/** Default path to the board file when none is given (validate, summarize, render). */
export const DEFAULT_BOARD_PATH = "./board.yaml";

/** Default port for the render server. */
export const DEFAULT_RENDER_PORT = 3000;

/** Debounce delay (ms) for file watcher before broadcasting board updates to WebSocket clients. */
export const RENDER_WATCH_DEBOUNCE_MS = 100;

/** Default board file path offered by init (cwd). */
export const INIT_DEFAULT_BOARD_PATH = "board.yaml";

/** Default directory for task .md files (relative to board), offered by init. */
export const INIT_DEFAULT_TASKS_DIR = "tasks";

/** Canonical column set per spec; init creates boards with these columns. */
export const CANONICAL_COLUMNS = ["Backlog", "Ready", "In Progress", "Done"] as const;

/** Filename of the board format spec shipped with the CLI package (statecraft spec). */
export const SPEC_FILENAME = "spec.md";
