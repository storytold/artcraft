use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::text_to_image_generation_complete_event::{GeneratedImage, TextToImageGenerationCompleteEvent};
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use anyhow::anyhow;
use artcraft_api_defs::jobs::list_session_jobs::{ListSessionJobsItem, ListSessionResultDetailsResponse};
use enums::tauri::tasks::task_type::TaskType;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use errors::AnyhowResult;
use log::{error, warn};
use sqlite_tasks::queries::list_tasks_by_provider_and_tokens::{list_tasks_by_provider_and_tokens, ListTasksArgs};
use sqlite_tasks::queries::task::Task;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::media_files::list_batch_generated_redux_media_files::list_batch_generated_redux_media_files;
use tauri::AppHandle;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;

pub async fn maybe_handle_text_to_image_complete_event(
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  maybe_creds: Option<&StorytellerCredentialSet>,
  task: &Task,
  job: &ListSessionJobsItem,
) -> AnyhowResult<()> {

  match task.task_type {
    TaskType::ImageGeneration => {} // NB: Fall-through
    _ => return Ok(()),
  }

  match task.frontend_caller {
    Some(TauriCommandCaller::TextToImage) => {} // NB: Fall-through
    _ => return Ok(()),
  }

  let job_result = match job.maybe_result {
    Some(ref res) => res,
    None => {
      warn!("Job result is None for task: {:?}", task);
      return Ok(()); // No result, nothing to do
    },
  };

  let event = match job_result.maybe_batch_token.as_ref() {
    Some(batch_token) => {
      handle_batch(
        app,
        app_env_configs,
        maybe_creds,
        task,
        job,
        job_result,
        batch_token
      ).await?
    }
    None => {
      handle_single(
        app,
        task,
        job,
        job_result,
      ).await?
    }
  };

  if let Err(err) = event.send(&app) {
    error!("Failed to send TextToImageGenerationCompleteEvent: {:?}", err); // Fail open
  }

  Ok(())
}

async fn handle_single(
  app: &AppHandle,
  task: &Task,
  job: &ListSessionJobsItem,
  job_result: &ListSessionResultDetailsResponse,
) -> AnyhowResult<TextToImageGenerationCompleteEvent> {
  Ok(TextToImageGenerationCompleteEvent {
    generated_images: vec![GeneratedImage {
      media_token: MediaFileToken::new_from_str(&job_result.entity_token),
      cdn_url: job_result.media_links.cdn_url.clone(),
      maybe_thumbnail_template: job_result.media_links.maybe_thumbnail_template.clone(),
    }],
    maybe_frontend_subscriber_id: task.frontend_subscriber_id.clone(),
    maybe_frontend_subscriber_payload: task.frontend_subscriber_payload.clone(),
  })
}

async fn handle_batch(
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  maybe_creds: Option<&StorytellerCredentialSet>,
  task: &Task,
  job: &ListSessionJobsItem,
  job_result: &ListSessionResultDetailsResponse,
  batch_token: &BatchGenerationToken,
) -> AnyhowResult<TextToImageGenerationCompleteEvent> {

  let result = list_batch_generated_redux_media_files(
    &app_env_configs.storyteller_host,
    maybe_creds,
    batch_token,
  ).await?;

  if result.media_files.is_empty() {
    return Err(anyhow!("No media files found for batch token: {}", batch_token));
  }

  let media_files = result.media_files
      .into_iter()
      .map(|file| GeneratedImage {
        media_token: file.token,
        cdn_url: file.media_links.cdn_url,
        maybe_thumbnail_template: file.media_links.maybe_thumbnail_template,
      })
      .collect();

  Ok(TextToImageGenerationCompleteEvent {
    generated_images: media_files,
    maybe_frontend_subscriber_id: task.frontend_subscriber_id.clone(),
    maybe_frontend_subscriber_payload: task.frontend_subscriber_payload.clone(),
  })
}
