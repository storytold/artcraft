pub mod endpoints;
pub mod events;
pub mod state;
pub mod stubs;
pub mod threads;
pub mod transfer;
pub mod utils;

use crate::endpoints::download_models::download_models;
use crate::endpoints::inpaint_image_endpoint::inpaint_image;
use crate::endpoints::flip_image::flip_image;
use crate::endpoints::realtime_image_endpoint::infer_image;
use crate::endpoints::remove_background_endpoint::remove_background;
use crate::endpoints::text_to_image_endpoint::text_to_image;
use crate::state::app_config::AppConfig;
use crate::stubs::model_cache::ModelCache;
use crate::stubs::prompt_cache::PromptCache;
use crate::threads::downloader_thread::downloader_thread;

use tauri_plugin_log::Target;
use tauri_plugin_log::TargetKind;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // NB: Tauri wants to install the logger itself, so we can't rely on the logger crate 
  // until the tauri runtime begins.
  println!("Loading model config...");

  let config = AppConfig::init()
    .expect("config should load");

  let prompt_cache = PromptCache::with_capacity(8)
    .expect("prompt cache should load");

  println!("Creating model cache...");
  
  let model_cache = ModelCache::new();
  
  let app_data_root = config.app_data_root.clone();
  let app_data_root2 = config.app_data_root.clone();

  println!("Initializing backend runtime...");

  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::new()
      .level(log::LevelFilter::Info)
      .targets(vec![
        Target::new(TargetKind::Stdout),
        Target::new(TargetKind::LogDir { file_name: Some(app_data_root.log_file_name_str().to_string()) }),
      ])
      .build())
    .setup(|app| {
      // TODO(bt): This is broken on windows
      // log_environment_details();

      //if cfg!(debug_assertions) {
      //  app.handle().plugin(
      //    tauri_plugin_log::Builder::default()
      //      .level(log::LevelFilter::Info)
      //      .build(),
      //  )?;
      //}
      let app = app.handle().clone();

      tauri::async_runtime::spawn(downloader_thread(app_data_root2, app));

      Ok(())
    })
    .manage(config)
    .manage(prompt_cache)
    .manage(model_cache)
    .manage(app_data_root)
    .invoke_handler(tauri::generate_handler![
      download_models,
      flip_image,
      infer_image,
      inpaint_image,
      text_to_image,
      remove_background,
      text_to_image,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
