use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::threads::third_party_task_polling_thread::events::notify_frontend_of_completion::{notify_frontend_of_completion, CompletionData};
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::auto_download::{auto_download_task_files, clear_auto_download_checkpoint};
use crate::core::utils::provider_image_context::ProviderImageContext;
use crate::core::utils::local_generations::keep_as;
use crate::core::events::functional_events::text_to_image_generation_complete_event::GeneratedImage;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::utils::media_links_to_thumbnail_template::media_links_to_thumbnail_template;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::error::api_error::ApiError;
use artcraft_client::error::storyteller_error::StorytellerError;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use artcraft_client::endpoints::media_files::legacy_upload_media_file_from_file::{legacy_upload_media_file_from_file_with_idempotency_token, LegacyUploadMediaFileFromFileArgs};
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::{upload_image_media_file_from_file_with_idempotency_token, UploadImageFromFileArgs};
use artcraft_client::endpoints::media_files::upload_video_media_file_from_file::{upload_video_media_file_from_file_with_idempotency_token, UploadVideoFromFileArgs};
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use log::{error, info, warn};
use sqlite_tasks::queries::task::Task;
use sqlite_tasks::queries::update_successful_task_status_with_metadata::{update_successful_task_status_with_metadata, UpdateSuccessfulTaskArgs};
use std::path::{Path, PathBuf};
use std::time::Duration;
use tauri::AppHandle;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use super::provider_transfer::{cache_downloads_with_client, clear_cached_downloads};
use super::provider_upload_checkpoint::{resume_uploads, CompletionIdentity, UploadCheckpoint};

const MAX_UPLOAD_RETRIES: u32 = 5;
const INITIAL_RETRY_DELAY_SECS: u64 = 10;

#[cfg(test)]
#[path = "provider_completion_tests.rs"]
pub(crate) mod provider_completion_tests;

pub async fn try_resume_saved_completion(app_handle: &AppHandle<impl tauri::Runtime>, app_env_configs: &AppEnvConfigs, app_data_root: &AppDataRoot, task_database: &TaskDatabase, storyteller_creds_manager: &StorytellerCredentialManager, task: &Task) -> Result<bool, Box<dyn std::error::Error>> {
  let path = checkpoint_path(app_data_root, task)?;
  let loaded = match UploadCheckpoint::load(&path).map_err(|error| {
    let invalid = error.is::<serde_json::Error>() || error.downcast_ref::<std::io::Error>().is_some_and(|error| error.kind() == std::io::ErrorKind::InvalidData);
    (invalid, error.to_string())
  }) {
    Ok(loaded) => loaded,
    Err((true, error)) => {
      super::handle_provider_failure::handle_provider_failure(app_handle, task_database, task, &format!("Saved upload progress is unreadable; recovery stopped to avoid duplicate uploads: {error}")).await;
      return Ok(true);
    },
    Err((false, error)) => return Err(error.into()),
  };
  let Some(checkpoint) = loaded else {
    return Ok(false);
  };
  if checkpoint.identity != completion_identity(app_env_configs, task, checkpoint.identity.media_class) {
    return Err("Provider upload checkpoint belongs to a different task or API host".into());
  }
  handle_provider_complete(app_handle, app_env_configs, app_data_root, task_database, storyteller_creds_manager, task, checkpoint.urls(), checkpoint.identity.media_class).await?;
  Ok(true)
}

pub async fn handle_provider_complete(app_handle: &AppHandle<impl tauri::Runtime>, app_env_configs: &AppEnvConfigs, app_data_root: &AppDataRoot, task_database: &TaskDatabase, storyteller_creds_manager: &StorytellerCredentialManager, task: &Task, urls: Vec<String>, media_class: TaskMediaFileClass) -> Result<(), Box<dyn std::error::Error>> {
  let client = super::public_media_client::public_media_client()?;
  handle_provider_complete_with_client(app_handle, app_env_configs, app_data_root, task_database, storyteller_creds_manager, task, urls, media_class, &client).await
}

async fn handle_provider_complete_with_client(app_handle: &AppHandle<impl tauri::Runtime>, app_env_configs: &AppEnvConfigs, app_data_root: &AppDataRoot, task_database: &TaskDatabase, storyteller_creds_manager: &StorytellerCredentialManager, task: &Task, urls: Vec<String>, media_class: TaskMediaFileClass, client: &reqwest::Client) -> Result<(), Box<dyn std::error::Error>> {
  if urls.is_empty() {
    warn!("[ProviderComplete] Task {} completed but no downloadable media found in response", task.id.as_str());
    super::handle_provider_failure::handle_provider_failure(app_handle, task_database, task, "Provider completed without downloadable media").await;
    return Ok(());
  }
  let path = checkpoint_path(app_data_root, task)?;
  let identity = completion_identity(app_env_configs, task, media_class);
  UploadCheckpoint::prepare(&path, &identity, &urls)?;
  let files = cache_downloads_with_client(client, &path, &urls).await?;
  let maybe_context = if task.provider == GenerationProvider::WaveSpeed { task.provider_job_id.as_deref().map(|job_id| ProviderImageContext::load(app_data_root, job_id)).transpose()?.flatten() } else { None };
  let maybe_creds = storyteller_creds_manager.get_signed_in_credentials()?;
  if should_keep_locally(task.provider, media_class, maybe_context.as_ref(), maybe_creds.is_some()) {
    for file in &files {
      let validation = if media_class == TaskMediaFileClass::Video { crate::core::utils::local_generations::validate_video_file(file) } else { crate::core::utils::local_generations::validate_image_file(file) };
      if let Err(error) = validation {
        if error.downcast_ref::<crate::core::utils::local_generations::InvalidLocalImage>().is_some() {
          if super::handle_provider_failure::handle_provider_failure(app_handle, task_database, task, &format!("WaveSpeed returned unsupported or invalid media: {error}")).await {
            cleanup_completion(app_handle, app_data_root, task, &path);
          }
        }
        return Err(error.into());
      }
    }
  }

  // Save local copies before uploading or announcing completion.
  let download_urls = urls.iter().map(|url| reqwest::Url::parse(url)).collect::<Result<Vec<_>, _>>()?;
  auto_download_task_files(app_handle, task, &download_urls, &files).await?;

  if should_keep_locally(task.provider, media_class, maybe_context.as_ref(), maybe_creds.is_some()) {
    let local_images = keep_local_images(app_data_root, task, &files, maybe_context.as_ref())?;
    let primary = local_images.first().ok_or("No local image results")?;
    let updated = update_successful_task_status_with_metadata(UpdateSuccessfulTaskArgs { db: task_database.get_connection(), task_id: &task.id, maybe_batch_token: None, maybe_primary_media_file_token: Some(&primary.media_token), maybe_primary_media_file_class: Some(media_class), maybe_primary_media_file_cdn_url: Some(primary.cdn_url.as_str()), maybe_primary_media_file_thumbnail_url_template: None }).await?;
    if updated {
      let completion = CompletionData { primary_media_file_token: primary.media_token.clone(), maybe_cdn_url: Some(primary.cdn_url.clone()), maybe_thumbnail_url_template: None, maybe_batch_token: None, media_class, local_images: Some(local_images) };
      notify_frontend_of_completion(app_handle, &app_env_configs.storyteller_host, None, task, &completion).await;
    }
    cleanup_completion(app_handle, app_data_root, task, &path);
    return Ok(());
  }
  let creds = maybe_creds.ok_or("Sign in to finish saving this generation to ArtCraft")?;
  let session_cookie = creds.session.as_ref().ok_or("Sign in to finish saving this generation to ArtCraft")?;
  let session = artcraft_client::utils::login_challenge_client::LoginChallengeClient::new(&app_env_configs.storyteller_host)?.session(session_cookie.as_str()).await?;
  if !session.success || !session.logged_in {
    return Err("Sign in to finish saving this generation to ArtCraft".into());
  }
  let user = session.user.ok_or("ArtCraft did not return the signed-in user")?;
  let mut checkpoint = UploadCheckpoint::prepare(&path, &identity, &urls)?;
  checkpoint.bind_upload_account(&path, user.user_token.as_str())?;

  // Use the prompt token from the task record (created at generation time).
  let maybe_prompt_token = task.prompt_token.as_ref().map(|s| PromptToken::new_from_str(s));

  if maybe_prompt_token.is_some() {
    info!("[ProviderComplete] Using prompt token from task: {:?}", maybe_prompt_token);
  } else {
    warn!("[ProviderComplete] Task {} has no prompt token, uploading without prompt association", task.id.as_str());
  }

  let (primary_token, maybe_batch_token) = resume_uploads(&path, &identity, &urls, |plan| {
    let creds = &creds;
    let maybe_prompt_token = maybe_prompt_token.as_ref();
    let download_path = &files[plan.index];
    async move { upload_to_backend(creds, app_env_configs, download_path, maybe_prompt_token, plan.maybe_batch_token.as_ref(), media_class, task.provider, &plan.idempotency_token).await }
  })
  .await?;
  let maybe_primary_media_file_token = Some(primary_token);

  // Look up CDN/thumbnail URLs for the primary media file
  let mut maybe_cdn_url: Option<reqwest::Url> = None;
  let mut maybe_cdn_url_str: Option<String> = None;
  let mut maybe_thumbnail_url_template = None;

  if let Some(media_file_token) = maybe_primary_media_file_token.as_ref() {
    match tokio::time::timeout(Duration::from_secs(60), get_media_file(&app_env_configs.storyteller_host, media_file_token)).await {
      Ok(Ok(response)) => {
        maybe_cdn_url = Some(response.media_file.media_links.cdn_url.clone());
        maybe_cdn_url_str = Some(response.media_file.media_links.cdn_url.to_string());
        maybe_thumbnail_url_template = media_links_to_thumbnail_template(&response.media_file.media_links).map(|s| s.to_string());
      },
      result => {
        error!("[ProviderComplete] Failed to look up media file after upload: {:?} (failing open)", result);
      },
    }
  }

  // Mark the task as completed in the local database
  let updated = update_successful_task_status_with_metadata(UpdateSuccessfulTaskArgs { db: task_database.get_connection(), task_id: &task.id, maybe_batch_token: maybe_batch_token.as_ref(), maybe_primary_media_file_token: maybe_primary_media_file_token.as_ref(), maybe_primary_media_file_class: Some(media_class), maybe_primary_media_file_cdn_url: maybe_cdn_url_str.as_deref(), maybe_primary_media_file_thumbnail_url_template: maybe_thumbnail_url_template.as_deref() }).await?;

  cleanup_completion(app_handle, app_data_root, task, &path);
  if updated {
    clear_auto_download_checkpoint(app_handle, task);
    if let Some(primary_token) = maybe_primary_media_file_token {
      let completion = CompletionData { primary_media_file_token: primary_token, maybe_cdn_url, maybe_thumbnail_url_template, maybe_batch_token, media_class, local_images: None };

      if tokio::time::timeout(Duration::from_secs(60), notify_frontend_of_completion(app_handle, &app_env_configs.storyteller_host, Some(&creds), task, &completion)).await.is_err() {
        warn!("[ProviderComplete] Timed out notifying completion for {}", task.id.as_str());
      }
    }
  }

  info!("[ProviderComplete] Task {} fully handled", task.id.as_str());

  Ok(())
}

// ── Helpers ──

fn should_keep_locally(provider: GenerationProvider, media_class: TaskMediaFileClass, maybe_context: Option<&ProviderImageContext>, signed_in: bool) -> bool {
  provider == GenerationProvider::WaveSpeed && matches!(media_class, TaskMediaFileClass::Image | TaskMediaFileClass::Video) && (maybe_context.is_some_and(|context| context.local_only) || !signed_in)
}

fn keep_local_images(root: &AppDataRoot, task: &Task, files: &[PathBuf], maybe_context: Option<&ProviderImageContext>) -> Result<Vec<GeneratedImage>, Box<dyn std::error::Error>> {
  files
    .iter()
    .enumerate()
    .map(|(index, file)| {
      let keep = if task.task_type == enums::tauri::tasks::task_type::TaskType::VideoGeneration { crate::core::utils::local_generations::keep_video_as } else { keep_as };
      let kept = keep(root, &format!("{}_{index}", task.id.as_str()), file, maybe_context.map(|context| context.prompt.as_str()).unwrap_or_default(), maybe_context.map(|context| context.model_id.as_str()).or_else(|| task.model_type.as_ref().map(|model| model.to_str())).unwrap_or("unknown"), "wavespeed")?;
      Ok(GeneratedImage { media_token: kept.token, cdn_url: kept.asset_url, maybe_thumbnail_template: None })
    })
    .collect()
}

fn cleanup_completion(app: &AppHandle<impl tauri::Runtime>, root: &AppDataRoot, task: &Task, path: &Path) {
  if let Err(error) = clear_cached_downloads(path) {
    warn!("Could not remove cached provider media: {error}");
  }
  if let Err(error) = std::fs::remove_file(path) {
    if error.kind() != std::io::ErrorKind::NotFound {
      warn!("Could not remove provider upload checkpoint: {error}");
    }
  }
  if task.provider == GenerationProvider::WaveSpeed {
    if let Some(job_id) = task.provider_job_id.as_deref() {
      if let Err(error) = crate::core::utils::provider_submission::remove_submission(root, job_id) {
        warn!("Could not remove completed submission receipt: {error}");
      }
      if let Err(error) = ProviderImageContext::remove(root, job_id) {
        warn!("Could not remove provider image context: {error}");
      }
    }
  }
  clear_auto_download_checkpoint(app, task);
}

fn checkpoint_path(root: &AppDataRoot, task: &Task) -> Result<PathBuf, Box<dyn std::error::Error>> {
  if task.id.as_str().is_empty() || !task.id.as_str().bytes().all(|byte| byte.is_ascii_alphanumeric() || byte == b'_' || byte == b'-') {
    return Err("Invalid task ID for upload checkpoint".into());
  }
  Ok(root.state_dir().path().join(format!("provider_upload_{}.json", task.id.as_str())))
}

fn completion_identity(config: &AppEnvConfigs, task: &Task, media_class: TaskMediaFileClass) -> CompletionIdentity {
  CompletionIdentity { task_id: task.id.to_string(), provider: task.provider, maybe_provider_job_id: task.provider_job_id.clone(), api_host: config.storyteller_host.to_api_hostname_and_scheme(), media_class }
}

async fn upload_to_backend(creds: &StorytellerCredentialSet, app_env_configs: &AppEnvConfigs, download_path: &Path, maybe_prompt_token: Option<&PromptToken>, maybe_batch_token: Option<&BatchGenerationToken>, media_class: TaskMediaFileClass, provider: GenerationProvider, idempotency_token: &str) -> Result<MediaFileToken, Box<dyn std::error::Error>> {
  let mut retry_delay_secs = INITIAL_RETRY_DELAY_SECS;

  for attempt in 0..MAX_UPLOAD_RETRIES {
    let result = try_upload(creds, app_env_configs, download_path, maybe_prompt_token, maybe_batch_token, media_class, provider, idempotency_token).await;

    match result {
      Ok(token) => return Ok(token),
      Err(StorytellerError::Api(ApiError::TooManyRequests(_))) => {
        if attempt + 1 < MAX_UPLOAD_RETRIES {
          warn!("[ProviderComplete] Upload rate-limited (429), retrying in {}s (attempt {}/{})", retry_delay_secs, attempt + 1, MAX_UPLOAD_RETRIES,);
          tokio::time::sleep(Duration::from_secs(retry_delay_secs)).await;
          retry_delay_secs = (retry_delay_secs * 2).min(60);
        } else {
          error!("[ProviderComplete] Upload rate-limited after {} attempts, giving up", MAX_UPLOAD_RETRIES);
          return Err(Box::new(StorytellerError::Api(ApiError::TooManyRequests("Max retries exceeded".to_string()))));
        }
      },
      Err(err) => return Err(Box::new(err)),
    }
  }

  unreachable!()
}

async fn try_upload(creds: &StorytellerCredentialSet, app_env_configs: &AppEnvConfigs, download_path: &Path, maybe_prompt_token: Option<&PromptToken>, maybe_batch_token: Option<&BatchGenerationToken>, media_class: TaskMediaFileClass, provider: GenerationProvider, idempotency_token: &str) -> Result<MediaFileToken, StorytellerError> {
  let media_token = match media_class {
    TaskMediaFileClass::Video => {
      let result = upload_video_media_file_from_file_with_idempotency_token(UploadVideoFromFileArgs { api_host: &app_env_configs.storyteller_host, maybe_creds: Some(creds), path: download_path, maybe_prompt_token, maybe_generation_provider: Some(provider) }, idempotency_token).await?;
      result.media_file_token
    },
    TaskMediaFileClass::Dimensional => {
      let result = legacy_upload_media_file_from_file_with_idempotency_token(LegacyUploadMediaFileFromFileArgs { api_host: &app_env_configs.storyteller_host, maybe_creds: Some(creds), path: download_path, maybe_generation_provider: Some(provider) }, idempotency_token).await?;
      result.media_file_token
    },
    _ => {
      let result = upload_image_media_file_from_file_with_idempotency_token(UploadImageFromFileArgs { api_host: &app_env_configs.storyteller_host, maybe_creds: Some(creds), path: download_path, is_intermediate_system_file: false, maybe_prompt_token, maybe_batch_token, maybe_generation_provider: Some(provider) }, idempotency_token).await?;
      result.media_file_token
    },
  };

  Ok(media_token)
}
