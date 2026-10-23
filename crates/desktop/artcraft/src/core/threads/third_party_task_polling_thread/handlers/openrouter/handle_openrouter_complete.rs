//! Uploads a finished OpenRouter job's images into the user's library, then completes the task
//! (as `handle_fal_complete` does for fal's result links). Signed out, the images are kept on this
//! computer instead (`local_generations`).

use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::openrouter_jobs::{FinishedOpenRouterJob, OpenRouterJobs};
use crate::core::state::task_database::TaskDatabase;
use crate::core::events::functional_events::text_to_image_generation_complete_event::GeneratedImage;
use crate::core::threads::third_party_task_polling_thread::events::notify_frontend_of_completion::{
  notify_frontend_of_completion, CompletionData,
};
use crate::core::utils::auto_download::{auto_download_task, auto_download_task_urls, clear_auto_download_checkpoint};
use crate::core::utils::local_generations::{keep_local_generation_as, kept_asset_urls, KeptGeneration};
use local_generations::LocalGenerationDetails;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::utils::media_links_to_thumbnail_template::media_links_to_thumbnail_template;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::{
  upload_image_media_file_from_file_with_idempotency_token, UploadImageFromFileArgs,
};
use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use log::{error, info};
use sqlite_tasks::queries::task::Task;
use sqlite_tasks::queries::update_successful_task_status_with_metadata::{
  update_successful_task_status_with_metadata, UpdateSuccessfulTaskArgs,
};
use tauri::AppHandle;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use uuid_utils::uuid::generate_random_uuid;

/// Errors leave the job finished, so the next polling pass retries the upload (the idempotency
/// tokens make re-uploads harmless).
pub async fn handle_openrouter_complete(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
  jobs: &OpenRouterJobs,
  job_id: &str,
  task: &Task,
  finished: &FinishedOpenRouterJob,
) -> Result<(), Box<dyn std::error::Error>> {
  let Some(creds) = storyteller_creds_manager.get_signed_in_credentials()? else {
    let kept = keep_finished_images(jobs, job_id, app_data_root, task, finished)?;
    return complete_kept_openrouter_images(app_handle, app_env_configs, task_database, task, &kept).await;
  };

  info!("[OpenRouterComplete] Uploading {} image(s) for task {}", finished.images.len(), task.id.as_str());

  let maybe_prompt_token = task.prompt_token.as_ref().map(|s| PromptToken::new_from_str(s));
  let maybe_batch_token = finished.maybe_batch_token.as_ref();

  let mut maybe_primary_media_file_token: Option<MediaFileToken> = None;

  for (i, (image, idempotency_token)) in finished.images.iter().zip(&finished.upload_idempotency_tokens).enumerate() {
    let path = app_data_root.temp_dir().path().join(format!("openrouter_{}_{}.{}", generate_random_uuid(), i, image.extension()));
    std::fs::write(&path, &image.bytes)?;

    let result = upload_image_media_file_from_file_with_idempotency_token(UploadImageFromFileArgs {
      api_host: &app_env_configs.storyteller_host,
      maybe_creds: Some(&creds),
      path: &path,
      is_intermediate_system_file: false,
      maybe_prompt_token: maybe_prompt_token.as_ref(),
      maybe_batch_token,
      // Left unset: servers that predate `open_router` would reject the upload.
      maybe_generation_provider: None,
    }, idempotency_token).await;

    let _ = std::fs::remove_file(&path);
    let media_token = result?.media_file_token;
    info!("[OpenRouterComplete] Uploaded result {} as {:?}", i, media_token);

    if maybe_primary_media_file_token.is_none() {
      maybe_primary_media_file_token = Some(media_token);
    }
  }

  let primary_token = maybe_primary_media_file_token.ok_or("OpenRouter returned no images")?;

  let mut maybe_cdn_url = None;
  let mut maybe_cdn_url_str = None;
  let mut maybe_thumbnail_url_template = None;

  match get_media_file(&app_env_configs.storyteller_host, &primary_token).await {
    Ok(response) => {
      maybe_cdn_url = Some(response.media_file.media_links.cdn_url.clone());
      maybe_cdn_url_str = Some(response.media_file.media_links.cdn_url.to_string());
      maybe_thumbnail_url_template = media_links_to_thumbnail_template(&response.media_file.media_links)
        .map(|s| s.to_string());
    }
    Err(err) => {
      error!("[OpenRouterComplete] Failed to look up media file after upload: {:?} (failing open)", err);
    }
  }

  // Save local copies before announcing completion (a failure retries on the next pass).
  auto_download_task(
    app_handle,
    task,
    maybe_batch_token,
    maybe_cdn_url_str.as_deref(),
    Some(finished.images.len()),
  ).await?;

  let updated = update_successful_task_status_with_metadata(UpdateSuccessfulTaskArgs {
    db: task_database.get_connection(),
    task_id: &task.id,
    maybe_batch_token,
    maybe_primary_media_file_token: Some(&primary_token),
    maybe_primary_media_file_class: Some(TaskMediaFileClass::Image),
    maybe_primary_media_file_cdn_url: maybe_cdn_url_str.as_deref(),
    maybe_primary_media_file_thumbnail_url_template: maybe_thumbnail_url_template.as_deref(),
  }).await?;

  if updated {
    clear_auto_download_checkpoint(app_handle, task);
    let completion = CompletionData {
      primary_media_file_token: primary_token,
      maybe_cdn_url,
      maybe_thumbnail_url_template,
      maybe_batch_token: finished.maybe_batch_token.clone(),
      media_class: TaskMediaFileClass::Image,
      local_images: Vec::new(),
    };
    notify_frontend_of_completion(
      app_handle,
      &app_env_configs.storyteller_host,
      Some(&creds),
      task,
      &completion,
    ).await;
  }

  info!("[OpenRouterComplete] Task {} fully handled", task.id.as_str());

  Ok(())
}

/// Completes a task whose images were kept on this computer (signed out).
pub async fn complete_kept_openrouter_images(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  task_database: &TaskDatabase,
  task: &Task,
  kept: &[KeptGeneration],
) -> Result<(), Box<dyn std::error::Error>> {
  let primary = kept.first().ok_or("OpenRouter returned no images")?;

  let updated = update_successful_task_status_with_metadata(UpdateSuccessfulTaskArgs {
    db: task_database.get_connection(),
    task_id: &task.id,
    maybe_batch_token: None,
    maybe_primary_media_file_token: Some(&primary.token),
    maybe_primary_media_file_class: Some(TaskMediaFileClass::Image),
    maybe_primary_media_file_cdn_url: Some(primary.asset_url.as_str()),
    maybe_primary_media_file_thumbnail_url_template: None,
  }).await?;

  if updated {
    // The images are already safe in `local_generations/`: a failed copy mustn't hold the task up.
    if let Err(err) = auto_download_task_urls(app_handle, task, &kept_asset_urls(kept)).await {
      error!("[OpenRouterComplete] Couldn't save copies of task {}: {:?}", task.id.as_str(), err);
    }
    clear_auto_download_checkpoint(app_handle, task);
    let completion = CompletionData {
      primary_media_file_token: primary.token.clone(),
      maybe_cdn_url: Some(primary.asset_url.clone()),
      maybe_thumbnail_url_template: None,
      maybe_batch_token: None,
      media_class: TaskMediaFileClass::Image,
      local_images: kept.iter().map(|k| GeneratedImage { media_token: k.token.clone(), cdn_url: k.asset_url.clone(), maybe_thumbnail_template: None }).collect(),
    };
    notify_frontend_of_completion(app_handle, &app_env_configs.storyteller_host, None, task, &completion).await;
  }

  Ok(())
}

/// Keeps a finished job's images on this computer and records them in `jobs`, so a retry
/// completes the task without keeping them again. Ids come from the job, so keeping a job
/// reloaded after a restart overwrites rather than duplicates.
fn keep_finished_images(
  jobs: &OpenRouterJobs,
  job_id: &str,
  app_data_root: &AppDataRoot,
  task: &Task,
  finished: &FinishedOpenRouterJob,
) -> anyhow::Result<Vec<KeptGeneration>> {
  info!("[OpenRouterComplete] Signed out: keeping {} image(s) for task {} on this computer", finished.images.len(), task.id.as_str());

  let model_id = task.model_type.as_ref().map(|m| m.to_str()).unwrap_or_default();
  let kept = finished.images.iter().enumerate()
    .map(|(i, image)| keep_local_generation_as(app_data_root, &format!("{job_id}_{i}"), &image.bytes, image.extension(), LocalGenerationDetails {
      prompt: &finished.prompt,
      model_id,
      provider: task.provider.to_str(),
    }))
    .collect::<anyhow::Result<Vec<_>>>()?;
  jobs.keep_locally(job_id, kept.clone());
  Ok(kept)
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::state::openrouter_jobs::OpenRouterJobState;
  use enums::common::generation_provider::GenerationProvider;
  use enums::tauri::tasks::task_model_type::TaskModelType;
  use enums::tauri::tasks::task_status::TaskStatus;
  use enums::tauri::tasks::task_type::TaskType;
  use openrouter_client::api::generate_image::OpenRouterImage;
  use tokens::tokens::sqlite::tasks::TaskId;

  #[test]
  fn kept_images_are_recorded_so_a_retry_keeps_nothing_new() {
    let dir = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(dir.path()).unwrap();
    let jobs = OpenRouterJobs::default();
    let image = OpenRouterImage { bytes: b"png".to_vec(), maybe_media_type: Some("image/png".into()) };
    jobs.finish("job", "a fox".to_owned(), vec![image.clone(), image]);
    let Some(OpenRouterJobState::Finished(finished)) = jobs.state("job") else { panic!("expected finished") };
    let kept = keep_finished_images(&jobs, "job", &root, &task(), &finished).unwrap();
    let Some(OpenRouterJobState::KeptLocally(recorded)) = jobs.state("job") else { panic!("a retry must find the kept images") };
    let tokens = |kept: &[KeptGeneration]| kept.iter().map(|k| k.token.as_str().to_owned()).collect::<Vec<_>>();
    assert_eq!(tokens(&recorded), tokens(&kept));
    assert_eq!(local_generations::list(root.path()).len(), 2);
  }

  #[test]
  fn keeping_a_reloaded_job_again_keeps_nothing_new() {
    let dir = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(dir.path()).unwrap();
    let jobs = OpenRouterJobs::default();
    let image = OpenRouterImage { bytes: b"png".to_vec(), maybe_media_type: Some("image/png".into()) };
    jobs.finish("job", "a fox".to_owned(), vec![image.clone(), image]);
    let Some(OpenRouterJobState::Finished(finished)) = jobs.state("job") else { panic!("expected finished") };
    let kept = keep_finished_images(&jobs, "job", &root, &task(), &finished).unwrap();
    let again = keep_finished_images(&jobs, "job", &root, &task(), &finished).unwrap();
    let tokens = |kept: &[KeptGeneration]| kept.iter().map(|k| k.token.as_str().to_owned()).collect::<Vec<_>>();
    assert_eq!(tokens(&again), tokens(&kept), "a job reloaded after a restart keeps the same ids");
    assert_eq!(local_generations::list(root.path()).len(), 2);
  }

  fn task() -> Task {
    Task {
      id: TaskId::generate(),
      status: TaskStatus::Pending,
      task_type: TaskType::ImageGeneration,
      model_type: Some(TaskModelType::NanoBanana),
      provider: GenerationProvider::OpenRouter,
      provider_job_id: Some("job".to_owned()),
      queue_status_url: None,
      queue_response_url: None,
      prompt_token: None,
      frontend_caller: None,
      frontend_subscriber_id: None,
      frontend_subscriber_payload: None,
    }
  }
}
