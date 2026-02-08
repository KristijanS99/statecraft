import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { runInit } from "../src/executors/init.js";
import { runSync } from "../src/executors/sync.js";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const cliRoot = path.join(__dirname, "..");
const cliPath = path.join(cliRoot, "dist", "index.js");

describe("statecraft sync", () => {
  it("updates Cursor rule when .statecraft.json exists", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "statecraft-sync-"));
    try {
      await runInit({
        cwd: tmpDir,
        answers: [
          "Sync Board",
          "board.yaml",
          "tasks",
          "",
          "y",
          "y",
          "y",
          "y",
          "n",
          "n",
        ],
      });
      const rulePath = path.join(tmpDir, ".cursor", "rules", "statecraft.mdc");
      const before = fs.readFileSync(rulePath, "utf-8");
      runSync({ cwd: tmpDir });
      const after = fs.readFileSync(rulePath, "utf-8");
      expect(after).toContain("board.yaml");
      expect(after).toContain("Task lifecycle");
      expect(after.length).toBe(before.length); // same structure, possibly same content
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("fallback: parses from existing Cursor rule when .statecraft.json missing", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "statecraft-sync-"));
    try {
      await runInit({
        cwd: tmpDir,
        answers: [
          "Legacy Board",
          "board.yaml",
          "tasks",
          "",
          "y",
          "y",
          "y",
          "y",
          "n",
          "n",
        ],
      });
      const configPath = path.join(tmpDir, ".statecraft.json");
      fs.rmSync(configPath);
      runSync({ cwd: tmpDir });
      expect(fs.existsSync(configPath)).toBe(true);
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      expect(config.boardPath).toBe("board.yaml");
      expect(config.tasksDir).toBe("tasks");
      expect(config.cursor).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("exits with message when no rule files and no .statecraft.json", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "statecraft-sync-"));
    try {
      const result = spawnSync("node", [cliPath, "sync"], {
        encoding: "utf-8",
        cwd: tmpDir,
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("No Statecraft rule files found");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("--dry-run lists files without writing", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "statecraft-sync-"));
    try {
      await runInit({
        cwd: tmpDir,
        answers: [
          "Dry Board",
          "board.yaml",
          "tasks",
          "",
          "y",
          "y",
          "y",
          "y",
          "n",
          "n",
        ],
      });
      const rulePath = path.join(tmpDir, ".cursor", "rules", "statecraft.mdc");
      const before = fs.readFileSync(rulePath, "utf-8");
      const result = spawnSync("node", [cliPath, "sync", "--dry-run"], {
        encoding: "utf-8",
        cwd: tmpDir,
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain("Would update");
      const after = fs.readFileSync(rulePath, "utf-8");
      expect(after).toBe(before);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
