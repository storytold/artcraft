# ArtCraft: A Beginner's Guide

This page is the map. Read it first, then jump to the folder you need. Every
section says what a thing is, where it lives, and how to check that you did not
break it.

## What the app is

ArtCraft is a desktop app that generates AI images and video. It is built with
Tauri, which means two programs run together inside one window:

| Part     | Language         | Lives in                  | Job                                                   |
|----------|------------------|---------------------------|-------------------------------------------------------|
| Backend  | Rust             | `crates/`                 | Talks to AI providers, stores tasks, owns the window  |
| Frontend | TypeScript/React | `frontend/`               | Everything you see and click                          |
| Bridge   | Tauri commands   | `crates/desktop/artcraft` | The frontend calls a named Rust function (a "command") |

Analogy: the frontend is the restaurant dining room, the backend is the
kitchen, and a Tauri command is the order slip passed through the window.

## Folder map

| Folder                            | What is inside                                                  |
|-----------------------------------|-----------------------------------------------------------------|
| `crates/desktop/artcraft`         | The Tauri app itself: commands, windows, background threads     |
| `crates/api_clients`              | One client per AI provider (Grok, World Labs, Midjourney, ...)  |
| `crates/lib`                      | Small support libraries shared by the Rust code                 |
| `crates/schema`                   | Shared data shapes (enums, ids) and the SQLite task database    |
| `crates/testing`                  | Helpers used only by Rust tests                                 |
| `crates/vendor`                   | Third-party code we carry a modified copy of                    |
| `frontend/apps/artcraft`          | The React app that runs in the window                           |
| `frontend/libs/components`        | Reusable UI pieces (buttons, modals, gallery, video editor)     |
| `frontend/libs/api`               | `@storyteller/api`: HTTP calls to the web backend               |
| `frontend/libs/tauri-api`         | Wrappers that call Rust commands from TypeScript                |
| `frontend/libs/tauri-events`      | Typed listeners for events Rust sends to the UI                 |
| `frontend/libs/model-list`        | The catalogue of models the user can pick                       |
| `_database/sql`                   | SQLite migrations for the local task database                   |
| `script/artcraft`                 | Dev and build scripts                                           |

## How a generation flows

1. The user clicks Generate in a React component.
2. A wrapper in `libs/tauri-api` calls a Rust command by name.
3. The command (one file per command, under `crates/desktop/artcraft`) validates
   the request and starts a job with the right provider client.
4. A background polling thread watches the job. When it finishes or fails, it
   sends an event back to the frontend (`notify_frontend_of_completion.rs`).
5. The UI listens for that event (`libs/tauri-events`) and shows the result.

If something fails silently, check steps 4 and 5 first: the job usually did
run, but the message to the UI got lost.

## Running things

Rust, from the repo root:

```bash
cargo check --workspace --all-targets
cargo test --workspace
```

The database queries are checked at compile time. Set `SQLX_OFFLINE=true` to
use the saved metadata in `.sqlx/` instead of a live database.

Frontend, from `frontend/`:

```bash
npm test                              # vitest inside every package (the one to run)
cd apps/artcraft && npx tsc -b        # type-check
cd apps/artcraft && npm run lint      # lint
```

A bare `npx vitest run` at `frontend/` also works, but it skips the video editor
(its WebAssembly file only loads when run from inside that package). `npm test`
runs every package separately, including the video editor.

## Rules of the house

These come from `AGENTS.md`:

- Rust: never `println!`/`eprintln!` outside tests; use `log::info!`, `warn!`, etc.
- One Tauri command per file, named after the command.
- Two-space indentation.
- File order: constants, types, public functions, private helpers last.
- Markdown tables are padded so the columns line up in plain text.

## How tests are organized

| Where                                       | What it checks                                         |
|---------------------------------------------|--------------------------------------------------------|
| `*.spec.ts(x)` next to the code in `libs/`  | One module in isolation (vitest)                       |
| `frontend/apps/artcraft/test/`              | The app's API-manager classes against a mocked `fetch` |
| `#[cfg(test)]` modules inside Rust files    | Rust units; run with `cargo test`                      |

Two gotchas for beginners:

- jsdom (the fake browser in tests) has no Tauri runtime, so a component that
  calls `listen` from `@tauri-apps/api/event` needs `vi.mock` for it. See
  `libs/components/provider-billing-modal/src/lib/provider-billing-modal.spec.tsx`.
- There are two copies of the API classes: the live one in `libs/api` and an old
  one in `apps/artcraft/app/src/Classes/ApiManager`. New code should import
  `@storyteller/api`. Merging them is on the open list in `TRACKER.md`.

## Where the history lives

- `CHANGELOG.md`: what changed, newest first.
- `TRACKER.md`: per-file detail of each fix, plus the open list.
- `ROADMAP.md`: where the project is heading.
- `AGENTS.md`: the coding rules.

## Annotation progress

Source files are being given plain-language comments in stages. Stages already
done are listed in `TRACKER.md`.
