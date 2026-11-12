//! ArtCraft, natively: an egui app over the ArtCraft API (no Tauri, no webview).
//!
//! This crate is both the desktop binary (`src/main.rs`) and the Android shared library
//! (`libartcraft_native.so`, started by `android_main` below from the GameActivity in `android/`).

mod app;
mod backend;
mod feed;
mod models;
mod overlays;
mod pages;
pub mod platform;
mod prompt_box;
mod shell;
mod theme;
mod ui;

pub const APP_ID: &str = "ai.artcraft.native";

/// Starts the desktop app.
#[cfg(not(target_os = "android"))]
pub fn run_desktop() -> eframe::Result {
  env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();
  let mut viewport = egui::ViewportBuilder::default().with_title("ArtCraft").with_app_id(APP_ID).with_inner_size([1440.0, 900.0]).with_min_inner_size([960.0, 640.0]);
  if let Some(icon) = app_icon() {
    viewport = viewport.with_icon(icon);
  }
  // The app draws its own title bar; macOS keeps its traffic lights over it.
  viewport = if cfg!(target_os = "macos") { viewport.with_fullsize_content_view(true).with_titlebar_shown(false).with_title_shown(false) } else { viewport.with_decorations(false) };
  let options = eframe::NativeOptions { viewport, persist_window: true, ..Default::default() };
  eframe::run_native("ArtCraft", options, Box::new(|cc| Ok(Box::new(app::ArtcraftApp::new(cc)))))
}

/// The window and taskbar icon.
#[cfg(not(target_os = "android"))]
fn app_icon() -> Option<egui::IconData> {
  const ICON: &[u8] = include_bytes!("../../crates/desktop/artcraft/icons/icon.png");
  let rgba = image::load_from_memory(ICON).ok()?.into_rgba8();
  Some(egui::IconData { width: rgba.width(), height: rgba.height(), rgba: rgba.into_raw() })
}

/// The Android entry point: the GameActivity's native glue calls this on its own thread.
#[cfg(target_os = "android")]
#[no_mangle]
pub fn android_main(app: winit::platform::android::activity::AndroidApp) {
  android_logger::init_once(android_logger::Config::default().with_tag("ArtCraft").with_max_level(log::LevelFilter::Info));
  // Safety: the pointers come straight from the glue and stay valid for the activity's lifetime.
  unsafe { platform::android::init(app.vm_as_ptr(), app.activity_as_ptr(), app.internal_data_path()) };
  let options = eframe::NativeOptions { android_app: Some(app), ..Default::default() };
  if let Err(err) = eframe::run_native("ArtCraft", options, Box::new(|cc| Ok(Box::new(app::ArtcraftApp::new(cc))))) {
    log::error!("ArtCraft stopped: {err}");
  }
}
