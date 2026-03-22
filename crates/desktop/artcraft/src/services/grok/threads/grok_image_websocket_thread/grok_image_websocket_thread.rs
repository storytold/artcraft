use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::text_to_image_generation_complete_event::{GeneratedImage, TextToImageGenerationCompleteEvent};
use crate::core::events::generation_events::common::{GenerationAction, GenerationServiceProvider};
use crate::core::events::generation_events::generation_complete_event::GenerationCompleteEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::task_database::TaskDatabase;
use crate::core::utils::download_url_to_temp_dir::download_url_to_temp_dir;
use crate::core::utils::task_database_pending_statuses::TASK_DATABASE_PENDING_STATUSES;
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;
use crate::services::grok::state::grok_image_prompt_queue::{GrokImagePromptQueue, PromptItem};
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use anyhow::anyhow;
use artcraft_api_defs::prompts::create_prompt::CreatePromptRequest;
use artcraft_api_defs::utils::media_links_to_thumbnail_template::media_links_to_thumbnail_template;
use enums::common::generation_provider::GenerationProvider;
use enums::common::model_type::ModelType;
use enums::tauri::tasks::task_media_file_class::TaskMediaFileClass;
use errors::AnyhowResult;
use grok_client::recipes::prompt_websocket_image_with_retry::{prompt_websocket_image_with_retry, PromptWebsocketImageWithRetryArgs};
use grok_client::requests::image_websocket::create_listen_websocket::{create_listen_websocket, CreateListenWebsocketArgs};
use grok_client::requests::image_websocket::grok_websocket::GrokWebsocket;
use grok_client::requests::image_websocket::grok_wrapped_websocket::GrokWrappedWebsocket;
use grok_client::requests::image_websocket::listen_for_websocket_images::{listen_for_websocket_images, ImageResults, ListenForWebsocketImagesArgs};
use grok_client::requests::image_websocket::messages::websocket_client_message::ClientMessageAspectRatio;
use grok_client::requests::image_websocket::prompt_websocket_image::{prompt_websocket_image, PromptWebsocketImageArgs};
use uuid_utils::uuid::generate_random_uuid;
use log::{error, info, warn};
use sqlite_tasks::queries::get_task_by_provider_and_provider_job_id::{get_task_by_provider_and_provider_job_id, GetTaskByProviderAndProviderJobIdArgs};
use sqlite_tasks::queries::list_tasks_by_provider_and_status::{list_tasks_by_provider_and_status, ListTasksByProviderAndStatusArgs};
use sqlite_tasks::queries::task::Task;
use sqlite_tasks::queries::update_successful_task_status_with_metadata::{update_successful_task_status_with_metadata, UpdateSuccessfulTaskArgs};
use sqlite_tasks::queries::update_successful_task_status_with_metadata_by_provider::{update_successful_task_status_with_metadata_by_provider, UpdateSuccessfulTaskByProviderArgs};
use std::time::Duration;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use artcraft_client::endpoints::media_files::list_batch_generated_redux_media_files::list_batch_generated_redux_media_files;
use artcraft_client::endpoints::media_files::upload_image_media_file_from_file::{upload_image_media_file_from_file, UploadImageFromFileArgs, UploadImageMediaFileSuccessResponse};
use artcraft_client::endpoints::prompts::create_prompt::create_prompt;
use artcraft_client::error::api_error::ApiError;
use artcraft_client::error::storyteller_error::StorytellerError;
use tauri::AppHandle;
use tokens::tokens::batch_generations::BatchGenerationToken;
use tokens::tokens::sqlite::tasks::TaskId;

pub async fn grok_image_websocket_thread(
  app_handle: AppHandle,
  app_env_configs: AppEnvConfigs,
  app_data_root: AppDataRoot,
  task_database: TaskDatabase,
  creds: GrokCredentialManager,
  prompt_queue: GrokImagePromptQueue,
  storyteller_creds_manager: StorytellerCredentialManager,
) -> ! {
  loop {
    let res = inner_loop(
      &app_handle,
      &app_env_configs,
      &app_data_root,
      &task_database,
      &creds,
      &prompt_queue,
      &storyteller_creds_manager,
    ).await;
    if let Err(err) = res {
      error!("An error occurred: {:?}", err);
    }
    // NB: Only sleep if an error occurs.
    tokio::time::sleep(std::time::Duration::from_millis(30_000)).await;
  }
}

async fn inner_loop(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  task_database: &TaskDatabase,
  grok_creds: &GrokCredentialManager,
  prompt_queue: &GrokImagePromptQueue,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> AnyhowResult<()> {

  loop {
    if !grok_creds.do_task_polling()? {
      tokio::time::sleep(std::time::Duration::from_millis(10_000)).await;
      continue;
    }

    let maybe_cookies = grok_creds.maybe_copy_typed_cookies()?;

    //let maybe_cookie_header = grok_creds.maybe_copy_cookie_header_string()?;

    let cookies = match maybe_cookies {
      Some(cookies) => cookies,
      None => {
        tokio::time::sleep(std::time::Duration::from_millis(10_000)).await;
        continue;
      },
    };

    //let cookie_header = match maybe_cookie_header {
    //  Some(cookie_header) => cookie_header,
    //  None => {
    //    tokio::time::sleep(std::time::Duration::from_millis(10_000)).await;
    //    continue;
    //  }
    //};

    let websocket = create_listen_websocket(CreateListenWebsocketArgs {
      cookies: cookies.as_str(),
    }).await?;

    let mut websocket = GrokWebsocket::new(websocket);

    loop {
      let maybe_prompt = prompt_queue.dequeue()?;

      let prompt_item = match maybe_prompt {
        Some(prompt_item) => prompt_item,
        None => {
          tokio::time::sleep(std::time::Duration::from_millis(1_000)).await;
          continue;
        }
      };

      info!("Prompt received over in-memory queue. Prompting Grok websocket: {}", prompt_item.prompt);

      let result = prompt_websocket_image_with_retry(PromptWebsocketImageWithRetryArgs {
        websocket: &mut websocket,
        prompt: &prompt_item.prompt,
        aspect_ratio: prompt_item.aspect_ratio,
        cookies: &cookies,
      }).await?;

      if let Some(new_websocket) = result.maybe_new_websocket {
        info!("Replacing websocket with new one...");
        websocket = new_websocket;
      }

      let images = listen_for_websocket_images(ListenForWebsocketImagesArgs {
        websocket: &mut websocket,
        timeout: Duration::from_millis(30_000),
      }).await?;

      upload_images_to_storyteller(
        &app_handle,
        &app_env_configs,
        &app_data_root,
        &task_database,
        &storyteller_creds_manager,
        &prompt_item,
        &images,
      ).await?
    }

  }
}

async fn upload_images_to_storyteller(
  app_handle: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  task_database: &TaskDatabase,
  storyteller_creds_manager: &StorytellerCredentialManager,
  prompt_item: &PromptItem,
  images: &ImageResults,
) -> AnyhowResult<()> {

  loop {
    let storyteller_creds = match storyteller_creds_manager.get_credentials()? {
      Some(creds) => creds,
      None => {
        error!("No Storyteller credentials found. Cannot proceed with Grok polling.");
        tokio::time::sleep(std::time::Duration::from_millis(5_000)).await;
        continue;
      }
    };

    let prompt = prompt_item.prompt.trim().to_string();

    let request = CreatePromptRequest {
      uuid_idempotency_token: generate_random_uuid(),
      positive_prompt: Some(prompt),
      negative_prompt: None,
      model_type: Some(ModelType::GrokImage),
      generation_provider: Some(GenerationProvider::Grok),
    };

    let prompt_response = create_prompt(
      &app_env_configs.storyteller_host,
      Some(&storyteller_creds),
      request
    ).await?;

    info!("Created prompt: {:?}", &prompt_response.prompt_token);

    // TODO: Move this from clientside to the backend.
    //  The first upload should produce a batch token that we can reuse.
    let batch_token = BatchGenerationToken::generate();

    let mut maybe_primary_media_file_token = None;

    for (i, image) in images.images.iter().enumerate() {
      loop {
        let url = image.url.to_string();
        let file = download_url_to_temp_dir(&url, app_data_root).await?;

        info!("Uploading image {} of {} ...", i, images.images.len());

        let result = upload_image_media_file_from_file(UploadImageFromFileArgs {
          api_host: &app_env_configs.storyteller_host,
          maybe_creds: Some(&storyteller_creds),
          path: file.path(),
          is_intermediate_system_file: false,
          maybe_prompt_token: Some(&prompt_response.prompt_token),
          maybe_batch_token: Some(&batch_token),
        }).await;

        match result {
          Ok(uploaded) => {
            if maybe_primary_media_file_token.is_none() {
              maybe_primary_media_file_token = Some(uploaded.media_file_token);
            }
            break; // Break retry loop.
          }
          Err(StorytellerError::Api(ApiError::TooManyRequests(_))) => {
            tokio::time::sleep(std::time::Duration::from_millis(10_000)).await;
            continue;
          }
          Err(err) => {
            error!("Error uploading image: {}", err);
            break;
          }
        }
      } // Retry on 429s, etc.
    }

    let event = GenerationCompleteEvent {
      //media_file_token: result.media_file_token,
      action: Some(GenerationAction::GenerateImage),
      service: GenerationServiceProvider::Grok,
      model: None,
    };

    event.send_infallible(&app_handle);

    let task = get_task_by_provider_and_provider_job_id(GetTaskByProviderAndProviderJobIdArgs {
      db: task_database.get_connection(),
      provider: GenerationProvider::Grok,
      provider_job_id: &prompt_item.task_id,
    }).await?;

    let task = match task {
      Some(task) => task,
      None => {
        warn!("Couldn't find local sqlite task by id: {}", &prompt_item.task_id);
        return Ok(());
      }
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
      task_id: &task.id,
      maybe_batch_token: Some(&batch_token),
      maybe_primary_media_file_token: maybe_primary_media_file_token.as_ref(),
      maybe_primary_media_file_class: Some(TaskMediaFileClass::Image),
      maybe_primary_media_file_thumbnail_url_template: maybe_thumbnail_url_template.as_deref(),
      maybe_primary_media_file_cdn_url: maybe_cdn_url.as_deref(),
    }).await?;

    if !updated {
      return Ok(()); // If anything breaks with queries, don't spam events.
    }

    send_frontend_ui_update(
      app_handle,
      app_env_configs,
      Some(&storyteller_creds),
      &task,
      &batch_token,
    ).await?;

    return Ok(())
  }
}

async fn send_frontend_ui_update(
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  maybe_creds: Option<&StorytellerCredentialSet>,
  task: &Task,
  batch_token: &BatchGenerationToken,
) -> AnyhowResult<()> {

  let result = list_batch_generated_redux_media_files(
    &app_env_configs.storyteller_host,
    maybe_creds,
    batch_token,
  ).await?;

  if result.media_files.is_empty() {
    return Err(anyhow!("No media files found for batch token: {}", batch_token));
  }

  let media_files = result.media_files
      .into_iter()
      .map(|file| GeneratedImage {
        media_token: file.token,
        cdn_url: file.media_links.cdn_url,
        maybe_thumbnail_template: file.media_links.maybe_thumbnail_template,
      })
      .collect();

  let event = TextToImageGenerationCompleteEvent {
    generated_images: media_files,
    maybe_frontend_subscriber_id: task.frontend_subscriber_id.clone(),
    maybe_frontend_subscriber_payload: task.frontend_subscriber_payload.clone(),
  };

  event.send_infallible(app);

  Ok(())
}
