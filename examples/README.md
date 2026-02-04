# Example Statecraft boards

Sample board files that conform to the [Statecraft DSL spec](../docs/spec.md). Use them for development, manual testing, or as templates.

| File | Description |
|------|--------------|
| `board.yaml` | Full example: Auth Service board with columns (incl. WIP limit), multiple tasks, `description`, `spec`, `depends_on`. |
| `board-minimal.yaml` | Minimal example: two columns, two tasks; useful for smoke tests. |

Pass the path to the CLI or renderer explicitly (e.g. `statecraft validate examples/board.yaml`).
