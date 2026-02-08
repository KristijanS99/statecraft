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

/** Init default: enforce "create task before work" workflow for all agents. */
export const INIT_STRICT_MODE_DEFAULT = true;

/** Init default: require each task to have a spec .md file in the tasks directory. */
export const INIT_REQUIRE_SPEC_FILE_DEFAULT = true;

/** Init default: include task spec .md format guidelines in generated rules. */
export const INIT_INCLUDE_TASK_SPEC_FORMAT_DEFAULT = true;

/** Filename for Statecraft config written by init and read by sync (.statecraft.json). */
export const STATECRAFT_CONFIG_FILENAME = ".statecraft.json";
