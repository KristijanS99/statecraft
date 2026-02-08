/**
 * Shared content for generated AI rules (Cursor, Claude Code, Codex).
 * Single source for the Statecraft rule body so init only orchestrates.
 */

export function buildStatecraftRuleBody(boardPath: string, tasksDir: string): string {
  return `# Statecraft

This project uses Statecraft for the task board.

- **Board file:** \`${boardPath}\`
- **Task spec files:** \`${tasksDir}/<task-id>.md\` (relative to board directory)
- **Columns (canonical):** Backlog → Ready → In Progress → Done.

## Commands

- Get board format spec: \`statecraft spec\`
- Validate board: \`statecraft validate ${boardPath}\`
- View board in browser: \`statecraft render ${boardPath}\`

## Task lifecycle (edit board and task files directly)

- **Prepare for work:** When the task has a clear definition and dependencies are satisfied, set \`status\` to **Ready**.
- **Start work:** Set the task's \`status\` to **In Progress**. Optionally open/read the task's \`spec\` file.
- **Finish work:** Set the task's \`status\` to **Done** only when the task's acceptance criteria (in its spec file) are satisfied.
- **Create task:** Add an entry under \`tasks\` with \`status: Backlog\` (id, title, optional description, spec, owner, priority, depends_on). If needed, create \`${tasksDir}/<task-id>.md\` with description and DoD.

## AI guidelines for creating tickets

- **Task naming:** kebab-case, verb or noun phrase (e.g. \`fix-auth-timeout\`).
- **Description:** One line summary; optional markdown for context.
- **Definition of Done:** Acceptance criteria in task spec; all checked before moving to Done.
- **Task fields (from spec):** \`title\` (required), \`status\` (required), optional \`description\`, \`spec\` (path to .md), \`owner\`, \`priority\`, \`depends_on\`.
- **Spec file:** Path relative to board directory, e.g. \`${tasksDir}/<task-id>.md\`.
`;
}
