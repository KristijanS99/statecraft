#!/usr/bin/env node
import { parseBoard, summarize, validate } from "@statecraft/core";
import { startRenderServer } from "./render-server.js";

const DEFAULT_BOARD_PATH = "./board.yaml";
const DEFAULT_RENDER_PORT = 3000;

function printUsage(stream: NodeJS.WritableStream = process.stdout): void {
  const usage = `
statecraft — validate, summarize, and render board files

Usage:
  statecraft validate [path]   Validate a board file (default: ${DEFAULT_BOARD_PATH})
  statecraft summarize [path]  Summarize a board (default: ${DEFAULT_BOARD_PATH})
  statecraft render [path]     Serve board UI (default: ${DEFAULT_BOARD_PATH})
                              Options: --port ${DEFAULT_RENDER_PORT}, --open
  statecraft --help, -h        Show this help

Path: Relative to current working directory unless absolute. Only one board file per run.
Default path: ${DEFAULT_BOARD_PATH}

Examples:
  statecraft validate
  statecraft summarize examples/board.yaml
  statecraft render --open
  statecraft render --port 4000 examples/board.yaml
`.trim();
  stream.write(usage + "\n");
}

function parseArgs(): { subcommand: string | null; path: string; help: boolean; extraArgs: string[] } {
  const args = process.argv.slice(2);
  let subcommand: string | null = null;
  let path = DEFAULT_BOARD_PATH;
  let help = false;
  const extraArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      help = true;
      break;
    }
    if (subcommand === null) {
      if (!arg.startsWith("--")) subcommand = arg;
      continue;
    }
    if (arg.startsWith("--")) continue;
    path = arg;
    // Collect any further non-flag args (multiple paths are not supported)
    for (let j = i + 1; j < args.length; j++) {
      if (!args[j].startsWith("--")) extraArgs.push(args[j]);
    }
    break;
  }

  return { subcommand, path, help, extraArgs };
}

function formatValidationError(err: { message: string; path?: string }): string {
  const prefix = err.path != null && err.path !== "" ? `${err.path}: ` : "";
  return `${prefix}${err.message}`;
}

function runValidate(path: string): void {
  try {
    const board = parseBoard(path);
    const result = validate(board);
    if (!result.valid) {
      for (const err of result.errors) {
        process.stderr.write(formatValidationError(err) + "\n");
      }
      process.exitCode = 1;
      return;
    }
    process.exitCode = 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(message + "\n");
    process.exitCode = 1;
  }
}

function runSummarize(path: string): void {
  try {
    const board = parseBoard(path);
    const summary = summarize(board);
    process.stdout.write(summary);
    process.exitCode = 0;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(message + "\n");
    process.exitCode = 1;
  }
}

function main(): void {
  const { subcommand, path, help, extraArgs } = parseArgs();

  if (help) {
    printUsage();
    process.exit(0);
  }

  if (subcommand === null || subcommand === "") {
    printUsage(process.stderr);
    process.exit(1);
  }

  if (extraArgs.length > 0 && subcommand !== "render") {
    process.stderr.write("Only one board file per run. Multiple paths are not supported.\n");
    printUsage(process.stderr);
    process.exit(1);
  }

  switch (subcommand) {
    case "validate":
      runValidate(path);
      break;
    case "summarize":
      runSummarize(path);
      break;
    case "render":
      runRender();
      break;
    default:
      process.stderr.write(`Unknown command: ${subcommand}\n`);
      printUsage(process.stderr);
      process.exit(1);
  }
}

function parseRenderArgs(): { path: string; port: number; open: boolean } {
  const args = process.argv.slice(2);
  let path = DEFAULT_BOARD_PATH;
  let port = DEFAULT_RENDER_PORT;
  let open = false;
  let i = 0;
  if (args[i] === "render") i++;
  while (i < args.length) {
    if (args[i] === "--port") {
      const next = args[i + 1];
      if (next != null && /^\d+$/.test(next)) {
        port = parseInt(next, 10) || DEFAULT_RENDER_PORT;
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (args[i] === "--open") {
      open = true;
      i++;
      continue;
    }
    if (args[i] === "--help" || args[i] === "-h") {
      i++;
      continue;
    }
    if (!args[i].startsWith("-") && (args[i].endsWith(".yaml") || args[i].endsWith(".yml"))) {
      if (path !== DEFAULT_BOARD_PATH) {
        process.stderr.write("Only one board file per run. Multiple paths are not supported.\n");
        printUsage(process.stderr);
        process.exit(1);
      }
      path = args[i];
      i++;
    } else {
      i++;
    }
  }
  return { path, port, open };
}

function runRender(): void {
  const { path: boardPath, port, open } = parseRenderArgs();
  startRenderServer({ boardPath, port, openBrowser: open });
}

main();
