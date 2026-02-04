# Statecraft board DSL — Spec (v0)

This document defines the Statecraft board format. A single file describes one Kanban-style board in YAML. The file is the source of truth for humans and AI agents; tools (CLI, renderer) read and validate it.

**One board per file.** Use `.yaml` or `.yml`. Convention: name the file e.g. `board.yaml`, or pass the path explicitly to tools.

---

## Overview

- **Format:** YAML (UTF-8).
- **Scope:** One board per file. Top-level keys: `board`, `columns`, `tasks`.
- **Purpose:** Machine-readable task state: columns, tasks, status, dependencies, optional WIP limits. Designed to be written and updated by AI agents and versioned in Git.

---

## Board

**Required.** Identifies the board.

| Key     | Type   | Required | Description                |
|---------|--------|----------|----------------------------|
| `board` | string | Yes      | Board name (human-readable label). |

---

## Columns

**Required.** Ordered list of columns (lanes). Each column is either a string (name only) or an object with `name` and optional `limit`.

| Shape   | Meaning |
|---------|--------|
| `"Column Name"` | Column with that name, no WIP limit. |
| `{ name: "Column Name", limit: N }` | Column with optional WIP limit (integer; max tasks allowed in that column). |

- Column names must be unique.
- Order of columns is significant (left to right).
- `limit` is optional; if present, it constrains how many tasks can be in that column at once (WIP limit).

---

## Tasks

**Required** (but may be an empty object). Map of task id → task. Task id is a string key (e.g. `AUTH-12`, `task-1`). Each task has the following fields:

| Field        | Type   | Required | Description |
|--------------|--------|----------|-------------|
| `title`      | string | Yes      | Short description of the task. |
| `status`     | string | Yes      | Current column; must match one of the column names. |
| `description` | string | No      | Inline summary or context; may be markdown. Use for one-liners. |
| `spec`       | string | No       | Path to a markdown file (e.g. `.md`) with full task spec, acceptance criteria, notes. Path is **relative to the board file's directory**. AI agents can read this file for context. |
| `owner`      | string | No       | Assignee (e.g. username or agent id). |
| `priority`    | string | No       | e.g. `low`, `medium`, `high`. Semantics are tool-specific. |
| `depends_on` | string or list of strings | No | Task id(s) that must be completed before this task; single id or list. |

- Task ids must be unique within the board.
- `status` must equal one of the column names from `columns`.
- `depends_on` must reference task ids that exist in `tasks` (validation rule).
- `spec`: resolved relative to the directory containing the board file. Tools may warn if the file is missing; validation does not require the file to exist.

---

## Example

Complete valid board:

```yaml
board: "Auth Service"

columns:
  - Backlog
  - name: In Progress
    limit: 3
  - Review
  - Done

tasks:
  AUTH-7:
    title: "Audit existing JWT usage"
    status: Done
    owner: kristijan
    priority: high
    description: "List all endpoints and call sites using JWT."

  AUTH-12:
    title: "Replace JWT with PASETO"
    status: In Progress
    owner: kristijan
    priority: high
    depends_on: AUTH-7
    spec: tasks/AUTH-12.md

  AUTH-13:
    title: "Add rate limiting to auth endpoints"
    status: Backlog
    priority: medium
    description: "Per-IP and per-user limits; configurable thresholds."
```

---

## Constraints (for validation)

Tools that validate board files should enforce:

1. **Board:** `board` is present and a non-empty string.
2. **Columns:** `columns` is present, a non-empty array; each entry is a string or an object with `name` (string) and optional `limit` (positive integer). Column names are unique.
3. **Tasks:** `tasks` is present (may be `{}`). Each key is a task id; each value has required `title` and `status`. `status` must match a column name. `depends_on` entries must be task ids that exist in `tasks`. Task ids are unique.
4. **WIP:** If a column has a `limit`, the number of tasks with that column as `status` must not exceed `limit`.

These constraints are the basis for parser/validator implementations; this spec does not define error messages or reporting format.

---

## See also

- **Example boards** in the repo: [`examples/`](../examples/) — `board.yaml` (full), `board-minimal.yaml` (minimal). Use with `statecraft validate examples/board.yaml` and similar.
