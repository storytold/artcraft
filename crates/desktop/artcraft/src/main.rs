// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
  // WebKitGTK's DMABUF renderer crashes the WebKit process on many Linux
  // (Wayland) setups. The dev scripts already disable it; do the same for
  // release builds. Must run before any webview exists. Respect user overrides.
  #[cfg(target_os = "linux")]
  if std::env::var_os("WEBKIT_DISABLE_DMABUF_RENDERER").is_none() {
    std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
  }

  if let Some(result) = artcraft_app_lib::updates::finish_helper() {
    let failed = result.is_err();
    if let Err(error) = result { log::error!("Update failed: {error}"); }
    std::process::exit(i32::from(failed));
  }
  artcraft_app_lib::run();
}
