# Why Statecraft?

A short note on the motivation and principles behind Statecraft.

## The problem

Current task tools (Jira, Linear, Trello) are UI-first, poor for automation, and hard for AI agents to reason about. AI coding tools can write and modify code but cannot reliably manage long-term task state—they lack shared memory, dependencies, and constraints.

**Statecraft fills that gap**: a machine-readable task language with deterministic rules and a stable interface for AI agents. The board lives as a YAML file in your repo, versioned with Git, so any tool that can read and write files can participate.

## Repo-first

The **repository** is the source of truth. Task changes happen via commits and PRs; the board file is the single source of truth for both humans and AI. No SaaS required, full history and diffs, and a natural fit for developers and AI coding agents.

## CRUS (not just CRUD)

Statecraft is built around **CRUS**:

- **Create** — create tasks
- **Read** — inspect board state, dependencies, blockers
- **Update** — move tasks, assign owners, change status (by editing the file)
- **Summarize** — generate compressed, semantic summaries

Summarize replaces Delete: tasks are completed and reasoned about, not thrown away. CRUS matches how AI agents think and operate.

## Principle

> **Boring, deterministic, inspectable infrastructure beats clever SaaS.**

Statecraft is infrastructure for task state—designed for AI agents first, with developers benefiting from the same format and a read-only view in the browser.
