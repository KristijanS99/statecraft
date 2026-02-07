/** Default path to the board file when none is given. */
export const DEFAULT_BOARD_PATH = "./board.yaml";

/** Default port for the render server. */
export const DEFAULT_RENDER_PORT = 3000;

/** Debounce delay (ms) for file watcher before broadcasting board updates to WebSocket clients. */
export const RENDER_WATCH_DEBOUNCE_MS = 100;
