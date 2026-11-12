#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

//! ArtCraft's desktop binary. The app itself lives in the library so Android can share it.

#[cfg(not(target_os = "android"))]
fn main() -> eframe::Result {
  artcraft_native::run_desktop()
}

// Android loads the library through the GameActivity (`android_main`); there is no binary.
#[cfg(target_os = "android")]
fn main() {}
