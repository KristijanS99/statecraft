#!/usr/bin/env node
/**
 * Copies the built renderer (packages/renderer/dist) into the CLI package as
 * renderer-dist/ so the published npm package can serve it when users run
 * `statecraft render`. Run after the renderer is built (root: pnpm build).
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliRoot = join(__dirname, "..");
const source = join(cliRoot, "..", "renderer", "dist");
const dest = join(cliRoot, "renderer-dist");

if (!existsSync(source) || !existsSync(join(source, "index.html"))) {
  console.error("copy-renderer: renderer dist not found. From repo root run: pnpm build");
  process.exit(1);
}
if (existsSync(dest)) rmSync(dest, { recursive: true });
mkdirSync(dest, { recursive: true });
cpSync(source, dest, { recursive: true });
