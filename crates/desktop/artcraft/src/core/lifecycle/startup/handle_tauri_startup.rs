use crate::core::lifecycle::startup::tasks::bootstrap_task_database::bootstrap_task_database;
use crate::core::lifecycle::startup::tasks::initially_size_and_position_windows::initially_size_and_position_windows;
use crate::core::lifecycle::startup::tasks::load_provider_priority_state::load_provider_priority_state;
use crate::core::lifecycle::startup::tasks::set_app_log_level::set_app_log_level;
use crate::core::lifecycle::startup::tasks::spawn_discord_presence_thread::spawn_discord_presence_thread;
use crate::core::lifecycle::startup::tasks::spawn_main_window_thread::spawn_main_window_thread;
use crate::core::lifecycle::startup::tasks::spawn_sora_task_polling_thread::spawn_sora_task_polling_thread;
use crate::core::lifecycle::startup::tasks::spawn_storyteller_threads::spawn_storyteller_threads;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::artcraft_platform_info::ArtcraftPlatformInfo;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_tracker::ArtcraftUsageTracker;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;
use crate::services::grok::state::grok_image_prompt_queue::GrokImagePromptQueue;
use crate::services::grok::threads::grok_image_websocket_thread::grok_image_websocket_thread::grok_image_websocket_thread;
use crate::services::grok::threads::grok_video_task_polling::grok_video_task_polling_thread::grok_video_task_polling_thread;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::midjourney::threads::midjourney_long_polling_thread::midjourney_long_polling_thread;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use crate::services::worldlabs::state::worldlabs_bearer_bridge::WorldlabsBearerBridge;
use crate::services::worldlabs::state::worldlabs_credential_manager::WorldlabsCredentialManager;
use crate::core::providers::credentials::provider_credential_loading_cache::ProviderCredentialLoadingCache;
use crate::core::threads::third_party_task_polling_thread::third_party_task_polling_thread::third_party_task_polling_thread;
use crate::services::worldlabs::threads::worldlabs_marble_task_polling::worldlabs_marble_task_polling;
use errors::AnyhowResult;
use tauri::{AppHandle, Manager};

pub async fn handle_tauri_startup(
  app: AppHandle,
  root: AppDataRoot,
  app_env_configs: AppEnvConfigs,
  artcraft_platform_info: ArtcraftPlatformInfo,
  artcraft_usage_tracker: ArtcraftUsageTracker,
  storyteller_creds_manager: StorytellerCredentialManager,
  sora_credential_manager: SoraCredentialManager,
  sora_task_queue: SoraTaskQueue,
  mj_creds_manager: MidjourneyCredentialManager,
  grok_creds_manager: GrokCredentialManager,
  grok_image_prompt_queue: GrokImagePromptQueue,
  worldlabs_bearer_bridge: WorldlabsBearerBridge,
  worldlabs_creds_manager: WorldlabsCredentialManager,
  credential_cache: ProviderCredentialLoadingCache,
) -> AnyhowResult<()> {

  set_app_log_level(
    &app,
    &root,
  )?;

  let task_database =
      bootstrap_task_database(&app, &root).await?;

  load_provider_priority_state(
    &app,
    &root,
  )?;

  spawn_main_window_thread(
    &app,
    &root,
    &storyteller_creds_manager,
  )?;

  spawn_storyteller_threads(
    &app,
    &app_env_configs,
    &artcraft_usage_tracker,
    &artcraft_platform_info,
    &task_database,
    &storyteller_creds_manager,
  )?;

  spawn_sora_task_polling_thread(
    &app,
    &root,
    &app_env_configs,
    &task_database,
    &sora_credential_manager,
    &storyteller_creds_manager,
    &sora_task_queue,
  )?;

  tauri::async_runtime::spawn(grok_video_task_polling_thread(
    app.clone(),
    app_env_configs.clone(),
    root.clone(),
    task_database.clone(),
    grok_creds_manager.clone(),
    storyteller_creds_manager.clone(),
  ));

  tauri::async_runtime::spawn(grok_image_websocket_thread(
    app.clone(),
    app_env_configs.clone(),
    root.clone(),
    task_database.clone(),
    grok_creds_manager.clone(),
    grok_image_prompt_queue.clone(),
    storyteller_creds_manager.clone(),
  ));

  tauri::async_runtime::spawn(midjourney_long_polling_thread(
    app.clone(),
    app_env_configs.clone(),
    root.clone(),
    task_database.clone(),
    mj_creds_manager.clone(),
    storyteller_creds_manager.clone(),
  ));

  tauri::async_runtime::spawn(worldlabs_marble_task_polling(
    app.clone(),
    app_env_configs.clone(),
    root.clone(),
    task_database.clone(),
    worldlabs_creds_manager.clone(),
    storyteller_creds_manager.clone(),
  ));

  tauri::async_runtime::spawn(third_party_task_polling_thread(
    app.clone(),
    app_env_configs.clone(),
    root.clone(),
    task_database.clone(),
    storyteller_creds_manager.clone(),
    credential_cache,
  ));

  spawn_discord_presence_thread()?;

  initially_size_and_position_windows(&app, &root);

  Ok(())
}
