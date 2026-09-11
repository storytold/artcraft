# AGENTS.md

This file provides guidance for coding agents when working with the Artcraft monorepo.

## Project Overview

Artcraft is a public-facing Tauri desktop app for generating AI images and video.
It uses Rust and TypeScript. Backend services, company tooling, and website builds
live in the separate `artcraft-services` repository.

## Project Structure

```
artcraft/
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
