# Contributing to Statecraft

Thanks for your interest in contributing. Statecraft is a developer- and AI-first standard for Kanban-style boards as code.

## How to contribute

1. **Fork and clone** the repo.
2. **Install dependencies:**  
   Ensure you have Node.js 20+ and pnpm 9+. From the repo root:
   ```bash
   pnpm install
   ```
3. **Build:**  
   ```bash
   pnpm build
   ```
4. **Run tests:**  
   ```bash
   pnpm test
   pnpm test:e2e
   ```
   E2E tests will build the renderer and run Playwright (install browsers once: `pnpm --filter @statecraft/renderer exec playwright install chromium`).
5. **Make your changes** in a branch. Keep the test suite passing.
6. **Open a pull request** against `main`. Describe what you changed and why. CI will run build and tests automatically.

## Project structure

- **`packages/core`** — DSL parser, AST, validation, summarizer. No CLI or UI.
- **`packages/cli`** — CLI (`validate`, `summarize`, `render`). Depends on core.
- **`packages/renderer`** — Read-only web UI (Vite + React). Used by `statecraft render`.

The board format is specified in [docs/spec.md](docs/spec.md). When changing the DSL or parser, update the spec and ensure example boards in `examples/` still validate.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/) for consistency and to drive automated versioning:

- `feat: add something` — new feature
- `fix: resolve something` — bug fix
- `docs: update README` — documentation only
- `chore: bump deps` — maintenance (no user-facing change)

Prefix your commit message with `feat:`, `fix:`, `docs:`, or `chore:` as appropriate; these are used for automated versioning when PRs are merged.

## Questions

Open an [issue](https://github.com/KristijanS99/statecraft/issues) for bugs, ideas, or questions.
