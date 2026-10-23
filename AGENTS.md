# AGENTS.md

This file provides guidance for coding agents when working with the Artcraft monorepo.
Claude Code, Codex and other agents read `AGENTS.md` files directly; do not add
`CLAUDE.md` mirrors (see [agent documentation](_docs/AGENTS.md)).

## Project Overview

Artcraft is a public-facing Tauri desktop app for generating AI images and video.
It uses Rust and TypeScript. `artcraft-native/` is a separate pure Rust/egui
desktop app over the same API client crates. Backend services, company tooling,
and website builds live in the separate `artcraft-services` repository.
[Development setup](_docs/dev_setup.md) owns environment commands.

## Project Structure

```
artcraft/
├── artcraft-native/                  # Rust/egui desktop app over shared API clients
├── _database/sql/artcraft_migrations/  # Embedded SQLite task database migrations
├── .sqlx/                             # SQLite query metadata for offline builds
├── crates/
│   ├── desktop/artcraft/              # Tauri app, configuration, capabilities, icons
│   ├── api_clients/                  # Desktop provider clients and shared API types
│   ├── lib/                          # Desktop support libraries
│   ├── schema/database/sqlite_tasks/ # Desktop task persistence
│   ├── schema/public/                # Shared wire-format enums and identifiers
│   ├── testing/                      # Shared test helpers
│   └── vendor/tauri-plugin-http/      # HTTP plugin fork with cookie access
├── frontend/
│   ├── apps/artcraft/                # Tauri app frontend and public resources
│   └── libs/                         # Shared frontend libraries
├── script/artcraft/                  # Desktop development and build scripts
├── test_data/                        # Fixtures used by retained crate tests
└── Cargo.toml                        # Desktop dependency workspace
```

Keep `external/` and `secrets/` untouched. Repository pruning must preserve
untracked and ignored local files; delete only Git-tracked paths unless the user
explicitly authorizes a cache cleanup.

## Code Style

- Rust with no minimum supported version
- SQLx for SQLite; prefer `sqlx::query!` / `sqlx::query_as!` compile-time checked macros over runtime `sqlx::query()` whenever possible
- A mix of wreq and reqwest for Rust HTTP clients
- Never use `println!` or `eprintln!` outside of tests; use `log` crate macros instead
- When two crates export the same type name, alias imports with a suffix: `use foo::Bar as BarFoo;`
- Prefer `use` imports over inline fully-qualified paths; only qualify inline for true one-offs or std collisions
- TypeScript with Nx, React, Vite, Zustand, and Three.js
- Use two spaces for indentation
- Each Tauri command belongs in its own file module, named after the command. Keep shared state, types, and helpers in separate support modules; see the [Storyteller command conventions](crates/desktop/artcraft/src/services/storyteller/commands/AGENTS.md).

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
  | Model        | Configuration | Credits | Speed | Score |
  |--------------|---------------|---------|-------|-------|
  | Meshy 6      | text or image | 104     | 80.0  | +24   |
  | Rodin 2.5    | text or image | 13      | 10.0  | +3    |
  ```

  Not: `| Model | Configuration | Credits | Speed | Score |` packed tight
  with varying widths per row.

## Working Rules

- Reproduce a found defect with a test before fixing it and confirm the failure's cause.
  If automation cannot reach it, record the limitation and the nearest executable check.
  Never weaken a valid test to make a suite pass.
- Use the owning boundary's existing types, error idiom and dependency direction. Read a
  dependency's source before wrapping it; avoid unrelated cleanup or new frameworks.
- Run checks that reach the changed boundary and widen them for shared wire types or
  routing. Compilation, fixture tests, live-provider behavior, native startup and visual
  acceptance are different evidence; report which ones ran and which were skipped.
- Keep ordinary tests local and hermetic. Paid generation, uploads, real credentials,
  account changes, releases and destructive operations need explicit authorization.
- Nested `AGENTS.md` files own their context. For a change that crosses boundaries, read
  the `AGENTS.md` of each affected directory before editing.

Contexts: [Rust](crates/AGENTS.md), [frontend](frontend/AGENTS.md),
[pagescene](frontend/libs/components/pagescene/AGENTS.md),
[native app](artcraft-native/AGENTS.md), [agent documentation](_docs/AGENTS.md).
The [engineering methodology](_docs/agent-engineering-methodology.md) explains these
rules and describes optional review and concurrent-agent workflows.
