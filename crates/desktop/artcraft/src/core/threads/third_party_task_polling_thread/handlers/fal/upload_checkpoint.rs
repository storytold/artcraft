use std::future::Future;
use std::io::Write;
use std::path::Path;

use serde::{Deserialize, Serialize};
use tempfile::NamedTempFile;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::media_files::MediaFileToken;
use uuid_utils::uuid::generate_random_uuid;

type TransferError = Box<dyn std::error::Error>;

#[derive(Serialize, Deserialize)]
struct Checkpoint {
  maybe_batch_token: Option<BatchGenerationToken>,
  files: Vec<FileProgress>,
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

/// Save identities before the first request and successes before the next one.
/// A lost response retries with the same token; a confirmed success is skipped.
pub(super) async fn resume_uploads<F, Fut>(path: &Path, urls: &[String], mut upload: F) -> Result<(MediaFileToken, Option<BatchGenerationToken>), TransferError>
where
  F: FnMut(UploadPlan) -> Fut,
  Fut: Future<Output = Result<MediaFileToken, TransferError>>,
{
  if urls.is_empty() { return Err("No FAL results to upload".into()); }
  let mut checkpoint: Checkpoint = match std::fs::read(path) {
    Ok(bytes) => serde_json::from_slice(&bytes)?,
    Err(err) if err.kind() == std::io::ErrorKind::NotFound => {
      let checkpoint = Checkpoint {
        maybe_batch_token: (urls.len() > 1).then(BatchGenerationToken::generate),
        files: urls.iter().map(|url| FileProgress { url: url.clone(), idempotency_token: generate_random_uuid(), maybe_media_token: None }).collect(),
      };
      save(path, &checkpoint)?;
      checkpoint
    },
    Err(err) => return Err(err.into()),
  };
  if !checkpoint.files.iter().map(|file| &file.url).eq(urls.iter()) {
    return Err("FAL result URLs changed; refusing to reuse upload identities for different results".into());
  }
  for index in 0..checkpoint.files.len() {
    let file = &checkpoint.files[index];
    if file.maybe_media_token.is_some() { continue; }
    let plan = UploadPlan { index, url: file.url.clone(), idempotency_token: file.idempotency_token.clone(), maybe_batch_token: checkpoint.maybe_batch_token.clone() };
    let token = upload(plan).await?;
    checkpoint.files[index].maybe_media_token = Some(token);
    save(path, &checkpoint)?;
  }
  let primary = checkpoint.files[0].maybe_media_token.clone().ok_or("Missing primary FAL upload")?;
  Ok((primary, checkpoint.maybe_batch_token))
}

fn save(path: &Path, checkpoint: &Checkpoint) -> Result<(), TransferError> {
  let parent = path.parent().ok_or("Checkpoint has no parent directory")?;
  let mut file = NamedTempFile::new_in(parent)?;
  file.write_all(&serde_json::to_vec(checkpoint)?)?;
  file.as_file().sync_all()?;
  file.persist(path)?;
  Ok(())
}

#[cfg(test)]
mod fal_upload_recovery_tests {
  use super::*;
  use std::sync::{Arc, Mutex};

  #[tokio::test]
  async fn restart_skips_confirmed_uploads_and_reuses_batch_and_request_identity() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("checkpoint.json");
    let urls = vec!["first".into(), "second".into()];
    let attempts = Arc::new(Mutex::new(Vec::new()));
    let captured = attempts.clone();
    assert!(resume_uploads(&path, &urls, move |plan| {
      captured.lock().unwrap().push((plan.index, plan.idempotency_token.clone(), plan.maybe_batch_token.clone()));
      async move { if plan.index == 1 { Err("response lost".into()) } else { Ok(MediaFileToken::new_from_str("mf_first")) } }
    }).await.is_err());
    let captured = attempts.clone();
    let (primary, batch) = resume_uploads(&path, &urls, move |plan| {
      captured.lock().unwrap().push((plan.index, plan.idempotency_token.clone(), plan.maybe_batch_token.clone()));
      async move { Ok(MediaFileToken::new_from_str("mf_second")) }
    }).await.unwrap();
    assert_eq!(primary.as_str(), "mf_first");
    let log = attempts.lock().unwrap();
    assert_eq!(log.iter().map(|entry| entry.0).collect::<Vec<_>>(), [0, 1, 1]);
    assert_ne!(log[0].1, log[1].1);
    assert_eq!(log[1], log[2]);
    assert!(batch.is_some());
    assert!(log.iter().all(|entry| entry.2 == batch));
    drop(log);
    resume_uploads(&path, &urls, |_| async { panic!("completed upload must not run again after a database failure") }).await.unwrap();
  }

  #[tokio::test]
  async fn cannot_upload_before_checkpoint_is_saved_or_reuse_it_for_changed_results() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("missing").join("checkpoint.json");
    assert!(resume_uploads(&path, &["url".into()], |_| async { panic!("must persist before uploading") }).await.is_err());
    let path = directory.path().join("checkpoint.json");
    resume_uploads(&path, &["url".into()], |_| async { Ok(MediaFileToken::new_from_str("mf_one")) }).await.unwrap();
    assert!(resume_uploads(&path, &["changed".into()], |_| async { panic!("different result must not reuse identity") }).await.is_err());
  }
}
