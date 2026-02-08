import type { Board, Column, Task } from "./ast.js";

/** Canonical column set per spec: exact names and order. */
export const CANONICAL_COLUMNS = ["Backlog", "Ready", "In Progress", "Done"] as const;

/** A single validation error (or warning). */
export interface ValidationError {
  /** Human-readable message. */
  message: string;
  /** Optional path (e.g. "tasks.AUTH-12.status") for tooling. */
  path?: string;
  /** Optional code (e.g. "STATUS_INVALID") for programmatic handling. */
  code?: string;
}

/** Result of validating a board. Does not throw; caller decides what to do with errors. */
export interface ValidationResult {
  /** True if there are no errors. */
  valid: boolean;
  /** List of validation errors (empty if valid). */
  errors: ValidationError[];
  /** Optional warnings (e.g. spec file missing). Empty if none. */
  warnings?: ValidationError[];
}

/**
 * Run all validation rules on a parsed board. Does not throw; returns a list of errors.
 * @param board - Parsed board AST.
 * @returns List of validation errors (empty if valid).
 */
export function validateBoard(board: Board): ValidationError[] {
  const errors: ValidationError[] = [];
  const columnNames = board.columns.map((c) => c.name);

  // Canonical columns: must be Backlog, Ready, In Progress, Done in that order
  if (board.columns.length !== CANONICAL_COLUMNS.length) {
    errors.push({
      path: "columns",
      message: `Board must have exactly ${CANONICAL_COLUMNS.length} columns: ${CANONICAL_COLUMNS.join(", ")}. Got ${board.columns.length}.`,
      code: "COLUMNS_NOT_CANONICAL",
    });
  } else {
    for (let i = 0; i < CANONICAL_COLUMNS.length; i++) {
      const expected = CANONICAL_COLUMNS[i];
      const actual = board.columns[i]?.name;
      if (actual !== expected) {
        errors.push({
          path: `columns[${i}]`,
          message: `Column at index ${i} must be "${expected}". Got "${actual}". Canonical order: ${CANONICAL_COLUMNS.join(", ")}.`,
          code: "COLUMNS_NOT_CANONICAL",
        });
      }
    }
  }

  // Column names unique (redundant if canonical check passed, but keeps other checks consistent)
  const seen = new Set<string>();
  for (let i = 0; i < board.columns.length; i++) {
    const name = board.columns[i].name;
    if (seen.has(name)) {
      errors.push({
        path: `columns[${i}]`,
        message: `Duplicate column name: "${name}"`,
        code: "DUPLICATE_COLUMN",
      });
    }
    seen.add(name);
  }

  // Task status matches column; depends_on refs exist
  const taskIds = new Set(Object.keys(board.tasks));
  for (const [id, task] of Object.entries(board.tasks)) {
    const taskPath = `tasks.${id}`;

    if (!columnNames.includes(task.status)) {
      errors.push({
        path: `${taskPath}.status`,
        message: `Task status "${task.status}" does not match any column. Valid columns: ${columnNames.join(", ")}`,
        code: "STATUS_INVALID",
      });
    }

    if (task.depends_on) {
      for (const refId of task.depends_on) {
        if (!taskIds.has(refId)) {
          errors.push({
            path: `${taskPath}.depends_on`,
            message: `Task "${id}" depends on "${refId}", which does not exist`,
            code: "DEPENDS_ON_INVALID",
          });
        }
      }
    }
  }

  // WIP limit per column
  const countByStatus = new Map<string, number>();
  for (const task of Object.values(board.tasks)) {
    countByStatus.set(task.status, (countByStatus.get(task.status) ?? 0) + 1);
  }

  for (let i = 0; i < board.columns.length; i++) {
    const col = board.columns[i];
    if (col.limit == null) continue;
    const count = countByStatus.get(col.name) ?? 0;
    if (count > col.limit) {
      errors.push({
        path: `columns[${i}]`,
        message: `Column "${col.name}" has limit ${col.limit} but ${count} task(s) in that status`,
        code: "WIP_LIMIT_EXCEEDED",
      });
    }
  }

  return errors;
}

/**
 * Validate a parsed board. Returns a result with `valid` and `errors`; does not throw.
 * Use this as the public API; use `validateBoard` if you only need the error list.
 *
 * @param board - Parsed board AST.
 * @returns ValidationResult with `valid: true` and empty `errors` when valid, otherwise `valid: false` and non-empty `errors`.
 */
export function validate(board: Board): ValidationResult {
  const errors = validateBoard(board);
  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
  };
}
