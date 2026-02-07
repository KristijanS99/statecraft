# Example Statecraft boards

Sample board files that conform to the [Statecraft DSL spec](../docs/spec.md). Use them for development, manual testing, or as templates.

| File | Description |
|------|--------------|
| `board.yaml` | Main example: Platform MVP — many columns (with WIP limits), 15 tasks across Backlog → Done; good for demo and stress-testing the renderer/summarizer. |
| `board-minimal.yaml` | Minimal example: two columns, two tasks; useful for smoke tests. |

Pass the path to the CLI or renderer explicitly (e.g. `statecraft validate examples/board.yaml`).
