#!/usr/bin/env node
import { createRequire } from "node:module";
import { Command } from "commander";
import { DEFAULT_BOARD_PATH, DEFAULT_RENDER_PORT } from "./constants.js";
import { runRender, runSummarize, runValidate } from "./executors/index.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

function rejectMultiplePaths(extra: string[]): void {
  if (extra.length > 0) {
    process.stderr.write("Only one board file per run. Multiple paths are not supported.\n");
    process.exitCode = 1;
  }
}

const program = new Command();

program
  .name("statecraft")
  .description("Validate, summarize, and render Statecraft board files")
  .version(version);

program
  .command("validate")
  .description("Validate a board file (exit 0 if valid, 1 on errors)")
  .argument("[path]", "path to board file", DEFAULT_BOARD_PATH)
  .argument("[extra...]", "ignored (only one path allowed)")
  .action((path: string, extra: string[]) => {
    rejectMultiplePaths(extra);
    if (process.exitCode !== 1) runValidate(path);
  });

program
  .command("summarize")
  .description("Print a short text summary of the board")
  .argument("[path]", "path to board file", DEFAULT_BOARD_PATH)
  .argument("[extra...]", "ignored (only one path allowed)")
  .action((path: string, extra: string[]) => {
    rejectMultiplePaths(extra);
    if (process.exitCode !== 1) runSummarize(path);
  });

program
  .command("render")
  .description("Serve the board in the browser (read-only UI)")
  .argument("[path]", "path to board file", DEFAULT_BOARD_PATH)
  .option("-p, --port <number>", "port for the server", String(DEFAULT_RENDER_PORT))
  .option("--open", "open browser after starting server")
  .action((path: string, options: { port: string; open: boolean }) => {
    const port = parseInt(options.port, 10) || DEFAULT_RENDER_PORT;
    runRender(path, { port, open: options.open ?? false });
  });

program.parse();
