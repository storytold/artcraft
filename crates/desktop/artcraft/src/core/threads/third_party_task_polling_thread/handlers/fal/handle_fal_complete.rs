use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::threads::third_party_task_polling_thread::events::notify_frontend_of_completion::{
  notify_frontend_of_completion, CompletionData,
};
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::events::functional_events::text_to_image_generation_complete_event::GeneratedImage;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::auto_download::{auto_download_task_urls, clear_auto_download_checkpoint};
use crate::core::threads::third_party_task_polling_thread::handlers::fal::handle_fal_failure::handle_fal_failure;
use crate::core::utils::local_generations::{keep_local_generation_as, kept_asset_urls, KeptGeneration};
use local_generations::{image_extension_for, LocalGenerationDetails};
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
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
use tokens::tokens::prompts::PromptToken;
use uuid_utils::uuid::generate_random_uuid;

const SIGNED_OUT_NON_IMAGE_REASON: &str = "Video, audio and 3D results need an ArtCraft account. Sign in, then generate again.";
const UNKEEPABLE_RESULT_REASON: &str = "FAL returned a result that isn't a PNG, JPEG, WebP or GIF image, so it can't be kept on this computer.";
/// Result downloads run on the polling thread, so a stalled CDN mustn't hold it up for long (the
/// same limits as `download_url_with_filename`).
const DOWNLOAD_CONNECT_TIMEOUT: Duration = Duration::from_secs(30);
const DOWNLOAD_TIMEOUT: Duration = Duration::from_secs(600);

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
  let maybe_creds = storyteller_creds_manager.get_signed_in_credentials()?;

  let extracted = job_response.extracted_contents;

  // Determine what kind of media we got and collect download URLs.
  let (urls, media_class) = collect_media_urls(task, &extracted)?;

  if urls.is_empty() {
    warn!("[FalComplete] Task {} completed but no downloadable media found in response", task.id.as_str());
    //warn!("[FalComplete] Raw body: {}", &job_response.raw_body[..job_response.raw_body.len().min(500)]);
    return Ok(());
  }

  let Some(creds) = maybe_creds else {
    return keep_fal_results_locally(app_handle, app_env_configs, app_data_root, task_database, task, &urls, media_class).await;
  };

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

  let maybe_batch_token = if urls.len() > 1 {
    let token = BatchGenerationToken::generate();
    info!("[FalComplete] Using batch token for {} files: {:?}", urls.len(), token);
    Some(token)
  } else {
    None
  };

  let mut maybe_primary_media_file_token: Option<MediaFileToken> = None;
  let client = download_client(DOWNLOAD_TIMEOUT)?;

  for (i, url) in urls.iter().enumerate() {
    info!("[FalComplete] Downloading result {} from: {}", i, url);

    let download_path = download_file(&client, url, app_data_root, i).await?;

    info!("[FalComplete] Uploading result {} to backend...", i);

    let media_token = upload_to_backend(
      &creds,
      app_env_configs,
      &download_path,
      maybe_prompt_token.as_ref(),
      maybe_batch_token.as_ref(),
      media_class,
    ).await?;

    info!("[FalComplete] Uploaded as media file: {:?}", media_token);

    if maybe_primary_media_file_token.is_none() {
      maybe_primary_media_file_token = Some(media_token);
    }
  }

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
    clear_auto_download_checkpoint(app_handle, task);
    if let Some(primary_token) = maybe_primary_media_file_token {
      let completion = CompletionData {
        primary_media_file_token: primary_token,
        maybe_cdn_url,
        maybe_thumbnail_url_template,
        maybe_batch_token,
        media_class,
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
  }

  info!("[FalComplete] Task {} fully handled", task.id.as_str());

  Ok(())
}

/// Signed out: keeps fal's results on this computer and completes the task with their asset URLs.
async fn keep_fal_results_locally(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  task_database: &TaskDatabase,
  task: &Task,
  urls: &[String],
  media_class: TaskMediaFileClass,
) -> Result<(), Box<dyn std::error::Error>> {
  if let Some(reason) = signed_out_refusal(media_class) {
    handle_fal_failure(app_handle, task_database, task, reason).await;
    return Ok(());
  }

  info!("[FalComplete] Signed out: keeping {} result(s) for task {} on this computer", urls.len(), task.id.as_str());

  let maybe_kept = match keep_fal_results(&download_client(DOWNLOAD_TIMEOUT)?, app_data_root, task, urls).await {
    Ok(kept) => Some(kept),
    Err(err) if err.is::<UnkeepableFalResult>() => {
      warn!("[FalComplete] Task {}: {:?}", task.id.as_str(), err);
      None
    },
    Err(err) => return Err(err),
  };
  let Some(kept) = maybe_kept else {
    handle_fal_failure(app_handle, task_database, task, UNKEEPABLE_RESULT_REASON).await;
    return Ok(());
  };
  let primary = kept.first().ok_or("FAL returned no results")?;

  let updated = update_successful_task_status_with_metadata(UpdateSuccessfulTaskArgs {
    db: task_database.get_connection(),
    task_id: &task.id,
    maybe_batch_token: None,
    maybe_primary_media_file_token: Some(&primary.token),
    maybe_primary_media_file_class: Some(media_class),
    maybe_primary_media_file_cdn_url: Some(primary.asset_url.as_str()),
    maybe_primary_media_file_thumbnail_url_template: None,
  }).await?;

  if updated {
    // Only once the task is complete: retrying a failed copy must not keep the results again.
    if let Err(err) = auto_download_task_urls(app_handle, task, &kept_asset_urls(&kept)).await {
      error!("[FalComplete] Couldn't save copies of task {}: {:?}", task.id.as_str(), err);
    }
    clear_auto_download_checkpoint(app_handle, task);
    let completion = CompletionData {
      primary_media_file_token: primary.token.clone(),
      maybe_cdn_url: Some(primary.asset_url.clone()),
      maybe_thumbnail_url_template: None,
      maybe_batch_token: None,
      media_class,
      local_images: kept.iter().map(|k| GeneratedImage { media_token: k.token.clone(), cdn_url: k.asset_url.clone(), maybe_thumbnail_template: None }).collect(),
    };
    notify_frontend_of_completion(app_handle, &app_env_configs.storyteller_host, None, task, &completion).await;
  }

  Ok(())
}

/// Downloads fal's results and keeps them in `local_generations/`. Nothing is kept until every
/// download succeeds, and ids come from the task and result index, so a retry (eg. after a failed
/// status update) overwrites instead of keeping the same image twice.
async fn keep_fal_results(client: &reqwest::Client, app_data_root: &AppDataRoot, task: &Task, urls: &[String]) -> Result<Vec<KeptGeneration>, Box<dyn std::error::Error>> {
  let mut downloads = Vec::with_capacity(urls.len());
  for url in urls {
    downloads.push(client.get(url).send().await?.error_for_status()?.bytes().await?);
  }
  if let Some((url, _)) = urls.iter().zip(&downloads).find(|(url, bytes)| image_extension_for(bytes, url_extension(url)).is_none()) {
    return Err(Box::new(UnkeepableFalResult { url: url.clone() }));
  }
  let mut kept = Vec::with_capacity(urls.len());
  for (i, (url, bytes)) in urls.iter().zip(downloads).enumerate() {
    // fal's task records no prompt text (its prompt record needs an account).
    let details = LocalGenerationDetails { prompt: "", model_id: task.model_type.as_ref().map(|m| m.to_str()).unwrap_or_default(), provider: task.provider.to_str() };
    let seed = format!("{}_{}", task.id.as_str(), i);
    kept.push(keep_local_generation_as(app_data_root, &seed, &bytes, url_extension(url), details)?);
  }
  Ok(kept)
}

/// A result that downloaded but isn't an image that can be kept, so retrying can't help.
#[derive(Debug)]
struct UnkeepableFalResult {
  url: String,
}

impl std::fmt::Display for UnkeepableFalResult {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{:?}", self)
  }
}

impl std::error::Error for UnkeepableFalResult {}

/// Only images can be kept on this computer; anything else fails the task with this reason.
fn signed_out_refusal(media_class: TaskMediaFileClass) -> Option<&'static str> {
  match media_class {
    TaskMediaFileClass::Image => None,
    _ => Some(SIGNED_OUT_NON_IMAGE_REASON),
  }
}

// ── Helpers ──

/// A client for fetching results, giving up after `overall` (`DOWNLOAD_TIMEOUT` outside tests).
fn download_client(overall: Duration) -> reqwest::Result<reqwest::Client> {
  reqwest::Client::builder().connect_timeout(DOWNLOAD_CONNECT_TIMEOUT).timeout(overall).build()
}

/// The file extension in a result URL (`bin` when it has none).
fn url_extension(url: &str) -> &'static str {
  url_utils::download_extension::extract_download_extension_from_url::extract_download_extension_from_url_str(url)
    .map(|ext| ext.as_extension_without_period())
    .unwrap_or("bin")
}

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
  client: &reqwest::Client,
  url: &str,
  app_data_root: &AppDataRoot,
  index: usize,
) -> Result<PathBuf, Box<dyn std::error::Error>> {
  let response = client.get(url).send().await?;
  let bytes = response.bytes().await?;

  let extension = url_extension(url);

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
  maybe_prompt_token: Option<&PromptToken>,
  maybe_batch_token: Option<&BatchGenerationToken>,
  media_class: TaskMediaFileClass,
) -> Result<MediaFileToken, Box<dyn std::error::Error>> {
  let mut retry_delay_secs = INITIAL_RETRY_DELAY_SECS;

  for attempt in 0..MAX_UPLOAD_RETRIES {
    let result = try_upload(creds, app_env_configs, download_path, maybe_prompt_token, maybe_batch_token, media_class).await;

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
) -> Result<MediaFileToken, StorytellerError> {
  let media_token = match media_class {
    TaskMediaFileClass::Video => {
      let result = upload_video_media_file_from_file(UploadVideoFromFileArgs {
        api_host: &app_env_configs.storyteller_host,
        maybe_creds: Some(creds),
        path: download_path,
        maybe_prompt_token,
        maybe_generation_provider: Some(GenerationProvider::Fal),
      }).await?;
      result.media_file_token
    }
    TaskMediaFileClass::Dimensional => {
      let result = legacy_upload_media_file_from_file(LegacyUploadMediaFileFromFileArgs {
        api_host: &app_env_configs.storyteller_host,
        maybe_creds: Some(creds),
        path: download_path,
        maybe_generation_provider: Some(GenerationProvider::Fal),
      }).await?;
      result.media_file_token
    }
    _ => {
      let result = upload_image_media_file_from_file(UploadImageFromFileArgs {
        api_host: &app_env_configs.storyteller_host,
        maybe_creds: Some(creds),
        path: download_path,
        is_intermediate_system_file: false,
        maybe_prompt_token,
        maybe_batch_token,
        maybe_generation_provider: Some(GenerationProvider::Fal),
      }).await?;
      result.media_file_token
    }
  };

  Ok(media_token)
}

#[cfg(test)]
mod tests {
  use super::*;
  use enums::tauri::tasks::task_model_type::TaskModelType;
  use enums::tauri::tasks::task_status::TaskStatus;
  use tokio::io::{AsyncReadExt, AsyncWriteExt};
  use tokio::net::TcpListener;
  use tokens::tokens::sqlite::tasks::TaskId;

  #[test]
  fn signed_out_video_and_3d_results_need_an_account() {
    assert_eq!(signed_out_refusal(TaskMediaFileClass::Image), None);
    for class in [TaskMediaFileClass::Video, TaskMediaFileClass::Dimensional] {
      assert!(signed_out_refusal(class).is_some_and(|reason| reason.contains("ArtCraft account")), "{class:?}");
    }
  }

  #[tokio::test]
  async fn nothing_is_kept_until_every_result_downloads() {
    let dir = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(dir.path()).unwrap();
    let base = server(vec![(200, "first"), (500, "error")]).await;
    let urls = [format!("{base}/first.png"), format!("{base}/second.png")];
    assert!(keep_fal_results(&client(), &root, &task(), &urls).await.is_err());
    assert!(local_generations::list(root.path()).is_empty(), "a retry would keep the first image twice");
  }

  #[tokio::test]
  async fn keeping_the_same_results_again_keeps_nothing_new() {
    let dir = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(dir.path()).unwrap();
    let base = server(vec![(200, "first"), (200, "second"), (200, "first"), (200, "second")]).await;
    let urls = [format!("{base}/first.png"), format!("{base}/second.png")];
    let task = task();
    let kept = keep_fal_results(&client(), &root, &task, &urls).await.unwrap();
    let again = keep_fal_results(&client(), &root, &task, &urls).await.unwrap();
    let tokens = |kept: &[KeptGeneration]| kept.iter().map(|k| k.token.as_str().to_owned()).collect::<Vec<_>>();
    assert_eq!(tokens(&again), tokens(&kept), "a retry after a failed status update reuses the ids");
    assert_eq!(local_generations::list(root.path()).len(), 2);
  }

  #[tokio::test]
  async fn a_stalled_download_gives_up_instead_of_holding_up_polling() {
    let dir = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(dir.path()).unwrap();
    let base = stalled_server().await;
    let short = download_client(Duration::from_millis(200)).unwrap();
    let result = tokio::time::timeout(Duration::from_secs(10), keep_fal_results(&short, &root, &task(), &[format!("{base}/stalled.png")])).await;
    assert!(matches!(result, Ok(Err(_))), "the download must time out on its own");
    assert!(local_generations::list(root.path()).is_empty());
  }

  #[tokio::test]
  async fn results_that_arent_images_are_refused_before_anything_is_kept() {
    let dir = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(dir.path()).unwrap();
    let base = server(vec![(200, "first"), (200, "not an image")]).await;
    let urls = [format!("{base}/first.png"), format!("{base}/result")];
    let Err(err) = keep_fal_results(&client(), &root, &task(), &urls).await else { panic!("expected a refusal") };
    assert!(err.is::<UnkeepableFalResult>(), "retrying can't help, so the task must fail: {err}");
    assert!(local_generations::list(root.path()).is_empty());
  }

  fn client() -> reqwest::Client {
    download_client(DOWNLOAD_TIMEOUT).unwrap()
  }

  /// Accepts connections and never answers.
  async fn stalled_server() -> String {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let base = format!("http://{}", listener.local_addr().unwrap());
    tokio::spawn(async move {
      let mut held = Vec::new();
      while let Ok((socket, _)) = listener.accept().await {
        held.push(socket);
      }
    });
    base
  }

  fn task() -> Task {
    Task {
      id: TaskId::generate(),
      status: TaskStatus::Pending,
      task_type: TaskType::ImageGeneration,
      model_type: Some(TaskModelType::NanoBanana),
      provider: GenerationProvider::Fal,
      provider_job_id: None,
      queue_status_url: None,
      queue_response_url: None,
      prompt_token: None,
      frontend_caller: None,
      frontend_subscriber_id: None,
      frontend_subscriber_payload: None,
    }
  }

  async fn server(responses: Vec<(u16, &'static str)>) -> String {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let base = format!("http://{}", listener.local_addr().unwrap());
    tokio::spawn(async move {
      for (status, body) in responses {
        let (mut socket, _) = listener.accept().await.unwrap();
        let mut request = [0; 4096];
        socket.read(&mut request).await.unwrap();
        let response = format!("HTTP/1.1 {status} Test\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len());
        socket.write_all(response.as_bytes()).await.unwrap();
      }
    });
    base
  }
}
