# CLAUDE.md

This file provides guidance for Claude Code when working with the Artcraft monorepo.

## Project Overview

Artcraft is a web and desktop application for generating AI image and video. It is written in 
Rust and TypeScript and contains desktop, server, and frontend components.

## Project Structure

```
artcraft/
├── _database/                           # Schema definitions and migrations (MySQL, SQLite, Elasticsearch, etc.)
│   ├── elasticsearch/                   # Elasticsearch schema and queries
│   └── sql/                             # MySQL and SQLite schema definitions and migrations
│       ├── artcraft_migrations/         # ArtCraft desktop app SQLite migrations
│       ├── migrations/                  # Server MySQL migrations
│       └── migrations_squashed/         # Fully materialized MySQL schema definitions for most tables
├── _tools/                              # Various 3rd party tool integrations and configurations
│   └── postman/                         # Postman configs for test HTTP requests against development and production
├── build/                               # Dockerfile build instructions for server components
├── crates/                              # Rust workspace
│   ├── api_clients/                     # HTTP clients for calling internal and 3rd party services
│   ├── cli/                             # Command line tools
│   ├── desktop/                         # Desktop (Tauri) apps
│   │   └── artcraft/                    # (Important) ArtCraft, the desktop app. This is one of our main pieces of software
│   ├── lib/                             # Various utility libraries for servers, CLI tools, desktop, etc.
│   ├── schema/                          # Data definition layer: MySQL, SQlite, Redis, S3/R2 buckets, etc.
│   │   ├── buckets/                     # Declares R2 cloud bucket topology
│   │   ├── database/                    # MySQL, SQLite, Elasticsearch, Redis, etc.
│   │   │   ├── elasticsearch_schema/    # Elasticsearch
│   │   │   ├── migration/               # (deprecated) Online schema adapters for MySQL 
│   │   │   ├── mysql_queries/           # Sqlx MySQL queries for our backend monolith `storyteller-web`, jobs, etc.
│   │   │   ├── redis_common/            # Redis support
│   │   │   ├── redis_schema/            # Redis key and HKEY topology
│   │   │   ├── sqlite_queries/          # (deprecated) Sqlite queries
│   │   │   └── sqlite_tasks/            # Queries for the ArtCraft desktop app's "tasks" database.
│   │   ├── public/                      # Token identifier and enum variant definitions
│   │   │   ├── composite_identifier/    # MySQL composite key system
│   │   │   ├── enums/                   # MySQL "enums" stored in VARCHAR fields.
│   │   │   └── tokens/                  # Primary database identifiers with Stripe-like ID prefixes, eg. "user_{entropy}"
│   │   └── service/                     # Backend HTTP services and jobs
│   │       ├── job/                     # Backend jobs.
│   │       │   └── video_thumbnail_job/ # Render video thumbnails
│   │       ├── plugins/                 # Collections of reusable Actix-Web HTTP functions (user and billing systems)
│   │       └── web/                     # HTTP web servers
│   │           └── storyteller_web/     # (Important) Our main HTTP API monolith and backend.
│   └── frontend/                        # Nx typescript monorepo for our websites and Tauri desktop apps
│       ├── apps/                        # Websites and Tauri desktop apps
│       │   ├── artcraft/                # ArtCraft the Tauri app's frontend. Used in conjunction with `artcraft` the Rust crate.
│       │   └── artcraft-website/        # The website for https://getartcraft.com
│       └── libs/                        # Support libraries, reusable React components, etc.
└── Cargo.toml                           # Rust monorepo workspace
```

## Code Style

- Rust with no minimum supported version
- Actix-web for HTTP services
- SQLx for MySQL and SQLite. MySQL queries belong in the `mysql_queries` crate, not in application/service crates like `storyteller-web` — call those query functions instead of embedding `sqlx::query!` / `sqlx::query()` in handlers. (Query-writing conventions live in `crates/schema/database/mysql_queries/CLAUDE.md`.)
- A mix of wreq and reqwest for Rust HTTP clients
- Never use `println!` or `eprintln!` outside of tests; use `log` crate macros instead
- When two crates export the same type name, alias imports with a suffix: `use foo::Bar as BarFoo;`
- Prefer `use` imports over inline fully-qualified paths; only qualify inline for true one-offs or std collisions
- TypeScript with Nx, React, Vite, Zustand, and Three.js
- Use two spaces for indentation

### File Layout

Organize for top-to-bottom reading. Important things first, details later.

- **Constants** at the top (after imports)
- **Structs/enums** next; outer structs above inner sub-structs
- **API types** in order: Request, Response, Error
- **In impl blocks**: constructors first, then public methods, then private helpers
- Private helpers go *below* the methods that call them
- Among helpers: meatier logic above leaf-level formatters
- **In test modules**: constants first, then test cases (grouped into sub-modules when 2+), then helper functions last

## Markdown

- **Tables must be space-padded so columns align in plain text.** Markdown
  tables are read raw (terminals, diffs, editors) at least as often as
  rendered, and condensed tables are unreadable there. Pad every cell to its
  column width:

  ```markdown
  | Model        | Configuration | Credits    | Speed | Score   |
  |--------------|---------------|--------------------|---------|
  | Meshy 6      | text or image | 104        | 80.0  | +24     |
  | Rodin 2.5    | text or image | 13         | 10.0  | +3      |
  ```

  Not: `| Model | Configuration | Credits | Speed | Score |` packed tight
  with varying widths per row.

---

# Project: ArtCraft MCP (fork-local — everything below governs work on this fork only)

Guidance for executing the ArtCraft MCP project (embedded control server + standalone MCP server). It is planned in Linear; this section keeps every session on-rails. Upstream conventions above still apply to all code.

- **Project:** ArtCraft MCP
- **Domain:** software
- **Tools & channels:** Rust (axum control server in the Tauri app), TypeScript (`mcp/artcraft-mcp` with @modelcontextprotocol/sdk), Ollama MCP for local-model dispatch, MCP inspector, Claude Code / Codex as executors
- **Repo / default branch:** github.com/performance-clickt/artcraft (upstream: storytold/artcraft) / `main`
- **Linear team / project:** Hive Mind / [ArtCraft MCP](https://linear.app/clickt/project/artcraft-mcp-6759fa1b04b7)
- **Milestones (integration checkpoints):** M1 Baseline build → M2 Control server (Path A) → M3 Scene bridge → M4 MCP server → M5 Verification & evals
- **Lessons Log:** the Linear document named "Lessons Log" on the ArtCraft MCP project
- **Orientation docs:** `docs/PROJECT.md`, full plan in `docs/artcraft-mcp-brief.md`

## Session start

Before pulling an issue:

1. Read the project's **Lessons Log** document in Linear and apply any relevant entries.
2. Pull the next issue from the project and read it in full — it contains everything needed to execute that task.

## Linear is the source of truth

Every unit of work is a Linear issue, and each issue is written to be executed as a standalone prompt.

- **Execute only what the issue specifies.** If the issue is missing context or contains an unresolved decision, stop and flag it rather than improvising — a well-formed issue shouldn't need outside context.
- **Update issue status** as you move: claim it (In Progress) when you start — this claim happens *before* any git action and is the lock that stops two agents taking one issue — and done only when acceptance criteria are proven, reflect has run, and the PR is merged.
- **Never work off-Linear.** If new work surfaces mid-project, create an issue for it rather than silently expanding scope.
- **Assume parallel agents.** Other agents may be executing other issues at the same time. Coordinate only through Linear: an In-Progress issue is owned — never start it. Pick only unclaimed, unblocked issues.

## Linear sync at issue boundaries

Exactly two comments per issue:

- **On starting**: post the todo plan as a comment — checkable items for what you're about to do.
- **On completing**: post one wrap-up comment: what changed, verification evidence (tests/checks pass, curl or inspector output, behavior demonstrated), deviations from the plan, the reflect verdict, the PR link and its check status. Then update the issue status.
- **No per-item progress comments.** (Status transitions and Lessons Log appends are separate normal actions, not counted against this cap.)
- If a Linear write fails, don't block the work: note the failure and fold the missed update into the completion comment or the next session.

Track the plan locally as checkable items (`tasks/todo.md` or your todo tool) while you work; the Linear comments are the record.

## Lessons Log

The project's Linear document "Lessons Log" is the single canonical store of lessons. There is no local lessons file.

- **After any correction from the user** (or a review pass that surfaces a repeatable mistake): append one line **immediately**, before resuming work — format: `pattern → rule that prevents it (issue ID)`.
- If the append fails, record the lesson in the issue's completion comment and append it at the next session start.

## Token efficiency: Ollama MCP dispatch

Local models are verified present: `devstral-small-2:latest` (code-oriented) and `muse-glimmer:30b-mlx` (prose/brainstorming). Use `mcp__ollama__ollama_dispatch` for mechanical, high-token, low-judgment work instead of spending frontier context:

- **Good dispatches:** summarizing long upstream source files, extracting struct/signature/field lists, first-draft boilerplate (repetitive endpoint bodies, TS invoke wrappers, README/eval drafts), reformatting. Pass `files`/`file_globs` so file contents never enter frontier context.
- **Never dispatch:** final review, verification, correctness judgments, acceptance-criteria checks, or anything a person will rely on unreviewed. Local-model output is an untrusted draft — verify it against the real source before using it.

## Codex handoff

Issues are written to be executable cold by Claude Code **or** Codex. Well-bounded implementation issues (self-contained TS tool batches, single-module endpoint work — flagged "Codex-friendly" in their Notes) may be dispatched to Codex via the `codex:codex-rescue` agent or `codex:rescue` skill. The dispatching agent still owns the CLAUDE.md gates: Linear claim, verification, reflect, PR, and merge approval are never delegated to Codex.

## Reflexion at the end of every issue

Before marking any issue done, run:

```
/reflexion:reflect
```

- **Let the skill triage, never pre-triage.** Do not decide "this issue is trivial, skipping reflect" — invoke it and let its own complexity triage route trivial changes to its quick path.
- **Record the verdict** in the completion comment: path taken, confidence, any issues found and fixed. Never write a verdict reflect didn't produce.
- An issue is not done until reflect passes and acceptance criteria are proven.

## Milestone integration check

At each milestone boundary (M1→M5 above), before starting the next milestone's issues:

1. Run the milestone verification across the whole milestone, not just the last issue — M1: stock build runs logged-in; M2: full curl matrix incl. 401s + one cheap generation; M3: scene ops with tab open/closed + timeout path; M4: 16/16 tools in inspector; M5: e2e prompt + eval scorecard. `SQLX_OFFLINE=true cargo check -p artcraft` and `npm run build` (in `mcp/artcraft-mcp`) must be clean at every boundary.
2. **Re-read every issue in the milestone** and verify its acceptance criteria still hold in the assembled state.
3. **Read the Lessons Log and the milestone's completion comments** for unresolved flags. Resolve mechanical items; file follow-up issues for judgment calls. Flag missing verification evidence — don't backfill it.
4. **Post a milestone summary comment** on the project recording verification results and how each flag was handled.

## Git workflow

Repo: **github.com/performance-clickt/artcraft** · default branch: **`main`** · upstream remote: `storytold/artcraft` (rebase target for future releases — never push to it). Every issue is delivered on its own branch and PR. **Assume other agents are working other issues in parallel.** Per issue, in order:

1. **Claim before touching git.** Move the issue to In Progress and self-assign in Linear *first*.
2. **Isolate in a worktree.** From an up-to-date `main`, create a git worktree on a new branch named with the issue's Linear `gitBranchName`. One issue = one branch = one worktree = one agent. Never work on `main`.
3. **Commit small.** Focused commits referencing the issue key (e.g. `HM-916: …`).
4. **Open a PR** to `main` on the fork with the issue key in the title. Rebase on latest `main` first; never force-push `main`.
5. **Verify.** Green per the issue's acceptance criteria, reflect passed. Prove it before asking for merge.
6. **Stop for merge approval — never self-merge.** Post the wrap-up comment with PR link and evidence, ask John to approve. Only after approval: merge, delete branch, remove worktree, mark done.

Parallel-safety: claim in Linear before any git action; never start an issue whose `blockedBy` isn't merged; small PRs merged promptly; rebase, don't force.

**Patch hygiene (this fork's extra rule):** all project logic lives in NEW files. Only these upstream files may be edited: root `Cargo.toml`, `crates/desktop/artcraft/Cargo.toml`, `crates/desktop/artcraft/src/lib.rs`, `core/lifecycle/startup/handle_tauri_startup.rs`, `crates/schema/public/enums/src/tauri/ux/tauri_event_name.rs`, `frontend/apps/artcraft/app/src/root.tsx`, `frontend/libs/tauri-events/src/index.ts`, `frontend/libs/tauri-api/src/index.ts` (plus append-only `mod.rs` lines). Editing any other upstream file needs a stated reason in the PR.

**Linear ↔ GitHub linkage:** use the exact `gitBranchName` and issue key so Linear auto-links. If the integration isn't enabled, update issue status through the Linear MCP manually at each step.

## Plan mode + verification gates

- **Plan first.** For any non-trivial task (3+ steps or a structural decision), enter plan mode before executing. If something goes sideways mid-execution, stop and re-plan.
- **Verification before done.** Never mark an issue complete without proving it: tests/checks pass, curl or inspector evidence captured, behavior demonstrated in the running app.
- **Autonomous fixing.** Given a failing check, fix it — point at the evidence and resolve it rather than asking for hand-holding.
- **Credit discipline.** Generations spend real credits: always check `estimate_cost` first, use the cheapest model and `batch_size: 1` for verification, and never exceed an issue's stated spend budget.

## Core principles

- **Simplicity first.** The smallest change that works.
- **No laziness.** Root causes, no band-aid fixes.
- **Minimal impact.** Touch only what's necessary — especially upstream files (see patch hygiene).
