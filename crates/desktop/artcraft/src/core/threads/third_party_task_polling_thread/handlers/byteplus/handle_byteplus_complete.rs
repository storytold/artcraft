use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::task_database::TaskDatabase;
use crate::core::threads::third_party_task_polling_thread::events::notify_frontend_of_completion::{
  notify_frontend_of_completion, CompletionData,
};
use crate::core::utils::auto_download::{auto_download_task_urls, clear_auto_download_checkpoint};
use crate::core::utils::mp4_hevc_tag::retag_hevc_for_playback;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::utils::media_links_to_thumbnail_template::media_links_to_thumbnail_template;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
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
use artcraft_client::error::storyteller_error::StorytellerError;
use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use log::{error, info, warn};
use sqlite_tasks::queries::task::Task;
use sqlite_tasks::queries::update_successful_task_status_with_metadata::{
  update_successful_task_status_with_metadata, UpdateSuccessfulTaskArgs,
};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use uuid_utils::uuid::generate_random_uuid;

/// Finishes a BytePlus task the way FAL tasks finish: saves local copies, uploads each result to
/// the ArtCraft media library, marks the task complete and tells the frontend.
///
/// BytePlus result links expire (24 hours for Seedream), so they're downloaded right away.
pub async fn handle_byteplus_complete(
  app: &AppHandle,
  task: &Task,
  results: &[ByteplusResult],
) -> Result<(), Box<dyn std::error::Error>> {
  info!("[BytePlusComplete] Handling completed task {} ({} result(s))", task.id.as_str(), results.len());

  let Some(media_class) = results.first().map(|result| result.media_class) else {
    return Err("BytePlus returned no results".into());
  };

  let app_env_configs = app.state::<AppEnvConfigs>();
  let task_database = app.state::<TaskDatabase>();
  let creds = app.state::<StorytellerCredentialManager>().get_credentials()?
    .ok_or("Log in to ArtCraft to save BytePlus results to your library")?;

  let download_urls = results.iter()
    .map(|result| reqwest::Url::parse(&result.url))
    .collect::<Result<Vec<_>, _>>()?;
  auto_download_task_urls(app, task, &download_urls).await?;

  let maybe_prompt_token = task.prompt_token.as_ref().map(|s| PromptToken::new_from_str(s));
  let maybe_batch_token = (results.len() > 1).then(BatchGenerationToken::generate);

  let mut maybe_primary_media_file_token: Option<MediaFileToken> = None;

  for (i, result) in results.iter().enumerate() {
    let download_path = download_result(app, result, i).await?;
    let upload = upload_to_backend(
      &creds,
      &app_env_configs,
      &download_path,
      maybe_prompt_token.as_ref(),
      maybe_batch_token.as_ref(),
      result.media_class,
    ).await;
    remove_temp_file(&download_path);
    let media_token = upload?;

    info!("[BytePlusComplete] Uploaded result {} as {:?}", i, media_token);
    maybe_primary_media_file_token.get_or_insert(media_token);
  }

  let mut maybe_cdn_url: Option<reqwest::Url> = None;
  let mut maybe_thumbnail_url_template = None;

  if let Some(media_file_token) = maybe_primary_media_file_token.as_ref() {
    match get_media_file(&app_env_configs.storyteller_host, media_file_token).await {
      Ok(response) => {
        maybe_cdn_url = Some(response.media_file.media_links.cdn_url.clone());
        maybe_thumbnail_url_template = media_links_to_thumbnail_template(&response.media_file.media_links)
          .map(|s| s.to_string());
      }
      Err(err) => {
        error!("[BytePlusComplete] Failed to look up media file after upload: {:?} (failing open)", err);
      }
    }
  }

  let maybe_cdn_url_str = maybe_cdn_url.as_ref().map(|url| url.to_string());

  let updated = update_successful_task_status_with_metadata(UpdateSuccessfulTaskArgs {
    db: task_database.get_connection(),
    task_id: &task.id,
    maybe_batch_token: maybe_batch_token.as_ref(),
    maybe_primary_media_file_token: maybe_primary_media_file_token.as_ref(),
    maybe_primary_media_file_class: Some(media_class),
    maybe_primary_media_file_cdn_url: maybe_cdn_url_str.as_deref(),
    maybe_primary_media_file_thumbnail_url_template: maybe_thumbnail_url_template.as_deref(),
  }).await?;

  if updated {
    clear_auto_download_checkpoint(app, task);
    if let Some(primary_media_file_token) = maybe_primary_media_file_token {
      let completion = CompletionData {
        primary_media_file_token,
        maybe_cdn_url,
        maybe_thumbnail_url_template,
        maybe_batch_token,
        media_class,
      };
      notify_frontend_of_completion(
        app,
        &app_env_configs.storyteller_host,
        Some(&creds),
        task,
        &completion,
      ).await;
    }
  }

  info!("[BytePlusComplete] Task {} fully handled", task.id.as_str());
  Ok(())
}

/// One finished BytePlus output, still on BytePlus's servers.
pub struct ByteplusResult {
  pub url: String,
  /// File extension without the period, eg. `png` or `mp4`.
  pub extension: String,
  pub media_class: TaskMediaFileClass,
}

// ── Helpers ──

async fn download_result(
  app: &AppHandle,
  result: &ByteplusResult,
  index: usize,
) -> Result<PathBuf, Box<dyn std::error::Error>> {
  let mut bytes = reqwest::get(&result.url).await?.error_for_status()?.bytes().await?.to_vec();
  if result.media_class == TaskMediaFileClass::Video {
    // Seedance's 10-bit output is HEVC tagged `hev1`, which the app's players show as black.
    retag_hevc_for_playback(&mut bytes);
  }
  let filename = format!("byteplus_{}_{}.{}", generate_random_uuid(), index, result.extension);
  let download_path = app.state::<AppDataRoot>().temp_dir().path().join(filename);
  tokio::fs::write(&download_path, &bytes).await?;
  Ok(download_path)
}

fn remove_temp_file(path: &Path) {
  if let Err(err) = std::fs::remove_file(path) {
    warn!("[BytePlusComplete] Could not remove temporary file {:?}: {:?}", path, err);
  }
}

/// NB: Uploads carry no generation provider. storyteller-web doesn't know `byteplus`, and an
/// unknown value must not make the upload fail.
async fn upload_to_backend(
  creds: &StorytellerCredentialSet,
  app_env_configs: &AppEnvConfigs,
  path: &PathBuf,
  maybe_prompt_token: Option<&PromptToken>,
  maybe_batch_token: Option<&BatchGenerationToken>,
  media_class: TaskMediaFileClass,
) -> Result<MediaFileToken, StorytellerError> {
  let api_host = &app_env_configs.storyteller_host;
  let media_token = match media_class {
    TaskMediaFileClass::Video => {
      upload_video_media_file_from_file(UploadVideoFromFileArgs {
        api_host,
        maybe_creds: Some(creds),
        path,
        maybe_prompt_token,
        maybe_generation_provider: None,
      }).await?.media_file_token
    }
    TaskMediaFileClass::Dimensional => {
      legacy_upload_media_file_from_file(LegacyUploadMediaFileFromFileArgs {
        api_host,
        maybe_creds: Some(creds),
        path,
        maybe_generation_provider: None,
      }).await?.media_file_token
    }
    _ => {
      upload_image_media_file_from_file(UploadImageFromFileArgs {
        api_host,
        maybe_creds: Some(creds),
        path,
        is_intermediate_system_file: false,
        maybe_prompt_token,
        maybe_batch_token,
        maybe_generation_provider: None,
      }).await?.media_file_token
    }
  };
  Ok(media_token)
}
