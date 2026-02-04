import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.join(__dirname, "..");
const cliPath = path.join(cliRoot, "dist", "index.js");
const validBoardPath = path.join(cliRoot, "test", "fixtures", "valid-board.yaml");
const missingPath = path.join(cliRoot, "test", "fixtures", "nonexistent.yaml");

function runSummarize(boardPath: string, extraArgs: string[] = []): ReturnType<typeof spawnSync> {
  return spawnSync("node", [cliPath, "summarize", boardPath, ...extraArgs], {
    encoding: "utf-8",
    cwd: cliRoot,
  });
}

describe("statecraft summarize", () => {
  it("exits 0 and prints summary when board file is valid", () => {
    const result = runSummarize(validBoardPath);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Board:");
    expect(result.stdout).toContain("CLI Test");
    expect(result.stdout).toContain("Columns:");
    expect(result.stdout).toContain("Tasks:");
    expect(result.stdout).toContain("T1");
    expect(result.stdout).toContain("T2");
  });

  it("exits 1 when file is missing", () => {
    const result = runSummarize(missingPath);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/cannot read file|ENOENT|not found/i);
  });

  it("exits 1 when multiple paths are given", () => {
    const result = runSummarize(validBoardPath, ["other.yaml"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Only one board file per run");
  });
});
