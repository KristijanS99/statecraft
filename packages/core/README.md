# @statecraft/core

Parser, AST, validation, and summarizer for the Statecraft board DSL. No CLI or UI—consumed by `@statecraft/cli` and `@statecraft/renderer`.

## Flow

1. **Parser** (`parser.ts`) — YAML string or file path → typed **Board** AST. Throws `ParseError` on invalid YAML or missing/wrong required fields.
2. **AST** (`ast.ts`) — Types: `Board`, `Column`, `Task`. Columns are normalized to `{ name, limit? }`; `depends_on` to `string[]`.
3. **Validation** (`validation.ts`) — `validate(board)` returns `{ valid, errors }`. Enforces canonical columns (Backlog, Ready, In Progress, Done), task status in columns, `depends_on` refs, WIP limits. Does not throw.
4. **Summarize** (`summarize.ts`) — `summarize(board)` returns a plain-text summary (board name, column counts, task list, blocked section).

## API

- `parseBoard(input: string): Board` — Parse from file path or raw YAML (heuristic: path if no newline and ends with `.yaml`/`.yml` or contains path sep).
- `parseBoardFromString(content: string): Board` — Parse raw YAML only.
- `validate(board: Board): ValidationResult` — Returns `{ valid, errors }`; use for CLI/UI.
- `summarize(board: Board): string` — Text summary for terminal or paste.

See `docs/spec.md` in the repo root for the board format.

## Tests

```bash
pnpm --filter @statecraft/core test
```
