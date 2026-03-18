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
use crate::services::sora::threads::sora_task_polling::helpers::download_extension::DownloadExtension;
use crate::services::sora::threads::sora_task_polling::helpers::handle_failed_generations::{handle_classic_failed_generations, FailedGeneration};
use crate::services::sora::threads::sora_task_polling::helpers::handle_successful_generations::{handle_classic_successful_generations, GenerationItem, SuccessfulGeneration};
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
use openai_sora_client::recipes::list_sora2_drafts::list_sora2_drafts_with_session_auto_renew::list_sora2_drafts_with_session_auto_renew;
use openai_sora_client::requests::common::task_id::TaskId;
use openai_sora_client::requests::list_classic_tasks::list_classic_tasks::TaskStatus;
use openai_sora_client::requests::list_sora2_drafts::list_sora2_drafts::Draft;
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

pub async fn poll_sora_2_tasks(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  task_database: &TaskDatabase,
  sora_creds_manager: &SoraCredentialManager,
  sora_creds: &SoraCredentialSet,
  storyteller_creds_manager: &StorytellerCredentialManager,
  sora_task_queue: &SoraTaskQueue,
  app_data_root: &AppDataRoot,
  local_sqlite_tasks_by_sora_task_id: &HashMap<String, Task>,
) -> AnyhowResult<()> {

  let (sora_response, maybe_new_creds) =
      list_sora2_drafts_with_session_auto_renew(&sora_creds).await?;

  if let Some(new_creds) = maybe_new_creds {
    info!("Saving new credentials.");
    sora_creds_manager.set_credentials(&new_creds)?;
  }

  let drafts = sora_response.drafts;

  let mut sora_succeeded_drafts_by_id = HashMap::new();
  let mut sora_failed_drafts_by_id = HashMap::new();

  let storyteller_creds = storyteller_creds_manager.get_credentials_required()?;

  for draft in drafts.into_iter() {
    match draft {
      Draft::Success(success_draft) => {
        sora_succeeded_drafts_by_id.insert(
          success_draft.task_id,
          SuccessfulGeneration {
            prompt: Some(success_draft.prompt),
            model_type: ModelType::Sora2,
            items: vec![GenerationItem {
              item_id: success_draft.id,
              url: success_draft.url,
            }]
          });
      }
      Draft::Failure(failed_draft) => {
        sora_failed_drafts_by_id.insert(
          failed_draft.task_id,
          FailedGeneration {
            reason: Some(failed_draft.reason_message)
          }
        );
      }
    }
  }

  // Clear dead tasks.
  handle_classic_failed_generations(
    &app_handle,
    &task_database,
    &local_sqlite_tasks_by_sora_task_id,
    &sora_failed_drafts_by_id,
    &sora_task_queue,
  ).await?;


  // Process succeeded tasks.
  handle_classic_successful_generations(
    &app_handle,
    &app_data_root,
    &app_env_configs,
    &task_database,
    &storyteller_creds,
    &sora_succeeded_drafts_by_id,
    &local_sqlite_tasks_by_sora_task_id,
    DownloadExtension::Mp4,
  ).await?;

  Ok(())
}

