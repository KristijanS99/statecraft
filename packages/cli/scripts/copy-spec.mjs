#!/usr/bin/env node
/**
 * Copies the canonical spec from repo docs/ into the CLI package so the built
 * CLI can ship it. Run as part of the CLI build. Single source of truth: docs/spec.md
 */
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliRoot = join(__dirname, "..");
const source = join(cliRoot, "..", "..", "docs", "spec.md");
const dest = join(cliRoot, "spec.md");

if (!existsSync(source)) {
  console.error("copy-spec: source not found:", source);
  process.exit(1);
}
mkdirSync(dirname(dest), { recursive: true });
copyFileSync(source, dest);
