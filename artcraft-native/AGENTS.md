# Pure Rust native app

Read this app's `README.md` before changing its architecture or known limitations.
This egui host is separate from Tauri; do not import webview/React architecture into
ordinary UI code. The dedicated sign-in webview remains its own credential boundary.

- Backend owns Tokio/API work and returns events to the UI. Keep network/download/decode
  work off the UI thread and reuse shared API client/router crates at their public seams.
- Preserve session ownership and identity headers. Test with temporary synthetic files;
  never use or expose a developer's cookie jar, provider credentials or real library.
- Write defect reproducers in native unit or `egui_kittest` coverage before fixes.
  Async results, cancellation, retries and restart recovery need explicit ownership.
- Run `cargo test -p artcraft_native` for affected behavior. It does not prove real
  generation, credential interoperability, native-window behavior or visual quality.
- Do not claim full parity from a test of one control; name the operation and boundary
  actually exercised. Keep known limitations visible in the owning README.
