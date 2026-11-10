use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::provider_image_context::ProviderImageContext;
use crate::core::utils::provider_submission::remove_submission;
use crate::core::utils::task_database_pending_statuses::TASK_DATABASE_PENDING_STATUSES;
use super::provider_upload_checkpoint::UploadCheckpoint;
use enums::tauri::tasks::task_status::TaskStatus;
use log::warn;
use std::collections::HashMap;
use std::path::Path;
use std::time::{Duration, SystemTime};

const ABANDONED_FILE_AGE: Duration = Duration::from_secs(24 * 60 * 60);

pub async fn cleanup_provider_cache(root: &AppDataRoot, database: &TaskDatabase) -> anyhow::Result<()> {
  let directory = root.state_dir().path();
  let statuses: HashMap<String, String> = sqlite_tasks::queries::list_task_statuses::list_task_statuses(database.get_connection()).await?.into_iter().collect();
  for entry in std::fs::read_dir(directory)? {
    let entry = entry?;
    let filename = entry.file_name();
    let Some(name) = filename.to_str() else {
      continue;
    };
    let Some(task_id) = name.strip_prefix("provider_upload_").and_then(|name| name.strip_suffix(".media").or_else(|| name.strip_suffix(".json"))) else {
      continue;
    };
    if task_id.is_empty() || !task_id.bytes().all(|byte| byte.is_ascii_alphanumeric() || byte == b'_' || byte == b'-') || entry.file_type()?.is_symlink() {
      continue;
    }
    let checkpoint_path = directory.join(format!("provider_upload_{task_id}.json"));
    let media_path = checkpoint_path.with_extension("media");
    let maybe_status = match statuses.get(task_id).map(|status| TaskStatus::from_str(status)).transpose() {
      Ok(status) => status,
      Err(error) => {
        warn!("Skipping provider cache with unknown task status: {error}");
        continue;
      },
    };
    if maybe_status.is_some_and(|status| !TASK_DATABASE_PENDING_STATUSES.contains(&status)) {
      if let Ok(Some(checkpoint)) = UploadCheckpoint::load(&checkpoint_path) {
        if checkpoint.identity.task_id == task_id {
          if let Some(job_id) = checkpoint.identity.maybe_provider_job_id.as_deref() {
            if checkpoint.identity.provider == enums::common::generation_provider::GenerationProvider::WaveSpeed {
              ProviderImageContext::remove(root, job_id)?;
              remove_submission(root, job_id)?;
            }
          }
        }
      }
      remove_owned_directory(&media_path)?;
      remove_file_if_present(&checkpoint_path)?;
      remove_file_if_present(&directory.join(format!("auto_download_{task_id}.json")))?;
    } else if media_path.is_dir() && !std::fs::symlink_metadata(&media_path)?.file_type().is_symlink() {
      let abandoned_directory = old_enough(&media_path)?;
      for partial in std::fs::read_dir(&media_path)? {
        let partial = partial?;
        if partial.file_type()?.is_file() && partial.file_name().to_string_lossy().starts_with("provider_") && old_enough(&partial.path())? {
          std::fs::remove_file(partial.path())?;
        }
      }
      if maybe_status.is_none() && !checkpoint_path.exists() && abandoned_directory {
        remove_owned_directory(&media_path)?;
      }
    }
  }
  for entry in std::fs::read_dir(root.temp_dir().path())? {
    let entry = entry?;
    if entry.file_type()?.is_file() && entry.file_name().to_string_lossy().starts_with("provider_") && old_enough(&entry.path())? {
      std::fs::remove_file(entry.path())?;
    }
  }
  Ok(())
}

fn old_enough(path: &Path) -> Result<bool, std::io::Error> {
  Ok(SystemTime::now().duration_since(std::fs::symlink_metadata(path)?.modified()?).is_ok_and(|age| age >= ABANDONED_FILE_AGE))
}

fn remove_owned_directory(path: &Path) -> Result<(), std::io::Error> {
  match std::fs::symlink_metadata(path) {
    Ok(metadata) if metadata.is_dir() && !metadata.file_type().is_symlink() => std::fs::remove_dir_all(path),
    Ok(_) => Ok(()),
    Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
    Err(error) => Err(error),
  }
}

fn remove_file_if_present(path: &Path) -> Result<(), std::io::Error> {
  match std::fs::symlink_metadata(path) {
    Ok(metadata) if metadata.is_file() && !metadata.file_type().is_symlink() => std::fs::remove_file(path),
    Ok(_) => Ok(()),
    Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
    Err(error) => Err(error),
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::threads::third_party_task_polling_thread::handlers::provider_upload_checkpoint::CompletionIdentity;
  use enums::common::generation_provider::GenerationProvider;
  use enums::tauri::tasks::{task_type::TaskType, task_media_file_class::TaskMediaFileClass, task_status::TaskStatus};
  use sqlite_tasks::queries::create_task::{create_task, CreateTaskArgs};

  #[tokio::test]
  async fn removes_terminal_caches_but_preserves_pending_data_and_unrelated_files() {
    let temporary = tempfile::tempdir().unwrap();
    let root = AppDataRoot::create_existing(temporary.path()).unwrap();
    let database = TaskDatabase::connect(&root).await.unwrap();
    let state = root.state_dir().path();
    let mut pending_paths = Vec::new();
    let mut terminal_paths = Vec::new();
    for status in [TaskStatus::Pending, TaskStatus::Started, TaskStatus::AttemptFailed, TaskStatus::CancelledByUser, TaskStatus::CompleteSuccess, TaskStatus::CompleteFailure] {
      let task = create_task(CreateTaskArgs { db: database.get_connection(), status, task_type: TaskType::ImageGeneration, model_type: None, provider: GenerationProvider::WaveSpeed, provider_job_id: None, queue_status_url: None, queue_response_url: None, prompt_token: None, frontend_caller: None, frontend_subscriber_id: None, frontend_subscriber_payload: None }).await.unwrap();
      let path = state.join(format!("provider_upload_{}.json", task.as_str()));
      UploadCheckpoint::prepare(&path, &CompletionIdentity { task_id: task.to_string(), provider: GenerationProvider::WaveSpeed, maybe_provider_job_id: None, api_host: "host".into(), media_class: TaskMediaFileClass::Image }, &["url".into()]).unwrap();
      let media = path.with_extension("media");
      std::fs::create_dir(&media).unwrap();
      std::fs::write(media.join("0.png"), b"paid output").unwrap();
      let partial = media.join("provider_abandoned.png");
      stale_file(&partial);
      if TASK_DATABASE_PENDING_STATUSES.contains(&status) {
        pending_paths.push((path, media));
      } else {
        terminal_paths.push((path, media));
      }
    }
    let orphan = state.join("provider_upload_task_missing.media");
    std::fs::create_dir(&orphan).unwrap();
    stale_file(&orphan.join("0.png"));
    make_old(&orphan);
    stale_file(&root.temp_dir().path().join("provider_abandoned.png"));
    stale_file(&root.temp_dir().path().join("unrelated.png"));
    cleanup_provider_cache(&root, &database).await.unwrap();
    for (path, media) in pending_paths {
      assert!(path.exists());
      assert!(media.join("0.png").exists());
      assert!(!media.join("provider_abandoned.png").exists());
    }
    for (path, media) in terminal_paths {
      assert!(!path.exists());
      assert!(!media.exists());
    }
    assert!(!orphan.exists());
    assert!(!root.temp_dir().path().join("provider_abandoned.png").exists());
    assert!(root.temp_dir().path().join("unrelated.png").exists());
  }

  fn stale_file(path: &Path) {
    std::fs::write(path, b"partial").unwrap();
    make_old(path);
  }
  fn make_old(path: &Path) {
    let time = SystemTime::now() - ABANDONED_FILE_AGE - Duration::from_secs(60);
    std::fs::File::open(path).unwrap().set_times(std::fs::FileTimes::new().set_modified(time)).unwrap();
  }
}
