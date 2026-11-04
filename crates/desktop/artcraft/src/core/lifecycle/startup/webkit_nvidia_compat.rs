//! WebKitGTK + NVIDIA compatibility workarounds.
//!
//! WebKitGTK 2.44+ (verified against 2.54) cannot satisfy the strict Wayland
//! explicit-sync handshake demanded by NVIDIA's proprietary driver (verified
//! against 615.71.09). The failure is startup-level and severe: either a
//! `Gdk-Message: Error 71 (Protocol error) dispatching to Wayland display.`
//! crash before the first frame, or broken frame presentation (e.g. an HTML5
//! `<video>` painting above all DOM, making the login screen unusable).
//! Disabling NVIDIA's explicit-sync handshake lets WebKitGTK's native
//! DMABUF/compositing pipeline present frames correctly at full acceleration.
//!
//! This must run before the webview is created and therefore before the Tauri
//! logger is installed, so it stays silent — it is an environment default, not
//! an event.

/// NVIDIA's proprietary kernel module registers this directory when loaded.
/// Its presence reliably signals that the proprietary driver is in use.
#[cfg(target_os = "linux")]
const NVIDIA_KERNEL_MODULE_PATH: &str = "/sys/module/nvidia";

/// Env var understood by NVIDIA's proprietary driver to skip the strict Wayland
/// explicit-sync handshake that WebKitGTK cannot complete.
#[cfg(target_os = "linux")]
const NVIDIA_DISABLE_EXPLICIT_SYNC_ENV: &str = "__NV_DISABLE_EXPLICIT_SYNC";

#[cfg(target_os = "linux")]
use std::env;
#[cfg(target_os = "linux")]
use std::path::Path;

/// Applies the NVIDIA explicit-sync workaround when the proprietary driver is
/// in use. Deliberately does not touch `WEBKIT_DISABLE_*`; those remain the
/// user's or launcher's explicit choice.
#[cfg(target_os = "linux")]
pub fn apply_webkit_nvidia_workarounds() {
  if !Path::new(NVIDIA_KERNEL_MODULE_PATH).exists() {
    return;
  }

  // Respect an explicit setting from the user or launcher.
  if env::var_os(NVIDIA_DISABLE_EXPLICIT_SYNC_ENV).is_some() {
    return;
  }

  // Safe: this runs single-threaded at the very top of `run()`, before the
  // Tauri runtime spawns any threads or initializes the webview.
  env::set_var(NVIDIA_DISABLE_EXPLICIT_SYNC_ENV, "1");
}

/// No-op on non-Linux platforms.
#[cfg(not(target_os = "linux"))]
pub fn apply_webkit_nvidia_workarounds() {}
