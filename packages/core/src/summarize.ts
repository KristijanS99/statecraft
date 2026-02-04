import type { Board, Column } from "./ast.js";

/**
 * Returns a plain-text summary of the board for terminal output or paste into chat/docs.
 * Format: board name, per-column counts, optional WIP limit lines, task list, optional blocked section.
 * @param board - Parsed board AST.
 * @returns Summary string ending with a single newline.
 */
export function summarize(board: Board): string {
  const columnNames = board.columns.map((c: Column) => c.name);
  const lastColumnName = columnNames.length > 0 ? columnNames[columnNames.length - 1] : "";

  // Per-column task counts
  const countByColumn: Record<string, number> = {};
  for (const name of columnNames) {
    countByColumn[name] = 0;
  }
  for (const task of Object.values(board.tasks)) {
    if (task.status in countByColumn) {
      countByColumn[task.status]++;
    }
  }

  const lines: string[] = [];

  // Board name
  lines.push(`Board: ${board.board}`);
  lines.push("");

  // Columns: name (count), ...
  const columnPart = columnNames.map((name) => `${name} (${countByColumn[name] ?? 0})`).join(", ");
  lines.push(`Columns: ${columnPart}`);

  // WIP limit: for each column with limit and count >= limit
  for (const col of board.columns) {
    if (col.limit != null && col.limit >= 1) {
      const count = countByColumn[col.name] ?? 0;
      if (count >= col.limit) {
        lines.push(`  ${col.name} at WIP limit (${count}/${col.limit})`);
      }
    }
  }

  lines.push("");

  // Tasks: ordered by column order, then by task id within column
  lines.push("Tasks:");
  const taskIds = Object.keys(board.tasks);
  const statusToIndex: Record<string, number> = {};
  columnNames.forEach((name, i) => {
    statusToIndex[name] = i;
  });
  const sortedIds = taskIds.slice().sort((a, b) => {
    const taskA = board.tasks[a];
    const taskB = board.tasks[b];
    const idxA = statusToIndex[taskA.status] ?? 999;
    const idxB = statusToIndex[taskB.status] ?? 999;
    if (idxA !== idxB) return idxA - idxB;
    return a.localeCompare(b);
  });
  if (sortedIds.length === 0) {
    lines.push("  (none)");
  } else {
    for (const id of sortedIds) {
      const task = board.tasks[id];
      lines.push(`  ${id} [${task.status}] ${task.title}`);
    }
  }

  // Blocked: task has depends_on and at least one dependency is not in last column
  const blocked: { id: string; deps: string[] }[] = [];
  for (const id of taskIds) {
    const task = board.tasks[id];
    const deps = task.depends_on ?? [];
    const unmet = deps.filter((depId) => {
      const dep = board.tasks[depId];
      return dep && dep.status !== lastColumnName;
    });
    if (unmet.length > 0) {
      blocked.push({ id, deps: unmet });
    }
  }
  if (blocked.length > 0) {
    lines.push("");
    for (const { id, deps } of blocked) {
      lines.push(`Blocked: ${id} (depends on ${deps.join(", ")})`);
    }
  }

  return lines.join("\n") + "\n";
}
