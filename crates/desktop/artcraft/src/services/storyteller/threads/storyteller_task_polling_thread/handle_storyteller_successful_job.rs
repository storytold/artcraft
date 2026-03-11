use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::GenerationAction;
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::enum_conversion::generation_provider::to_generation_service_provider;
use crate::core::utils::enum_conversion::task_type::to_generation_action;
use super::events::maybe_handle_frontend_caller_notification::maybe_handle_frontend_caller_notification;
use artcraft_api_defs::jobs::list_session_jobs::ListSessionJobsItem;
use artcraft_api_defs::utils::media_links_to_thumbnail_template::media_links_to_thumbnail_template;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use enums::by_table::generic_inference_jobs::inference_category::InferenceCategory;
use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use errors::AnyhowResult;
use log::error;
use log::info;
use sqlite_tasks::queries::task::Task;
use sqlite_tasks::queries::update_successful_task_status_with_metadata::{update_successful_task_status_with_metadata, UpdateSuccessfulTaskArgs};
use tauri::AppHandle;
use tokens::tokens::media_files::MediaFileToken;

pub async fn handle_successful_job(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  creds: Option<&StorytellerCredentialSet>,
  job: &ListSessionJobsItem,
  task: &Task,
  task_database: &TaskDatabase,
) -> AnyhowResult<()> {
  let maybe_primary_media_file_token = job.maybe_result
      .as_ref()
      .map(|result| MediaFileToken::new_from_str(&result.entity_token));

  let updated = update_successful_task_status_with_metadata(UpdateSuccessfulTaskArgs {
    db: task_database.get_connection(),
    task_id: &task.id,
    maybe_batch_token: job.maybe_result
        .as_ref()
        .map(|result| result.maybe_batch_token.as_ref())
        .flatten(),
    maybe_primary_media_file_token: maybe_primary_media_file_token.as_ref(),
    maybe_primary_media_file_class: get_media_file_class(job),
    maybe_primary_media_file_thumbnail_url_template: get_thumbnail_template(job),
    maybe_primary_media_file_cdn_url: job.maybe_result
        .as_ref()
        .map(|result| result.media_links.cdn_url.as_str()),
  }).await?;

  if !updated {
    return Ok(()); // If anything breaks with queries, don't spam events.
  }

  send_additional_success_events(app_handle, app_env_configs, creds, job, task).await;

  let service = to_generation_service_provider(task.provider);
  let action = to_generation_action(task.task_type);

  let event = GenerationCompleteEvent {
    action: Some(action),
    service,
    model: None, // TODO
  };

  if let Err(err) = event.send(app_handle) {
    error!("Failed to send GenerationCompleteEvent: {:?}", err); // Fail open
  }

  Ok(())
}

async fn send_additional_success_events(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  creds: Option<&StorytellerCredentialSet>,
  job: &ListSessionJobsItem,
  task: &Task
) {
  info!("Attempting to dispatch events for completed Storyteller job: {:?}", task);

  let result = maybe_handle_frontend_caller_notification(
    app_handle,
    app_env_configs,
    creds,
    task,
    job,
  ).await;

  if let Err(err) = result {
    error!("Failed to send generation complete event: {:?}", err);
  }

  //let result = maybe_handle_text_to_image_complete_event(
  //  app_handle,
  //  app_env_configs,
  //  creds,
  //  task,
  //  job,
  //).await;

  //if let Err(err) = result {
  //  error!("Failed to send text-to-image complete event: {:?}", err);
  //}

  //let result = maybe_handle_inpainting_complete_event(
  //  app_handle,
  //  app_env_configs,
  //  creds,
  //  task,
  //  job,
  //).await;

  //if let Err(err) = result {
  //  error!("Failed to send image inpainting complete event: {:?}", err);
  //}

  //let result = maybe_send_background_removal_complete_event(
  //  app_handle,
  //  task,
  //  job,
  //).await;

  //if let Err(err) = result {
  //  error!("Failed to send background removal complete event: {:?}", err);
  //}
}

fn get_thumbnail_template<'a>(job: &'a ListSessionJobsItem) -> Option<&'a str> {
  let links = match job.maybe_result.as_ref() {
    None => return None,
    Some(result) => &result.media_links,
  };

  media_links_to_thumbnail_template(links)
}

fn get_media_file_class(job: &ListSessionJobsItem) -> Option<TaskMediaFileClass> {
  match job.request.inference_category {
    InferenceCategory::BackgroundRemoval => return Some(TaskMediaFileClass::Image),
    InferenceCategory::ImageGeneration => return Some(TaskMediaFileClass::Image),
    InferenceCategory::VideoGeneration => return Some(TaskMediaFileClass::Video),
    InferenceCategory::ObjectGeneration => return Some(TaskMediaFileClass::Dimensional),
    _ => {}, // Fall-through
  }

  let result = match job.maybe_result.as_ref() {
    None => return None,
    Some(result) => result,
  };

  let url = result.media_links.cdn_url.as_str();

  if url.ends_with("jpg")
      || url.ends_with("jpeg")
      || url.ends_with("png")
  {
    return Some(TaskMediaFileClass::Image);
  }

  if url.ends_with("mp4")
      || url.ends_with("webm")
  {
    return Some(TaskMediaFileClass::Video);
  }

  if url.ends_with("glb") {
    return Some(TaskMediaFileClass::Dimensional);
  }

  if url.ends_with("wav")
      || url.ends_with("mp3")
  {
    return Some(TaskMediaFileClass::Audio);
  }

  None
}
