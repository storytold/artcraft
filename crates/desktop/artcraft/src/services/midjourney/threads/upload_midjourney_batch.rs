use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::task_database::TaskDatabase;
use crate::services::midjourney::threads::events::maybe_handle_text_to_image_complete_event::maybe_handle_text_to_image_complete_event;
use crate::services::midjourney::utils::download_midjourney_image::download_midjourney_image;
use artcraft_api_defs::prompts::create_prompt::CreatePromptRequest;
use artcraft_api_defs::utils::media_links_to_thumbnail_template::media_links_to_thumbnail_template;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::{upload_image_media_file_from_file_with_idempotency_token, UploadImageFromFileArgs};
use artcraft_client::endpoints::prompts::create_prompt::create_prompt;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use enums::tauri::tasks::task_model_type::TaskModelType;
use errors::AnyhowResult;
use log::{error, info};
use midjourney_client::endpoints::imagine::{ImagineItem, MidjourneyJobType};
use midjourney_client::utils::image_downloader_client::ImageDownloaderClient;
use serde::{Deserialize, Serialize};
use sqlite_tasks::queries::task::Task;
use sqlite_tasks::queries::update_successful_task_status_with_metadata::{update_successful_task_status_with_metadata, UpdateSuccessfulTaskArgs};
use std::io::Write;
use std::path::PathBuf;
use std::time::Duration;
use tauri::AppHandle;
use tempfile::NamedTempFile;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use uuid_utils::uuid::generate_random_uuid;

const REQUEST_TIMEOUT: Duration = Duration::from_secs(60);

#[derive(Serialize, Deserialize)]
struct MidjourneyUploadCheckpoint {
  batch_token: BatchGenerationToken,
  prompt_idempotency_token: String,
  maybe_prompt_token: Option<PromptToken>,
  #[serde(default = "upload_idempotency_tokens")]
  upload_idempotency_tokens: [String; 4],
  uploaded: Vec<MediaFileToken>,
}

pub(super) async fn upload_midjourney_batch(maybe_app_handle: Option<&AppHandle>, app_env_configs: &AppEnvConfigs, app_data_root: &AppDataRoot, task_database: &TaskDatabase, storyteller_creds: &StorytellerCredentialSet, image_downloader: &ImageDownloaderClient, midjourney_job_id: &str, local_task: &Task, maybe_item: Option<&ImagineItem>) -> AnyhowResult<()> {
  let mut checkpoint = MidjourneyUploadCheckpoint::load_or_create(app_data_root, local_task)?;
  let model_type = match local_task.model_type {
    Some(TaskModelType::Midjourney7) => CommonModelType::Midjourney7,
    Some(TaskModelType::Midjourney7Niji) => CommonModelType::Midjourney7Niji,
    Some(TaskModelType::Midjourney8) => CommonModelType::Midjourney8,
    _ => model_type_from_feed(maybe_item),
  };
  if checkpoint.maybe_prompt_token.is_none() {
    let request = CreatePromptRequest { uuid_idempotency_token: checkpoint.prompt_idempotency_token.clone(), positive_prompt: maybe_item.and_then(|item| item.full_command.clone()), negative_prompt: None, model_type: Some(model_type), generation_provider: Some(GenerationProvider::Midjourney), maybe_generation_mode: None, maybe_aspect_ratio: None, maybe_resolution: None, maybe_batch_count: Some(4), maybe_generate_audio: None, maybe_duration_seconds: None };
    let prompt = tokio::time::timeout(REQUEST_TIMEOUT, create_prompt(&app_env_configs.storyteller_host, Some(storyteller_creds), request)).await??;
    checkpoint.maybe_prompt_token = Some(prompt.prompt_token);
    checkpoint.save(app_data_root, local_task)?;
  }
  for index in checkpoint.uploaded.len()..4 {
    let download_path = tokio::time::timeout(REQUEST_TIMEOUT, download_midjourney_image(image_downloader, midjourney_job_id, index as u8, app_data_root)).await??;
    let result = tokio::time::timeout(REQUEST_TIMEOUT, upload_image_media_file_from_file_with_idempotency_token(UploadImageFromFileArgs { api_host: &app_env_configs.storyteller_host, maybe_creds: Some(storyteller_creds), path: &download_path, is_intermediate_system_file: false, maybe_prompt_token: checkpoint.maybe_prompt_token.as_ref(), maybe_batch_token: Some(&checkpoint.batch_token), maybe_generation_provider: Some(GenerationProvider::Midjourney) }, &checkpoint.upload_idempotency_tokens[index])).await??;
    checkpoint.uploaded.push(result.media_file_token);
    // Resume at the next image if a later upload fails or the app restarts.
    checkpoint.save(app_data_root, local_task)?;
  }
  let batch_token = checkpoint.batch_token;
  let maybe_primary_media_file_token = checkpoint.uploaded.first().cloned();

  let mut maybe_cdn_url = None;
  let mut maybe_thumbnail_url_template = None;

  if let Some(media_file_token) = maybe_primary_media_file_token.as_ref() {
    info!("Looking up file to grab CDN and thumbnail URLs: {:?} ...", media_file_token);

    let lookup_result = tokio::time::timeout(REQUEST_TIMEOUT, get_media_file(&app_env_configs.storyteller_host, media_file_token)).await;
    match lookup_result {
      Ok(Ok(response)) => {
        maybe_cdn_url = Some(response.media_file.media_links.cdn_url.to_string());
        maybe_thumbnail_url_template = media_links_to_thumbnail_template(&response.media_file.media_links).map(|s| s.to_string());
      },
      other => {
        error!("Failed to look up media file after upload: {:?} (failing open)", other);
      },
    }
  }

  let updated = update_successful_task_status_with_metadata(UpdateSuccessfulTaskArgs { db: task_database.get_connection(), task_id: &local_task.id, maybe_batch_token: Some(&batch_token), maybe_primary_media_file_token: maybe_primary_media_file_token.as_ref(), maybe_primary_media_file_class: Some(TaskMediaFileClass::Image), maybe_primary_media_file_thumbnail_url_template: maybe_thumbnail_url_template.as_deref(), maybe_primary_media_file_cdn_url: maybe_cdn_url.as_deref() }).await?;

  if !updated {
    return Ok(()); // If anything breaks with queries, don't spam events.
  }

  if let Some(app_handle) = maybe_app_handle {
    let event = GenerationCompleteEvent {
      //media_file_token: result.media_file_token,
      action: Some(GenerationAction::GenerateImage),
      service: GenerationServiceProvider::Midjourney,
      model: None,
    };

    if let Err(err) = event.send(&app_handle) {
      error!("Failed to send GenerationCompleteEvent: {:?}", err); // Fail open
    }

    let result = maybe_handle_text_to_image_complete_event(app_handle, app_env_configs, Some(storyteller_creds), local_task, &batch_token).await;

    if let Err(err) = result {
      error!("Failed to send text-to-image complete event: {:?}", err);
    }
  }

  if let Err(err) = std::fs::remove_file(MidjourneyUploadCheckpoint::path(app_data_root, local_task)) {
    log::warn!("Could not remove completed Midjourney upload checkpoint: {}", err);
  }
  Ok(())
}

impl MidjourneyUploadCheckpoint {
  fn load_or_create(root: &AppDataRoot, task: &Task) -> AnyhowResult<Self> {
    let path = Self::path(root, task);
    if path.exists() {
      let checkpoint: Self = serde_json::from_str(&std::fs::read_to_string(path)?)?;
      checkpoint.save(root, task)?; // Backfill stable tokens for older checkpoints.
      return Ok(checkpoint);
    }
    let checkpoint = Self { batch_token: BatchGenerationToken::generate(), prompt_idempotency_token: generate_random_uuid(), maybe_prompt_token: task.prompt_token.as_deref().map(PromptToken::new_from_str), upload_idempotency_tokens: upload_idempotency_tokens(), uploaded: Vec::new() };
    checkpoint.save(root, task)?;
    Ok(checkpoint)
  }

  fn save(&self, root: &AppDataRoot, task: &Task) -> AnyhowResult<()> {
    let mut file = NamedTempFile::new_in(root.state_dir().path())?;
    file.write_all(&serde_json::to_vec(self)?)?;
    file.as_file().sync_all()?;
    file.persist(Self::path(root, task))?;
    Ok(())
  }

  fn path(root: &AppDataRoot, task: &Task) -> PathBuf {
    root.state_dir().path().join(format!("midjourney_upload_{}.json", task.id.as_str()))
  }
}

fn upload_idempotency_tokens() -> [String; 4] {
  std::array::from_fn(|_| generate_random_uuid())
}

fn model_type_from_feed(maybe_item: Option<&ImagineItem>) -> CommonModelType {
  match maybe_item.and_then(|item| item.job_type.as_ref()) {
    Some(MidjourneyJobType::V6Diffusion) => CommonModelType::MidjourneyV6,
    Some(MidjourneyJobType::V6p1Diffusion) => CommonModelType::MidjourneyV6p1,
    Some(MidjourneyJobType::V6p1RawDiffusion) => CommonModelType::MidjourneyV6p1Raw,
    Some(MidjourneyJobType::V7Diffusion) => CommonModelType::MidjourneyV7,
    Some(MidjourneyJobType::V7RawDiffusion) => CommonModelType::MidjourneyV7Raw,
    Some(MidjourneyJobType::V7DraftDiffusion) => CommonModelType::MidjourneyV7Draft,
    Some(MidjourneyJobType::V7DraftRawDiffusion) => CommonModelType::MidjourneyV7DraftRaw,
    _ => CommonModelType::Midjourney,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use enums::tauri::tasks::{task_status::TaskStatus, task_type::TaskType};
  use tokens::tokens::sqlite::tasks::TaskId;

  #[test]
  fn partial_upload_resumes_with_original_prompt_batch_and_completed_images() {
    let dir = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(dir.path()).unwrap();
    let task = task();
    let mut checkpoint = MidjourneyUploadCheckpoint::load_or_create(&root, &task).unwrap();
    let batch = checkpoint.batch_token.clone();
    let idempotency = checkpoint.prompt_idempotency_token.clone();
    let upload_tokens = checkpoint.upload_idempotency_tokens.clone();
    checkpoint.uploaded.push(MediaFileToken::new_from_str("mf_first"));
    checkpoint.uploaded.push(MediaFileToken::new_from_str("mf_second"));
    checkpoint.save(&root, &task).unwrap();
    let loaded = MidjourneyUploadCheckpoint::load_or_create(&root, &task).unwrap();
    assert_eq!(loaded.batch_token, batch);
    assert_eq!(loaded.upload_idempotency_tokens, upload_tokens);
    assert_eq!(loaded.prompt_idempotency_token, idempotency);
    assert_eq!(loaded.maybe_prompt_token.unwrap().as_str(), "prompt_test");
    assert_eq!(loaded.uploaded.len(), 2);
    assert_eq!(loaded.uploaded[0].as_str(), "mf_first");
    assert_eq!((loaded.uploaded.len()..4).collect::<Vec<_>>(), vec![2, 3]);
  }

  fn task() -> Task {
    Task { id: TaskId::generate(), status: TaskStatus::Pending, task_type: TaskType::ImageGeneration, model_type: Some(TaskModelType::Midjourney8), provider: GenerationProvider::Midjourney, provider_job_id: Some("test-job".to_string()), queue_status_url: None, queue_response_url: None, prompt_token: Some("prompt_test".to_string()), frontend_caller: None, frontend_subscriber_id: None, frontend_subscriber_payload: None }
  }
}
