# Statecraft board DSL — Spec (v0)

This document defines the Statecraft board format. A single file describes one Kanban-style board in YAML. The file is the source of truth for AI agents and developers; tools (CLI, renderer) read and validate it.

**One board per file.** Use `.yaml` or `.yml`. Convention: name the file e.g. `board.yaml`, or pass the path explicitly to tools.

---

## Overview

- **Format:** YAML (UTF-8).
- **Scope:** One board per file. Top-level keys: `board`, `columns`, `tasks`.
- **Purpose:** Machine-readable task state: columns, tasks, status, dependencies, optional WIP limits. Designed for AI agents to read, write, and update; versioned in Git; developers can work with the same files.

---

## Board

**Required.** Identifies the board.

| Key     | Type   | Required | Description                |
|---------|--------|----------|----------------------------|
| `board` | string | Yes      | Board name (human-readable label). |

---

## Columns

**Required.** The board **must** use the following columns in this exact order. This is the only supported workflow; it gives AI agents a single, unambiguous contract.

### Canonical column set

| Column         | Meaning for AI |
|----------------|----------------|
| **Backlog**    | Not yet selected for immediate work. New tasks are created here. May be unrefined or unprioritized. |
| **Ready**      | Prepared and selected to be worked on next. Definition is clear (e.g. in spec file), dependencies met or N/A; safe to move to In Progress when capacity is free. |
| **In Progress** | Currently being worked on. Move a task here when starting work; at most one (or a configurable WIP limit) at a time per column if enforced. |
| **Done**       | Completed and accepted. Move here when the task’s acceptance criteria (in its spec file) are satisfied. |

- **Order:** `Backlog` → `Ready` → `In Progress` → `Done` (left to right).
- **Syntax:** Each column is either a string (name only) or an object with `name` and optional `limit`. The `limit` (positive integer) is a WIP limit: max tasks allowed in that column. Typically only **In Progress** has a limit (e.g. `{ name: "In Progress", limit: 3 }`).
- Validators must reject boards whose `columns` do not match this set (same names, same order). Column names are case-sensitive.

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

## CRUS: AI behavior

Statecraft is built around **CRUS** (Create, Read, Update, Summarize). AI agents must follow this behavior when working with the board.

### Create

- **Where:** New tasks are created with `status: Backlog`.
- **What:** Add an entry under `tasks` with at least `title` and `status`. Use a stable, kebab-case **task id** (e.g. `fix-auth-timeout`). Optionally set `description`, `spec` (path to a `.md` file relative to the board directory), `owner`, `priority`, `depends_on`.
- **Spec file:** If the task has acceptance criteria or context, create a markdown file (e.g. `tasks/<task-id>.md`) and set `spec: tasks/<task-id>.md`. Path is relative to the board file’s directory.

### Read

- **Board file:** The single source of truth. Read it to see all tasks, their `status`, and dependencies (`depends_on`).
- **Spec files:** For a task with a `spec` field, read that file for full description and definition of done. Resolve the path relative to the board file’s directory.
- **Status:** A task’s `status` is exactly one of the canonical column names (Backlog, Ready, In Progress, Done). Use it to reason about what is not yet selected, ready to start, in progress, or completed.

### Update

- **How:** Edit the board YAML file (and, if needed, task spec files) directly. There are no separate “move” APIs; changing `status` is the update.
- **Prepare for work:** When a task has a clear definition and dependencies are satisfied (or N/A), set `status` to `Ready`. Do not move to In Progress until the task is Ready (or skip Ready if the workflow is minimal).
- **Start work:** Set the task’s `status` to `In Progress`. Optionally read the task’s `spec` file first.
- **Finish work:** Set the task’s `status` to `Done` only when the task’s acceptance criteria (in its spec file, if present) are satisfied. Do not move to Done without meeting the definition of done.
- **Create / change fields:** Add or edit `title`, `status`, `description`, `spec`, `owner`, `priority`, `depends_on` in the board file; create or edit the spec file when the task has one.

### Summarize

- Completion is represented by moving tasks to **Done**, not by deleting them. Use `statecraft summarize` (or equivalent) to produce a short summary of the board (counts, task list, WIP, blocked). Summarize replaces “delete”: tasks are completed and reasoned about, not removed.

---

## Example

Complete valid board:

```yaml
board: "Auth Service"

columns:
  - Backlog
  - Ready
  - name: In Progress
    limit: 3
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
    status: Ready
    priority: medium
    description: "Per-IP and per-user limits; configurable thresholds."

  AUTH-14:
    title: "Document auth API"
    status: Backlog
    priority: low
```

---

## Constraints (for validation)

Tools that validate board files should enforce:

1. **Board:** `board` is present and a non-empty string.
2. **Columns:** `columns` is present and **must equal the canonical set** in order: Backlog, Ready, In Progress, Done. Each entry is either the string (e.g. `"Backlog"`, `"Ready"`, `"In Progress"`, `"Done"`) or an object `{ name: "<exact name>", limit: N }` with optional positive integer `limit` (typically only on In Progress). No extra or missing columns; no reordering.
3. **Tasks:** `tasks` is present (may be `{}`). Each key is a task id; each value has required `title` and `status`. `status` must be one of the canonical column names. `depends_on` entries must be task ids that exist in `tasks`. Task ids are unique.
4. **WIP:** If a column has a `limit`, the number of tasks with that column as `status` must not exceed `limit`.

These constraints are the basis for parser/validator implementations; this spec does not define error messages or reporting format.

---

## Setup and AI workflow

**Creating a board:** Use **`statecraft init`** to create a board file and optionally connect Statecraft to your AI workflow. Init creates a board with the **canonical columns** (Backlog, Ready, In Progress, Done) and prompts for: board name, optional WIP limit for In Progress, board file path, directory for task `.md` files (relative to the board), and whether to generate rules for **Cursor**, **Claude Code**, and/or **Codex**. It writes valid board YAML and, if you choose, tool-specific rule files so your AI assistant knows where the board is and how to follow CRUS.

**Generated rule files:**

- **Cursor:** `.cursor/rules/statecraft.mdc` — Cursor rules with YAML frontmatter (description, alwaysApply) and Markdown body.
- **Claude Code:** `.claude/rules/statecraft.md` — Modular rule in Claude Code’s rules directory (Markdown, no frontmatter).
- **Codex:** `AGENTS.md` at project root — Codex custom instructions; init creates the file or appends a Statecraft section if `AGENTS.md` already exists.

**Where AI guidelines live:** When init generates any of these files, it embeds **AI guidelines** for creating and updating tasks: task naming (e.g. kebab-case), description and DoD, task fields from this spec (`title`, `status`, `description`, `spec`, `owner`, `priority`, `depends_on`), and the convention for spec files (e.g. `tasks/<task-id>.md`). Each rule also describes the **task lifecycle**: how to start work, finish work, and create tasks by editing the board file and task spec files directly. To customize guidelines, edit the generated file(s) after init.

**Spec and validation:** After init, run `statecraft spec` to print this spec (for AI agents) and `statecraft validate <board-path>` to validate the board.

---

## See also

- **Example boards** in the repo: [`examples/`](../examples/) — `board.yaml` (full), `board-minimal.yaml` (minimal). Use with `statecraft validate examples/board.yaml` and similar.
