//! Generations running at Midjourney or fal, saved (`state/native_provider_jobs.json`) so they
//! finish even after a restart. Each also checkpoints its upload into the user's library: the
//! batch it goes into, one idempotency token per result, and what's uploaded so far.

use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use log::warn;
use serde::{Deserialize, Serialize};

use super::Provider;

const FILENAME: &str = "native_provider_jobs.json";

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
  /// The provider's job: Midjourney's job id, or fal's request id.
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
}

impl ProviderJob {
  /// The idempotency token for result `index`, making (and keeping) new ones as needed.
  pub fn upload_token(&mut self, index: usize) -> String {
    while self.upload_tokens.len() <= index {
      self.upload_tokens.push(uuid::Uuid::new_v4().to_string());
    }
    self.upload_tokens[index].clone()
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

  pub fn all(&self) -> Vec<ProviderJob> {
    self.jobs.lock().map(|j| j.clone()).unwrap_or_default()
  }

  /// Adds or replaces (by id) a job, then saves.
  pub fn put(&self, job: ProviderJob) {
    self.mutate(|jobs| match jobs.iter_mut().find(|j| j.id == job.id) {
      Some(existing) => *existing = job,
      None => jobs.push(job),
    });
  }

  pub fn remove(&self, id: &str) {
    self.mutate(|jobs| jobs.retain(|j| j.id != id));
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

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn jobs_survive_a_restart_and_keep_their_upload_tokens() {
    let dir = std::env::temp_dir().join(format!("artcraft-native-jobs-{}", uuid::Uuid::new_v4()));
    let store = JobStore::load(&dir);
    let mut job = ProviderJob { id: "local_1".into(), provider: Provider::Midjourney, model_id: "midjourney_7".into(), prompt: "a fox".into(), created_at: 1, batch_count: 4, provider_job_id: "mj".into(), maybe_status_url: None, maybe_response_url: None, maybe_prompt_token: None, batch_token: "batch_1".into(), upload_tokens: Vec::new(), uploaded: Vec::new() };
    let first = job.upload_token(2);
    assert_eq!(job.upload_tokens.len(), 3);
    assert_eq!(job.upload_token(2), first, "a retried upload reuses its token");
    store.put(job.clone());
    let reloaded = JobStore::load(&dir);
    assert_eq!(reloaded.all(), vec![job]);
    reloaded.remove("local_1");
    assert!(JobStore::load(&dir).all().is_empty());
    let _ = std::fs::remove_dir_all(dir);
  }
}
