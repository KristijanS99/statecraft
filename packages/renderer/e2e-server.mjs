#!/usr/bin/env node
/**
 * Minimal server for E2E tests: serves renderer dist + GET /api/board with fixture YAML.
 * Run from packages/renderer after build. Usage: node e2e-server.mjs [port]
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2] || process.env.PORT || "3000");
const DIST = path.join(__dirname, "dist");
const FIXTURE = path.join(__dirname, "e2e", "fixtures", "board.yaml");

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".yaml": "text/yaml",
  ".yml": "text/yaml",
};

function send(res, status, body, contentType = "text/plain") {
  res.writeHead(status, { "Content-Type": contentType });
  res.end(body);
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath);
  const contentType = MIME[ext] || "application/octet-stream";
  const stream = fs.createReadStream(filePath);
  stream.on("error", () => send(res, 404, "Not found", "text/plain"));
  res.writeHead(200, { "Content-Type": contentType });
  stream.pipe(res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (pathname === "/api/board") {
    try {
      const yaml = fs.readFileSync(FIXTURE, "utf-8");
      send(res, 200, yaml, "text/yaml");
    } catch (err) {
      send(res, 500, "Fixture not found", "text/plain");
    }
    return;
  }

  let filePath = path.join(DIST, pathname === "/" ? "index.html" : pathname);
  if (!path.extname(filePath)) {
    filePath = path.join(filePath, "index.html");
  }
  if (!filePath.startsWith(DIST)) {
    send(res, 404, "Not found", "text/plain");
    return;
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    filePath = path.join(DIST, "index.html");
  }
  serveFile(res, filePath);
});

server.listen(PORT, () => {
  process.stdout.write(`E2E server http://localhost:${PORT}\n`);
});
