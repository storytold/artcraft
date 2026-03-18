use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::core::events::generation_events::generation_failed_event::GenerationFailedEvent;
use crate::core::events::sendable_event_trait::SendableEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::task_database_pending_statuses::TASK_DATABASE_PENDING_STATUSES;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::sora::threads::sora_task_polling::helpers::handle_failed_generations::handle_classic_failed_generations;
use crate::services::sora::threads::sora_task_polling::helpers::handle_successful_generations::handle_classic_successful_generations;
use crate::services::sora::threads::sora_task_polling::helpers::poll_classic_sora_tasks::poll_classic_sora_tasks;
use crate::services::sora::threads::sora_task_polling::helpers::poll_sora_2_tasks::poll_sora_2_tasks;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::prompts::create_prompt::CreatePromptRequest;
use enums::common::generation_provider::GenerationProvider;
use enums::common::model_type::ModelType;
use enums::tauri::tasks::task_status;
use errors::AnyhowResult;
use uuid_utils::uuid::generate_random_uuid;
use log::{error, info, warn};
use once_cell::sync::Lazy;
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use openai_sora_client::recipes::list_classic_sora_tasks_with_session_auto_renew::list_classic_sora_tasks_with_session_auto_renew;
use openai_sora_client::requests::common::task_id::TaskId;
use openai_sora_client::requests::list_classic_tasks::list_classic_tasks::TaskStatus;
use reqwest::Url;
use sqlite_tasks::queries::list_tasks_by_provider_and_status::{list_tasks_by_provider_and_status, ListTasksByProviderAndStatusArgs, TaskList};
use sqlite_tasks::queries::task::Task;
use sqlite_tasks::queries::update_task_status::{update_task_status, UpdateTaskArgs};
use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::{upload_image_media_file_from_file, UploadImageFromFileArgs};
use artcraft_client::endpoints::prompts::create_prompt::create_prompt;
use tauri::AppHandle;
use tempdir::TempDir;

pub async fn sora_task_polling_thread(
  app_handle: AppHandle,
  app_env_configs: AppEnvConfigs,
  app_data_root: AppDataRoot,
  task_database: TaskDatabase,
  sora_creds_manager: SoraCredentialManager,
  storyteller_creds_manager: StorytellerCredentialManager,
  sora_task_queue: SoraTaskQueue,
) -> ! {
  loop {
    let res = local_task_polling_loop(
      &app_handle,
      &app_env_configs,
      &task_database,
      &sora_creds_manager, 
      &storyteller_creds_manager, 
      &sora_task_queue,
      &app_data_root,
    ).await;
    if let Err(err) = res {
      error!("An error occurred: {:?}", err);
    }
    tokio::time::sleep(std::time::Duration::from_millis(30_000)).await;
  }
}

async fn local_task_polling_loop(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  task_database: &TaskDatabase,
  sora_creds_manager: &SoraCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
  sora_task_queue: &SoraTaskQueue,
  app_data_root: &AppDataRoot,
) -> AnyhowResult<()> {
  loop {
    let local_sqlite_tasks = list_tasks_by_provider_and_status(ListTasksByProviderAndStatusArgs {
      db: task_database.get_connection(),
      provider: GenerationProvider::Sora,
      task_statuses: &TASK_DATABASE_PENDING_STATUSES,
    }).await?;

    if local_sqlite_tasks.tasks.is_empty() {
      // No need to poll if we don't have pending tasks.
      tokio::time::sleep(std::time::Duration::from_millis(2_000)).await;
      continue;
    }

    let creds = sora_creds_manager.get_credentials_required()?;

    // Map of Sora Task ID to Local Task.
    let local_sqlite_tasks_by_sora_task_id = local_sqlite_tasks.tasks.iter()
        .filter_map(|task| {
          if let Some(provider_job_id) = &task.provider_job_id {
            Some((provider_job_id.clone(), task.clone()))
          } else {
            None
          }
        })
        .collect::<HashMap<String, Task>>();

    // TODO: Only poll if we have classic items
    
    poll_classic_sora_tasks(
      &app_handle,
      &app_env_configs,
      &task_database,
      &sora_creds_manager,
      &creds,
      &storyteller_creds_manager,
      &sora_task_queue,
      &app_data_root,
      &local_sqlite_tasks_by_sora_task_id,
    ).await?;

    // TODO: Only poll if we have new items
    
    poll_sora_2_tasks(
      &app_handle,
      &app_env_configs,
      &task_database,
      &sora_creds_manager,
      &creds,
      &storyteller_creds_manager,
      &sora_task_queue,
      &app_data_root,
      &local_sqlite_tasks_by_sora_task_id,
    ).await?;

    tokio::time::sleep(std::time::Duration::from_millis(2_000)).await;
  }
}

