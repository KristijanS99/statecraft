import express, { type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { fileURLToPath } from "node:url";
import { DEFAULT_RENDER_PORT, RENDER_WATCH_DEBOUNCE_MS } from "./constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Resolve path to the renderer's dist folder (sibling package in monorepo).
 * When running from packages/cli/dist, go up to packages and into renderer/dist.
 */
function getRendererDistPath(): string {
  return path.resolve(__dirname, "..", "..", "renderer", "dist");
}

/**
 * Read board file and return content as UTF-8. Returns null on error.
 */
function readBoardContent(boardPath: string): string | null {
  try {
    const resolved = path.resolve(process.cwd(), boardPath);
    return fs.readFileSync(resolved, "utf-8");
  } catch {
    return null;
  }
}

export interface RenderServerOptions {
  boardPath: string;
  port?: number;
  openBrowser?: boolean;
}

/**
 * Start the render server: static app + GET /api/board + WebSocket /api/board/watch.
 * Watches the board file and broadcasts content to WS clients on change.
 */
export function startRenderServer(options: RenderServerOptions): void {
  const { boardPath, port = DEFAULT_RENDER_PORT, openBrowser = false } = options;
  const rendererDist = getRendererDistPath();

  if (!fs.existsSync(rendererDist) || !fs.statSync(rendererDist).isDirectory()) {
    process.stderr.write(
      "Renderer build not found. Run: pnpm build\n"
    );
    process.exitCode = 1;
    return;
  }

  const app = express();

  // API: board file content (raw YAML)
  app.get("/api/board", (_req: Request, res: Response) => {
    const content = readBoardContent(boardPath);
    if (content === null) {
      res.status(404).type("text/plain").send("Board file not found or unreadable.");
      return;
    }
    res.type("text/yaml").send(content);
  });

  // Static files (must be after /api routes so they take precedence)
  app.use(express.static(rendererDist));

  // SPA fallback: serve index.html for non-API routes
  app.get("*", (_req: Request, res: Response) => {
    const indexHtml = path.join(rendererDist, "index.html");
    if (fs.existsSync(indexHtml)) {
      res.sendFile(indexHtml);
    } else {
      res.status(404).send("Not found");
    }
  });

  const server = createServer(app);

  // WebSocket: /api/board/watch — broadcast board content on file change
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url ?? "", `http://${request.headers.host}`);
    if (url.pathname === "/api/board/watch") {
      wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  const resolvedBoardPath = path.resolve(process.cwd(), boardPath);
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function broadcastBoard(): void {
    const content = readBoardContent(boardPath);
    const payload = content ?? "";
    wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === 1) {
        client.send(payload);
      }
    });
  }

  wss.on("connection", (ws: WebSocket) => {
    // Send current board on connect
    const content = readBoardContent(boardPath);
    if (content !== null) {
      ws.send(content);
    }
  });

  try {
    fs.watch(resolvedBoardPath, { persistent: false }, () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        broadcastBoard();
      }, RENDER_WATCH_DEBOUNCE_MS);
    });
  } catch (err) {
    // File might not exist yet; watcher will not run
  }

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    process.stdout.write(`Open ${url}\n`);
    if (openBrowser) {
      import("open").then(({ default: open }) => {
        open(url).catch(() => {});
      });
    }
  });
}
