use crate::core::commands::generate::omni::{self, Modality, OmniRequest, OmniResult};
use crate::core::commands::generate::omni::dispatch::{adapt_legacy_response, decode_native};
use tauri::Manager;
use crate::core::commands::enqueue::common::notify_frontend_of_errors::notify_frontend_of_errors;
use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError, MissingCredentialsReason};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_video::artcraft::handle_artcraft_video::handle_video_artcraft;
use crate::core::commands::generate::generate_video::grok::handle_grok_video::handle_grok_video;
use crate::core::commands::generate::generate_video::request::{
  TauriGenerateVideoErrorType, TauriGenerateVideoRequest, TauriGenerateVideoResponse,
  TauriVideoModel,
};
use crate::core::commands::generate::generate_video::sora2::handle_sora_sora2::handle_sora_sora2;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::Response;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::credits_balance_changed_event::CreditsBalanceChangedEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_tracker::ArtcraftUsageTracker;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_type::{ArtcraftUsagePage, ArtcraftUsageType};
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::{Provider, ProviderPriorityStore};
use crate::core::state::task_database::TaskDatabase;
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::common::generation_provider::GenerationProvider;
use log::{error, info, warn};
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn generate_video_command(request: OmniRequest, app: AppHandle) -> OmniResult {
  if request.uses_artcraft() {
    return omni::generate(request, Modality::Video, &app).await;
  }
  adapt_legacy_response(generate_video_native(
    decode_native(request)?, app.clone(),
    app.state(), app.state(), app.state(), app.state(), app.state(), app.state(), app.state(), app.state(), app.state(),
  ).await)
}

async fn generate_video_native(
  mut request: TauriGenerateVideoRequest,
  app: AppHandle,
  app_env_configs: State<'_, AppEnvConfigs>,
  app_data_root: State<'_, AppDataRoot>,
  artcraft_usage_tracker: State<'_, ArtcraftUsageTracker>,
  provider_priority_store: State<'_, ProviderPriorityStore>,
  task_database: State<'_, TaskDatabase>,
  grok_creds_manager: State<'_, GrokCredentialManager>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
  sora_creds_manager: State<'_, SoraCredentialManager>,
) -> Response<TauriGenerateVideoResponse, TauriGenerateVideoErrorType, ()> {

  info!("generate_video_command called, request: {:?}", request);

  if request.image_media_token.is_none()
      && request.start_frame_image_media_token.is_some() {
    // NB: This is to fix the legacy handlers
    request.image_media_token = request.start_frame_image_media_token.clone();
  }

  if request.image_media_token.is_some()
      && request.start_frame_image_media_token.is_none() {
    // NB: This is to fix the modern handlers
    request.start_frame_image_media_token = request.image_media_token.clone();
  }

  let result = handle_request(
    request,
    &app,
    &app_env_configs,
    &app_data_root,
    &artcraft_usage_tracker,
    &provider_priority_store,
    &task_database,
    &grok_creds_manager,
    &sora_creds_manager,
    &storyteller_creds_manager,
  ).await;

  match result {
    Err(err) => {
      error!("error: {:?}", err);

      notify_frontend_of_errors(&app, &err).await;

      let mut status = CommandErrorStatus::ServerError;
      let mut error_type = TauriGenerateVideoErrorType::ServerError;
      let mut error_message = "A server error occurred. Please try again. If it continues, please tell our staff about the problem.";

      match err {
        GenerateError::BadInput(BadInputReason::NoModelSpecified) => {
          status = CommandErrorStatus::BadRequest;
          error_type = TauriGenerateVideoErrorType::ModelNotSpecified;
          error_message = "No model specified for video generation";
        }
        GenerateError::NoProviderAvailable => {
          status = CommandErrorStatus::ServerError;
          error_type = TauriGenerateVideoErrorType::NoProviderAvailable;
          error_message = "No configured provider available for video generation";
        }
        GenerateError::MissingCredentials(MissingCredentialsReason::NeedsFalApiKey) => {
          status = CommandErrorStatus::Unauthorized;
          error_type = TauriGenerateVideoErrorType::NeedsFalApiKey;
          error_message = "You need to set a FAL api key";
        },
        GenerateError::MissingCredentials(MissingCredentialsReason::NeedsStorytellerCredentials) => {
          status = CommandErrorStatus::Unauthorized;
          error_type = TauriGenerateVideoErrorType::NeedsStorytellerCredentials;
          error_message = "You need to be logged into Artcraft.";
        }
        _ => {}, // Fall-through
      }

      Err(CommandErrorResponseWrapper {
        status,
        error_message: Some(error_message.to_string()),
        error_type: Some(error_type),
        error_details: None,
      })
    }
    Ok(event) => {
      let event = GenerationEnqueueSuccessEvent {
        action: event.to_frontend_event_action(),
        service: event.to_frontend_event_service(),
        model: event.model,
      };

      if let Err(err) = event.send(&app) {
        error!("Failed to emit event: {:?}", err);
      }

      CreditsBalanceChangedEvent{}.send_infallible(&app);

      Ok(TauriGenerateVideoResponse {}.into())
    }
  }
}

async fn handle_request(
  request: TauriGenerateVideoRequest,
  app: &AppHandle,
  app_env_configs: &AppEnvConfigs,
  app_data_root: &AppDataRoot,
  artcraft_usage_tracker: &ArtcraftUsageTracker,
  provider_priority_store: &ProviderPriorityStore,
  task_database: &TaskDatabase,
  grok_creds_manager: &GrokCredentialManager,
  sora_creds_manager: &SoraCredentialManager,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {

  let model = match request.model {
    Some(model) => model,
    None => {
      return Err(GenerateError::no_model_specified())
    }
  };

  let provider = match (model, request.provider) {
    (TauriVideoModel::GrokVideo, _) => GenerationProvider::Grok,
    // NB: Grok Imagine 1.5 is served via Artcraft (storyteller-web / artcraft_router)
    // for now — force it regardless of the requested provider. In the future we
    // may serve it natively via the Grok provider.
    (TauriVideoModel::GrokImagineVideo1p5, _) => GenerationProvider::Artcraft,
    _ => request.provider.unwrap_or(GenerationProvider::Artcraft),
  };

  info!("generate video with {:?} via provider {:?}", &model, &provider);

  let result = match provider {
    GenerationProvider::Grok => {
      handle_grok_video(
        &request,
        app,
        app_data_root,
        app_env_configs,
        grok_creds_manager,
      ).await.map(|event| vec![event])
    }
    GenerationProvider::Sora => {
      handle_sora_sora2(
        &request,
        app,
        app_data_root,
        app_env_configs,
        sora_creds_manager,
      ).await.map(|event| vec![event])
    }
    _ => {
      handle_video_artcraft(
        &request,
        app,
        app_env_configs,
        storyteller_creds_manager,
      ).await
    }
  };

  let (success_event, count) = persist_video_tasks(result?, task_database, &request).await?;

  if let Err(err) = artcraft_usage_tracker.record_video_generation(count, ArtcraftUsageType::ImageToResult, ArtcraftUsagePage::VideoPage) {
    warn!("Failed to report usage: {:?}", err);
  }

  Ok(success_event)
}

async fn persist_video_tasks(events: Vec<TaskEnqueueSuccess>, task_database: &TaskDatabase, request: &TauriGenerateVideoRequest) -> Result<(TaskEnqueueSuccess, u16), GenerateError> {
  let count = u16::try_from(events.len()).unwrap_or(u16::MAX);
  for (index, event) in events.iter().enumerate() {
    let result = event.insert_into_task_database_with_frontend_payload(task_database, request.frontend_caller, request.frontend_subscriber_id.as_deref(), request.frontend_subscriber_payload.as_deref()).await;

    if let Err(err) = result {
      // Generation is already accepted; returning an error could prompt duplicate submissions.
      let role = if index == 0 { "primary" } else { "secondary" };
      error!("Failed to persist accepted {} video job {:?}: {:?}", role, event.provider_job_id, err);
    }
  }

  events.into_iter().next().map(|event| (event, count)).ok_or(GenerateError::ResponseHadNoJobTokens)
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::events::generation_events::common::GenerationModel;
  use enums::tauri::tasks::task_status::TaskStatus;
  use enums::tauri::tasks::task_type::TaskType;
  use enums::tauri::ux::tauri_command_caller::TauriCommandCaller;
  use serde_json::json;
  use sqlite_tasks::queries::list_tasks_by_provider_and_tokens::{list_tasks_by_provider_and_tokens, ListTasksArgs};

  const JOBS: [&str; 3] = ["job_primary", "job_second", "job_third"];

  mod persistence {
    use super::*;

    #[tokio::test]
    async fn persists_batch_and_single_video_jobs_with_subscriber_metadata() {
      for jobs in [&JOBS[..], &JOBS[..1]] {
        let directory = tempfile::tempdir().unwrap();
        let root = AppDataRoot::create_existing(directory.path()).unwrap();
        let database = TaskDatabase::connect(&root).await.unwrap();
        let request: TauriGenerateVideoRequest = serde_json::from_value(json!({
          "frontend_caller": "image_to_video",
          "frontend_subscriber_id": "video-editor",
          "frontend_subscriber_payload": "scene-123",
        }))
        .unwrap();
        let events = jobs.iter().copied().map(video_event).collect();

        let (event, count) = persist_video_tasks(events, &database, &request).await.unwrap();
        assert_eq!(event.provider_job_id.as_deref(), Some(JOBS[0]));
        assert_eq!(usize::from(count), jobs.len());
        database.get_connection().get_pool().close().await;

        let reopened = TaskDatabase::connect(&root).await.unwrap();
        let mut tasks = list_tasks_by_provider_and_tokens(ListTasksArgs { db: reopened.get_connection(), provider: GenerationProvider::Artcraft, provider_job_ids: None }).await.unwrap().tasks;
        tasks.sort_by(|left, right| left.provider_job_id.cmp(&right.provider_job_id));
        assert_eq!(tasks.iter().map(|task| task.provider_job_id.as_deref().unwrap()).collect::<Vec<_>>(), jobs);
        for task in tasks {
          assert_eq!(task.status, TaskStatus::Pending);
          assert_eq!(task.task_type, TaskType::VideoGeneration);
          assert_eq!(task.frontend_caller, Some(TauriCommandCaller::ImageToVideo));
          assert_eq!(task.frontend_subscriber_id.as_deref(), Some("video-editor"));
          assert_eq!(task.frontend_subscriber_payload.as_deref(), Some("scene-123"));
        }
        reopened.get_connection().get_pool().close().await;
      }
    }

    #[tokio::test]
    async fn preserves_accepted_batch_when_primary_or_secondary_insert_fails() {
      for failed_job in &JOBS[..2] {
        let directory = tempfile::tempdir().unwrap();
        let root = AppDataRoot::create_existing(directory.path()).unwrap();
        let database = TaskDatabase::connect(&root).await.unwrap();
        let existing_id = video_event(failed_job).insert_into_task_database_with_frontend_payload(&database, None, Some("existing-tracker"), None).await.unwrap();
        let request = serde_json::from_value(json!({ "frontend_subscriber_id": "new-tracker" })).unwrap();
        let events = JOBS.iter().copied().map(video_event).collect();

        let (event, count) = persist_video_tasks(events, &database, &request).await.unwrap();
        assert_eq!(event.provider_job_id.as_deref(), Some(JOBS[0]));
        assert_eq!(usize::from(count), JOBS.len());
        database.get_connection().get_pool().close().await;

        let reopened = TaskDatabase::connect(&root).await.unwrap();
        let mut tasks = list_tasks_by_provider_and_tokens(ListTasksArgs { db: reopened.get_connection(), provider: GenerationProvider::Artcraft, provider_job_ids: None }).await.unwrap().tasks;
        tasks.sort_by(|left, right| left.provider_job_id.cmp(&right.provider_job_id));
        assert_eq!(tasks.iter().map(|task| task.provider_job_id.as_deref().unwrap()).collect::<Vec<_>>(), JOBS);
        for task in tasks {
          if task.provider_job_id.as_deref() == Some(*failed_job) {
            assert_eq!(task.id, existing_id);
            assert_eq!(task.frontend_subscriber_id.as_deref(), Some("existing-tracker"));
          } else {
            assert_eq!(task.frontend_subscriber_id.as_deref(), Some("new-tracker"));
          }
        }
        reopened.get_connection().get_pool().close().await;
      }
    }

    #[tokio::test]
    async fn rejects_an_empty_video_batch() {
      let directory = tempfile::tempdir().unwrap();
      let root = AppDataRoot::create_existing(directory.path()).unwrap();
      let database = TaskDatabase::connect(&root).await.unwrap();
      let request = serde_json::from_value(json!({})).unwrap();
      let result = persist_video_tasks(Vec::new(), &database, &request).await;
      assert!(matches!(result, Err(GenerateError::ResponseHadNoJobTokens)));
      database.get_connection().get_pool().close().await;
    }
  }

  fn video_event(job: &str) -> TaskEnqueueSuccess {
    TaskEnqueueSuccess { task_type: TaskType::VideoGeneration, model: Some(GenerationModel::Seedance1p5Pro), provider: GenerationProvider::Artcraft, provider_job_id: Some(job.to_string()), maybe_queue_status_url: None, maybe_queue_response_url: None, maybe_prompt_token: None }
  }
}
