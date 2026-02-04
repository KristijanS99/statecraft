/**
 * AST types for a parsed Statecraft board.
 * Parser (YAML → AST) produces these; validation and tools consume them.
 * @see docs/spec.md
 */

/** Column: normalized shape. Parser converts string columns to { name }. */
export interface Column {
  name: string;
  limit?: number;
}

/** Task: required title + status; optional fields per spec. depends_on normalized to array. */
export interface Task {
  title: string;
  status: string;
  description?: string;
  spec?: string;
  owner?: string;
  priority?: string;
  /** Task ids this task depends on (normalized to array by parser). */
  depends_on?: string[];
}

/** Board: one board per file. columns ordered; tasks keyed by id. */
export interface Board {
  board: string;
  columns: Column[];
  tasks: Record<string, Task>;
}
