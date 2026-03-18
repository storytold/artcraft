use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::core::events::generation_events::generation_failed_event::GenerationFailedEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::data_dir::trait_data_subdir::DataSubdir;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::task_database_pending_statuses::TASK_DATABASE_PENDING_STATUSES;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::sora::threads::sora_task_polling::helpers::download_extension::DownloadExtension;
use crate::services::sora::threads::sora_task_polling::helpers::generation_type::GenerationType;
use crate::services::sora::threads::sora_task_polling::helpers::upload_generation_to_backend::{upload_generation_to_backend, UploadGenerationToBackendArgs};
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use artcraft_api_defs::prompts::create_prompt::CreatePromptRequest;
use artcraft_api_defs::utils::media_links_to_thumbnail_template::media_links_to_thumbnail_template;
use enums::common::generation_provider::GenerationProvider;
use enums::common::model_type::ModelType;
use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use enums::tauri::tasks::task_status;
use errors::AnyhowResult;
use uuid_utils::uuid::generate_random_uuid;
use log::{error, info, warn};
use once_cell::sync::Lazy;
use openai_sora_client::creds::sora_credential_set::SoraCredentialSet;
use openai_sora_client::recipes::list_classic_sora_tasks_with_session_auto_renew::list_classic_sora_tasks_with_session_auto_renew;
use openai_sora_client::requests::common::task_id::TaskId;
use openai_sora_client::requests::list_classic_tasks::list_classic_tasks::{PartialGeneration, PartialTaskResponse};
use reqwest::Url;
use sqlite_tasks::queries::list_tasks_by_provider_and_status::{list_tasks_by_provider_and_status, ListTasksByProviderAndStatusArgs, TaskList};
use sqlite_tasks::queries::task::Task;
use sqlite_tasks::queries::update_successful_task_status_with_metadata::{update_successful_task_status_with_metadata, UpdateSuccessfulTaskArgs};
use sqlite_tasks::queries::update_task_status::{update_task_status, UpdateTaskArgs};
use std::collections::{HashMap, HashSet};
use std::fs::File;
use std::io::Write;
use std::path::PathBuf;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::{upload_image_media_file_from_file, UploadImageFromFileArgs};
use artcraft_client::endpoints::media_files::upload_video_media_file_from_file::{upload_video_media_file_from_file, UploadVideoFromFileArgs};
use artcraft_client::endpoints::prompts::create_prompt::create_prompt;
use tauri::AppHandle;
use tempdir::TempDir;
use url_utils::download_extension::extract_download_extension_from_url::{extract_download_extension_from_url, extract_download_extension_from_url_str};

pub struct SuccessfulGeneration {
  pub prompt: Option<String>,
  pub items: Vec<GenerationItem>,
  pub model_type: ModelType,
}

pub struct GenerationItem {
  pub item_id: String,
  pub url: String,
}


pub async fn handle_classic_successful_generations(
  app_handle: &AppHandle,
  app_data_root: &AppDataRoot,
  app_env_configs: &AppEnvConfigs,
  task_database: &TaskDatabase,
  storyteller_creds: &StorytellerCredentialSet,
  succeeded_tasks_by_id: &HashMap<TaskId, SuccessfulGeneration>,
  sqlite_tasks_by_sora_task_id: &HashMap<String, Task>,
  recommended_download_extension: DownloadExtension,
) -> AnyhowResult<()> {

  for (task_id, generation) in succeeded_tasks_by_id.iter() {
    if !sqlite_tasks_by_sora_task_id.contains_key(task_id.as_str()) {
      continue; // Task is irrelevant - previously completed, generated elsewhere, etc.
    }

    info!("Task succeeded: {:?}", task_id);

    let generation_type = match generation.model_type {
      ModelType::GptImage1 => GenerationType::Image,
      ModelType::Sora2 => GenerationType::Video,
      _ => {
        // Fallback
        warn!("Unexpected model type: {:?}", generation.model_type);
        GenerationType::Image
      },
    };

    let prompt_request = CreatePromptRequest {
      uuid_idempotency_token: generate_random_uuid(),
      positive_prompt: generation.prompt.clone(),
      negative_prompt: None,
      model_type: Some(generation.model_type),
      generation_provider: Some(GenerationProvider::Sora),
    };

    let prompt_response = create_prompt(
      &app_env_configs.storyteller_host,
      Some(&storyteller_creds),
      prompt_request
    ).await?;

    info!("Created prompt: {:?}", &prompt_response.prompt_token);

    let mut maybe_primary_media_file_token = None;

    for (_i, item) in generation.items.iter().enumerate() {
      info!("Downloading generated file...");
      let download_path = download_generation_item(item, &app_data_root, recommended_download_extension).await?;

      info!("Uploading to backend...");

      let media_token = upload_generation_to_backend(UploadGenerationToBackendArgs {
        storyteller_api_host: &app_env_configs.storyteller_host,
        storyteller_creds: &storyteller_creds,
        upload_path: download_path,
        maybe_prompt_token: Some(&prompt_response.prompt_token),
        maybe_batch_token: None, // TODO: This should be added soon.
        generation_type,
      }).await?;

      if maybe_primary_media_file_token.is_none() {
        maybe_primary_media_file_token = Some(media_token.clone());
      }
    }

    // Clear from SQLite task database.
    if let Some(local_task) = sqlite_tasks_by_sora_task_id.get(task_id.as_str()) {
      info!("Marking local task as succeeded: {:?}", local_task.id);

      let generation_class = match generation_type {
        GenerationType::Image => TaskMediaFileClass::Image,
        GenerationType::Video => TaskMediaFileClass::Video,
      };

      let mut maybe_cdn_url = None;
      let mut maybe_thumbnail_url_template = None;

      if let Some(media_file_token) = maybe_primary_media_file_token.as_ref() {
        info!("Looking up file to grab CDN and thumbnail URLs: {:?} ...", media_file_token);

        let lookup_result = get_media_file(
          &app_env_configs.storyteller_host,
          media_file_token,
        ).await;
        match lookup_result {
          Ok(response) => {
            maybe_cdn_url = Some(response.media_file.media_links.cdn_url.to_string());
            maybe_thumbnail_url_template = media_links_to_thumbnail_template(&response.media_file.media_links)
                .map(|s| s.to_string());
          }
          Err(err) => {
            error!("Failed to look up media file after upload: {:?} (failing open)", err);
          }
        }
      }

      let updated = update_successful_task_status_with_metadata(UpdateSuccessfulTaskArgs {
        db: task_database.get_connection(),
        task_id: &local_task.id,
        maybe_batch_token: None, // TODO: Support when we have batches of items.
        maybe_primary_media_file_token: maybe_primary_media_file_token.as_ref(),
        maybe_primary_media_file_class: Some(generation_class),
        maybe_primary_media_file_thumbnail_url_template: maybe_thumbnail_url_template.as_deref(),
        maybe_primary_media_file_cdn_url: maybe_cdn_url.as_deref(),
      }).await?;

      if updated {
        // If anything breaks with queries, don't spam events.
        let event = GenerationCompleteEvent {
          action: Some(match generation_type {
            GenerationType::Image => GenerationAction::GenerateImage,
            GenerationType::Video => GenerationAction::GenerateVideo,
          }),
          service: GenerationServiceProvider::Sora,
          model: None,
        };

        event.send_infallible(&app_handle);
      }
    }
  }

  Ok(())
}


async fn download_generation_item(
  generation: &GenerationItem,
  app_data_root: &AppDataRoot,
  recommended_download_extension: DownloadExtension
) -> AnyhowResult<PathBuf> {
  info!("Downloading generation item from URL: {}", generation.url.as_str());

  let response = reqwest::get(&generation.url).await?;
  let image_bytes = response.bytes().await?;

  let extension = extract_download_extension_from_url_str(&generation.url)
      .map(|ext| ext.as_extension_without_period())
      .unwrap_or_else(|| recommended_download_extension.as_extension_without_period());
  
  let tempdir = app_data_root.temp_dir().path();
  let download_filename = format!("{}.{}", generation.item_id, extension);
  let download_path = tempdir.join(download_filename);

  info!("Writing to path: {:?}", download_path);

  let mut file = File::create(&download_path)?;
  file.write_all(&image_bytes)?;

  Ok(download_path)
}
