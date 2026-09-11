use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::task_database::TaskDatabase;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use crate::services::storyteller::threads::storyteller_task_polling_thread::handle_storyteller_failed_job::handle_failed_job;
use crate::services::storyteller::threads::storyteller_task_polling_thread::handle_storyteller_successful_job::handle_successful_job;
use anyhow::anyhow;
use artcraft_client::endpoints::jobs::list_session_jobs::{list_session_jobs, States};
use artcraft_client::error::api_error::ApiError;
use artcraft_client::error::storyteller_error::StorytellerError;
use enums::common::generation_provider::GenerationProvider;
use enums::common::job_status_plus::JobStatusPlus;
use enums::tauri::tasks::task_status::TaskStatus;
use errors::AnyhowResult;
use log::error;
use sqlite_tasks::queries::list_tasks_by_provider_and_tokens::{list_tasks_by_provider_and_tokens, ListTasksArgs};
use sqlite_tasks::queries::task::Task;
use std::collections::HashMap;
use tauri::AppHandle;

pub async fn storyteller_task_polling_thread(
  app_handle: AppHandle,
  app_env_configs: AppEnvConfigs,
  task_database: TaskDatabase,
  storyteller_creds_manager: StorytellerCredentialManager,
) -> ! {
  loop {
    let res = polling_loop(
      &app_handle,
      &app_env_configs,
      &task_database,
      &storyteller_creds_manager,
    ).await;
    if let Err(err) = res {
      error!("An error occurred: {:?}", err);
    }
    // NB: Only sleep if an error occurs.
    tokio::time::sleep(std::time::Duration::from_millis(30_000)).await;
  }
}

async fn polling_loop(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> AnyhowResult<()> {
  loop {
    // Wait before next request for jobs.
    tokio::time::sleep(std::time::Duration::from_millis(5_000)).await;

    let creds = storyteller_creds_manager.get_credentials()?;

    let result = list_session_jobs(
      &app_env_configs.storyteller_host,
      creds.as_ref(),
      States::All,
    ).await;

    let jobs = match result {
      Ok(result) => result.jobs,
      Err(err) => {
        match &err {
          StorytellerError::Api(ApiError::TooManyRequests(message)) => {
            error!("Too many requests (sleeping): {:?}", message);
            tokio::time::sleep(std::time::Duration::from_millis(60_000)).await;
          }
          _ => {}
        }
        return Err(anyhow!(err));
      }
    };

    let job_ids = jobs.iter()
        .map(|job| job.job_token.to_string())
        .collect::<Vec<_>>();

    let tasks = list_tasks_by_provider_and_tokens(ListTasksArgs {
      db: task_database.get_connection(),
      provider: GenerationProvider::Artcraft,
      provider_job_ids: Some(job_ids),
    }).await?;

    let tasks = tasks.tasks;

    let jobs_by_id = jobs.iter()
        .map(|job| (job.job_token.to_string(), job))
        .collect::<HashMap<String, _>>();

    let tasks_by_provider_job_id = tasks.iter()
        .filter_map(|task| {
          if let Some(provider_job_id) = &task.provider_job_id {
            Some((provider_job_id.clone(), task.clone()))
          } else {
            None
          }
        })
        //.map(|task| (task.provider_job_id.clone(), task.clone()))
        .collect::<HashMap<String, Task>>();

    for job in jobs.iter() {
      let task = match tasks_by_provider_job_id.get(job.job_token.as_str()) {
        Some(task) => task,
        None => continue,
      };

      match job.status.status {
        JobStatusPlus::CompleteSuccess => {
          match task.status {
            TaskStatus::CompleteSuccess => continue, // NB: We're done with this task.
            _ => {}
          }
          handle_successful_job(app_handle, app_env_configs, creds.as_ref(), job, task, task_database).await?;
        }
        JobStatusPlus::CompleteFailure => {
          match task.status {
            TaskStatus::CompleteFailure => continue, // NB: We're done with this task.
            _ => {}
          }
          handle_failed_job(app_handle, job, task, task_database).await?;
        }
        _ => continue,
      }
    }

  }
}
