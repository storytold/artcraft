# artcraft_client

Rust HTTP endpoint bindings used by the ArtCraft Tauri desktop app.

## Endpoint layout

- Each HTTP endpoint binding must live in its own descriptively named `.rs` file.
  This applies to both free functions and methods implemented on a shared client.
  Do not combine several routes into a catch-all file such as `login_challenges.rs`
  or `password_auth.rs`.
- Group related bindings in a directory module. Keep `mod.rs` for module declarations;
  it must not contain endpoint implementations. For example:
  `endpoints/users/login_challenges/create_login_challenge.rs` and
  `endpoints/users/login_challenges/poll_login_challenge.rs`.
- Keep each endpoint's route constant, request construction, and endpoint-specific
  request/response types in its file. Keep shared wire types in `artcraft_api_defs`
  or a dedicated shared type module; do not duplicate them across endpoint files.
- Put shared HTTP transport, client setup, and common error handling in a separate
  utility module. A transport module must not accumulate endpoint bindings.
- Update callers to import types from their new modules when splitting bindings.
  Preserve request methods, paths, headers, error behavior, and cookie handling.

## Validation

Run `cargo check --offline -p artcraft_client` for client changes. For native login
bindings, also run `SQLX_OFFLINE=true cargo test --offline -p artcraft --lib
login_bridge_tests`; these tests use local HTTP fixtures and temporary cookie jars.
