import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildClaudeRuleContent,
  buildCodexAgentsContent,
  buildCursorRuleContent,
  runInit,
} from "../src/executors/init";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.join(__dirname, "..");
const cliPath = path.join(cliRoot, "dist", "index.js");

describe("buildCursorRuleContent", () => {
  it("includes board path and tasks dir", () => {
    const content = buildCursorRuleContent("docs-private/board.yaml", "docs-private/tasks");
    expect(content).toContain("docs-private/board.yaml");
    expect(content).toContain("docs-private/tasks/<task-id>.md");
  });

  it("includes statecraft spec and validate commands", () => {
    const content = buildCursorRuleContent("board.yaml", "tasks");
    expect(content).toContain("statecraft spec");
    expect(content).toContain("statecraft validate");
    expect(content).toContain("statecraft render");
  });

  it("includes Task lifecycle section", () => {
    const content = buildCursorRuleContent("board.yaml", "tasks");
    expect(content).toContain("Task lifecycle");
    expect(content).toContain("Start work:");
    expect(content).toContain("Finish work:");
    expect(content).toContain("Create task:");
  });

  it("includes AI guidelines section", () => {
    const content = buildCursorRuleContent("board.yaml", "tasks");
    expect(content).toContain("AI guidelines for creating tickets");
    expect(content).toContain("kebab-case");
    expect(content).toContain("title");
    expect(content).toContain("status");
  });

  it("has valid YAML frontmatter", () => {
    const content = buildCursorRuleContent("board.yaml", "tasks");
    expect(content).toMatch(/^---\n[\s\S]*?\n---/);
    expect(content).toContain("description:");
    expect(content).toContain("alwaysApply: false");
  });
});

describe("statecraft init", () => {
  it("creates a valid board file with canonical columns when given answers (no Cursor rule)", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "statecraft-init-"));
    try {
      await runInit({
        cwd: tmpDir,
        answers: [
          "Test Board",
          "board.yaml",
          "tasks",
          "",
          "n",
          "n",
          "n",
        ],
      });

      const boardPath = path.join(tmpDir, "board.yaml");
      expect(fs.existsSync(boardPath)).toBe(true);

      const yamlContent = fs.readFileSync(boardPath, "utf-8");
      expect(yamlContent).toContain("board:");
      expect(yamlContent).toContain("columns:");
      expect(yamlContent).toContain("tasks:");
      expect(yamlContent).toContain("Test Board");
      expect(yamlContent).toContain("Backlog");
      expect(yamlContent).toContain("Ready");
      expect(yamlContent).toContain("In Progress");
      expect(yamlContent).toContain("Done");

      const validateResult = spawnSync("node", [cliPath, "validate", "board.yaml"], {
        encoding: "utf-8",
        cwd: tmpDir,
      });
      expect(validateResult.status).toBe(0);
      expect(validateResult.stderr).toBe("");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("creates board and Cursor rule when user answers Y to Cursor rule", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "statecraft-init-"));
    try {
      await runInit({
        cwd: tmpDir,
        answers: [
          "My Project",
          "my-board.yaml",
          "specs",
          "",
          "y",
          "n",
          "n",
        ],
      });

      const boardPath = path.join(tmpDir, "my-board.yaml");
      expect(fs.existsSync(boardPath)).toBe(true);

      const rulePath = path.join(tmpDir, ".cursor", "rules", "statecraft.mdc");
      expect(fs.existsSync(rulePath)).toBe(true);

      const ruleContent = fs.readFileSync(rulePath, "utf-8");
      expect(ruleContent).toContain("my-board.yaml");
      expect(ruleContent).toContain("specs/<task-id>.md");
      expect(ruleContent).toContain("statecraft spec");
      expect(ruleContent).toContain("statecraft validate");
      expect(ruleContent).toContain("Task lifecycle");
      expect(ruleContent).toContain("Prepare for work");
      expect(ruleContent).toContain("Ready");
      expect(ruleContent).toContain("AI guidelines for creating tickets");

      const validateResult = spawnSync("node", [cliPath, "validate", "my-board.yaml"], {
        encoding: "utf-8",
        cwd: tmpDir,
      });
      expect(validateResult.status).toBe(0);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("creates Claude Code rule at .claude/rules/statecraft.md when user answers y", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "statecraft-init-"));
    try {
      await runInit({
        cwd: tmpDir,
        answers: [
          "Claude Board",
          "board.yaml",
          "tasks",
          "",
          "n",
          "y",
          "n",
        ],
      });

      const claudePath = path.join(tmpDir, ".claude", "rules", "statecraft.md");
      expect(fs.existsSync(claudePath)).toBe(true);

      const content = fs.readFileSync(claudePath, "utf-8");
      expect(content).toContain("# Statecraft");
      expect(content).toContain("board.yaml");
      expect(content).toContain("tasks/<task-id>.md");
      expect(content).toContain("statecraft spec");
      expect(content).toContain("Task lifecycle");
      expect(content).toContain("Prepare for work");
      expect(content).toContain("Ready");
      expect(content).toContain("AI guidelines for creating tickets");
      expect(content).not.toMatch(/^---\n/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("creates or appends AGENTS.md for Codex when user answers y", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "statecraft-init-"));
    try {
      await runInit({
        cwd: tmpDir,
        answers: [
          "Codex Board",
          "board.yaml",
          "tasks",
          "",
          "n",
          "n",
          "y",
        ],
      });

      const agentsPath = path.join(tmpDir, "AGENTS.md");
      expect(fs.existsSync(agentsPath)).toBe(true);

      const content = fs.readFileSync(agentsPath, "utf-8");
      expect(content).toContain("## Statecraft (generated by statecraft init)");
      expect(content).toContain("# Statecraft");
      expect(content).toContain("board.yaml");
      expect(content).toContain("statecraft spec");
      expect(content).toContain("Task lifecycle");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("appends to existing AGENTS.md when Codex is chosen and file exists", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "statecraft-init-"));
    try {
      const existing = "# My project\n\nUse pnpm.\n";
      fs.writeFileSync(path.join(tmpDir, "AGENTS.md"), existing, "utf-8");

      await runInit({
        cwd: tmpDir,
        answers: [
          "Codex Board",
          "board.yaml",
          "tasks",
          "",
          "n",
          "n",
          "y",
        ],
      });

      const content = fs.readFileSync(path.join(tmpDir, "AGENTS.md"), "utf-8");
      expect(content).toContain("# My project");
      expect(content).toContain("Use pnpm.");
      expect(content).toContain("## Statecraft (generated by statecraft init)");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe("buildClaudeRuleContent", () => {
  it("returns markdown without YAML frontmatter", () => {
    const content = buildClaudeRuleContent("board.yaml", "tasks");
    expect(content).toContain("# Statecraft");
    expect(content).not.toMatch(/^---\n/);
    expect(content).toContain("statecraft spec");
  });
});

describe("buildCodexAgentsContent", () => {
  it("includes Statecraft section header and body", () => {
    const content = buildCodexAgentsContent("board.yaml", "tasks");
    expect(content).toContain("## Statecraft (generated by statecraft init)");
    expect(content).toContain("# Statecraft");
    expect(content).toContain("statecraft validate");
  });
});
