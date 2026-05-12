use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::task_database::TaskDatabase;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::prompts::create_prompt::CreatePromptRequest;
use artcraft_api_defs::utils::media_links_to_thumbnail_template::media_links_to_thumbnail_template;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::error::api_error::ApiError;
use artcraft_client::error::storyteller_error::StorytellerError;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use artcraft_client::endpoints::media_files::legacy_upload_media_file_from_file::{
  legacy_upload_media_file_from_file, LegacyUploadMediaFileFromFileArgs,
};
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::{
  upload_image_media_file_from_file, UploadImageFromFileArgs,
};
use artcraft_client::endpoints::media_files::upload_video_media_file_from_file::{
  upload_video_media_file_from_file, UploadVideoFromFileArgs,
};
use artcraft_client::endpoints::prompts::create_prompt::create_prompt;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use enums::tauri::tasks::task_type::TaskType;
use fal_client::polling::poll_job_response::poll_job_response::PollJobResponse;
use fal_client::polling::poll_job_response::success_case_extractors::PollResponseExtractedContents;
use log::{error, info, warn};
use sqlite_tasks::queries::task::Task;
use sqlite_tasks::queries::update_successful_task_status_with_metadata::{
  update_successful_task_status_with_metadata, UpdateSuccessfulTaskArgs,
};
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use std::time::Duration;
use tauri::AppHandle;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use uuid_utils::uuid::generate_random_uuid;

pub async fn handle_fal_complete(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
  task: &Task,
  job_response: PollJobResponse,
) {
  info!("[FalComplete] Handling completed task {}", task.id.as_str());

  let result = handle_fal_complete_inner(
    app_handle,
    app_env_configs,
    app_data_root,
    task_database,
    storyteller_creds_manager,
    task,
    job_response,
  ).await;

  if let Err(err) = result {
    error!("[FalComplete] Failed to handle task {}: {:?}", task.id.as_str(), err);
  }
}

async fn handle_fal_complete_inner(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
  task: &Task,
  job_response: PollJobResponse,
) -> Result<(), Box<dyn std::error::Error>> {
  let creds = storyteller_creds_manager.get_credentials()?
    .ok_or("No Storyteller credentials available")?;

  let extracted = job_response.extracted_contents;

  // Determine what kind of media we got and collect download URLs.
  let (urls, media_class, generation_action) = collect_media_urls(task, &extracted)?;

  if urls.is_empty() {
    warn!("[FalComplete] Task {} completed but no downloadable media found in response", task.id.as_str());
    //warn!("[FalComplete] Raw body: {}", &job_response.raw_body[..job_response.raw_body.len().min(500)]);
    return Ok(());
  }

  // Create a prompt record
  let prompt_response = create_prompt(
    &app_env_configs.storyteller_host,
    Some(&creds),
    CreatePromptRequest {
      uuid_idempotency_token: generate_random_uuid(),
      positive_prompt: None,
      negative_prompt: None,
      model_type: None,
      generation_provider: Some(GenerationProvider::Fal),
      maybe_generation_mode: None,
      maybe_aspect_ratio: None,
      maybe_resolution: None,
      maybe_batch_count: None,
      maybe_generate_audio: None,
      maybe_duration_seconds: None,
    },
  ).await?;

  info!("[FalComplete] Created prompt: {:?}", prompt_response.prompt_token);

  let maybe_batch_token = if urls.len() > 1 {
    let token = BatchGenerationToken::generate();
    info!("[FalComplete] Using batch token for {} files: {:?}", urls.len(), token);
    Some(token)
  } else {
    None
  };

  let mut maybe_primary_media_file_token: Option<MediaFileToken> = None;

  for (i, url) in urls.iter().enumerate() {
    info!("[FalComplete] Downloading result {} from: {}", i, url);

    let download_path = download_file(url, app_data_root, i).await?;

    info!("[FalComplete] Uploading result {} to backend...", i);

    let media_token = upload_to_backend(
      &creds,
      app_env_configs,
      &download_path,
      &prompt_response.prompt_token,
      maybe_batch_token.as_ref(),
      media_class,
    ).await?;

    info!("[FalComplete] Uploaded as media file: {:?}", media_token);

    if maybe_primary_media_file_token.is_none() {
      maybe_primary_media_file_token = Some(media_token);
    }
  }

  // Look up CDN/thumbnail URLs for the primary media file
  let mut maybe_cdn_url = None;
  let mut maybe_thumbnail_url_template = None;

  if let Some(media_file_token) = maybe_primary_media_file_token.as_ref() {
    match get_media_file(&app_env_configs.storyteller_host, media_file_token).await {
      Ok(response) => {
        maybe_cdn_url = Some(response.media_file.media_links.cdn_url.to_string());
        maybe_thumbnail_url_template = media_links_to_thumbnail_template(&response.media_file.media_links)
          .map(|s| s.to_string());
      }
      Err(err) => {
        error!("[FalComplete] Failed to look up media file after upload: {:?} (failing open)", err);
      }
    }
  }

  // Mark the task as completed
  let updated = update_successful_task_status_with_metadata(UpdateSuccessfulTaskArgs {
    db: task_database.get_connection(),
    task_id: &task.id,
    maybe_batch_token: maybe_batch_token.as_ref(),
    maybe_primary_media_file_token: maybe_primary_media_file_token.as_ref(),
    maybe_primary_media_file_class: Some(media_class),
    maybe_primary_media_file_cdn_url: maybe_cdn_url.as_deref(),
    maybe_primary_media_file_thumbnail_url_template: maybe_thumbnail_url_template.as_deref(),
  }).await?;

  if updated {
    let event = GenerationCompleteEvent {
      action: Some(generation_action),
      service: GenerationServiceProvider::Fal,
      model: None,
    };
    event.send_infallible(app_handle);
  }

  info!("[FalComplete] Task {} fully handled", task.id.as_str());

  Ok(())
}

// ── Helpers ──

/// Collect downloadable media URLs from the extracted response contents.
fn collect_media_urls(
  task: &Task,
  extracted: &Option<PollResponseExtractedContents>,
) -> Result<(Vec<String>, TaskMediaFileClass, GenerationAction), Box<dyn std::error::Error>> {
  let extracted = match extracted {
    Some(e) => e,
    None => return Ok((vec![], TaskMediaFileClass::Image, GenerationAction::GenerateImage)),
  };

  // Images (batch)
  if let Some(images) = &extracted.images {
    let urls: Vec<String> = images.iter()
      .filter_map(|img| img.url.clone())
      .collect();
    if !urls.is_empty() {
      return Ok((urls, TaskMediaFileClass::Image, GenerationAction::GenerateImage));
    }
  }

  // Single image (e.g. background removal)
  if let Some(image) = &extracted.image {
    if let Some(url) = &image.url {
      return Ok((vec![url.clone()], TaskMediaFileClass::Image, GenerationAction::GenerateImage));
    }
  }

  // Video
  if let Some(video) = &extracted.video {
    if let Some(url) = &video.url {
      return Ok((vec![url.clone()], TaskMediaFileClass::Video, GenerationAction::GenerateVideo));
    }
  }

  // 3D model (GLB)
  if let Some(glb) = &extracted.model_glb {
    if let Some(url) = &glb.url {
      return Ok((vec![url.clone()], TaskMediaFileClass::Dimensional, GenerationAction::ImageTo3d));
    }
  }

  Ok((vec![], TaskMediaFileClass::Image, GenerationAction::GenerateImage))
}

async fn download_file(
  url: &str,
  app_data_root: &AppDataRoot,
  index: usize,
) -> Result<PathBuf, Box<dyn std::error::Error>> {
  let response = reqwest::get(url).await?;
  let bytes = response.bytes().await?;

  let extension = url_utils::download_extension::extract_download_extension_from_url::extract_download_extension_from_url_str(url)
    .map(|ext| ext.as_extension_without_period())
    .unwrap_or("bin");

  let tempdir = app_data_root.temp_dir().path();
  let filename = format!("fal_{}_{}.{}", generate_random_uuid(), index, extension);
  let download_path = tempdir.join(filename);

  let mut file = File::create(&download_path)?;
  file.write_all(&bytes)?;

  Ok(download_path)
}

const MAX_UPLOAD_RETRIES: u32 = 5;
const INITIAL_RETRY_DELAY_SECS: u64 = 10;

async fn upload_to_backend(
  creds: &StorytellerCredentialSet,
  app_env_configs: &AppEnvConfigs,
  download_path: &PathBuf,
  prompt_token: &tokens::tokens::prompts::PromptToken,
  maybe_batch_token: Option<&BatchGenerationToken>,
  media_class: TaskMediaFileClass,
) -> Result<MediaFileToken, Box<dyn std::error::Error>> {
  let mut retry_delay_secs = INITIAL_RETRY_DELAY_SECS;

  for attempt in 0..MAX_UPLOAD_RETRIES {
    let result = try_upload(creds, app_env_configs, download_path, prompt_token, maybe_batch_token, media_class).await;

    match result {
      Ok(token) => return Ok(token),
      Err(StorytellerError::Api(ApiError::TooManyRequests(_))) => {
        if attempt + 1 < MAX_UPLOAD_RETRIES {
          warn!(
            "[FalComplete] Upload rate-limited (429), retrying in {}s (attempt {}/{})",
            retry_delay_secs,
            attempt + 1,
            MAX_UPLOAD_RETRIES,
          );
          tokio::time::sleep(Duration::from_secs(retry_delay_secs)).await;
          retry_delay_secs = (retry_delay_secs * 2).min(60);
        } else {
          error!("[FalComplete] Upload rate-limited after {} attempts, giving up", MAX_UPLOAD_RETRIES);
          return Err(Box::new(StorytellerError::Api(ApiError::TooManyRequests(
            "Max retries exceeded".to_string(),
          ))));
        }
      }
      Err(err) => return Err(Box::new(err)),
    }
  }

  unreachable!()
}

async fn try_upload(
  creds: &StorytellerCredentialSet,
  app_env_configs: &AppEnvConfigs,
  download_path: &PathBuf,
  prompt_token: &tokens::tokens::prompts::PromptToken,
  maybe_batch_token: Option<&BatchGenerationToken>,
  media_class: TaskMediaFileClass,
) -> Result<MediaFileToken, StorytellerError> {
  let media_token = match media_class {
    TaskMediaFileClass::Video => {
      let result = upload_video_media_file_from_file(UploadVideoFromFileArgs {
        api_host: &app_env_configs.storyteller_host,
        maybe_creds: Some(creds),
        path: download_path,
        maybe_prompt_token: Some(prompt_token),
      }).await?;
      result.media_file_token
    }
    TaskMediaFileClass::Dimensional => {
      let result = legacy_upload_media_file_from_file(LegacyUploadMediaFileFromFileArgs {
        api_host: &app_env_configs.storyteller_host,
        maybe_creds: Some(creds),
        path: download_path,
      }).await?;
      result.media_file_token
    }
    _ => {
      let result = upload_image_media_file_from_file(UploadImageFromFileArgs {
        api_host: &app_env_configs.storyteller_host,
        maybe_creds: Some(creds),
        path: download_path,
        is_intermediate_system_file: false,
        maybe_prompt_token: Some(prompt_token),
        maybe_batch_token,
      }).await?;
      result.media_file_token
    }
  };

  Ok(media_token)
}
