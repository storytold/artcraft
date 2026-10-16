//! OpenRouter generations in this run of the app. OpenRouter answers with the finished images
//! (there is no job to poll), so `generate_image_command` queues the requests here and the
//! third-party polling thread sends them, then uploads the images. Finished images (already
//! billed) are also saved under `state/openrouter_results/<job id>/` until their task completes,
//! so a restart can't lose them. A task whose job is neither here nor saved was cut off by a
//! restart: OpenRouter only bills finished images, so it's failed, not resent.

use std::collections::{HashMap, HashSet};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};

use local_generations::image_extension_for;
use log::warn;
use openrouter_client::api::generate_image::{OpenRouterImage, OpenRouterImageRequest};
use serde_derive::{Deserialize, Serialize};
use tokens::tokens::batch_generations::BatchGenerationToken;
use uuid_utils::uuid::generate_random_uuid;

use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::utils::local_generations::KeptGeneration;

const RESULTS_DIRNAME: &str = "openrouter_results";
/// Written last, so a job folder without it holds no complete result.
const MANIFEST_FILENAME: &str = "job.json";

#[derive(Clone, Default)]
pub struct OpenRouterJobs {
  jobs: Arc<Mutex<HashMap<String, OpenRouterJobState>>>,
  /// Where finished jobs are saved; `None` keeps them in memory only.
  maybe_results_dir: Option<Arc<PathBuf>>,
}

#[derive(Clone)]
pub enum OpenRouterJobState {
  /// Waiting for the polling thread to send it.
  Queued(Vec<OpenRouterImageRequest>),
  Running,
  /// The images, waiting for their upload. The tokens stay the same across upload retries, so a
  /// retry can't add the same image to the library twice.
  Finished(Arc<FinishedOpenRouterJob>),
  /// Signed out, the images are already in `local_generations/`; a retry only completes the task.
  KeptLocally(Arc<Vec<KeptGeneration>>),
  Failed(String),
}

pub struct FinishedOpenRouterJob {
  /// The prompt, kept with the images when they stay on this computer (signed out).
  pub prompt: String,
  pub images: Vec<OpenRouterImage>,
  pub upload_idempotency_tokens: Vec<String>,
  pub maybe_batch_token: Option<BatchGenerationToken>,
}

/// A finished job's manifest, beside its images (`0.png`, `1.jpg`, ...).
#[derive(Serialize, Deserialize)]
struct SavedJob {
  prompt: String,
  maybe_batch_token: Option<String>,
  upload_idempotency_tokens: Vec<String>,
  images: Vec<SavedImage>,
}

#[derive(Serialize, Deserialize)]
struct SavedImage {
  filename: String,
  maybe_media_type: Option<String>,
}

impl OpenRouterJobs {
  /// Jobs whose finished images are saved under the app's state folder.
  pub fn saved_in(app_data_root: &AppDataRoot) -> Self {
    let results_dir = app_data_root.state_dir().path().join(RESULTS_DIRNAME);
    Self { jobs: Arc::default(), maybe_results_dir: Some(Arc::new(results_dir)) }
  }

  pub fn queue(&self, job_id: &str, requests: Vec<OpenRouterImageRequest>) {
    self.with(|jobs| jobs.insert(job_id.to_owned(), OpenRouterJobState::Queued(requests)));
  }

  /// A job's state; one finished in an earlier run of the app is loaded back from disk.
  pub fn state(&self, job_id: &str) -> Option<OpenRouterJobState> {
    if let Some(state) = self.with(|jobs| jobs.get(job_id).cloned()).flatten() {
      return Some(state);
    }
    let loaded = self.load_saved(job_id)?;
    let saved = match unkeepable_image(&loaded.images) {
      Some(reason) => OpenRouterJobState::Failed(reason),
      None => OpenRouterJobState::Finished(Arc::new(loaded)),
    };
    self.with(|jobs| jobs.entry(job_id.to_owned()).or_insert(saved).clone())
  }

  /// Marks a queued job running and hands back its requests; `None` if it wasn't queued.
  pub fn start(&self, job_id: &str) -> Option<Vec<OpenRouterImageRequest>> {
    self.with(|jobs| match jobs.get(job_id) {
      Some(OpenRouterJobState::Queued(requests)) => {
        let requests = requests.clone();
        jobs.insert(job_id.to_owned(), OpenRouterJobState::Running);
        Some(requests)
      },
      _ => None,
    }).flatten()
  }

  /// Records a job's images, or fails it if one can be neither kept nor uploaded (eg. an SVG):
  /// retrying that would never succeed.
  pub fn finish(&self, job_id: &str, prompt: String, images: Vec<OpenRouterImage>) {
    if let Some(reason) = unkeepable_image(&images) {
      warn!("[OpenRouterJobs] Job {} failed: {}", job_id, reason);
      return self.fail(job_id, reason);
    }
    let finished = FinishedOpenRouterJob {
      prompt,
      upload_idempotency_tokens: images.iter().map(|_| generate_random_uuid()).collect(),
      maybe_batch_token: (images.len() > 1).then(BatchGenerationToken::generate),
      images,
    };
    if let Err(err) = self.save(job_id, &finished) {
      warn!("[OpenRouterJobs] Couldn't save the results of job {}; they're lost if ArtCraft closes first: {:?}", job_id, err);
    }
    self.with(|jobs| jobs.insert(job_id.to_owned(), OpenRouterJobState::Finished(Arc::new(finished))));
  }

  pub fn keep_locally(&self, job_id: &str, kept: Vec<KeptGeneration>) {
    self.with(|jobs| jobs.insert(job_id.to_owned(), OpenRouterJobState::KeptLocally(Arc::new(kept))));
  }

  pub fn fail(&self, job_id: &str, reason: String) {
    self.with(|jobs| jobs.insert(job_id.to_owned(), OpenRouterJobState::Failed(reason)));
  }

  /// Forgets a job and deletes its saved images.
  pub fn remove(&self, job_id: &str) {
    self.with(|jobs| jobs.remove(job_id));
    if let Some(dir) = self.job_dir(job_id) {
      if let Err(err) = std::fs::remove_dir_all(&dir) {
        if err.kind() != std::io::ErrorKind::NotFound {
          warn!("[OpenRouterJobs] Couldn't delete {}: {:?}", dir.display(), err);
        }
      }
    }
  }

  /// Drops finished, kept and failed jobs (and saved ones) whose task is no longer pending, eg.
  /// dismissed. Queued and running jobs stay: their task may not be written yet. Returns the ids.
  pub fn prune(&self, pending_job_ids: &HashSet<&str>) -> Vec<String> {
    let mut settled = self.with(|jobs| jobs.iter()
      .filter(|(id, state)| !matches!(state, OpenRouterJobState::Queued(_) | OpenRouterJobState::Running) && !pending_job_ids.contains(id.as_str()))
      .map(|(id, _)| id.clone())
      .collect::<Vec<_>>()).unwrap_or_default();
    for id in self.saved_job_ids() {
      if !pending_job_ids.contains(id.as_str()) && !settled.contains(&id) && self.with(|jobs| jobs.contains_key(&id)) == Some(false) {
        settled.push(id);
      }
    }
    for id in &settled {
      self.remove(id);
    }
    settled
  }

  fn save(&self, job_id: &str, finished: &FinishedOpenRouterJob) -> anyhow::Result<()> {
    let Some(dir) = self.job_dir(job_id) else {
      return Ok(());
    };
    std::fs::create_dir_all(&dir)?;
    let mut images = Vec::with_capacity(finished.images.len());
    for (i, image) in finished.images.iter().enumerate() {
      let filename = format!("{i}.{}", image.extension());
      std::fs::write(dir.join(&filename), &image.bytes)?;
      images.push(SavedImage { filename, maybe_media_type: image.maybe_media_type.clone() });
    }
    let saved = SavedJob {
      prompt: finished.prompt.clone(),
      maybe_batch_token: finished.maybe_batch_token.as_ref().map(|t| t.as_str().to_owned()),
      upload_idempotency_tokens: finished.upload_idempotency_tokens.clone(),
      images,
    };
    let mut manifest = tempfile::NamedTempFile::new_in(&dir)?;
    manifest.write_all(&serde_json::to_vec_pretty(&saved)?)?;
    manifest.persist(dir.join(MANIFEST_FILENAME))?;
    Ok(())
  }

  fn load_saved(&self, job_id: &str) -> Option<FinishedOpenRouterJob> {
    let dir = self.job_dir(job_id)?;
    let manifest = std::fs::read(dir.join(MANIFEST_FILENAME)).ok()?;
    let loaded = serde_json::from_slice::<SavedJob>(&manifest).map_err(anyhow::Error::from).and_then(|saved| {
      let images = saved.images.iter()
        .map(|image| Ok(OpenRouterImage { bytes: std::fs::read(dir.join(&image.filename))?, maybe_media_type: image.maybe_media_type.clone() }))
        .collect::<anyhow::Result<Vec<_>>>()?;
      Ok(FinishedOpenRouterJob {
        prompt: saved.prompt,
        images,
        upload_idempotency_tokens: saved.upload_idempotency_tokens,
        maybe_batch_token: saved.maybe_batch_token.as_deref().map(BatchGenerationToken::new_from_str),
      })
    });
    loaded.map_err(|err| warn!("[OpenRouterJobs] Ignoring unreadable results of job {}: {:?}", job_id, err)).ok()
  }

  fn saved_job_ids(&self) -> Vec<String> {
    let Some(Ok(entries)) = self.maybe_results_dir.as_deref().map(std::fs::read_dir) else {
      return Vec::new();
    };
    entries.flatten()
      .filter_map(|entry| entry.file_name().to_str().map(str::to_owned))
      .filter(|id| is_safe_job_id(id))
      .collect()
  }

  /// `None` when results aren't saved, or the id can't be a folder name.
  fn job_dir(&self, job_id: &str) -> Option<PathBuf> {
    let results_dir: &Path = self.maybe_results_dir.as_deref()?;
    is_safe_job_id(job_id).then(|| results_dir.join(job_id))
  }

  fn with<T>(&self, change: impl FnOnce(&mut HashMap<String, OpenRouterJobState>) -> T) -> Option<T> {
    self.jobs.lock().ok().map(|mut jobs| change(&mut jobs))
  }
}

/// Why a job fails when one of its images isn't a PNG, JPEG, WebP or GIF: `local_generations`
/// can't keep it signed out, and the library won't take it signed in.
fn unkeepable_image(images: &[OpenRouterImage]) -> Option<String> {
  images.iter()
    .find(|image| image_extension_for(&image.bytes, image.extension()).is_none())
    .map(|image| format!("OpenRouter returned a .{} image, which ArtCraft can't save: only PNG, JPEG, WebP and GIF images are supported", image.extension()))
}

/// Our job ids are `openrouter_<uuid>`; anything else is never used as a path.
fn is_safe_job_id(job_id: &str) -> bool {
  !job_id.is_empty() && job_id.chars().all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
}

#[cfg(test)]
mod tests {
  use std::collections::HashSet;

  use super::*;

  const SVG_BYTES: &[u8] = b"<svg xmlns=\"http://www.w3.org/2000/svg\"/>";

  #[test]
  fn jobs_move_from_queued_to_finished() {
    let jobs = OpenRouterJobs::default();
    assert!(jobs.state("job").is_none(), "unknown jobs were lost to a restart");
    jobs.queue("job", vec![request()]);
    assert!(matches!(jobs.state("job"), Some(OpenRouterJobState::Queued(_))));
    assert_eq!(jobs.start("job").map(|r| r.len()), Some(1));
    assert!(jobs.start("job").is_none(), "a running job isn't started twice");
    assert!(matches!(jobs.state("job"), Some(OpenRouterJobState::Running)));
    let image = OpenRouterImage { bytes: b"png".to_vec(), maybe_media_type: Some("image/png".into()) };
    jobs.finish("job", "a fox".to_owned(), vec![image.clone(), image]);
    let Some(OpenRouterJobState::Finished(finished)) = jobs.state("job") else { panic!("expected finished") };
    assert_eq!(finished.upload_idempotency_tokens.len(), 2);
    assert!(finished.maybe_batch_token.is_some(), "several images share a batch");
    let Some(OpenRouterJobState::Finished(again)) = jobs.state("job") else { panic!("expected finished") };
    assert_eq!(again.upload_idempotency_tokens, finished.upload_idempotency_tokens, "retries reuse their tokens");
    jobs.remove("job");
    assert!(jobs.state("job").is_none());
  }

  #[test]
  fn polling_does_not_copy_image_bytes() {
    let jobs = OpenRouterJobs::default();
    jobs.queue("job", vec![request()]);
    jobs.finish("job", "a fox".to_owned(), vec![OpenRouterImage { bytes: vec![0; 1024], maybe_media_type: None }]);
    let Some(OpenRouterJobState::Finished(first)) = jobs.state("job") else { panic!("expected finished") };
    let Some(OpenRouterJobState::Finished(second)) = jobs.state("job") else { panic!("expected finished") };
    assert!(std::ptr::eq(first.images[0].bytes.as_ptr(), second.images[0].bytes.as_ptr()));
  }

  #[test]
  fn failures_keep_their_reason() {
    let jobs = OpenRouterJobs::default();
    jobs.queue("job", vec![request()]);
    jobs.fail("job", "out of credits".into());
    assert!(matches!(jobs.state("job"), Some(OpenRouterJobState::Failed(reason)) if reason == "out of credits"));
  }

  mod saved_results_tests {
    use super::*;

    #[test]
    fn finished_jobs_survive_a_restart_until_removed() {
      let dir = tempfile::tempdir().unwrap();
      let root = AppDataRoot::create_existing(dir.path()).unwrap();
      let jobs = OpenRouterJobs::saved_in(&root);
      jobs.queue("job", vec![request()]);
      jobs.start("job");
      jobs.finish("job", "a fox".to_owned(), vec![image(b"one", Some("image/png")), image(b"two", None)]);
      let Some(OpenRouterJobState::Finished(before)) = jobs.state("job") else { panic!("expected finished") };
      let restarted = OpenRouterJobs::saved_in(&root);
      let Some(OpenRouterJobState::Finished(after)) = restarted.state("job") else { panic!("paid-for images were lost to a restart") };
      assert_eq!(after.prompt, "a fox");
      assert_eq!(after.images, before.images);
      assert_eq!(after.upload_idempotency_tokens, before.upload_idempotency_tokens, "re-uploads stay harmless");
      assert_eq!(after.maybe_batch_token.as_ref().map(|t| t.as_str().to_owned()), before.maybe_batch_token.as_ref().map(|t| t.as_str().to_owned()));
      restarted.remove("job");
      assert!(OpenRouterJobs::saved_in(&root).state("job").is_none(), "a completed job's images are deleted");
    }

    #[test]
    fn jobs_cut_off_before_finishing_stay_lost() {
      let dir = tempfile::tempdir().unwrap();
      let root = AppDataRoot::create_existing(dir.path()).unwrap();
      let jobs = OpenRouterJobs::saved_in(&root);
      jobs.queue("job", vec![request()]);
      jobs.start("job");
      assert!(OpenRouterJobs::saved_in(&root).state("job").is_none());
    }
  }

  mod unkeepable_image_tests {
    use super::*;

    #[test]
    fn jobs_with_an_image_that_cant_be_kept_fail_instead_of_retrying() {
      let dir = tempfile::tempdir().unwrap();
      let root = AppDataRoot::create_existing(dir.path()).unwrap();
      let jobs = OpenRouterJobs::saved_in(&root);
      jobs.queue("job", vec![request()]);
      jobs.start("job");
      jobs.finish("job", "a fox".to_owned(), vec![image(b"one", Some("image/png")), image(SVG_BYTES, Some("image/svg+xml"))]);
      assert!(matches!(jobs.state("job"), Some(OpenRouterJobState::Failed(reason)) if reason.contains(".svg") && reason.contains("PNG, JPEG, WebP and GIF")));
      assert!(OpenRouterJobs::saved_in(&root).state("job").is_none(), "nothing is saved to retry");
    }

    #[test]
    fn saved_jobs_with_an_image_that_cant_be_kept_fail() {
      let dir = tempfile::tempdir().unwrap();
      let root = AppDataRoot::create_existing(dir.path()).unwrap();
      let finished = FinishedOpenRouterJob { prompt: "a fox".to_owned(), images: vec![image(SVG_BYTES, Some("image/svg+xml"))], upload_idempotency_tokens: vec!["token".to_owned()], maybe_batch_token: None };
      OpenRouterJobs::saved_in(&root).save("job", &finished).unwrap();
      assert!(matches!(OpenRouterJobs::saved_in(&root).state("job"), Some(OpenRouterJobState::Failed(_))), "saved by an earlier run, still not retried forever");
    }
  }

  #[test]
  fn settled_jobs_without_a_pending_task_are_dropped() {
    let dir = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(dir.path()).unwrap();
    OpenRouterJobs::saved_in(&root).finish("earlier_run", "a cat".to_owned(), vec![image(b"one", None)]);
    let jobs = OpenRouterJobs::saved_in(&root);
    jobs.queue("queued", vec![request()]);
    jobs.queue("running", vec![request()]);
    jobs.start("running");
    jobs.finish("finished", "a fox".to_owned(), vec![image(b"one", None)]);
    jobs.finish("pending", "a fox".to_owned(), vec![image(b"one", None)]);
    jobs.fail("failed", "out of credits".into());
    jobs.keep_locally("kept", Vec::new());
    let mut pruned = jobs.prune(&HashSet::from(["pending"]));
    pruned.sort();
    assert_eq!(pruned, vec!["earlier_run", "failed", "finished", "kept"]);
    for kept in ["queued", "running", "pending"] {
      assert!(jobs.state(kept).is_some(), "{kept} must stay");
    }
    let restarted = OpenRouterJobs::saved_in(&root);
    assert!(restarted.state("finished").is_none() && restarted.state("earlier_run").is_none(), "dropped jobs' images are deleted");
    assert!(restarted.state("pending").is_some());
  }

  fn image(bytes: &[u8], maybe_media_type: Option<&str>) -> OpenRouterImage {
    OpenRouterImage { bytes: bytes.to_vec(), maybe_media_type: maybe_media_type.map(str::to_owned) }
  }

  fn request() -> OpenRouterImageRequest {
    OpenRouterImageRequest { model: "google/gemini-3-pro-image".into(), prompt: "a fox".into(), n: Some(1), resolution: None, aspect_ratio: None, quality: None, input_references: Vec::new() }
  }
}
