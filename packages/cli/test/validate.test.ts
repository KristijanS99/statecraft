import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.join(__dirname, "..");
const cliPath = path.join(cliRoot, "dist", "index.js");
const validBoardPath = path.join(cliRoot, "test", "fixtures", "valid-board.yaml");
const invalidBoardPath = path.join(cliRoot, "test", "fixtures", "invalid-board.yaml");
const missingPath = path.join(cliRoot, "test", "fixtures", "nonexistent.yaml");

function runValidate(boardPath: string, extraArgs: string[] = []): ReturnType<typeof spawnSync> {
  return spawnSync("node", [cliPath, "validate", boardPath, ...extraArgs], {
    encoding: "utf-8",
    cwd: cliRoot,
  });
}

describe("statecraft validate", () => {
  it("exits 0 when board file is valid", () => {
    const result = runValidate(validBoardPath);
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });

  it("exits 1 when board has validation errors", () => {
    const result = runValidate(invalidBoardPath);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("UnknownColumn");
  });

  it("exits 1 when file is missing", () => {
    const result = runValidate(missingPath);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/cannot read file|ENOENT|not found/i);
  });

  it("exits 1 when multiple paths are given", () => {
    const result = runValidate(validBoardPath, ["other.yaml"]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Only one board file per run");
  });
});
