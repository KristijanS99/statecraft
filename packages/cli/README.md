# Statecraft CLI

Validate and summarize Statecraft board files from the terminal.

## Commands

- **`statecraft validate [path]`** — Parse and validate a board file. Exits 0 if valid, 1 on parse or validation errors.
- **`statecraft summarize [path]`** — Summarize a board. Prints a text summary to stdout.
- **`statecraft render [path]`** — Serve the board UI in the browser. Starts a local server that serves the built renderer, `GET /api/board` (board file from disk), and a WebSocket for live updates when the file changes. Options: `--port 3000` (default), `--open` (open browser).

## Path handling

- **Single path only.** One board file per run. Passing multiple paths (e.g. `statecraft validate a.yaml b.yaml`) is not supported and will exit with an error.
- **Default path:** If you omit the path, the CLI uses **`./board.yaml`** (relative to the current working directory).
- **Relative vs absolute:** The path is relative to the current working directory unless you pass an absolute path. The core library resolves paths internally, so the CLI passes your argument through as-is.

### Examples

```bash
# Validate the default board (./board.yaml)
statecraft validate

# Validate a specific file
statecraft validate examples/board.yaml
statecraft validate /path/to/board.yaml
```

## Development

From the repo root:

```bash
pnpm build          # build all packages (required before `render` so renderer dist exists)
pnpm cli validate   # run the CLI (uses workspace script)
pnpm cli render --open   # serve board UI (opens browser)
```

Or from this package:

```bash
pnpm build
node dist/index.js validate
```
