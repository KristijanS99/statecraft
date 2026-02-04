import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import type { Board, Column, Task } from "./ast.js";

/** Thrown when YAML is invalid or required fields are missing/wrong. */
export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

function assertObject(value: unknown, path: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ParseError(`${path}: expected an object`);
  }
}

function assertArray(value: unknown, path: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new ParseError(`${path}: expected an array`);
  }
}

function assertString(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string") {
    throw new ParseError(`${path}: expected a string`);
  }
}

/**
 * Parse YAML board content into a typed Board AST.
 * @param content - Raw YAML string (board file content).
 * @returns Board AST.
 * @throws ParseError when YAML is invalid or required fields are missing/wrong.
 */
export function parseBoardFromString(content: string): Board {
  let raw: unknown;
  try {
    raw = parse(content);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new ParseError(`Invalid YAML: ${message}`);
  }

  assertObject(raw, "root");
  const root = raw as Record<string, unknown>;

  // board (required, non-empty string)
  if (!("board" in root)) {
    throw new ParseError("Missing required field: board");
  }
  assertString(root.board, "board");
  if (root.board.trim() === "") {
    throw new ParseError("board must be a non-empty string");
  }

  // columns (required, non-empty array)
  if (!("columns" in root)) {
    throw new ParseError("Missing required field: columns");
  }
  assertArray(root.columns, "columns");
  if (root.columns.length === 0) {
    throw new ParseError("columns must be a non-empty array");
  }

  const columns: Column[] = root.columns.map((item: unknown, i: number) => {
    const path = `columns[${i}]`;
    if (typeof item === "string") {
      if (item.trim() === "") {
        throw new ParseError(`${path}: column name must be non-empty`);
      }
      return { name: item };
    }
    if (item !== null && typeof item === "object" && !Array.isArray(item)) {
      const obj = item as Record<string, unknown>;
      if (!("name" in obj)) {
        throw new ParseError(`${path}: column object must have "name"`);
      }
      assertString(obj.name, `${path}.name`);
      if ((obj.name as string).trim() === "") {
        throw new ParseError(`${path}.name: must be non-empty`);
      }
      const col: Column = { name: obj.name as string };
      if ("limit" in obj && obj.limit !== undefined) {
        if (typeof obj.limit !== "number" || !Number.isInteger(obj.limit) || obj.limit < 1) {
          throw new ParseError(`${path}.limit: must be a positive integer`);
        }
        col.limit = obj.limit;
      }
      return col;
    }
    throw new ParseError(`${path}: expected a string or object with "name" (and optional "limit")`);
  });

  // tasks (required, object; may be empty)
  if (!("tasks" in root)) {
    throw new ParseError("Missing required field: tasks");
  }
  if (root.tasks === null || typeof root.tasks !== "object" || Array.isArray(root.tasks)) {
    throw new ParseError("tasks must be an object (map of task id to task)");
  }
  const tasksRaw = root.tasks as Record<string, unknown>;
  const tasks: Record<string, Task> = {};

  for (const [id, rawTask] of Object.entries(tasksRaw)) {
    const path = `tasks.${id}`;
    assertObject(rawTask, path);
    const t = rawTask as Record<string, unknown>;

    if (!("title" in t)) {
      throw new ParseError(`${path}: missing required field "title"`);
    }
    assertString(t.title, `${path}.title`);

    if (!("status" in t)) {
      throw new ParseError(`${path}: missing required field "status"`);
    }
    assertString(t.status, `${path}.status`);

    const task: Task = {
      title: t.title as string,
      status: t.status as string,
    };

    if ("description" in t && t.description !== undefined) {
      assertString(t.description, `${path}.description`);
      task.description = t.description as string;
    }
    if ("spec" in t && t.spec !== undefined) {
      assertString(t.spec, `${path}.spec`);
      task.spec = t.spec as string;
    }
    if ("owner" in t && t.owner !== undefined) {
      assertString(t.owner, `${path}.owner`);
      task.owner = t.owner as string;
    }
    if ("priority" in t && t.priority !== undefined) {
      assertString(t.priority, `${path}.priority`);
      task.priority = t.priority as string;
    }
    if ("depends_on" in t && t.depends_on !== undefined) {
      if (typeof t.depends_on === "string") {
        task.depends_on = [t.depends_on];
      } else if (Array.isArray(t.depends_on)) {
        const arr = t.depends_on as unknown[];
        for (let i = 0; i < arr.length; i++) {
          assertString(arr[i], `${path}.depends_on[${i}]`);
        }
        task.depends_on = arr as string[];
      } else {
        throw new ParseError(`${path}.depends_on: expected a string or array of strings`);
      }
    }

    tasks[id] = task;
  }

  return {
    board: root.board as string,
    columns,
    tasks,
  };
}

/**
 * Heuristic: treat as file path if no newline and (ends with .yaml/.yml or contains path sep).
 * Otherwise treat as raw YAML content.
 */
function looksLikePath(input: string): boolean {
  if (input.includes("\n")) return false;
  const trimmed = input.trim();
  if (trimmed.length === 0) return false;
  return (
    trimmed.endsWith(".yaml") ||
    trimmed.endsWith(".yml") ||
    trimmed.includes("/") ||
    trimmed.includes(path.sep)
  );
}

/**
 * Parse a board from a file path or raw YAML string.
 * - If `input` looks like a path (no newline, ends with .yaml/.yml or contains path separator),
 *   the file is read from disk (relative to cwd) and parsed.
 * - Otherwise `input` is parsed as raw YAML content.
 *
 * @param input - File path (absolute or relative to cwd) or raw YAML string.
 * @returns Board AST.
 * @throws ParseError when YAML is invalid or required fields are missing/wrong.
 * @throws ParseError when input is a path and the file cannot be read (e.g. not found).
 */
export function parseBoard(input: string): Board {
  if (looksLikePath(input)) {
    const resolved = path.resolve(input.trim());
    let content: string;
    try {
      content = fs.readFileSync(resolved, "utf-8");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new ParseError(`Cannot read file "${resolved}": ${message}`);
    }
    return parseBoardFromString(content);
  }
  return parseBoardFromString(input);
}
