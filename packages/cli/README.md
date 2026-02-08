# Statecraft CLI

Validate, summarize, and render Statecraft board files from the terminal. Interactive **init** creates your board and optional AI rules (Cursor, Claude Code, Codex). **spec** prints the board format for AI agents.

## Install

```bash
npm install -g @stcrft/statecraft
# or: pnpm add -g @stcrft/statecraft   /   yarn global add @stcrft/statecraft
```

Then run `statecraft <command>`. Or use `npx @stcrft/statecraft init` (etc.) without a global install.

## Commands

| Command | Description |
|--------|-------------|
| **`statecraft init`** | Interactive setup: create a board file and optionally generate rules for Cursor (`.cursor/rules/statecraft.mdc`), Claude Code (`.claude/rules/statecraft.md`), and/or Codex (`AGENTS.md`) so your AI assistant knows the board path, task lifecycle, and AI guidelines. Re-run to create a new board; edit generated files to tweak guidelines. |
| **`statecraft spec`** | Print the board format spec (for AI agents; no paths). |
| **`statecraft validate [path]`** | Parse and validate a board file. Exit 0 if valid, 1 on errors. |
| **`statecraft summarize [path]`** | Print a short text summary of the board (name, columns, tasks, WIP/blocked). |
| **`statecraft render [path]`** | Serve the board in the browser (read-only UI). Options: `--port 3000` (default), `--open` (open browser). Starts a local server with `GET /api/board` and WebSocket for live updates when the file changes. |

## Path handling

- **Single path only.** One board file per run. Passing multiple paths is not supported and will exit with an error.
- **Default path:** If you omit the path for `validate`, `summarize`, or `render`, the CLI uses **`./board.yaml`** (relative to the current working directory).
- **Relative vs absolute:** The path is relative to the current working directory unless you pass an absolute path.

## Examples

```bash
# Interactive setup (new project)
statecraft init

# Print board format spec (for AI agents)
statecraft spec

# Validate the default board (./board.yaml)
statecraft validate

# Validate or summarize a specific file
statecraft validate examples/board.yaml
statecraft summarize /path/to/board.yaml

# Serve board UI (optional: --open to open browser)
statecraft render
statecraft render examples/board.yaml --port 3000 --open
```

## Development

From the repo root:

```bash
pnpm build          # build all packages (required before `render` so renderer dist exists)
pnpm cli init       # run init
pnpm cli spec       # print spec
pnpm cli validate   # validate default board
pnpm cli render --open   # serve board UI (opens browser)
```

Or from this package:

```bash
pnpm build
node dist/index.js validate
```
