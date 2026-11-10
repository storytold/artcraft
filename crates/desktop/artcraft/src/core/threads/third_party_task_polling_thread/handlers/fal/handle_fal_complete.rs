use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::threads::third_party_task_polling_thread::events::notify_frontend_of_completion::{
  notify_frontend_of_completion, CompletionData,
};
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::auto_download::{auto_download_task_urls, clear_auto_download_checkpoint};
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::utils::media_links_to_thumbnail_template::media_links_to_thumbnail_template;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::error::api_error::ApiError;
use artcraft_client::error::storyteller_error::StorytellerError;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use artcraft_client::endpoints::media_files::legacy_upload_media_file_from_file::{
  legacy_upload_media_file_from_file_with_idempotency_token, LegacyUploadMediaFileFromFileArgs,
};
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::{
  upload_image_media_file_from_file_with_idempotency_token, UploadImageFromFileArgs,
};
use artcraft_client::endpoints::media_files::upload_video_media_file_from_file::{
  upload_video_media_file_from_file_with_idempotency_token, UploadVideoFromFileArgs,
};
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
use tempfile::NamedTempFile;
use super::upload_checkpoint::resume_uploads;
use std::io::Write;
use std::path::PathBuf;
use std::time::Duration;
use tauri::AppHandle;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

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
  let (urls, media_class) = collect_media_urls(task, &extracted)?;

  if urls.is_empty() {
    warn!("[FalComplete] Task {} completed but no downloadable media found in response", task.id.as_str());
    //warn!("[FalComplete] Raw body: {}", &job_response.raw_body[..job_response.raw_body.len().min(500)]);
    return Ok(());
  }

  // Save local copies before uploading or announcing completion.
  let download_urls = urls.iter().map(|url| reqwest::Url::parse(url)).collect::<Result<Vec<_>, _>>()?;
  auto_download_task_urls(app_handle, task, &download_urls).await?;

  // Use the prompt token from the task record (created at generation time).
  let maybe_prompt_token = task.prompt_token.as_ref()
    .map(|s| PromptToken::new_from_str(s));

  if maybe_prompt_token.is_some() {
    info!("[FalComplete] Using prompt token from task: {:?}", maybe_prompt_token);
  } else {
    warn!("[FalComplete] Task {} has no prompt token, uploading without prompt association", task.id.as_str());
  }

  let checkpoint_path = app_data_root.state_dir().path().join(format!("fal_upload_{}.json", task.id.as_str()));
  let (primary_token, maybe_batch_token) = resume_uploads(&checkpoint_path, &urls, |plan| {
    let creds = &creds;
    let maybe_prompt_token = maybe_prompt_token.as_ref();
    async move {
      let download = download_file(&plan.url, app_data_root, plan.index).await?;
      upload_to_backend(creds, app_env_configs, &download.path().to_path_buf(), maybe_prompt_token, plan.maybe_batch_token.as_ref(), media_class, &plan.idempotency_token).await
      // The owned temporary is removed on both success and failure.
    }
  }).await?;
  let maybe_primary_media_file_token = Some(primary_token);

  // Look up CDN/thumbnail URLs for the primary media file
  let mut maybe_cdn_url: Option<reqwest::Url> = None;
  let mut maybe_cdn_url_str: Option<String> = None;
  let mut maybe_thumbnail_url_template = None;

  if let Some(media_file_token) = maybe_primary_media_file_token.as_ref() {
    match get_media_file(&app_env_configs.storyteller_host, media_file_token).await {
      Ok(response) => {
        maybe_cdn_url = Some(response.media_file.media_links.cdn_url.clone());
        maybe_cdn_url_str = Some(response.media_file.media_links.cdn_url.to_string());
        maybe_thumbnail_url_template = media_links_to_thumbnail_template(&response.media_file.media_links)
          .map(|s| s.to_string());
      }
      Err(err) => {
        error!("[FalComplete] Failed to look up media file after upload: {:?} (failing open)", err);
      }
    }
  }

  // Mark the task as completed in the local database
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
    if let Err(err) = std::fs::remove_file(&checkpoint_path) {
      if err.kind() != std::io::ErrorKind::NotFound { warn!("Could not remove FAL upload checkpoint: {err}"); }
    }
    clear_auto_download_checkpoint(app_handle, task);
    if let Some(primary_token) = maybe_primary_media_file_token {
      let completion = CompletionData {
        primary_media_file_token: primary_token,
        maybe_cdn_url,
        maybe_thumbnail_url_template,
        maybe_batch_token,
        media_class,
      };

      notify_frontend_of_completion(
        app_handle,
        &app_env_configs.storyteller_host,
        Some(&creds),
        task,
        &completion,
      ).await;
    }
  }

  info!("[FalComplete] Task {} fully handled", task.id.as_str());

  Ok(())
}

// ── Helpers ──

/// Collect downloadable media URLs from the extracted response contents.
fn collect_media_urls(
  task: &Task,
  extracted: &Option<PollResponseExtractedContents>,
) -> Result<(Vec<String>, TaskMediaFileClass), Box<dyn std::error::Error>> {
  let extracted = match extracted {
    Some(e) => e,
    None => return Ok((vec![], TaskMediaFileClass::Image)),
  };

  // Images (batch)
  if let Some(images) = &extracted.images {
    let urls: Vec<String> = images.iter()
      .filter_map(|img| img.url.clone())
      .collect();
    if !urls.is_empty() {
      return Ok((urls, TaskMediaFileClass::Image));
    }
  }

  // Single image (e.g. background removal)
  if let Some(image) = &extracted.image {
    if let Some(url) = &image.url {
      return Ok((vec![url.clone()], TaskMediaFileClass::Image));
    }
  }

  // Video
  if let Some(video) = &extracted.video {
    if let Some(url) = &video.url {
      return Ok((vec![url.clone()], TaskMediaFileClass::Video));
    }
  }

  // 3D model (GLB)
  if let Some(glb) = &extracted.model_glb {
    if let Some(url) = &glb.url {
      return Ok((vec![url.clone()], TaskMediaFileClass::Dimensional));
    }
  }

  Ok((vec![], TaskMediaFileClass::Image))
}

async fn download_file(
  url: &str,
  app_data_root: &AppDataRoot,
  index: usize,
) -> Result<NamedTempFile, Box<dyn std::error::Error>> {
  let response = reqwest::Client::builder().timeout(Duration::from_secs(600)).build()?.get(url).send().await?.error_for_status()?;
  let bytes = response.bytes().await?;

  let extension = url_utils::download_extension::extract_download_extension_from_url::extract_download_extension_from_url_str(url)
    .map(|ext| ext.as_extension_without_period())
    .unwrap_or("bin");

  let tempdir = app_data_root.temp_dir().path();
  let mut file = tempfile::Builder::new().prefix(&format!("fal_{index}_")).suffix(&format!(".{extension}")).tempfile_in(tempdir)?;
  file.write_all(&bytes)?;
  Ok(file)
}

const MAX_UPLOAD_RETRIES: u32 = 5;
const INITIAL_RETRY_DELAY_SECS: u64 = 10;

async fn upload_to_backend(
  creds: &StorytellerCredentialSet,
  app_env_configs: &AppEnvConfigs,
  download_path: &PathBuf,
  maybe_prompt_token: Option<&PromptToken>,
  maybe_batch_token: Option<&BatchGenerationToken>,
  media_class: TaskMediaFileClass,
  idempotency_token: &str,
) -> Result<MediaFileToken, Box<dyn std::error::Error>> {
  let mut retry_delay_secs = INITIAL_RETRY_DELAY_SECS;

  for attempt in 0..MAX_UPLOAD_RETRIES {
    let result = try_upload(creds, app_env_configs, download_path, maybe_prompt_token, maybe_batch_token, media_class, idempotency_token).await;

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
  maybe_prompt_token: Option<&PromptToken>,
  maybe_batch_token: Option<&BatchGenerationToken>,
  media_class: TaskMediaFileClass,
  idempotency_token: &str,
) -> Result<MediaFileToken, StorytellerError> {
  let media_token = match media_class {
    TaskMediaFileClass::Video => {
      let result = upload_video_media_file_from_file_with_idempotency_token(UploadVideoFromFileArgs {
        api_host: &app_env_configs.storyteller_host,
        maybe_creds: Some(creds),
        path: download_path,
        maybe_prompt_token,
        maybe_generation_provider: Some(GenerationProvider::Fal),
      }, idempotency_token).await?;
      result.media_file_token
    }
    TaskMediaFileClass::Dimensional => {
      let result = legacy_upload_media_file_from_file_with_idempotency_token(LegacyUploadMediaFileFromFileArgs {
        api_host: &app_env_configs.storyteller_host,
        maybe_creds: Some(creds),
        path: download_path,
        maybe_generation_provider: Some(GenerationProvider::Fal),
      }, idempotency_token).await?;
      result.media_file_token
    }
    _ => {
      let result = upload_image_media_file_from_file_with_idempotency_token(UploadImageFromFileArgs {
        api_host: &app_env_configs.storyteller_host,
        maybe_creds: Some(creds),
        path: download_path,
        is_intermediate_system_file: false,
        maybe_prompt_token,
        maybe_batch_token,
        maybe_generation_provider: Some(GenerationProvider::Fal),
      }, idempotency_token).await?;
      result.media_file_token
    }
  };

  Ok(media_token)
}

#[cfg(test)]
mod fal_transfer_tests {
  use super::*;
  use artcraft_client::utils::api_host::ApiHost;
  use tokio::io::{AsyncReadExt, AsyncWriteExt};
  use tokio::net::TcpListener;

  #[tokio::test]
  async fn temporary_download_is_removed_after_use_and_http_errors_leave_no_file() {
    let directory = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(directory.path()).unwrap();
    let (url, server) = http_server("200 OK", "synthetic media", 1).await;
    let file = download_file(&url, &root, 0).await.unwrap();
    let path = file.path().to_owned();
    assert_eq!(std::fs::read(&path).unwrap(), b"synthetic media");
    drop(file);
    assert!(!path.exists());
    server.await.unwrap();
    let (url, server) = http_server("503 Service Unavailable", "error", 1).await;
    assert!(download_file(&url, &root, 1).await.is_err());
    server.await.unwrap();
    assert_eq!(std::fs::read_dir(root.temp_dir().path()).unwrap().count(), 0);
  }

  #[tokio::test]
  async fn image_video_and_legacy_retries_send_the_supplied_idempotency_token() {
    const ID: &str = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
    let (url, server) = http_server("200 OK", r#"{"success":true,"media_file_token":"mf_uploaded"}"#, 6).await;
    let port = reqwest::Url::parse(&url).unwrap().port().unwrap();
    let config = AppEnvConfigs { storyteller_host: ApiHost::Localhost { port: u32::from(port) } };
    let file = NamedTempFile::new().unwrap();
    std::fs::write(file.path(), b"synthetic media").unwrap();
    for class in [TaskMediaFileClass::Image, TaskMediaFileClass::Video, TaskMediaFileClass::Dimensional] {
      for _ in 0..2 {
        let token = try_upload(&StorytellerCredentialSet::empty(), &config, &file.path().to_path_buf(), None, None, class, ID).await.unwrap();
        assert_eq!(token.as_str(), "mf_uploaded");
      }
    }
    let requests = server.await.unwrap();
    assert_eq!(requests.len(), 6);
    assert!(requests.iter().all(|request| request.contains("name=\"uuid_idempotency_token\"") && request.contains(ID)));
  }

  async fn http_server(status: &'static str, body: &'static str, count: usize) -> (String, tokio::task::JoinHandle<Vec<String>>) {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("http://{}/media.png", listener.local_addr().unwrap());
    let task = tokio::spawn(async move {
      let mut requests = Vec::new();
      for _ in 0..count {
        let (mut socket, _) = listener.accept().await.unwrap();
        let mut request = Vec::new();
        let mut buffer = [0; 4096];
        loop {
          let n = socket.read(&mut buffer).await.unwrap();
          assert!(n > 0);
          request.extend_from_slice(&buffer[..n]);
          if let Some(start) = request.windows(4).position(|part| part == b"\r\n\r\n") {
            let headers = String::from_utf8_lossy(&request[..start]).to_ascii_lowercase();
            let length = headers.lines().find_map(|line| line.strip_prefix("content-length:")).map(|n| n.trim().parse::<usize>().unwrap()).unwrap_or(0);
            if request.len() >= start + 4 + length { break; }
          }
        }
        requests.push(String::from_utf8_lossy(&request).into_owned());
        socket.write_all(format!("HTTP/1.1 {status}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len()).as_bytes()).await.unwrap();
      }
      requests
    });
    (url, task)
  }
}
