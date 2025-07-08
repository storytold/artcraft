pub mod core;
pub mod services;

use tauri::Manager;

use crate::core::commands::app_preferences::get_app_preferences_command::get_app_preferences_command;
use crate::core::commands::app_preferences::update_app_preference_command::update_app_preferences_command;
use crate::core::commands::enqueue::image::enqueue_text_to_image_command::enqueue_text_to_image_command;
use crate::core::commands::enqueue::image_bg_removal::enqueue_image_bg_removal_command::enqueue_image_bg_removal_command;
use crate::core::commands::enqueue::image_edit::enqueue_contextual_edit_image_command::enqueue_contextual_edit_image_command;
use crate::core::commands::enqueue::object::enqueue_image_to_3d_object_command::enqueue_image_to_3d_object_command;
use crate::core::commands::enqueue::video::enqueue_image_to_video_command::enqueue_image_to_video_command;
use crate::core::commands::flip_image::flip_image;
use crate::core::commands::get_app_info_command::get_app_info_command;
use crate::core::commands::platform_info_command::platform_info_command;
use crate::core::commands::providers::get_provider_order_command::get_provider_order_command;
use crate::core::commands::providers::set_provider_order_command::set_provider_order_command;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::app_preferences::app_preferences_manager::load_app_preferences_or_default;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::main_window_position::MainWindowPosition;
use crate::core::state::main_window_size::MainWindowSize;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::core::threads::discord_presence_thread::discord_presence_thread;
use crate::core::threads::main_window_thread::main_window_thread::main_window_thread;
use crate::core::utils::webview_unsafe::webview_unsafe_for_app;
use crate::services::fal::commands::fal_background_removal_command::fal_background_removal_command;
use crate::services::fal::commands::fal_hunyuan_image_to_3d_command::fal_hunyuan_image_to_3d_command;
use crate::services::fal::commands::fal_kling_image_to_video_command::fal_kling_image_to_video_command;
use crate::services::fal::commands::get_fal_api_key_command::get_fal_api_key_command;
use crate::services::fal::commands::set_fal_api_key_command::set_fal_api_key_command;
use crate::services::fal::state::fal_credential_manager::FalCredentialManager;
use crate::services::fal::state::fal_task_queue::FalTaskQueue;
use crate::services::fal::threads::fal_task_polling_thread::fal_task_polling_thread;
use crate::services::sora::commands::check_sora_session_command::check_sora_session_command;
use crate::services::sora::commands::open_sora_login_command::open_sora_login_command;
use crate::services::sora::commands::sora_image_generation_command::sora_image_generation_command;
use crate::services::sora::commands::sora_image_remix_command::sora_image_remix_command;
use crate::services::sora::commands::sora_logout_command::sora_logout_command;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::sora::threads::sora_task_polling_thread::sora_task_polling_thread;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;

use tauri_plugin_dialog;
use tauri_plugin_http;
use tauri_plugin_log::Target;
use tauri_plugin_log::TargetKind;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // NB: Tauri wants to install the logger itself, so we can't rely on the logger crate
  // until the tauri runtime begins.
  println!("Loading config...");
  let app_data_root = AppDataRoot::create_default().expect("data directory should be created");
  let app_data_root_2 = app_data_root.clone();

  println!("Loading app preferences...");
  let app_preferences = load_app_preferences_or_default(&app_data_root);
  
  // NB: tauri-plugin-http stores the credentials on disk, so we can defer to that for now.
  // println!("Attempting to read existing artcraft credentials...");
  // let storyteller_creds_manager = StorytellerCredentialManager::initialize_from_disk_infallible(&app_data_root);
  let storyteller_creds_manager = StorytellerCredentialManager::initialize_empty(&app_data_root);
  let storyteller_creds_manager_2 = storyteller_creds_manager.clone();
  let storyteller_creds_manager_3 = storyteller_creds_manager.clone();
  
  println!("Attempting to read existing sora credentials...");
  let sora_creds_manager = SoraCredentialManager::initialize_from_disk_infallible(&app_data_root);
  let sora_creds_manager_2 = sora_creds_manager.clone();
  
  println!("Attempting to read existing fal credentials...");
  let fal_creds_manager = FalCredentialManager::initialize_from_disk_infallible(&app_data_root);
  let fal_creds_manager_2 = fal_creds_manager.clone();

  // Other state
  let sora_task_queue = SoraTaskQueue::new();
  let sora_task_queue_2 = sora_task_queue.clone();

  let fal_task_queue = FalTaskQueue::new();
  let fal_task_queue_2 = fal_task_queue.clone();
  
  let app_env_configs = AppEnvConfigs::load_from_filesystem(&app_data_root)
    .expect("AppEnvConfigs should be loaded from disk");
  
  let app_env_configs_2 = app_env_configs.clone();
  
  let provider_priority = match ProviderPriorityStore::from_filesystem_configs(&app_data_root) {
    Ok(Some(priority)) => {
      println!("Loaded provider priority from disk: {:?}", priority.get_priority());
      priority
    }
    Ok(None) => {
      println!("No provider priority found on disk, using default.");
      ProviderPriorityStore::default()
    }
    Err(err) => {
      eprintln!("Failed to read provider priority from disk: {:?}", err);
      ProviderPriorityStore::default()
    }
  };

  println!("Initializing backend runtime...");

  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_upload::init())
    .plugin(tauri_plugin_log::Builder::new()
      .level(log::LevelFilter::Info)
      .targets(vec![
        Target::new(TargetKind::Stdout),
        Target::new(TargetKind::LogDir {
          file_name: Some(app_data_root.log_file_name_str().to_string())
        }),
      ])
      .build())
    .setup(move |app| {
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
      
      let result = webview_unsafe_for_app(&app);
      if let Err(err) = result {
        eprintln!("Error setting webview unsafe: {:?}", err);
      }

      // TODO(bt): Clean this up. We can just clone at the callsite. Also clean initialization
      let app_2 = app.clone();
      let app_3 = app.clone();
      let app_4 = app.clone();
      let app_5 = app.clone();
      let app_env_configs_3 = app_env_configs_2.clone();
      let app_data_root_3 = app_data_root_2.clone();
      let app_data_root_4 = app_data_root_2.clone();
      let app_data_root_5 = app_data_root_2.clone();
      let sora_creds_manager_3 = sora_creds_manager_2.clone();
      let storyteller_creds_manager_3 = storyteller_creds_manager.clone();
      let storyteller_creds_manager_4 = storyteller_creds_manager.clone();
      let fal_creds_manager_3 = fal_creds_manager_2.clone();
      let fal_task_queue_3 = fal_task_queue_2.clone();

      match MainWindowSize::from_filesystem_configs(&app_data_root_3) {
        Ok(None) => {}
        Ok(Some(size)) => {
          println!("Resizing window to: {:?}", size);
          let result = size.apply_to_main_window(&app);
          if let Err(err) = result {
            eprintln!("Could not set window size: {:?}", err);
          }
        }
        Err(err) => {
          eprintln!("Failed to read window size from disk: {:?}", err);
        }
      }

      match MainWindowPosition::from_filesystem_configs(&app_data_root_3) {
        Ok(None) => {}
        Ok(Some(pos)) => {
          println!("Moving window to: {:?}", pos);
          let result = pos.apply_to_main_window(&app);
          if let Err(err) = result {
            eprintln!("Could not set window position: {:?}", err);
          }
        }
        Err(err) => {
          eprintln!("Failed to read window position from disk: {:?}", err);
        }
      }

      tauri::async_runtime::spawn(main_window_thread(app_3, app_data_root_3, storyteller_creds_manager_2));
      tauri::async_runtime::spawn(sora_task_polling_thread(app_4, app_env_configs_2, app_data_root_4, sora_creds_manager_3, storyteller_creds_manager_3, sora_task_queue_2));
      tauri::async_runtime::spawn(discord_presence_thread());
      tauri::async_runtime::spawn(fal_task_polling_thread(app_5, app_env_configs_3, app_data_root_5, fal_creds_manager_3, fal_task_queue_3, storyteller_creds_manager_4));

      Ok(())
    })
    .manage(app_data_root)
    .manage(app_env_configs)
    .manage(app_preferences)
    .manage(fal_creds_manager)
    .manage(fal_task_queue)
    .manage(provider_priority)
    .manage(sora_creds_manager)
    .manage(sora_task_queue)
    .manage(storyteller_creds_manager_3)
    .invoke_handler(tauri::generate_handler![
      check_sora_session_command,
      enqueue_contextual_edit_image_command,
      enqueue_image_bg_removal_command,
      enqueue_image_to_3d_object_command,
      enqueue_image_to_video_command,
      enqueue_text_to_image_command,
      fal_background_removal_command,
      fal_hunyuan_image_to_3d_command,
      fal_kling_image_to_video_command,
      flip_image,
      get_app_info_command,
      get_app_preferences_command,
      get_fal_api_key_command,
      get_provider_order_command,
      open_sora_login_command,
      platform_info_command,
      set_fal_api_key_command,
      set_provider_order_command,
      sora_image_generation_command,
      sora_image_remix_command,
      sora_logout_command,
      update_app_preferences_command,
    ])
    .run(tauri::generate_context!("tauri.conf.json"))
    .expect("error while running tauri application");
}
