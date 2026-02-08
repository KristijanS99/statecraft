# Statecraft

[![CI](https://github.com/KristijanS99/statecraft/actions/workflows/ci.yml/badge.svg)](https://github.com/KristijanS99/statecraft/actions/workflows/ci.yml)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)

<p align="center">
  <img src="logo-small.png" width="200" alt="Statecraft logo" />
</p>

**Statecraft** is an AI-first, developer-friendly standard for representing Kanban-style task boards as code. Boards are defined in a small YAML DSL and live in your repo as the source of truth. The CLI validates and summarizes boards; a read-only web renderer lets you view them in the browser. No editing in the UI—boards are meant to be changed by AI agents (or in code) and versioned in Git.

**Why?** Task tools today are UI-first and hard for AI agents to use. Statecraft gives you a machine-readable task language in the repo—deterministic, diffable, and built for AI to read, update, and summarize. [Read more about motivation and principles →](docs/why-statecraft.md)

## Requirements

- **Node.js** 20 or later (LTS; actively maintained versions)

## Install

**From npm** (works with npm, pnpm, and Yarn):

```bash
# npm
npx statecraft init
# or install globally: npm install -g @stcrft/statecraft

# pnpm
pnpm add -g @stcrft/statecraft
# or: pnpm dlx statecraft init

# Yarn (v2+)
yarn global add @stcrft/statecraft
```

**From source** (for development or contributing):

- **pnpm** 9 or later (or use corepack: `corepack enable` then `pnpm install`)

```bash
git clone https://github.com/KristijanS99/statecraft.git
cd statecraft
pnpm install
pnpm build
```

Run the CLI via the workspace script (requires a build first):

```bash
pnpm cli <command> [path]
```

Path defaults to `./board.yaml` when omitted.

## Usage

| Command | Description |
|--------|-------------|
| **`statecraft init`** | Interactive setup: create a board file and optionally generate rules for Cursor (`.cursor/rules/statecraft.mdc`), Claude Code (`.claude/rules/statecraft.md`), and/or Codex (`AGENTS.md`) so your AI assistant knows the board path, task lifecycle, and AI guidelines. Re-run to create a new board; edit generated files to tweak guidelines. |
| **`statecraft spec`** | Print the board format spec (for AI agents; no paths). |
| **`statecraft validate [path]`** | Parse and validate a board file. Exit 0 if valid, 1 on errors. |
| **`statecraft summarize [path]`** | Print a short text summary (board name, column counts, task list, WIP/blocked) to stdout. |
| **`statecraft render [path]`** | Serve the board in the browser. Serves the built renderer and the board at `GET /api/board`; WebSocket pushes updates when the file changes. |

**Render options:** `--port 3000` (default), `--open` (open browser).

**Example boards** are in [`examples/`](examples/): try `pnpm cli validate examples/board.yaml`, then `pnpm cli render examples/board.yaml --open`.

### Setup with init

For a new project or repo, run **`statecraft init`** to create your board and connect it to your AI workflow. Init creates a board with the **canonical columns** (Backlog, Ready, In Progress, Done) and prompts for board name, board file path (default `board.yaml`), task spec directory (default `tasks`), optional WIP limit for In Progress, and whether to generate rules for **Cursor** (default yes), **Claude Code**, and **Codex**. Generated files (e.g. `.cursor/rules/statecraft.mdc`, `.claude/rules/statecraft.md`, or a Statecraft section in `AGENTS.md`) include the board path, commands (`statecraft validate`, `render`), task lifecycle (prepare for work → Ready, start → In Progress, finish → Done), and default AI guidelines. Edit any generated file to customize the guidelines.

### Quick start

**New project:** Run `pnpm cli init` to create your board and optional Cursor / Claude Code / Codex rules, then validate and render the path init gave you.

**Existing board or examples:**

```bash
pnpm build
pnpm cli validate examples/board.yaml
pnpm cli summarize examples/board.yaml
pnpm cli render examples/board.yaml --open
```

When you open the renderer without a server (e.g. Vite dev), you can paste YAML or choose a file to load a board.

## Board format (DSL)

The board format is a single YAML file with `board` (name), `columns` (canonical set: **Backlog → Ready → In Progress → Done**; optional WIP limit on In Progress), and `tasks` (id → title, status, optional description, owner, priority, depends_on). Full grammar and field reference:

- **[Statecraft board DSL — Spec (v0)](docs/spec.md)**

AI agents and developer tools should use the spec as the single source of truth.

## Project structure

| Package | Role |
|---------|------|
| **`packages/core`** | DSL parser, AST, validation, summarizer. No CLI or UI. |
| **`packages/cli`** | CLI for `validate`, `summarize`, and `render` (server + static app). |
| **`packages/renderer`** | Vite + React app: read-only board view, loads from API or paste/file. |

## Tests

```bash
pnpm test        # unit/integration (core + CLI)
pnpm test:e2e    # Playwright E2E (renderer; builds and serves fixture)
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to run the project, run tests, and open a PR. We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

## License

GPL-3.0 — see [LICENSE](LICENSE).
