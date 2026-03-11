use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::canvas_background_removal_complete_event::CanvasBackgroundRemovalCompleteEvent;
use crate::core::events::functional_events::gaussian_generation_complete_event::{GaussianGenerationCompleteEvent, GeneratedGaussian};
use crate::core::events::functional_events::image_edit_complete_event::{EditedImage, ImageEditCompleteEvent};
use crate::core::events::functional_events::object_generation_complete_event::{GeneratedObject, ObjectGenerationCompleteEvent};
use crate::core::events::functional_events::text_to_image_generation_complete_event::{GeneratedImage, TextToImageGenerationCompleteEvent};
use crate::core::events::functional_events::video_generation_complete_event::{GeneratedVideo, VideoGenerationCompleteEvent};
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use anyhow::anyhow;
use artcraft_api_defs::jobs::list_session_jobs::{ListSessionJobsItem, ListSessionResultDetailsResponse};
use artcraft_api_defs::utils::media_links_to_thumbnail_template::media_links_to_thumbnail_template;
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

pub async fn maybe_handle_frontend_caller_notification(
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  maybe_creds: Option<&StorytellerCredentialSet>,
  task: &Task,
  job: &ListSessionJobsItem,
) -> AnyhowResult<()> {

  let job_result = match job.maybe_result {
    Some(ref res) => res,
    None => {
      warn!("Job result is None for task: {:?}", task);
      return Ok(()); // No result, nothing to do
    },
  };

  match task.task_type {
    TaskType::ImageGeneration => {
      let _r = handle_image_generation(
        app,
        task,
        job_result,
        app_env_configs,
        maybe_creds,
      ).await?;
    }
    TaskType::ImageInpaintEdit => {
      let _r = handle_inpaint_image_generation(
        app,
        task,
        job_result,
        app_env_configs,
        maybe_creds,
      ).await?;
    }
    TaskType::VideoGeneration => {
      let _r = handle_video_generation(
        app,
        task,
        job_result,
      ).await?;
    }
    TaskType::ObjectGeneration => {
      let _r = handle_object_generation(
        app,
        task,
        job_result,
      ).await?;
    }
    TaskType::GaussianGeneration => {
      let _r = handle_gaussian_generation(
        app,
        task,
        job_result,
      ).await?;
    }
    TaskType::BackgroundRemoval => {
      let _r = handle_background_removal_generation(
        app,
        task,
        job_result,
      ).await?;
    }
  }

  Ok(())
}

async fn handle_image_generation(
  app: &AppHandle,
  task: &Task,
  job_result: &ListSessionResultDetailsResponse,
  app_env_configs: &AppEnvConfigs,
  maybe_creds: Option<&StorytellerCredentialSet>,
) -> AnyhowResult<()> {

  let generated_images = match job_result.maybe_batch_token.as_ref() {
    None => {
      vec![GeneratedImage {
        media_token: MediaFileToken::new_from_str(&job_result.entity_token),
        cdn_url: job_result.media_links.cdn_url.clone(),
        maybe_thumbnail_template: job_result.media_links.maybe_thumbnail_template.clone(),
      }]
    }
    Some(batch_token) => {
      let result = list_batch_generated_redux_media_files(
        &app_env_configs.storyteller_host,
        maybe_creds,
        batch_token,
      ).await?;

      if result.media_files.is_empty() {
        return Err(anyhow!("No media files found for batch token: {}", batch_token));
      }

      result.media_files
          .into_iter()
          .map(|file| GeneratedImage {
            media_token: file.token,
            cdn_url: file.media_links.cdn_url,
            maybe_thumbnail_template: file.media_links.maybe_thumbnail_template,
          })
          .collect()
    }
  };

  let event = TextToImageGenerationCompleteEvent {
    generated_images,
    maybe_frontend_subscriber_id: task.frontend_subscriber_id.clone(),
    maybe_frontend_subscriber_payload: task.frontend_subscriber_payload.clone(),
  };

  event.send_infallible(&app);

  Ok(())
}

async fn handle_inpaint_image_generation(
  app: &AppHandle,
  task: &Task,
  job_result: &ListSessionResultDetailsResponse,
  app_env_configs: &AppEnvConfigs,
  maybe_creds: Option<&StorytellerCredentialSet>,
) -> AnyhowResult<()> {

  let edited_images = match job_result.maybe_batch_token.as_ref() {
    None => {
      vec![EditedImage {
        media_token: MediaFileToken::new_from_str(&job_result.entity_token),
        cdn_url: job_result.media_links.cdn_url.clone(),
        maybe_thumbnail_template: job_result.media_links.maybe_thumbnail_template.clone(),
      }]
    }
    Some(batch_token) => {
      let result = list_batch_generated_redux_media_files(
        &app_env_configs.storyteller_host,
        maybe_creds,
        batch_token,
      ).await?;

      if result.media_files.is_empty() {
        return Err(anyhow!("No media files found for batch token: {}", batch_token));
      }

      result.media_files
          .into_iter()
          .map(|file| EditedImage {
            media_token: file.token,
            cdn_url: file.media_links.cdn_url,
            maybe_thumbnail_template: file.media_links.maybe_thumbnail_template,
          })
          .collect()
    }
  };

  let event = ImageEditCompleteEvent {
    edited_images,
    maybe_frontend_subscriber_id: task.frontend_subscriber_id.clone(),
    maybe_frontend_subscriber_payload: task.frontend_subscriber_payload.clone(),
  };

  event.send_infallible(&app);

  Ok(())
}

async fn handle_video_generation(
  app: &AppHandle,
  task: &Task,
  job_result: &ListSessionResultDetailsResponse,
) -> AnyhowResult<()> {

  // NB: For now, we only generate one video at a time.
  let event = VideoGenerationCompleteEvent {
    generated_video: Some(GeneratedVideo {
      media_token: MediaFileToken::new_from_str(&job_result.entity_token),
      cdn_url: job_result.media_links.cdn_url.clone(),
      maybe_thumbnail_template: media_links_to_thumbnail_template(&job_result.media_links)
          .map(|s| s.to_owned()),
    }),
    maybe_frontend_subscriber_id: task.frontend_subscriber_id.clone(),
    maybe_frontend_subscriber_payload: task.frontend_subscriber_payload.clone(),
  };

  event.send_infallible(&app);

  Ok(())
}

async fn handle_object_generation(
  app: &AppHandle,
  task: &Task,
  job_result: &ListSessionResultDetailsResponse,
) -> AnyhowResult<()> {

  // NB: For now, we only generate one object (3d mesh) at a time.
  let event = ObjectGenerationCompleteEvent {
    generated_object: Some(GeneratedObject {
      media_token: MediaFileToken::new_from_str(&job_result.entity_token),
      cdn_url: job_result.media_links.cdn_url.clone(),
      maybe_thumbnail_template: media_links_to_thumbnail_template(&job_result.media_links)
          .map(|s| s.to_owned()),
    }),
    maybe_frontend_subscriber_id: task.frontend_subscriber_id.clone(),
    maybe_frontend_subscriber_payload: task.frontend_subscriber_payload.clone(),
  };

  event.send_infallible(&app);

  Ok(())
}

async fn handle_gaussian_generation(
  app: &AppHandle,
  task: &Task,
  job_result: &ListSessionResultDetailsResponse,
) -> AnyhowResult<()> {

  // NB: For now, we only generate one object (gaussian) at a time.
  let event = GaussianGenerationCompleteEvent {
    generated_gaussian: Some(GeneratedGaussian {
      media_token: MediaFileToken::new_from_str(&job_result.entity_token),
      cdn_url: job_result.media_links.cdn_url.clone(),
      maybe_thumbnail_template: media_links_to_thumbnail_template(&job_result.media_links)
          .map(|s| s.to_owned()),
    }),
    maybe_frontend_subscriber_id: task.frontend_subscriber_id.clone(),
    maybe_frontend_subscriber_payload: task.frontend_subscriber_payload.clone(),
  };

  event.send_infallible(&app);

  Ok(())
}

async fn handle_background_removal_generation(
  app: &AppHandle,
  task: &Task,
  job_result: &ListSessionResultDetailsResponse,
) -> AnyhowResult<()> {

  let event = CanvasBackgroundRemovalCompleteEvent {
    media_token: MediaFileToken::new_from_str(&job_result.entity_token),
    image_cdn_url: job_result.media_links.cdn_url.clone(),
    maybe_frontend_subscriber_id: task.frontend_subscriber_id.clone(),
    maybe_frontend_subscriber_payload: task.frontend_subscriber_payload.clone(),
  };

  event.send_infallible(&app);

  Ok(())
}
