import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.join(__dirname, "..");
const cliPath = path.join(cliRoot, "dist", "index.js");

function runCli(args: string[]): ReturnType<typeof spawnSync> {
  return spawnSync("node", [cliPath, ...args], {
    encoding: "utf-8",
    cwd: cliRoot,
  });
}

describe("statecraft help", () => {
  it("statecraft --help prints usage and exits 0", () => {
    const result = runCli(["--help"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("statecraft");
    expect(result.stdout).toContain("validate");
    expect(result.stdout).toContain("summarize");
    expect(result.stdout).toContain("render");
    expect(result.stdout).toMatch(/Usage:|--help/);
  });

  it("statecraft -h prints usage and exits 0", () => {
    const result = runCli(["-h"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("validate");
    expect(result.stdout).toContain("summarize");
    expect(result.stdout).toContain("render");
  });

  it("statecraft validate --help prints usage and exits 0", () => {
    const result = runCli(["validate", "--help"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("validate");
    expect(result.stdout).toContain("board");
  });

  it("no subcommand prints usage to stderr and exits 1", () => {
    const result = runCli([]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("statecraft");
    expect(result.stderr).toContain("validate");
  });

  it("unknown command prints error and exits 1", () => {
    const result = runCli(["unknown"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Unknown command");
    expect(result.stderr).toContain("unknown");
  });
});
