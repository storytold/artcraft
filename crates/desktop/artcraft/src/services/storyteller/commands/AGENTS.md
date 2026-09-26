# Tauri Commands

- Put each `#[tauri::command]` function in its own `.rs` file module named after
  that command, such as `storyteller_create_login_challenge_command.rs`. Do not
  collect multiple commands in a catch-all `*_commands.rs` file.
- Keep `mod.rs` for module declarations. Put shared state, response/error types,
  and implementation helpers in separate support modules, with the narrowest
  visibility needed by their callers.
- Update the imports used by `tauri::generate_handler!` when moving commands.
  Preserve IPC command names and arguments unless changing that contract is
  explicitly part of the task.
- Authentication HTTP requests run in Rust through `artcraft_client` endpoint
  bindings. The frontend invokes Tauri commands; it does not call the API
  directly, and desktop commands do not connect to the backend MySQL database.
- For login bridge changes, run the existing native fixture tests with
  `SQLX_OFFLINE=true cargo test --offline -p artcraft --lib login_bridge_tests`.
  These tests use loopback HTTP servers and temporary cookie stores.
