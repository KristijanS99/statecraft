import {
  INIT_INCLUDE_TASK_SPEC_FORMAT_DEFAULT,
  INIT_REQUIRE_SPEC_FILE_DEFAULT,
  INIT_STRICT_MODE_DEFAULT,
} from "../constants.js";

/**
 * Options for generated rule content. Used by init; defaults match init prompts (Y/n).
 */
export interface RuleOptions {
  /** Enforce "create task before any work" workflow (strict mode). Default true. */
  strictMode: boolean;
  /** Require each task to have a spec .md file. Default true. */
  requireSpecFile: boolean;
  /** Include task spec .md format guidelines in the rule. Default true. */
  includeTaskSpecFormat: boolean;
}

const DEFAULT_RULE_OPTIONS: RuleOptions = {
  strictMode: INIT_STRICT_MODE_DEFAULT,
  requireSpecFile: INIT_REQUIRE_SPEC_FILE_DEFAULT,
  includeTaskSpecFormat: INIT_INCLUDE_TASK_SPEC_FORMAT_DEFAULT,
};

/**
 * Shared content for generated AI rules (Cursor, Claude Code, Codex).
 * Single source for the Statecraft rule body so init only orchestrates.
 */
export function buildStatecraftRuleBody(
  boardPath: string,
  tasksDir: string,
  options: Partial<RuleOptions> = {}
): string {
  const opts = { ...DEFAULT_RULE_OPTIONS, ...options };

  const strictBlock =
    opts.strictMode &&
    `## ⚠️ REQUIRED BEFORE ANY OTHER ACTION (100% enforced)

**Before** doing any substantive work (coding, fixing, refactoring, or answering the user's request with implementation), you **MUST**:

1. **Ensure a task exists:** In \`${boardPath}\`, either **create** a new task under \`tasks:\` with \`status: Backlog\` (use a kebab-case id, e.g. \`fix-header-import\`), or use an existing task. New tasks start in **Backlog** (vague is OK).
2. ${opts.requireSpecFile ? `**Spec file:** Create or update \`${tasksDir}/<task-id>.md\` (required for each task).` : `**Spec file:** Optionally create or update \`${tasksDir}/<task-id>.md\` with description and acceptance criteria.`}
3. **Flow:** Do **not** put the task in In Progress until it has been refined. After discovery/planning, update the task's spec (description, acceptance criteria); when you know what to do and the spec is clear, set \`status\` to **Ready**. Only when you are **actually starting the work** (e.g. writing code), set \`status\` to **In Progress**. So: Backlog → Ready (after refinement) → In Progress (when working) → Done.

You **must not** start implementation (no code, no concrete changes) until the task is at least in **Ready** and you are about to work on it; then move to **In Progress**. If \`${boardPath}\` does not exist yet, create a minimal valid board file (board name, columns: Backlog, Ready, In Progress, Done, tasks: {}) and the task in Backlog before proceeding.

---
`;

  const taskSpecFormatSection = opts.includeTaskSpecFormat
    ? `
## Task spec file format (\`${tasksDir}/<task-id>.md\`)

Follow this structure so task specs are consistent and machine-friendly:

- **Title:** First line or \`# <Task title>\` (match the board \`title\` or expand it).
- **Description:** Short context or problem statement (optional \`## Description\`).
- **Acceptance criteria / Definition of Done:** \`## Acceptance criteria\` or \`## Definition of Done\` with a checklist (e.g. \`- [ ] item\`) so completion is unambiguous. All items must be checked before moving the task to Done.
- **Notes / Dependencies:** Optional \`## Notes\`, \`## Dependencies\` (for human context; \`depends_on\` in the board is the source of truth for task ordering).

Keep each file focused on one task; use the task id in the filename (e.g. \`fix-auth-timeout.md\`).

---
`
    : "";

  const requireSpecBullet = opts.requireSpecFile
    ? `- **Spec required:** Every task must have a \`spec\` field pointing to \`${tasksDir}/<task-id>.md\`. Create the .md file when creating the task.
`
    : "";

  return `# Statecraft
${strictBlock || ""}
This project uses Statecraft for the task board.

- **Board file:** \`${boardPath}\`
- **Task spec files:** \`${tasksDir}/<task-id>.md\` (relative to board directory)
- **Columns (canonical):** Backlog → Ready → In Progress → Done.

## Commands

Use \`statecraft\` if installed globally. If not in PATH, use \`npx statecraft\` (npm), \`pnpm dlx statecraft\` (pnpm), or \`yarn dlx statecraft\` (yarn)—e.g. \`npx statecraft validate ${boardPath}\`.

- Get board format spec: \`statecraft spec\`
- Validate board: \`statecraft validate ${boardPath}\`
- View board in browser: \`statecraft render ${boardPath}\`

## Task lifecycle (edit board and task files directly)

**Flow:** Backlog → Ready → In Progress → Done. Do not skip Ready.

- **Create task:** Add an entry under \`tasks\` with \`status: Backlog\` (id, title, optional description, spec, owner, priority, depends_on). ${opts.requireSpecFile ? `Create \`${tasksDir}/<task-id>.md\` for each task (required).` : `If needed, create \`${tasksDir}/<task-id>.md\` with description and DoD.`} Backlog = initial or vague; refinement comes next.
- **Refine and move to Ready:** After discovery or planning, update the task's spec file (description, acceptance criteria). When the definition is clear and you know how to solve it, set \`status\` to **Ready**. Ready = "ready to be worked on."
- **Start work:** Only when you are about to do the actual work (code, fix, etc.), set the task's \`status\` to **In Progress**. Read the task's \`spec\` file if needed.
- **Finish work:** Set the task's \`status\` to **Done** only when the task's acceptance criteria (in its spec file) are satisfied.
${taskSpecFormatSection}
## AI guidelines for creating tickets

- **Keep the board in sync:** When doing substantive work, create a new task in **Backlog** (or use an existing one). After discovery/refinement, update the task spec and move to **Ready**; only when actually working move to **In Progress**, then **Done** when criteria are met. Do not skip Ready.
${requireSpecBullet}- **Task naming:** kebab-case, verb or noun phrase (e.g. \`fix-auth-timeout\`).
- **Description:** One line summary; optional markdown for context.
- **Definition of Done:** Acceptance criteria in task spec; all checked before moving to Done.
- **Task fields (from spec):** \`title\` (required), \`status\` (required), optional \`description\`, \`spec\` (path to .md), \`owner\`, \`priority\`, \`depends_on\`.
- **Spec file:** Path relative to board directory, e.g. \`${tasksDir}/<task-id>.md\`.
`;
}
