# Rust Workspace

All Rust code lives under `crates/`. The workspace is defined in `Cargo.toml` at the repo root.

## Code Style

- Two spaces for indentation (not four)
- No minimum supported Rust version; use latest stable features freely
- Never use `println!` or `eprintln!` outside of tests; use `log` crate macros instead
- Use `anyhow::Result` / `AnyhowResult` for fallible functions in application code
- Fields that are optional use the `maybe_` prefix: `maybe_creator_user_token`
- When two crates export the same type name, alias with a suffix: `use foo::Bar as BarFoo;`
- Prefer `use` imports over inline fully-qualified paths; only qualify inline for true one-offs or std prelude collisions (`Result`, `Option`, `Error`)

## File Layout

Organize for top-to-bottom reading. Important things first, details later.

1. **Constants** at the top (after imports)
2. **Primary public type** (the main struct/enum the file defines)
3. **Supporting types** below the primary type
4. **API types** in order: Request, Response, Error
5. **`impl` blocks** after their type definitions
   - Constructors first, then public methods, then private helpers
   - Callers above callees — follow the call chain downward

## Test Layout

Within `#[cfg(test)] mod tests { ... }`:

1. **Imports**
2. **Constants** (test IDs, URLs, fixture data) — small context that tests reference
3. **Test functions or sub-modules** grouped by category
4. **Helper functions** (builders, pipeline runners, assertions)

Constants provide small context up front. Test cases come next so engineers see *what* is
tested before *how* the helpers work.

Group related tests into sub-modules (`mod pricing_tests { ... }`) when a category has 2+
tests. Don't wrap a single test in its own module. Keep nesting to two levels max. Shared
helpers go in the parent `mod tests` so sub-modules can `use super::*`.

## Building

- Most crates: `cargo check -p {crate_name}` or `cargo test -p {crate_name}`
- Crates using SQLx: `SQLX_OFFLINE=true cargo check -p {crate_name}`
- `storyteller-web` and `mysql_queries` require `SQLX_OFFLINE=true`
- `storyteller-web` has ~370 pre-existing warnings — check the last few lines for actual errors

## Key Crates

- `storyteller_web` — main HTTP API monolith (actix-web)
- `artcraft` (desktop) — Tauri desktop app
- `artcraft_router` — provider routing for image/video generation (Artcraft, Fal, Seedance2Pro, Muapi)
- `artcraft_api_defs` — shared HTTP API type definitions
- `seedance2pro_client` — HTTP client for the Kinovi/Seedance2Pro video generation service
- `enums` — database-backed enums stored as VARCHAR fields
- `tokens` — primary key identifiers with Stripe-like prefixes (e.g. `user_`, `mf_`)
- `mysql_queries` — SQLx MySQL queries for the backend
