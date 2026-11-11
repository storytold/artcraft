use std::future::Future;
use std::io::Write;
use std::path::Path;

use serde::{Deserialize, Serialize};
use tempfile::NamedTempFile;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use uuid_utils::uuid::generate_random_uuid;

use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;

type TransferError = Box<dyn std::error::Error>;

#[derive(Clone, Serialize, Deserialize, PartialEq, Eq)]
pub(super) struct CompletionIdentity {
  pub task_id: String,
  pub provider: GenerationProvider,
  pub maybe_provider_job_id: Option<String>,
  pub api_host: String,
  pub media_class: TaskMediaFileClass,
}

#[derive(Serialize, Deserialize)]
pub(super) struct UploadCheckpoint {
  version: u8,
  pub identity: CompletionIdentity,
  maybe_batch_token: Option<BatchGenerationToken>,
  files: Vec<FileProgress>,
  #[serde(default)]
  maybe_upload_account: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct FileProgress {
  url: String,
  idempotency_token: String,
  maybe_media_token: Option<MediaFileToken>,
}

pub(super) struct UploadPlan {
  pub index: usize,
  pub url: String,
  pub idempotency_token: String,
  pub maybe_batch_token: Option<BatchGenerationToken>,
}

impl UploadCheckpoint {
  /// Persist stable upload identities before transfer and reject changed task identities or result URLs.
  pub fn prepare(path: &Path, identity: &CompletionIdentity, urls: &[String]) -> Result<Self, TransferError> {
    if urls.is_empty() {
      return Err("No provider results to upload".into());
    }
    let checkpoint = match Self::load(path)? {
      Some(checkpoint) => checkpoint,
      None => {
        let checkpoint = Self { version: 1, identity: identity.clone(), maybe_batch_token: (urls.len() > 1).then(BatchGenerationToken::generate), files: urls.iter().map(|url| FileProgress { url: url.clone(), idempotency_token: generate_random_uuid(), maybe_media_token: None }).collect(), maybe_upload_account: None };
        save(path, &checkpoint)?;
        checkpoint
      },
    };
    if &checkpoint.identity != identity || !checkpoint.files.iter().map(|file| &file.url).eq(urls.iter()) {
      return Err("Provider results changed; refusing to reuse upload identities".into());
    }
    Ok(checkpoint)
  }

  /// Load bounded versioned upload progress; return none only when no checkpoint exists.
  pub fn load(path: &Path) -> Result<Option<Self>, TransferError> {
    match crate::core::utils::read_bounded_file::read_bounded_file(path, 4 * 1024 * 1024) {
      Ok(bytes) => {
        let checkpoint: Self = serde_json::from_slice(&bytes)?;
        if checkpoint.version != 1 || checkpoint.files.is_empty() {
          return Err(std::io::Error::new(std::io::ErrorKind::InvalidData, "Invalid provider upload checkpoint").into());
        }
        Ok(Some(checkpoint))
      },
      Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
      Err(error) => Err(error.into()),
    }
  }

  /// Return output URLs in checkpoint order so retries retain their original upload identities.
  pub fn urls(&self) -> Vec<String> {
    self.files.iter().map(|file| file.url.clone()).collect()
  }

  /// Persist the verified account before upload and reject cross-account or unsafe legacy reuse.
  pub fn bind_upload_account(&mut self, path: &Path, account: &str) -> Result<(), TransferError> {
    match self.maybe_upload_account.as_deref() {
      Some(original) if original != account => return Err("Sign in to the original ArtCraft account to resume this upload".into()),
      Some(_) => return Ok(()),
      None if self.files.iter().any(|file| file.maybe_media_token.is_some()) => return Err("This older upload has no recorded account; refusing to reuse its cloud media".into()),
      None => {},
    }
    self.maybe_upload_account = Some(account.into());
    save(path, self)?;
    Ok(())
  }
}

/// Skip confirmed uploads and persist each returned token, reusing keys after uncertain responses.
pub(super) async fn resume_uploads<F, Fut>(path: &Path, identity: &CompletionIdentity, urls: &[String], mut upload: F) -> Result<(MediaFileToken, Option<BatchGenerationToken>), TransferError>
where
  F: FnMut(UploadPlan) -> Fut,
  Fut: Future<Output = Result<MediaFileToken, TransferError>>,
{
  let mut checkpoint = UploadCheckpoint::prepare(path, identity, urls)?;
  for index in 0..checkpoint.files.len() {
    let file = &checkpoint.files[index];
    if file.maybe_media_token.is_some() {
      continue;
    }
    let plan = UploadPlan { index, url: file.url.clone(), idempotency_token: file.idempotency_token.clone(), maybe_batch_token: checkpoint.maybe_batch_token.clone() };
    let token = upload(plan).await?;
    checkpoint.files[index].maybe_media_token = Some(token);
    save(path, &checkpoint)?;
  }
  let primary = checkpoint.files[0].maybe_media_token.clone().ok_or("Missing primary upload")?;
  Ok((primary, checkpoint.maybe_batch_token))
}

/// Flush upload progress to a temporary file and atomically replace its checkpoint.
fn save(path: &Path, checkpoint: &UploadCheckpoint) -> Result<(), TransferError> {
  let parent = path.parent().ok_or("Checkpoint has no parent directory")?;
  let mut file = NamedTempFile::new_in(parent)?;
  file.write_all(&serde_json::to_vec(checkpoint)?)?;
  file.as_file().sync_all()?;
  file.persist(path)?;
  Ok(())
}

#[cfg(test)]
mod provider_upload_recovery_tests {
  use super::*;
  use std::sync::{Arc, Mutex};

  #[tokio::test]
  async fn upload_progress_cannot_be_reused_by_another_account() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("checkpoint.json");
    let identity = identity(GenerationProvider::WaveSpeed);
    let urls = vec!["first".into(), "second".into()];
    let mut checkpoint = UploadCheckpoint::prepare(&path, &identity, &urls).unwrap();
    checkpoint.bind_upload_account(&path, "user_a").unwrap();
    assert!(resume_uploads(&path, &identity, &urls, |plan| async move {
      if plan.index == 0 { Ok(MediaFileToken::new_from_str("mf_a")) } else { Err("interrupted".into()) }
    }).await.is_err());
    let mut saved = UploadCheckpoint::load(&path).unwrap().unwrap();
    assert!(saved.bind_upload_account(&path, "user_b").is_err());
    saved.bind_upload_account(&path, "user_a").unwrap();
    let result = resume_uploads(&path, &identity, &urls, |plan| async move {
      assert_eq!(plan.index, 1);
      Ok(MediaFileToken::new_from_str("mf_a_second"))
    }).await.unwrap();
    assert_eq!(result.0.as_str(), "mf_a");
  }

  #[tokio::test]
  async fn restart_skips_confirmed_results_and_reuses_lost_response_identity() {
    for provider in [GenerationProvider::Fal, GenerationProvider::WaveSpeed] {
      let directory = tempfile::tempdir().unwrap();
      let path = directory.path().join("checkpoint.json");
      let identity = identity(provider);
      let urls = vec!["first".into(), "second".into()];
      let attempts = Arc::new(Mutex::new(Vec::new()));
      let captured = attempts.clone();
      assert!(resume_uploads(&path, &identity, &urls, move |plan| {
        captured.lock().unwrap().push((plan.url.clone(), plan.idempotency_token.clone(), plan.maybe_batch_token.clone()));
        async move {
          if plan.url == "second" {
            Err("response lost".into())
          } else {
            Ok(MediaFileToken::new_from_str("mf_first"))
          }
        }
      })
      .await
      .is_err());
      let captured = attempts.clone();
      let (primary, batch) = resume_uploads(&path, &identity, &urls, move |plan| {
        captured.lock().unwrap().push((plan.url.clone(), plan.idempotency_token.clone(), plan.maybe_batch_token.clone()));
        async { Ok(MediaFileToken::new_from_str("mf_second")) }
      })
      .await
      .unwrap();
      assert_eq!(primary.as_str(), "mf_first");
      let log = attempts.lock().unwrap();
      assert_eq!(log.iter().map(|entry| entry.0.as_str()).collect::<Vec<_>>(), ["first", "second", "second"]);
      assert_ne!(log[0].1, log[1].1);
      assert_eq!(log[1], log[2]);
      assert!(batch.is_some());
      assert!(log.iter().all(|entry| entry.2 == batch));
      drop(log);
      let saved = UploadCheckpoint::load(&path).unwrap().unwrap();
      assert_eq!(saved.urls(), urls);
      resume_uploads(&path, &identity, &saved.urls(), |_| async { panic!("database failure must not cause confirmed uploads to repeat") }).await.unwrap();
    }
  }

  #[tokio::test]
  async fn fails_closed_before_upload_on_missing_storage_corruption_or_changed_results() {
    let directory = tempfile::tempdir().unwrap();
    let identity = identity(GenerationProvider::WaveSpeed);
    let path = directory.path().join("missing/checkpoint.json");
    assert!(resume_uploads(&path, &identity, &["url".into()], |_| async { panic!("must save first") }).await.is_err());
    let path = directory.path().join("checkpoint.json");
    resume_uploads(&path, &identity, &["url".into()], |_| async { Ok(MediaFileToken::new_from_str("mf_one")) }).await.unwrap();
    assert!(resume_uploads(&path, &identity, &["changed".into()], |_| async { panic!("changed URL") }).await.is_err());
    let other = CompletionIdentity { provider: GenerationProvider::Fal, ..identity.clone() };
    assert!(resume_uploads(&path, &other, &["url".into()], |_| async { panic!("changed provider") }).await.is_err());
    std::fs::write(&path, b"broken").unwrap();
    assert!(resume_uploads(&path, &identity, &["url".into()], |_| async { panic!("corrupt checkpoint") }).await.is_err());
  }

  fn identity(provider: GenerationProvider) -> CompletionIdentity {
    CompletionIdentity { task_id: "task_test".into(), provider, maybe_provider_job_id: Some("job".into()), api_host: "https://example.com".into(), media_class: TaskMediaFileClass::Image }
  }
}
