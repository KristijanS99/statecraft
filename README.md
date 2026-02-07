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
- **pnpm** 9 or later (or use corepack: `corepack enable` then `pnpm install`)

## Install

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
| **`statecraft validate [path]`** | Parse and validate a board file. Exit 0 if valid, 1 on errors. |
| **`statecraft summarize [path]`** | Print a short text summary (board name, column counts, task list, WIP/blocked) to stdout. |
| **`statecraft render [path]`** | Serve the board in the browser. Serves the built renderer and the board at `GET /api/board`; WebSocket pushes updates when the file changes. |

**Render options:** `--port 3000` (default), `--open` (open browser).

**Example boards** are in [`examples/`](examples/): try `pnpm cli validate examples/board.yaml`, then `pnpm cli render examples/board.yaml --open`.

### Quick start

```bash
pnpm build
pnpm cli validate examples/board.yaml
pnpm cli summarize examples/board.yaml
pnpm cli render examples/board.yaml --open
```

When you open the renderer without a server (e.g. Vite dev), you can paste YAML or choose a file to load a board.

## Board format (DSL)

The board format is a single YAML file with `board` (name), `columns` (ordered lanes, optional WIP limits), and `tasks` (id → title, status, optional description, owner, priority, depends_on). Full grammar and field reference:

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
