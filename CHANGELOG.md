# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.1.0] - 2026-02-03

### Added

- **DSL & core:** YAML board format (spec in `docs/spec.md`), parser, AST, validation, summarizer.
- **CLI:** `statecraft validate [path]`, `statecraft summarize [path]`, `statecraft render [path]` with `--port` and `--open`.
- **Renderer:** Read-only web UI; loads board from API when served by `statecraft render`, fallback paste/file; columns as lanes, tasks as cards; live updates via WebSocket; basic styling and responsive layout.
- **E2E:** Playwright tests for the renderer (load board, columns, tasks, responsive).
- **Docs:** README, LICENSE (GPL-3.0), public spec, example boards in `examples/`.
