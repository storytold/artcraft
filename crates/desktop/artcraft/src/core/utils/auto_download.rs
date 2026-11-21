use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::app_preferences::app_preferences::AppPreferences;
use crate::core::state::app_preferences::app_preferences_manager::AppPreferencesManager;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::utils::download_url_to_user_download_dir::{download_url_with_filename, suggested_download_filename};
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::{anyhow, ensure};
use artcraft_client::endpoints::media_files::list_batch_generated_redux_media_files::list_batch_generated_redux_media_files;
use chrono::{DateTime, Local};
use errors::AnyhowResult;
use serde::{Deserialize, Serialize};
use sqlite_tasks::queries::task::Task;
use std::collections::BTreeMap;
use std::io::Write;
use std::path::PathBuf;
use std::time::Duration;
use tauri::{AppHandle, Manager};
use tempfile::NamedTempFile;
use tokens::tokens::batch_generations::BatchGenerationToken;
use url::Url;

#[derive(Serialize, Deserialize)]
struct AutoDownloadCheckpoint {
  download_time: DateTime<Local>,
  saved: BTreeMap<String, PathBuf>,
}

/// Await this before updating task status or emitting ANY completion events.
/// A failed download leaves the task pending for the next polling pass.
pub async fn auto_download_task(
  app: &AppHandle,
  task: &Task,
  maybe_batch_token: Option<&BatchGenerationToken>,
  maybe_primary_url: Option<&str>,
  maybe_expected_count: Option<usize>,
) -> AnyhowResult<()> {
  let prefs = app.state::<AppPreferencesManager>().get_clone()?;
  if !prefs.auto_download {
    return Ok(());
  }
  let urls = if let Some(batch) = maybe_batch_token {
    let config = app.state::<AppEnvConfigs>();
    let credentials = app.state::<StorytellerCredentialManager>().get_credentials()?;
    let result = tokio::time::timeout(
      Duration::from_secs(60),
      list_batch_generated_redux_media_files(&config.storyteller_host, credentials.as_ref(), batch),
    )
    .await??;
    ensure!(!result.media_files.is_empty(), "No downloadable results for batch {}", batch);
    // Stable order across retries, even if the backend reorders the response.
    let mut files = result.media_files;
    files.sort_by(|a, b| a.token.as_str().cmp(b.token.as_str()));
    files.into_iter().map(|file| file.media_links.cdn_url).collect::<Vec<_>>()
  } else {
    vec![Url::parse(
      maybe_primary_url.ok_or_else(|| anyhow!("Completed task has no download URL"))?,
    )?]
  };
  if let Some(expected) = maybe_expected_count {
    ensure!(
      urls.len() == expected,
      "Waiting for all {} download results (currently {})",
      expected,
      urls.len()
    );
  }
  download_generated_results(&app.state::<AppDataRoot>(), &prefs, task, &urls).await
}

/// For providers that already expose all result URLs before upload.
pub async fn auto_download_task_urls(app: &AppHandle, task: &Task, urls: &[Url]) -> AnyhowResult<()> {
  let prefs = app.state::<AppPreferencesManager>().get_clone()?;
  download_generated_results(&app.state::<AppDataRoot>(), &prefs, task, urls).await
}

pub fn clear_auto_download_checkpoint(app: &AppHandle, task: &Task) {
  let path = checkpoint_path(&app.state::<AppDataRoot>(), task);
  if let Err(err) = std::fs::remove_file(path) {
    if err.kind() != std::io::ErrorKind::NotFound {
      log::warn!("Could not remove automatic download checkpoint: {}", err);
    }
  }
}

async fn download_generated_results(
  root: &AppDataRoot,
  prefs: &AppPreferences,
  task: &Task,
  urls: &[Url],
) -> AnyhowResult<()> {
  if !prefs.auto_download {
    return Ok(());
  }
  ensure!(!urls.is_empty(), "Completed task has no downloadable results");
  let path = checkpoint_path(root, task);
  let mut checkpoint: AutoDownloadCheckpoint = match std::fs::read(&path) {
    Ok(bytes) => serde_json::from_slice(&bytes)?,
    Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
      AutoDownloadCheckpoint { download_time: Local::now(), saved: BTreeMap::new() }
    },
    Err(err) => return Err(err.into()),
  };
  let directory = prefs.preferred_download_directory.download_directory(root);
  for (index, url) in urls.iter().enumerate() {
    if checkpoint.saved.get(url.as_str()).is_some_and(|path| path.is_file()) {
      continue;
    }
    let filename = suggested_download_filename(
      url,
      prefs,
      task.model_type.as_ref().map(|model| model.to_str()),
      (urls.len() > 1).then_some(index + 1),
      checkpoint.download_time,
    );
    let saved = download_url_with_filename(url, &directory, &filename).await?;
    checkpoint.saved.insert(url.to_string(), saved);
    let mut file = NamedTempFile::new_in(root.state_dir().path())?;
    file.write_all(&serde_json::to_vec(&checkpoint)?)?;
    file.as_file().sync_all()?;
    file.persist(&path)?;
  }
  Ok(())
}

fn checkpoint_path(root: &AppDataRoot, task: &Task) -> PathBuf {
  root.state_dir().path().join(format!("auto_download_{}.json", task.id.as_str()))
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::state::app_preferences::preferred_download_directory::PreferredDownloadDirectory;
  use crate::core::state::app_preferences::preferred_download_filename::PreferredDownloadFilename;
  use enums::common::generation_provider::GenerationProvider;
  use enums::tauri::tasks::{task_model_type::TaskModelType, task_status::TaskStatus, task_type::TaskType};
  use tokio::io::{AsyncReadExt, AsyncWriteExt};
  use tokio::net::TcpListener;
  use tokio::sync::oneshot;
  use tokens::tokens::sqlite::tasks::TaskId;

  #[tokio::test]
  async fn disabled_auto_download_does_not_access_network_or_create_files() {
    let dir = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(dir.path()).unwrap();
    let mut prefs = preferences(&root);
    prefs.auto_download = false;
    download_generated_results(
      &root,
      &prefs,
      &task(GenerationProvider::Artcraft),
      &[Url::parse("http://127.0.0.1:1/never.png").unwrap()],
    )
    .await
    .unwrap();
    assert!(!dir.path().join("chosen").exists());
  }

  #[tokio::test]
  async fn all_results_are_saved_for_artcraft_and_midjourney_and_retries_skip_saved_files() {
    for provider in [GenerationProvider::Artcraft, GenerationProvider::Midjourney] {
      let dir = tempfile::tempdir().unwrap();
      let root = AppDataRoot::create_existing(dir.path()).unwrap();
      let prefs = preferences(&root);
      let task = task(provider);
      let (base, server) = server(vec![(200, "image"), (200, "video"), (200, "audio"), (200, "splat")]).await;
      let urls = ["png", "mp4", "mp3", "spz"].map(|ext| Url::parse(&format!("{base}/result.{ext}")).unwrap());
      download_generated_results(&root, &prefs, &task, &urls).await.unwrap();
      server.await.unwrap();
      for (index, (ext, bytes)) in [("png", "image"), ("mp4", "video"), ("mp3", "audio"), ("spz", "splat")]
        .iter()
        .enumerate()
      {
        assert_eq!(
          std::fs::read_to_string(dir.path().join(format!("chosen/midjourney_8_result_{}.{ext}", index + 1))).unwrap(),
          *bytes
        );
      }
      // The server is gone; resuming from disk must not redownload anything.
      download_generated_results(&root, &prefs, &task, &urls).await.unwrap();
      assert_eq!(std::fs::read_dir(dir.path().join("chosen")).unwrap().count(), 4);
    }
  }

  #[tokio::test]
  async fn partial_failure_keeps_finished_files_and_retries_only_the_failed_result() {
    let dir = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(dir.path()).unwrap();
    let prefs = preferences(&root);
    let task = task(GenerationProvider::Midjourney);
    let (base, server) = server(vec![(200, "first"), (500, "error"), (200, "second")]).await;
    let urls = ["first", "second"].map(|name| Url::parse(&format!("{base}/{name}.png")).unwrap());
    assert!(download_generated_results(&root, &prefs, &task, &urls).await.is_err());
    assert_eq!(std::fs::read_dir(dir.path().join("chosen")).unwrap().count(), 1);
    download_generated_results(&root, &prefs, &task, &urls).await.unwrap();
    server.await.unwrap();
    assert_eq!(
      std::fs::read_to_string(dir.path().join("chosen/midjourney_8_result_1.png")).unwrap(),
      "first"
    );
    assert_eq!(
      std::fs::read_to_string(dir.path().join("chosen/midjourney_8_result_2.png")).unwrap(),
      "second"
    );
  }

  #[tokio::test]
  async fn matching_custom_filenames_never_overwrite_previous_generations() {
    let dir = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(dir.path()).unwrap();
    let prefs = preferences(&root);
    let (base, server) = server(vec![(200, "first"), (200, "second")]).await;
    let url = Url::parse(&format!("{base}/file.png")).unwrap();
    for _ in 0..2 {
      download_generated_results(&root, &prefs, &task(GenerationProvider::Artcraft), &[url.clone()])
        .await
        .unwrap();
    }
    server.await.unwrap();
    assert_eq!(
      std::fs::read_to_string(dir.path().join("chosen/midjourney_8_result.png")).unwrap(),
      "first"
    );
    assert_eq!(
      std::fs::read_to_string(dir.path().join("chosen/midjourney_8_result_1.png")).unwrap(),
      "second"
    );
  }

  #[tokio::test]
  async fn completion_waits_until_the_entire_file_is_on_disk() {
    let dir = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(dir.path()).unwrap();
    let prefs = preferences(&root);
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = Url::parse(&format!("http://{}/file.png", listener.local_addr().unwrap())).unwrap();
    let (started_tx, started_rx) = oneshot::channel();
    let (finish_tx, finish_rx) = oneshot::channel();
    let server = tokio::spawn(async move {
      let (mut socket, _) = listener.accept().await.unwrap();
      let mut request = [0; 4096];
      socket.read(&mut request).await.unwrap();
      socket
        .write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 6\r\nConnection: close\r\n\r\nabc")
        .await
        .unwrap();
      started_tx.send(()).unwrap();
      finish_rx.await.unwrap();
      socket.write_all(b"def").await.unwrap();
    });
    let completion = tokio::spawn(async move {
      download_generated_results(&root, &prefs, &task(GenerationProvider::Artcraft), &[url])
        .await
        .unwrap();
      // Callers may mark success and emit notifications only after this await.
      std::fs::read_to_string(root.path().join("chosen/midjourney_8_result.png")).unwrap()
    });
    started_rx.await.unwrap();
    assert!(!completion.is_finished());
    assert!(!dir.path().join("chosen/midjourney_8_result.png").exists());
    finish_tx.send(()).unwrap();
    assert_eq!(completion.await.unwrap(), "abcdef");
    server.await.unwrap();
  }

  fn preferences(root: &AppDataRoot) -> AppPreferences {
    AppPreferences {
      auto_download: true,
      preferred_download_directory: PreferredDownloadDirectory::Custom(root.path().join("chosen")),
      preferred_download_filename: PreferredDownloadFilename::Custom("{model}_result".into()),
      ..AppPreferences::default()
    }
  }

  fn task(provider: GenerationProvider) -> Task {
    Task {
      id: TaskId::generate(),
      status: TaskStatus::Pending,
      task_type: TaskType::ImageGeneration,
      model_type: Some(TaskModelType::Midjourney8),
      provider,
      provider_job_id: None,
      queue_status_url: None,
      queue_response_url: None,
      prompt_token: None,
      frontend_caller: None,
      frontend_subscriber_id: None,
      frontend_subscriber_payload: None,
    }
  }

  async fn server(responses: Vec<(u16, &'static str)>) -> (String, tokio::task::JoinHandle<()>) {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let base = format!("http://{}", listener.local_addr().unwrap());
    let server = tokio::spawn(async move {
      for (status, body) in responses {
        let (mut socket, _) = listener.accept().await.unwrap();
        let mut request = [0; 4096];
        socket.read(&mut request).await.unwrap();
        let response = format!(
          "HTTP/1.1 {status} Test\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",
          body.len()
        );
        socket.write_all(response.as_bytes()).await.unwrap();
      }
    });
    (base, server)
  }
}
