# @statecraft/renderer

Read-only web UI for Statecraft boards. Used by `statecraft render` or run standalone.

## Scripts

- **`pnpm run dev`** — Vite dev server (no API; use paste/file to load a board).
- **`pnpm run build`** — Production build to `dist/`.
- **`pnpm run preview`** — Serve `dist/` (no `/api/board`).
- **`pnpm run test:e2e`** — Playwright E2E tests. Builds the app, starts a test server (fixture at `/api/board`), and runs tests. From repo root: `pnpm test:e2e`.

## E2E tests

Tests live in `e2e/*.spec.ts`. The config starts a minimal server (`e2e-server.mjs`) that serves the built app and a fixture board at `GET /api/board`. No CLI or real board file required. Install browsers once: `npx playwright install chromium`.
