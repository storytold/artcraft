# Code Style

## Rust

- Two spaces for indentation (not four)
- No minimum supported Rust version; use latest stable features freely
- `#[macro_use] extern crate serde_derive;` is used in binary crates; library crates use `use serde_derive::{Serialize, Deserialize};`
- Prefer `log` crate macros (`info!`, `warn!`, `error!`) over `println!`
- Use `anyhow::Result` / `AnyhowResult` for fallible functions in application code
- Enum Display/Debug: use `impl_enum_display_and_debug_using_to_str!` macro, not `derive_more::Display` (CLion doesn't understand it)
- Fields that are optional use the `maybe_` prefix: `maybe_creator_user_token`, `maybe_prompt_token`
- When implementing `fmt::Display` for error types, use the pattern: `write!(f, "{:?}", self)`

## Naming

- Handler functions: `{verb}_{noun}_handler` (e.g. `get_health_check_handler`, `login_handler`)
- Error enums: `{Feature}Error` (e.g. `FalWebhookError`, `HealthCheckError`)
- Request/response structs: `{Action}Request`, `{Action}Response`, `{Action}SuccessResponse`
- Path params: `{Action}PathInfo`
- Builder structs: `{Thing}Builder` with `set_` prefixed setters and a `build()` method

## Imports

- Group imports: std, external crates, internal workspace crates, `crate::` imports
- Use fully qualified paths for one-off references; `use` for repeated references
- Prefer specific imports over wildcards, except in `api_doc.rs` and test modules

## TypeScript / Frontend

- TypeScript with React, Vite, Zustand, Three.js
- Nx monorepo under `crates/frontend/`
- Two spaces for indentation
