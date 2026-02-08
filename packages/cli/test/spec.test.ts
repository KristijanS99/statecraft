import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.join(__dirname, "..");
const cliPath = path.join(cliRoot, "dist", "index.js");

function runSpec(): ReturnType<typeof spawnSync> {
  return spawnSync("node", [cliPath, "spec"], {
    encoding: "utf-8",
    cwd: cliRoot,
  });
}

describe("statecraft spec", () => {
  it("exits 0 and prints spec content to stdout", () => {
    const result = runSpec();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
  });

  it("stdout contains canonical columns section and column names", () => {
    const result = runSpec();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Columns");
    expect(result.stdout).toContain("Backlog");
    expect(result.stdout).toContain("Ready");
    expect(result.stdout).toContain("In Progress");
    expect(result.stdout).toContain("Done");
  });

  it("stdout contains board format overview", () => {
    const result = runSpec();
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/board|columns|tasks/i);
  });
});
