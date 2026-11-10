//! Generations running at Midjourney, fal or OpenRouter, saved (`state/native_provider_jobs.json`)
//! so they finish even after a restart. Each also checkpoints its upload into the user's library: the
//! batch it goes into, one idempotency token per result, and what's uploaded so far.

use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use anyhow::{anyhow, bail};
use base64::Engine;
use base64::engine::general_purpose::STANDARD;
use log::warn;
use openrouter_client::api::generate_image::OpenRouterImageRequest;
use serde::{Deserialize, Serialize};

use super::Provider;

const FILENAME: &str = "native_provider_jobs.json";
/// Where OpenRouter's images wait for their upload, one folder per job.
const RESULTS_DIRNAME: &str = "native_provider_results";
/// Inline (`data:`) references are kept here, inside the job's results folder.
const REFERENCES_DIRNAME: &str = "references";
/// What a saved reference's URL becomes in a job's requests: this, then the file's path.
const REFERENCE_FILE_PREFIX: &str = "artcraft-reference-file:";
/// The image types a reference is saved as, by file extension.
const REFERENCE_TYPES: [(&str, &str); 4] = [("image/png", "png"), ("image/jpeg", "jpg"), ("image/webp", "webp"), ("image/gif", "gif")];

/// One generation at another provider.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ProviderJob {
  /// Ours (`local_<uuid>`): the feed's pending card is keyed by it.
  pub id: String,
  pub provider: Provider,
  pub model_id: String,
  pub prompt: String,
  /// Unix seconds.
  pub created_at: i64,
  pub batch_count: u32,
  /// The provider's job: Midjourney's job id, fal's request id, or ours for OpenRouter.
  pub provider_job_id: String,
  /// fal's queue URLs.
  pub maybe_status_url: Option<String>,
  pub maybe_response_url: Option<String>,
  /// The ArtCraft prompt the results are attributed to.
  pub maybe_prompt_token: Option<String>,
  /// The library batch the results go into.
  pub batch_token: String,
  /// Upload idempotency tokens, one per result (made as needed).
  pub upload_tokens: Vec<String>,
  /// Media tokens uploaded so far, in result order.
  pub uploaded: Vec<String>,
  /// OpenRouter's requests (one per image for single-image models), sent by the worker.
  #[serde(default, skip_serializing_if = "Vec::is_empty")]
  pub openrouter_requests: Vec<OpenRouterImageRequest>,
  /// OpenRouter's images, saved to disk until they're uploaded.
  #[serde(default, skip_serializing_if = "Vec::is_empty")]
  pub result_files: Vec<PathBuf>,
}

impl ProviderJob {
  /// The idempotency token for result `index`, making (and keeping) new ones as needed.
  pub fn upload_token(&mut self, index: usize) -> String {
    while self.upload_tokens.len() <= index {
      self.upload_tokens.push(uuid::Uuid::new_v4().to_string());
    }
    self.upload_tokens[index].clone()
  }

  /// The OpenRouter requests as sent: saved references go back to the data URLs they came as
  /// (each file read once). Jobs saved with inline data URLs send them unchanged.
  pub fn openrouter_requests_to_send(&self) -> anyhow::Result<Vec<OpenRouterImageRequest>> {
    let mut read: Vec<(String, String)> = Vec::new();
    let mut requests = self.openrouter_requests.clone();
    for reference in requests.iter_mut().flat_map(|r| r.input_references.iter_mut()) {
      let url = &mut reference.image_url.url;
      let Some(path) = url.strip_prefix(REFERENCE_FILE_PREFIX) else {
        continue;
      };
      let data_url = match read.iter().find(|(saved, _)| saved == path) {
        Some((_, data_url)) => data_url.clone(),
        None => {
          let data_url = read_reference(Path::new(path))?;
          read.push((path.to_owned(), data_url.clone()));
          data_url
        },
      };
      *url = data_url;
    }
    Ok(requests)
  }
}

/// The saved jobs, shared by the submitter, the worker and the UI.
#[derive(Clone)]
pub struct JobStore {
  path: Arc<PathBuf>,
  jobs: Arc<Mutex<Vec<ProviderJob>>>,
}

impl JobStore {
  pub fn load(data_root: &Path) -> Self {
    let path = data_root.join("state").join(FILENAME);
    let jobs = std::fs::read_to_string(&path).ok().and_then(|text| serde_json::from_str(&text).map_err(|err| warn!("Ignoring unreadable {}: {err}", path.display())).ok()).unwrap_or_default();
    Self { path: Arc::new(path), jobs: Arc::new(Mutex::new(jobs)) }
  }

  /// The folder a job's downloaded results wait in.
  pub fn results_dir(&self, job_id: &str) -> PathBuf {
    self.path.parent().unwrap_or(Path::new(".")).join(RESULTS_DIRNAME).join(job_id)
  }

  pub fn all(&self) -> Vec<ProviderJob> {
    self.jobs.lock().map(|j| j.clone()).unwrap_or_default()
  }

  /// Adds or replaces (by id) a job, then saves. Inline references are moved into files first, so
  /// the list (saved on every change, copied on every worker tick) stays small.
  pub fn put(&self, mut job: ProviderJob) {
    self.save_references(&mut job);
    self.mutate(|jobs| match jobs.iter_mut().find(|j| j.id == job.id) {
      Some(existing) => *existing = job,
      None => jobs.push(job),
    });
  }

  pub fn remove(&self, id: &str) {
    self.mutate(|jobs| jobs.retain(|j| j.id != id));
  }

  /// Writes each distinct inline reference once (in the job's results folder, removed with it)
  /// and points the requests at it. One that can't be written stays inline.
  fn save_references(&self, job: &mut ProviderJob) {
    let dir = self.results_dir(&job.id).join(REFERENCES_DIRNAME);
    let mut written: Vec<(String, String)> = Vec::new();
    for reference in job.openrouter_requests.iter_mut().flat_map(|r| r.input_references.iter_mut()) {
      let url = &mut reference.image_url.url;
      if !url.starts_with("data:") {
        continue;
      }
      if let Some((_, saved)) = written.iter().find(|(data_url, _)| data_url == url) {
        *url = saved.clone();
        continue;
      }
      match write_reference(&dir, url) {
        Ok(saved) => written.push((std::mem::replace(url, saved.clone()), saved)),
        Err(err) => warn!("Keeping a reference inline in job {}: {err}", job.id),
      }
    }
  }

  fn mutate(&self, change: impl FnOnce(&mut Vec<ProviderJob>)) {
    let Ok(mut jobs) = self.jobs.lock() else {
      return;
    };
    change(&mut jobs);
    if let Err(err) = save(&self.path, &jobs) {
      warn!("Couldn't save {}: {err}", self.path.display());
    }
  }
}

/// Writes atomically, so a crash can't truncate the list.
fn save(path: &Path, jobs: &[ProviderJob]) -> anyhow::Result<()> {
  let dir = path.parent().ok_or_else(|| anyhow::anyhow!("no state directory"))?;
  std::fs::create_dir_all(dir)?;
  let mut file = tempfile::NamedTempFile::new_in(dir)?;
  file.write_all(serde_json::to_string_pretty(jobs)?.as_bytes())?;
  file.persist(path)?;
  Ok(())
}

/// Saves a base64 `data:` URL's image in `dir`; returns the URL that stands for it. Only data URLs
/// that come back byte for byte are saved.
fn write_reference(dir: &Path, data_url: &str) -> anyhow::Result<String> {
  let (mime, data) = data_url.strip_prefix("data:").and_then(|rest| rest.split_once(";base64,")).ok_or_else(|| anyhow!("not a base64 data URL"))?;
  let (_, extension) = REFERENCE_TYPES.iter().find(|(m, _)| *m == mime).ok_or_else(|| anyhow!("unknown image type {mime}"))?;
  let bytes = STANDARD.decode(data)?;
  if STANDARD.encode(&bytes) != data {
    bail!("non-standard base64");
  }
  std::fs::create_dir_all(dir)?;
  let path = dir.join(format!("{}.{extension}", uuid::Uuid::new_v4()));
  let saved = format!("{REFERENCE_FILE_PREFIX}{}", path.to_str().ok_or_else(|| anyhow!("non-UTF-8 path"))?);
  std::fs::write(&path, bytes)?;
  Ok(saved)
}

/// A saved reference as the data URL it was.
fn read_reference(path: &Path) -> anyhow::Result<String> {
  let extension = path.extension().and_then(|e| e.to_str()).unwrap_or_default();
  let (mime, _) = REFERENCE_TYPES.iter().find(|(_, e)| *e == extension).ok_or_else(|| anyhow!("unknown reference file {}", path.display()))?;
  let bytes = std::fs::read(path).map_err(|err| anyhow!("couldn't read {}: {err}", path.display()))?;
  Ok(format!("data:{mime};base64,{}", STANDARD.encode(bytes)))
}

#[cfg(test)]
mod tests {
  use base64::Engine;
  use base64::engine::general_purpose::STANDARD;
  use openrouter_client::api::generate_image::OpenRouterInputReference;

  use super::*;

  #[test]
  fn jobs_survive_a_restart_and_keep_their_upload_tokens() {
    let dir = std::env::temp_dir().join(format!("artcraft-native-jobs-{}", uuid::Uuid::new_v4()));
    let store = JobStore::load(&dir);
    let mut job = ProviderJob { id: "local_1".into(), provider: Provider::Midjourney, model_id: "midjourney_7".into(), prompt: "a fox".into(), created_at: 1, batch_count: 4, provider_job_id: "mj".into(), maybe_status_url: None, maybe_response_url: None, maybe_prompt_token: None, batch_token: "batch_1".into(), upload_tokens: Vec::new(), uploaded: Vec::new(), openrouter_requests: Vec::new(), result_files: Vec::new() };
    let first = job.upload_token(2);
    assert_eq!(job.upload_tokens.len(), 3);
    assert_eq!(job.upload_token(2), first, "a retried upload reuses its token");
    store.put(job.clone());
    let reloaded = JobStore::load(&dir);
    assert_eq!(reloaded.all(), vec![job]);
    reloaded.remove("local_1");
    assert!(JobStore::load(&dir).all().is_empty());
    assert_eq!(reloaded.results_dir("local_1"), dir.join("state").join("native_provider_results").join("local_1"));
    let _ = std::fs::remove_dir_all(dir);
  }

  #[test]
  fn jobs_saved_before_openrouter_still_load() {
    let old = r#"[{"id":"local_1","provider":"fal","model_id":"flux_1_dev","prompt":"a fox","created_at":1,"batch_count":1,"provider_job_id":"r","maybe_status_url":null,"maybe_response_url":null,"maybe_prompt_token":null,"batch_token":"b","upload_tokens":[],"uploaded":[]}]"#;
    let jobs: Vec<ProviderJob> = serde_json::from_str(old).unwrap();
    assert!(jobs[0].openrouter_requests.is_empty() && jobs[0].result_files.is_empty());
  }

  #[test]
  fn references_are_saved_once_as_files_not_in_the_job_list() {
    let dir = temp_dir();
    let store = JobStore::load(&dir);
    let data_url = format!("data:image/png;base64,{}", STANDARD.encode(vec![7u8; 64 * 1024]));
    let job = openrouter_job(vec![request(&data_url), request(&data_url), request("https://cdn/x.png")]);
    store.put(job.clone());
    let saved = std::fs::read_to_string(dir.join("state").join(FILENAME)).unwrap();
    assert!(!saved.contains("data:") && saved.len() < 8 * 1024, "the saved list holds no reference bytes ({} bytes)", saved.len());
    let files: Vec<PathBuf> = std::fs::read_dir(store.results_dir(&job.id).join(REFERENCES_DIRNAME)).unwrap().map(|e| e.unwrap().path()).collect();
    assert_eq!(files.len(), 1, "a reference shared by the job's requests is written once");
    assert!(JobStore::load(&dir).all()[0].openrouter_requests[2].input_references[0].image_url.url == "https://cdn/x.png", "links are left alone");
    let _ = std::fs::remove_dir_all(dir);
  }

  #[test]
  fn jobs_saved_with_inline_references_still_load_and_send_them() {
    let dir = temp_dir();
    let data_url = format!("data:image/jpeg;base64,{}", STANDARD.encode(b"jpeg bytes"));
    let old = serde_json::to_string(&vec![openrouter_job(vec![request(&data_url)])]).unwrap();
    std::fs::create_dir_all(dir.join("state")).unwrap();
    std::fs::write(dir.join("state").join(FILENAME), old).unwrap();
    let job = JobStore::load(&dir).all().remove(0);
    assert_eq!(job.openrouter_requests[0].input_references[0].image_url.url, data_url);
    assert_eq!(job.openrouter_requests_to_send().unwrap(), vec![request(&data_url)], "sent as before");
    let _ = std::fs::remove_dir_all(dir);
  }

  fn temp_dir() -> PathBuf {
    std::env::temp_dir().join(format!("artcraft-native-jobs-{}", uuid::Uuid::new_v4()))
  }

  fn openrouter_job(openrouter_requests: Vec<OpenRouterImageRequest>) -> ProviderJob {
    ProviderJob { id: format!("local_{}", uuid::Uuid::new_v4()), provider: Provider::OpenRouter, model_id: "nano_banana_pro".into(), prompt: "a fox".into(), created_at: 1, batch_count: 1, provider_job_id: "r".into(), maybe_status_url: None, maybe_response_url: None, maybe_prompt_token: None, batch_token: "b".into(), upload_tokens: Vec::new(), uploaded: Vec::new(), openrouter_requests, result_files: Vec::new() }
  }

  fn request(url: &str) -> OpenRouterImageRequest {
    OpenRouterImageRequest { model: "google/gemini-3-pro-image".into(), prompt: "a fox".into(), n: None, resolution: None, aspect_ratio: None, quality: None, input_references: vec![OpenRouterInputReference::from_url(url)] }
  }
}
