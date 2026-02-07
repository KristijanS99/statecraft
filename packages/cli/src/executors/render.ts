import { startRenderServer } from "../render-server.js";

export function runRender(path: string, options: { port: number; open: boolean }): void {
  startRenderServer({
    boardPath: path,
    port: options.port,
    openBrowser: options.open,
  });
}
