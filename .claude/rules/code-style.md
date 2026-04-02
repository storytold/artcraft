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

## File Layout (Top-to-Bottom Reading Order)

Organize code so a human reading top-to-bottom encounters the most important things first and
can drill down into details only when curious. Think of it like a newspaper: headline first,
then the story, then the fine print.

### Ordering within a file

1. **Constants** at the top, right after imports.
2. **The primary public type** (the main struct/enum the file is about) comes next.
   A reader opening this file should immediately see what it defines.
3. **Supporting/subordinate types** (sub-structs, helper enums, serialization DTOs) go
   below the primary type, not above it. Ask: "Would a reader need to know this type
   exists before seeing the main type?" — if no, push it down.
4. **Type ordering for API types**: Request, then Response (success), then Error.
5. **`impl` blocks** after their type definitions.

### Ordering within an `impl` block

1. **Constructors** (`new`, `from_*`, `builder`) at the top.
2. **Public methods** next — these are the main entry points a reader cares about.
3. **Private helper methods** below public methods.
   - Among helpers: place "meaty" helpers (substantial logic, direct continuations of the
     public entry point) above "leaf" helpers (small formatters, simple lookups).
   - A method that calls another method in the same file should appear *above* the method
     it calls. This lets readers follow the call chain downward.

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
