use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::provider_image_context::ProviderImageContext;
use crate::core::utils::task_database_pending_statuses::TASK_DATABASE_PENDING_STATUSES;
use anyhow::{ensure, Result};
use artcraft_router::errors::artcraft_router_error::ArtcraftRouterError;
use artcraft_router::errors::provider_error::ProviderError;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
use enums::tauri::tasks::task_type::TaskType;
use log::warn;
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::{Path, PathBuf};
use tempfile::NamedTempFile;
use uuid_utils::uuid::generate_random_uuid;
use sqlite_tasks::queries::get_task_by_provider_and_provider_job_id::{get_task_by_provider_and_provider_job_id, GetTaskByProviderAndProviderJobIdArgs};

#[derive(Deserialize, Serialize)]
pub struct ProviderSubmission {
  version: u8,
  id: String,
  pub context: ProviderImageContext,
  #[serde(default = "default_task_type")]
  task_type: TaskType,
  #[serde(default)]
  api_host: String,
  maybe_success: Option<TaskEnqueueSuccess>,
  maybe_caller: Option<TauriCommandCaller>,
  maybe_subscriber_id: Option<String>,
  maybe_subscriber_payload: Option<String>,
}

impl ProviderSubmission {
  /// Persist a bounded uncertain-submission receipt before sending a paid creation request.
  pub fn begin(root: &AppDataRoot, context: ProviderImageContext, task_type: TaskType, api_host: String, maybe_caller: Option<TauriCommandCaller>, maybe_subscriber_id: Option<String>, maybe_subscriber_payload: Option<String>) -> Result<Self> {
    let receipt = Self { version: 1, id: generate_random_uuid(), context, task_type, api_host, maybe_success: None, maybe_caller, maybe_subscriber_id, maybe_subscriber_payload };
    ensure!(serde_json::to_vec(&receipt)?.len() <= 1024 * 1024, "Submission metadata is too large");
    receipt.save(root)?;
    Ok(receipt)
  }

  /// Record the accepted WaveSpeed job and its recovery context before local task insertion.
  pub fn accept(&mut self, root: &AppDataRoot, success: &TaskEnqueueSuccess) -> Result<()> {
    ensure!(success.provider == GenerationProvider::WaveSpeed && success.provider_job_id.is_some(), "Invalid WaveSpeed acceptance receipt");
    self.maybe_success = Some(success.clone());
    self.save(root)?;
    self.save_context(root)?;
    Ok(())
  }

  /// Discard only explicit HTTP rejection receipts and preserve uncertain paid outcomes.
  pub fn handle_submission_result<T>(&self, root: &AppDataRoot, result: Result<T, ArtcraftRouterError>) -> Result<T, ArtcraftRouterError> {
    if let Err(ArtcraftRouterError::Provider(ProviderError::WaveSpeed(error)) | ArtcraftRouterError::ProviderBillingError(ProviderError::WaveSpeed(error))) = &result {
      if error.is_definitive_submission_rejection() {
        if let Err(error) = self.discard(root) {
          warn!("Could not discard rejected WaveSpeed submission receipt: {error}");
        }
      }
    }
    result
  }

  /// Remove an unaccepted receipt by its validated ID; accepted jobs require recovery instead.
  fn discard(&self, root: &AppDataRoot) -> Result<()> {
    ensure!(self.maybe_success.is_none(), "Accepted submissions must be recovered, not discarded");
    ensure!(!self.id.is_empty() && self.id.bytes().all(|byte| byte.is_ascii_alphanumeric() || byte == b'-'), "Invalid submission receipt ID");
    match std::fs::remove_file(directory(root)?.join(format!("{}.json", self.id))) {
      Ok(()) => Ok(()),
      Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
      Err(error) => Err(error.into()),
    }
  }

  /// Restore accepted jobs only for their original API host, skipping already-tracked tasks.
  pub async fn restore_task(&self, root: &AppDataRoot, database: &TaskDatabase, api_host: &str) -> Result<()> {
    ensure!(self.version == 1, "Unsupported submission receipt version");
    ensure!(self.api_host == api_host, "Submission belongs to a different ArtCraft API host");
    if let Some(success) = &self.maybe_success {
      ensure!(success.provider == GenerationProvider::WaveSpeed && success.provider_job_id.is_some(), "Invalid saved acceptance receipt");
      let job_id = success.provider_job_id.as_deref().unwrap();
      let maybe_task = get_task_by_provider_and_provider_job_id(GetTaskByProviderAndProviderJobIdArgs { db: database.get_connection(), provider: success.provider, provider_job_id: job_id }).await?;
      if let Some(task) = maybe_task {
        if !TASK_DATABASE_PENDING_STATUSES.contains(&task.status) {
          ProviderImageContext::remove(root, job_id)?;
          remove_submission(root, job_id)?;
        }
        return Ok(());
      }
      self.save_context(root)?;
      success.insert_into_task_database_with_frontend_payload(database, self.maybe_caller, self.maybe_subscriber_id.as_deref(), self.maybe_subscriber_payload.as_deref()).await?;
    }
    Ok(())
  }

  /// Persist generation metadata under the accepted provider job identity.
  fn save_context(&self, root: &AppDataRoot) -> Result<()> {
    if let Some(job_id) = self.maybe_success.as_ref().and_then(|success| success.provider_job_id.as_deref()) {
      ProviderImageContext::save_prepared(root, job_id, self.context.prepare(root)?)?;
    }
    Ok(())
  }

  /// Atomically replace a bounded receipt and flush its contents before returning.
  fn save(&self, root: &AppDataRoot) -> Result<()> {
    let directory = directory(root)?;
    let bytes = serde_json::to_vec(self)?;
    ensure!(bytes.len() <= 4 * 1024 * 1024, "Submission receipt is too large");
    let mut temporary = NamedTempFile::new_in(&directory)?;
    temporary.write_all(&bytes)?;
    temporary.as_file().sync_all()?;
    temporary.persist(directory.join(format!("{}.json", self.id)))?;
    #[cfg(unix)]
    std::fs::File::open(&directory)?.sync_all()?;
    Ok(())
  }
}

/// Replay accepted receipts without resubmission and quarantine unreadable receipt files.
pub async fn restore_submissions(root: &AppDataRoot, database: &TaskDatabase, api_host: &str) -> Result<()> {
  let mut maybe_error = None;
  for entry in std::fs::read_dir(directory(root)?)? {
    let entry = entry?;
    if entry.path().extension().and_then(|value| value.to_str()) != Some("json") || !entry.file_type()?.is_file() {
      continue;
    }
    let result = read_receipt(&entry.path());
    match result {
      Ok(receipt) => {
        if receipt.api_host != api_host { continue; }
        if let Err(error) = receipt.restore_task(root, database, api_host).await {
          warn!("Could not restore accepted WaveSpeed submission: {error}");
          maybe_error = Some(error);
        }
      },
      Err(error) => {
        warn!("Could not read WaveSpeed submission receipt: {error}");
        if let Err(error) = std::fs::rename(entry.path(), entry.path().with_extension("invalid")) {
          warn!("Could not quarantine invalid submission receipt: {error}");
        }
      },
    }
  }
  if let Some(error) = maybe_error { return Err(error); }
  Ok(())
}

/// Remove receipt files matching a completed provider job without touching unrelated jobs.
pub fn remove_submission(root: &AppDataRoot, job_id: &str) -> Result<()> {
  for entry in std::fs::read_dir(directory(root)?)? {
    let entry = entry?;
    if entry.path().extension().and_then(|value| value.to_str()) == Some("json") && entry.file_type()?.is_file() {
      if let Ok(receipt) = read_receipt(&entry.path()) {
        if receipt.maybe_success.as_ref().and_then(|success| success.provider_job_id.as_deref()) == Some(job_id) {
          std::fs::remove_file(entry.path())?;
        }
      }
    }
  }
  Ok(())
}

/// Bound receipt bytes and reject unsupported stored schema versions.
fn read_receipt(path: &Path) -> Result<ProviderSubmission> {
  let bytes = crate::core::utils::read_bounded_file::read_bounded_file(path, 4 * 1024 * 1024)?;
  let receipt: ProviderSubmission = serde_json::from_slice(&bytes)?;
  ensure!(receipt.version == 1, "Unsupported submission receipt version");
  Ok(receipt)
}

/// Interpret older receipts without an explicit task type as image generation.
fn default_task_type() -> TaskType {
  TaskType::ImageGeneration
}

#[derive(Serialize)]
pub struct UncertainSubmission {
  pub id: String,
  pub prompt: String,
  pub model_id: String,
  pub task_type: TaskType,
}

/// List unaccepted receipts scoped to the current ArtCraft API host.
pub fn uncertain_submissions(root: &AppDataRoot, api_host: &str) -> Result<Vec<UncertainSubmission>> {
  let mut results = Vec::new();
  for entry in std::fs::read_dir(directory(root)?)? {
    let entry = entry?;
    if !entry.file_type()?.is_file() || entry.path().extension().and_then(|value| value.to_str()) != Some("json") {
      continue;
    }
    if let Ok(receipt) = read_receipt(&entry.path()) {
      if receipt.maybe_success.is_none() && receipt.api_host == api_host {
        results.push(UncertainSubmission { id: receipt.id, prompt: receipt.context.prompt, model_id: receipt.context.model_id, task_type: receipt.task_type });
      }
    }
  }
  Ok(results)
}

/// Attach a history prediction to an unchanged uncertain receipt without creating a paid job.
pub fn attach_prediction(root: &AppDataRoot, id: &str, job_id: &str, api_host: &str) -> Result<()> {
  ensure!(!id.is_empty() && id.len() <= 64 && id.bytes().all(|byte| byte.is_ascii_alphanumeric() || byte == b'-'), "Invalid submission receipt ID");
  let mut receipt = read_receipt(&directory(root)?.join(format!("{id}.json")))?;
  ensure!(receipt.api_host == api_host && receipt.id == id && receipt.maybe_success.is_none(), "Submission receipt cannot be changed");
  let success = TaskEnqueueSuccess { task_type: receipt.task_type, model: Some(crate::core::events::generation_events::common::GenerationModel::Unknown(receipt.context.model_id.clone())), provider: GenerationProvider::WaveSpeed, provider_job_id: Some(job_id.into()), maybe_queue_status_url: None, maybe_queue_response_url: None, maybe_prompt_token: None };
  receipt.accept(root, &success)
}

/// Create the owned receipt directory and reject a symlink at its location.
fn directory(root: &AppDataRoot) -> Result<PathBuf> {
  let path = root.state_dir().path().join("wavespeed_submissions");
  std::fs::create_dir_all(&path)?;
  ensure!(!std::fs::symlink_metadata(&path)?.file_type().is_symlink(), "Submission directory must not be a symlink");
  Ok(path)
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::events::generation_events::common::GenerationModel;
  use enums::tauri::tasks::task_status::TaskStatus;
  use sqlite_tasks::queries::update_task_status::{update_task_status, UpdateTaskArgs};
  use sqlite_tasks::queries::list_non_artcraft_pending_tasks::{list_non_artcraft_pending_tasks, ListNonArtcraftPendingTasksArgs};

  const HOST: &str = "https://api.storyteller.ai";

  #[test]
  fn rejected_receipts_are_discarded_but_uncertain_outcomes_are_preserved() {
    use wavespeed_client::WaveSpeedError;
    let temporary = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(temporary.path()).unwrap();
    for task_type in [TaskType::ImageGeneration, TaskType::VideoGeneration] {
      for status in [200, 400, 401, 402, 403, 422, 429, 500] {
        let receipt = begin(&root, task_type);
        let path = directory(&root).unwrap().join(format!("{}.json", receipt.id));
        let error = match status {
          200 | 401 | 403 => WaveSpeedError::Authentication { http_status: status },
          402 => WaveSpeedError::Billing { http_status: status },
          400 | 422 => WaveSpeedError::Rejected { http_status: status, code: status, message: String::new() },
          429 => WaveSpeedError::RateLimited { http_status: status, maybe_retry_after_secs: None, message: String::new() },
          _ => WaveSpeedError::Http { status, message: String::new() },
        };
        let result: Result<(), ArtcraftRouterError> = Err(ProviderError::WaveSpeed(error).into());
        assert!(receipt.handle_submission_result(&root, result).is_err());
        assert_eq!(path.exists(), matches!(status, 200 | 500));
        if path.exists() { std::fs::remove_file(path).unwrap(); }
      }
      let mut receipt = begin(&root, task_type);
      receipt.accept(&root, &success(task_type)).unwrap();
      assert!(receipt.discard(&root).is_err());
      remove_submission(&root, "job_recovery").unwrap();
    }
  }

  #[tokio::test]
  async fn accepted_submission_survives_database_failure_restart_and_concurrent_replay() {
    let temporary = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(temporary.path()).unwrap();
    let database = TaskDatabase::connect(&root).await.unwrap();
    let mut receipt = begin(&root, TaskType::ImageGeneration);
    assert_eq!(uncertain_submissions(&root, HOST).unwrap().len(), 1);
    let success = success(TaskType::ImageGeneration);
    receipt.accept(&root, &success).unwrap();
    database.get_connection().get_pool().close().await;
    assert!(receipt.restore_task(&root, &database, HOST).await.is_err());
    let database = TaskDatabase::connect(&root).await.unwrap();
    let (first, second) = tokio::join!(restore_submissions(&root, &database, HOST), restore_submissions(&root, &database, HOST));
    first.unwrap();
    second.unwrap();
    let tasks = list_non_artcraft_pending_tasks(ListNonArtcraftPendingTasksArgs { db: database.get_connection(), task_statuses: &TASK_DATABASE_PENDING_STATUSES }).await.unwrap().tasks;
    assert_eq!(tasks.len(), 1);
    assert_eq!(tasks[0].frontend_subscriber_payload.as_deref(), Some("original payload"));
    assert_eq!(tasks[0].prompt_token.as_deref(), Some("p_original"));
    assert_eq!(ProviderImageContext::load(&root, "job_recovery").unwrap().unwrap().prompt, "a bird");
    update_task_status(UpdateTaskArgs { db: database.get_connection(), task_id: &tasks[0].id, status: TaskStatus::CancelledByUser }).await.unwrap();
    restore_submissions(&root, &database, HOST).await.unwrap();
    assert_eq!(std::fs::read_dir(directory(&root).unwrap()).unwrap().count(), 0);
    assert!(ProviderImageContext::load(&root, "job_recovery").unwrap().is_none());
  }

  #[tokio::test]
  async fn uncertain_submission_is_not_resubmitted_and_can_be_attached_without_billing() {
    let temporary = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(temporary.path()).unwrap();
    let database = TaskDatabase::connect(&root).await.unwrap();
    let receipt = begin(&root, TaskType::VideoGeneration);
    restore_submissions(&root, &database, HOST).await.unwrap();
    assert!(get_task_by_provider_and_provider_job_id(GetTaskByProviderAndProviderJobIdArgs { db: database.get_connection(), provider: GenerationProvider::WaveSpeed, provider_job_id: "job_recovery" }).await.unwrap().is_none());
    assert!(uncertain_submissions(&root, "https://other.example").unwrap().is_empty());
    assert!(attach_prediction(&root, "../escape", "job_recovery", HOST).is_err());
    assert!(attach_prediction(&root, &receipt.id, "job_recovery", "other").is_err());
    attach_prediction(&root, &receipt.id, "job_recovery", HOST).unwrap();
    let accepted = read_receipt(&directory(&root).unwrap().join(format!("{}.json", receipt.id))).unwrap();
    assert_eq!(accepted.maybe_success.as_ref().and_then(|success| success.provider_job_id.as_deref()), Some("job_recovery"));
    restore_submissions(&root, &database, HOST).await.unwrap();
    let task = get_task_by_provider_and_provider_job_id(GetTaskByProviderAndProviderJobIdArgs { db: database.get_connection(), provider: GenerationProvider::WaveSpeed, provider_job_id: "job_recovery" }).await.unwrap().unwrap();
    assert_eq!(task.task_type, TaskType::VideoGeneration);
    assert!(attach_prediction(&root, &receipt.id, "job_different", HOST).is_err());
  }

  fn begin(root: &AppDataRoot, task_type: TaskType) -> ProviderSubmission {
    ProviderSubmission::begin(root, ProviderImageContext { prompt: "a bird".into(), model_id: "nano_banana_pro".into(), local_only: true }, task_type, HOST.into(), None, Some("subscriber".into()), Some("original payload".into())).unwrap()
  }

  fn success(task_type: TaskType) -> TaskEnqueueSuccess {
    TaskEnqueueSuccess { task_type, model: Some(GenerationModel::NanoBananaPro), provider: GenerationProvider::WaveSpeed, provider_job_id: Some("job_recovery".into()), maybe_queue_status_url: None, maybe_queue_response_url: None, maybe_prompt_token: Some(tokens::tokens::prompts::PromptToken::new_from_str("p_original")) }
  }
}
