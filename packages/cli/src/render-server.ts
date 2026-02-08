import express, { type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { fileURLToPath } from "node:url";
import { DEFAULT_RENDER_PORT, RENDER_WATCH_DEBOUNCE_MS } from "./constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Resolve path to the renderer's static files.
 * - When installed from npm: bundled at package-root/renderer-dist.
 * - When running in monorepo: sibling package at packages/renderer/dist.
 */
function getRendererDistPath(): string {
  const bundled = path.resolve(__dirname, "..", "renderer-dist");
  if (fs.existsSync(bundled) && fs.statSync(bundled).isDirectory()) {
    return bundled;
  }
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

  // Board file directory (for resolving spec paths relative to board)
  const resolvedBoardPath = path.resolve(process.cwd(), boardPath);
  const boardDir = path.dirname(resolvedBoardPath);

  // API: board file content (raw YAML)
  app.get("/api/board", (_req: Request, res: Response) => {
    const content = readBoardContent(boardPath);
    if (content === null) {
      res.status(404).type("text/plain").send("Board file not found or unreadable.");
      return;
    }
    res.type("text/yaml").send(content);
  });

  // API: spec file content (path relative to board file directory; only .md files)
  app.get("/api/spec", (req: Request, res: Response) => {
    const rawPath = typeof req.query.path === "string" ? req.query.path : "";
    if (!rawPath || rawPath.includes("..")) {
      res.status(400).type("text/plain").send("Invalid or missing path.");
      return;
    }
    const ext = path.extname(rawPath).toLowerCase();
    if (ext !== ".md") {
      res.status(400).type("text/plain").send("Only .md spec files are allowed.");
      return;
    }
    const resolved = path.resolve(boardDir, rawPath);
    const relative = path.relative(boardDir, resolved);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      res.status(400).type("text/plain").send("Path must be under board directory.");
      return;
    }
    try {
      const content = fs.readFileSync(resolved, "utf-8");
      res.type("text/markdown").send(content);
    } catch {
      res.status(404).type("text/plain").send("Spec file not found or unreadable.");
    }
  });

  // Static files (must be after /api routes so they take precedence)
  app.use(express.static(rendererDist));

  // SPA fallback: serve index.html for GET requests not handled by static (Express 5 / path-to-regexp v8 reject bare '*')
  app.use((_req: Request, res: Response, next: express.NextFunction) => {
    if (_req.method !== "GET" || res.headersSent) return next();
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
  } catch {
    // File might not exist yet; watcher will not run
  }

  server.on("error", (err: Error & { code?: string }) => {
    process.stderr.write(`Render server error: ${err.message}\n`);
    if (err.code === "EADDRINUSE") {
      process.stderr.write(`Port ${port} is in use. Try --port <number>.\n`);
    }
    process.exitCode = 1;
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    process.stdout.write(`Open ${url}\n`);
    if (openBrowser) {
      import("open").then(({ default: open }) => {
        open(url).catch(() => {});
      });
    }
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(process.exitCode ?? 0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
