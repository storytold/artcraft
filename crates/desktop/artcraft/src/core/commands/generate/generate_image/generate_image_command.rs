use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_image::providers::artcraft::handle_artcraft_via_omni_endpoint::handle_artcraft_via_omni_endpoint;
use crate::core::commands::generate::generate_image::tauri_generate_image_request::{
  TauriGenerateImageErrorType, TauriGenerateImageRequest, TauriGenerateImageResponse,
};
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::Response;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::credits_balance_changed_event::CreditsBalanceChangedEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::task_database::TaskDatabase;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::common::generation_provider::GenerationProvider;
use log::{error, info};
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn generate_image_command(
  request: TauriGenerateImageRequest,
  app: AppHandle,
  app_env_configs: State<'_, AppEnvConfigs>,
  task_database: State<'_, TaskDatabase>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
) -> Response<TauriGenerateImageResponse, TauriGenerateImageErrorType, ()> {

  info!("generate_image_command called, request: {:?}", request);

  // Only Artcraft provider is supported via this command.
  // Other providers (Grok, Sora, Midjourney) should use the legacy commands.

  let is_artcraft_provider = matches!(
    request.provider,
    None | Some(GenerationProvider::Artcraft)
  );

  if !is_artcraft_provider {
    return Err(CommandErrorResponseWrapper {
      status: CommandErrorStatus::BadRequest,
      error_message: Some("Only Artcraft is supported.".to_string()),
      error_type: Some(TauriGenerateImageErrorType::NoProviderAvailable),
      error_details: None,
    });
  }

  let result = handle_artcraft_via_omni_endpoint(
    &request,
    &app_env_configs,
    &storyteller_creds_manager,
  ).await;

  match result {
    Ok(success) => {
      // Insert into task database
      let db_result = success
        .insert_into_task_database_with_frontend_payload(
          &task_database,
          request.frontend_caller,
          request.frontend_subscriber_id.as_deref(),
          request.frontend_subscriber_payload.as_deref(),
        )
        .await;

      if let Err(err) = db_result {
        error!("Failed to create task in database: {:?}", err);
      }

      map_success_to_response(success, &app)
    }
    Err(err) => map_error_to_response(err),
  }
}

// ── Result mapping ──

fn map_success_to_response(
  success: TaskEnqueueSuccess,
  app: &AppHandle,
) -> Response<TauriGenerateImageResponse, TauriGenerateImageErrorType, ()> {
  let event = GenerationEnqueueSuccessEvent {
    action: success.to_frontend_event_action(),
    service: success.to_frontend_event_service(),
    model: success.model,
  };

  if let Err(err) = event.send(app) {
    error!("Failed to emit event: {:?}", err);
  }

  CreditsBalanceChangedEvent{}.send_infallible(app);

  Ok(TauriGenerateImageResponse {}.into())
}

fn map_error_to_response(
  err: GenerateError,
) -> Response<TauriGenerateImageResponse, TauriGenerateImageErrorType, ()> {
  error!("generate_image_command error: {:?}", err);

  let error_type = match &err {
    GenerateError::BadInput(_) => TauriGenerateImageErrorType::BadInput,
    GenerateError::MissingCredentials(_) => TauriGenerateImageErrorType::NeedsStorytellerCredentials,
    GenerateError::NoProviderAvailable => TauriGenerateImageErrorType::NoProviderAvailable,
    GenerateError::BillingIssue(_) => TauriGenerateImageErrorType::BillingIssue,
    _ => TauriGenerateImageErrorType::ServerError,
  };

  Err(CommandErrorResponseWrapper {
    status: CommandErrorStatus::ServerError,
    error_message: Some(format!("{:?}", err)),
    error_type: Some(error_type),
    error_details: None,
  })
}
