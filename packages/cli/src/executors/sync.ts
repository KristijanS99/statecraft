import fs from "node:fs";
import path from "node:path";
import {
  INIT_INCLUDE_TASK_SPEC_FORMAT_DEFAULT,
  INIT_REQUIRE_SPEC_FILE_DEFAULT,
  INIT_STRICT_MODE_DEFAULT,
  STATECRAFT_CONFIG_FILENAME,
} from "../constants.js";
import {
  buildClaudeRuleContent,
  buildCodexAgentsContent,
  buildCursorRuleContent,
  CODEX_MARKER,
  type StatecraftConfig,
} from "./init.js";
import type { RuleOptions } from "./rule-content.js";

const BOARD_PATH_RE = /\*\*Board file:\*\*\s*`([^`]+)`/;
const TASKS_DIR_RE = /\*\*Task spec files:\*\*\s*`([^`]+)\/<task-id>\.md`/;

function ensureDirAndWrite(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content, "utf-8");
}

function parseConfig(raw: string): StatecraftConfig | null {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (
      typeof data.boardPath !== "string" ||
      typeof data.tasksDir !== "string" ||
      typeof data.strictMode !== "boolean" ||
      typeof data.requireSpecFile !== "boolean" ||
      typeof data.includeTaskSpecFormat !== "boolean" ||
      typeof data.cursor !== "boolean" ||
      typeof data.claude !== "boolean" ||
      typeof data.codex !== "boolean"
    ) {
      return null;
    }
    return data as StatecraftConfig;
  } catch {
    return null;
  }
}

function parseBoardPathAndTasksDir(content: string): { boardPath: string; tasksDir: string } | null {
  const boardMatch = content.match(BOARD_PATH_RE);
  const tasksMatch = content.match(TASKS_DIR_RE);
  if (!boardMatch || !tasksMatch) return null;
  return { boardPath: boardMatch[1].trim(), tasksDir: tasksMatch[1].trim() };
}

function defaultRuleOptions(): RuleOptions {
  return {
    strictMode: INIT_STRICT_MODE_DEFAULT,
    requireSpecFile: INIT_REQUIRE_SPEC_FILE_DEFAULT,
    includeTaskSpecFormat: INIT_INCLUDE_TASK_SPEC_FORMAT_DEFAULT,
  };
}

function replaceCodexSectionInAgents(agentsPath: string, newSection: string): void {
  const existing = fs.readFileSync(agentsPath, "utf-8");
  const start = existing.indexOf(CODEX_MARKER);
  if (start === -1) {
    fs.writeFileSync(agentsPath, existing.trimEnd() + "\n\n" + newSection.trim() + "\n", "utf-8");
    return;
  }
  const afterMarker = start + CODEX_MARKER.length;
  const nextH2 = existing.indexOf("\n## ", afterMarker);
  const end = nextH2 === -1 ? existing.length : nextH2;
  const rest = existing.slice(end);
  const newFile = existing.slice(0, start) + newSection.trimEnd() + (rest ? "\n\n" + rest.trimStart() : "\n");
  fs.writeFileSync(agentsPath, newFile, "utf-8");
}

export interface RunSyncOptions {
  cwd?: string;
  dryRun?: boolean;
}

export function runSync(options?: RunSyncOptions): void {
  const cwd = options?.cwd ?? process.cwd();
  const dryRun = options?.dryRun ?? false;
  const log = (msg: string) => process.stdout.write(msg + "\n");

  const configPath = path.resolve(cwd, STATECRAFT_CONFIG_FILENAME);
  let config: StatecraftConfig | null = null;
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, "utf-8");
    config = parseConfig(raw);
    if (!config) {
      process.stderr.write(`${STATECRAFT_CONFIG_FILENAME} is invalid or missing required fields.\n`);
      process.exitCode = 1;
      return;
    }
  }

  let boardPath: string;
  let tasksDir: string;
  let ruleOptions: RuleOptions;
  let cursor: boolean;
  let claude: boolean;
  let codex: boolean;

  if (config) {
    boardPath = config.boardPath;
    tasksDir = config.tasksDir;
    ruleOptions = {
      strictMode: config.strictMode,
      requireSpecFile: config.requireSpecFile,
      includeTaskSpecFormat: config.includeTaskSpecFormat,
    };
    cursor = config.cursor;
    claude = config.claude;
    codex = config.codex;
  } else {
    const cursorPath = path.resolve(cwd, ".cursor", "rules", "statecraft.mdc");
    const claudePath = path.resolve(cwd, ".claude", "rules", "statecraft.md");
    const agentsPath = path.resolve(cwd, "AGENTS.md");

    let parsed: { boardPath: string; tasksDir: string } | null = null;
    if (fs.existsSync(cursorPath)) {
      parsed = parseBoardPathAndTasksDir(fs.readFileSync(cursorPath, "utf-8"));
    }
    if (!parsed && fs.existsSync(claudePath)) {
      parsed = parseBoardPathAndTasksDir(fs.readFileSync(claudePath, "utf-8"));
    }
    if (!parsed && fs.existsSync(agentsPath)) {
      const content = fs.readFileSync(agentsPath, "utf-8");
      if (content.includes(CODEX_MARKER)) parsed = parseBoardPathAndTasksDir(content);
    }

    if (!parsed) {
      process.stderr.write("No Statecraft rule files found. Run `statecraft init` first.\n");
      process.exitCode = 1;
      return;
    }

    boardPath = parsed.boardPath;
    tasksDir = parsed.tasksDir; // full path as in rule (e.g. docs-private/tasks)
    ruleOptions = defaultRuleOptions();
    cursor = fs.existsSync(cursorPath);
    claude = fs.existsSync(claudePath);
    codex = fs.existsSync(agentsPath) && fs.readFileSync(agentsPath, "utf-8").includes(CODEX_MARKER);
  }

  const specDir = config
    ? path.join(path.dirname(boardPath), tasksDir)
    : tasksDir;
  let updated = 0;

  if (cursor) {
    const cursorRulePath = path.resolve(cwd, ".cursor", "rules", "statecraft.mdc");
    const content = buildCursorRuleContent(boardPath, specDir, ruleOptions);
    if (dryRun) {
      log(`Would update ${path.relative(cwd, cursorRulePath)}`);
    } else {
      ensureDirAndWrite(cursorRulePath, content);
      log(`Updated ${path.relative(cwd, cursorRulePath)}`);
    }
    updated++;
  }

  if (claude) {
    const claudeRulePath = path.resolve(cwd, ".claude", "rules", "statecraft.md");
    const content = buildClaudeRuleContent(boardPath, specDir, ruleOptions);
    if (dryRun) {
      log(`Would update ${path.relative(cwd, claudeRulePath)}`);
    } else {
      ensureDirAndWrite(claudeRulePath, content);
      log(`Updated ${path.relative(cwd, claudeRulePath)}`);
    }
    updated++;
  }

  if (codex) {
    const agentsPath = path.resolve(cwd, "AGENTS.md");
    const content = buildCodexAgentsContent(boardPath, specDir, ruleOptions);
    if (dryRun) {
      log(`Would update Statecraft section in ${path.relative(cwd, agentsPath)}`);
    } else {
      replaceCodexSectionInAgents(agentsPath, content);
      log(`Updated Statecraft section in ${path.relative(cwd, agentsPath)}`);
    }
    updated++;
  }

  if (updated === 0) {
    process.stderr.write("No rule files to sync (cursor, claude, and codex are all false or no files found).\n");
    process.exitCode = 1;
    return;
  }

  if (!config && !dryRun) {
    const tasksDirForConfig = path.relative(path.dirname(boardPath), specDir);
    const newConfig: StatecraftConfig = {
      boardPath,
      tasksDir: tasksDirForConfig,
      strictMode: ruleOptions.strictMode,
      requireSpecFile: ruleOptions.requireSpecFile,
      includeTaskSpecFormat: ruleOptions.includeTaskSpecFormat,
      cursor,
      claude,
      codex,
    };
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2) + "\n", "utf-8");
    log(`Wrote ${STATECRAFT_CONFIG_FILENAME} for future syncs`);
  }
}
