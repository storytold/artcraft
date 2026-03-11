use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::artcraft_platform_info::ArtcraftPlatformInfo;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_tracker::ArtcraftUsageTracker;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use artcraft_api_defs::analytics::log_active_user::LogAppActiveUserRequest;
use artcraft_client::endpoints::analytics::log_active_user_v2::log_active_user_v2;
use artcraft_client::error::api_error::ApiError;
use artcraft_client::error::storyteller_error::StorytellerError;
use errors::AnyhowResult;
use log::{debug, error, info};
use sqlite_tasks::queries::list_tasks_by_provider_and_tokens::{list_tasks_by_provider_and_tokens, ListTasksArgs};
use std::time::Instant;
use tokens::tokens::app_session::AppSessionToken;

const CLIENT_NAME : &str = "artcraft";

const ERROR_SLEEP_MILLIS : u64 = 1_000 * 60 * 3; // 3 minutes;

pub async fn storyteller_activity_thread(
  app_env_configs: AppEnvConfigs,
  artcraft_platform_info: ArtcraftPlatformInfo,
  artcraft_usage_tracker: ArtcraftUsageTracker,
  storyteller_creds_manager: StorytellerCredentialManager,
) -> ! {
  let startup = Instant::now();
  let app_session_token = AppSessionToken::generate();

  info!("Session started at {:?} with token: {:?}", startup, app_session_token);

  loop {
    let res = polling_loop(
      &app_env_configs,
      &artcraft_usage_tracker,
      &storyteller_creds_manager,
      startup,
      &artcraft_platform_info,
      &app_session_token,
    ).await;
    if let Err(err) = res {
      error!("An error occurred: {:?}", err);
    }
    // NB: Sleep if an error occurs.
    tokio::time::sleep(std::time::Duration::from_millis(ERROR_SLEEP_MILLIS)).await;
  }
}

async fn polling_loop(
  app_env_configs: &AppEnvConfigs,
  artcraft_usage_tracker: &ArtcraftUsageTracker,
  storyteller_creds_manager: &StorytellerCredentialManager,
  startup: Instant,
  artcraft_platform_info: &ArtcraftPlatformInfo,
  app_session_token: &AppSessionToken,
) -> AnyhowResult<()> {
  loop {
    let creds = storyteller_creds_manager.get_credentials()?;

    let creds = match creds {
      None => {
        tokio::time::sleep(std::time::Duration::from_millis(5_000)).await;
        continue;
      }
      Some(creds) => {
        if creds.is_empty() {
          tokio::time::sleep(std::time::Duration::from_millis(5_000)).await;
          continue;
        }
        creds
      },
    };

    let usage_data = artcraft_usage_tracker.get()?;
    
    let time_since_startup = Instant::now().duration_since(startup);

    let request = LogAppActiveUserRequest {
      maybe_app_session_token: Some(app_session_token.clone()),
      maybe_app_name: Some(CLIENT_NAME.to_string()),
      maybe_app_version: Some(artcraft_platform_info.artcraft_version.clone()),
      maybe_os_platform: Some(artcraft_platform_info.os_platform.as_str().to_owned()),
      maybe_os_version: Some(artcraft_platform_info.os_version.clone()),
      maybe_session_duration_seconds: Some(time_since_startup.as_secs()),
      total_generation_count: Some(usage_data.total_generation_count),
      image_generation_count: Some(usage_data.image_generation_count),
      video_generation_count: Some(usage_data.video_generation_count),
      object_generation_count: Some(usage_data.object_generation_count),
      text_to_image_count: Some(usage_data.text_to_image_count),
      image_to_image_count: Some(usage_data.image_to_image_count),
      text_to_video_count: Some(usage_data.text_to_video_count),
      image_to_video_count: Some(usage_data.image_to_video_count),
      text_to_object_count: Some(usage_data.text_to_object_count),
      image_to_object_count: Some(usage_data.image_to_object_count),
      image_page_prompt_count: Some(usage_data.image_page_prompt_count),
      video_page_prompt_count: Some(usage_data.video_page_prompt_count),
      edit_page_prompt_count: Some(usage_data.edit_page_prompt_count),
      stage_page_prompt_count: Some(usage_data.stage_page_prompt_count),
      object_page_prompt_count: Some(usage_data.object_page_prompt_count),
      other_page_prompt_count: Some(usage_data.other_page_prompt_count),
    };

    debug!("Logging active user with storyteller.");

    let result = log_active_user_v2(
      &app_env_configs.storyteller_host,
      Some(&creds),
      request,
    ).await;

    let wait_millis = match result {
      Ok(result) => result.wait_for_retry_millis,
      Err(err) => {
        match &err {
          StorytellerError::Api(ApiError::TooManyRequests(message)) => {
            error!("Too many requests (sleeping): {:?}", message);
            tokio::time::sleep(std::time::Duration::from_millis(ERROR_SLEEP_MILLIS)).await;
            continue;
          }
          _ => {}
        }
        return Err(anyhow!(err));
      }
    };

    // Wait at least a minute, no matter what the server tells us.
    let wait_millis = std::cmp::min(wait_millis, 60_000);
    tokio::time::sleep(std::time::Duration::from_millis(wait_millis)).await;
  }
}
