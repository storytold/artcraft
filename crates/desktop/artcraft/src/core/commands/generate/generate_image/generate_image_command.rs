use crate::core::commands::enqueue::common::notify_frontend_of_errors::notify_frontend_of_errors;
use crate::core::commands::enqueue::generate_error::GenerateError;
use crate::core::commands::enqueue::image_edit::enqueue_edit_image_command::{
  enqueue_edit_image_command, EnqueueEditImageCommand, ImageEditModel,
};
use crate::core::commands::enqueue::image_inpaint::enqueue_image_inpaint_command::{
  enqueue_image_inpaint_command, EnqueueInpaintImageCommand, ImageInpaintModel,
};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::enqueue::text_to_image::enqueue_text_to_image_command::{
  enqueue_text_to_image_command, EnqueueTextToImageRequest, TextToImageModel,
};
use crate::core::commands::generate::generate_image::artcraft::handle_artcraft_via_omni_endpoint::handle_artcraft_via_omni_endpoint;
use crate::core::commands::generate::generate_image::tauri_generate_image_request::{
  TauriGenerateImageErrorType, TauriGenerateImageRequest, TauriGenerateImageResponse,
};
use crate::core::commands::generate::generate_image::tauri_image_model::TauriImageModel;
use crate::core::commands::response::failure_response_wrapper::{CommandErrorResponseWrapper, CommandErrorStatus};
use crate::core::commands::response::shorthand::Response;
use crate::core::events::basic_sendable_event_trait::BasicSendableEvent;
use crate::core::events::functional_events::credits_balance_changed_event::CreditsBalanceChangedEvent;
use crate::core::events::generation_events::generation_enqueue_success_event::GenerationEnqueueSuccessEvent;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::artcraft_usage_tracker::artcraft_usage_tracker::ArtcraftUsageTracker;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::state::provider_priority::ProviderPriorityStore;
use crate::core::state::task_database::TaskDatabase;
use crate::services::grok::state::grok_credential_manager::GrokCredentialManager;
use crate::services::grok::state::grok_image_prompt_queue::GrokImagePromptQueue;
use crate::services::midjourney::state::midjourney_credential_manager::MidjourneyCredentialManager;
use crate::services::sora::state::sora_credential_manager::SoraCredentialManager;
use crate::services::sora::state::sora_task_queue::SoraTaskQueue;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;
use enums::common::generation_provider::GenerationProvider;
use log::{error, info, warn};
use serde::Serialize;
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn generate_image_command(
  request: TauriGenerateImageRequest,
  app: AppHandle,
  app_data_root: State<'_, AppDataRoot>,
  app_env_configs: State<'_, AppEnvConfigs>,
  artcraft_usage_tracker: State<'_, ArtcraftUsageTracker>,
  provider_priority_store: State<'_, ProviderPriorityStore>,
  task_database: State<'_, TaskDatabase>,
  grok_creds_manager: State<'_, GrokCredentialManager>,
  grok_image_prompt_queue: State<'_, GrokImagePromptQueue>,
  mj_creds_manager: State<'_, MidjourneyCredentialManager>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  sora_creds_manager: State<'_, SoraCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
) -> Response<TauriGenerateImageResponse, TauriGenerateImageErrorType, ()> {

  info!("generate_image_command called, request: {:?}", request);

  // ── Try the Artcraft omni endpoint first ──
  //
  // If the provider is Artcraft (or unspecified, which defaults to Artcraft),
  // and the model is supported by the omni endpoint, send it directly.
  // This bypasses the legacy command proxy entirely.

  let is_artcraft_provider = matches!(
    request.provider,
    None | Some(GenerationProvider::Artcraft)
  );

  if is_artcraft_provider {
    let omni_result = handle_artcraft_via_omni_endpoint(
      &request,
      &app_env_configs,
      &storyteller_creds_manager,
    ).await;

    match omni_result {
      Ok(success) => return map_success_to_response(success, &app),
      Err(GenerateError::NotYetImplemented(_)) => {
        // Model not supported by omni endpoint — fall through to legacy commands.
        info!("Model not supported by omni endpoint, falling back to legacy commands.");
      }
      Err(err) => {
        // Real error — return it.
        return map_error_to_response(err);
      }
    }
  }

  // ── Fall back to legacy command proxies ──

  let model = request.model;

  let has_mask = request.inpainting_mask_image_media_token.is_some()
    || request.inpainting_mask_image_raw_bytes.is_some();
  let has_image_refs = request.image_media_tokens.as_ref().is_some_and(|t| !t.is_empty());
  let has_canvas = request.canvas_image_media_token.is_some()
    || request.canvas_image_raw_bytes.is_some();
  let has_scene = request.scene_image_media_token.is_some()
    || request.scene_image_raw_bytes.is_some();
  let has_angles = request.adjust_horizontal_angle.is_some()
    || request.adjust_vertical_angle.is_some()
    || request.adjust_zoom.is_some();

  let is_inpaint_model = matches!(
    model,
    Some(TauriImageModel::FluxDevJuggernaut) | Some(TauriImageModel::FluxPro1)
  );

  let is_edit_only_model = matches!(
    model,
    Some(TauriImageModel::FluxProKontextMax)
    | Some(TauriImageModel::QwenEdit2511Angles)
    | Some(TauriImageModel::Flux2LoraAngles)
  );

  if has_mask || is_inpaint_model {
    proxy_to_image_inpaint_command(
      request, app, app_data_root, app_env_configs, artcraft_usage_tracker,
      provider_priority_store, task_database, storyteller_creds_manager,
      sora_creds_manager, sora_task_queue,
    ).await
  } else if has_image_refs || has_canvas || has_scene || has_angles || is_edit_only_model {
    proxy_to_edit_image_command(
      request, app, app_data_root, app_env_configs, artcraft_usage_tracker,
      provider_priority_store, task_database, storyteller_creds_manager,
      sora_creds_manager, sora_task_queue,
    ).await
  } else {
    proxy_to_text_to_image_command(
      request, app, app_data_root, app_env_configs, artcraft_usage_tracker,
      provider_priority_store, task_database, mj_creds_manager,
      grok_creds_manager, grok_image_prompt_queue, storyteller_creds_manager,
      sora_creds_manager, sora_task_queue,
    ).await
  }
}

// ── Proxy to text-to-image ──

async fn proxy_to_text_to_image_command(
  request: TauriGenerateImageRequest,
  app: AppHandle,
  app_data_root: State<'_, AppDataRoot>,
  app_env_configs: State<'_, AppEnvConfigs>,
  artcraft_usage_tracker: State<'_, ArtcraftUsageTracker>,
  provider_priority_store: State<'_, ProviderPriorityStore>,
  task_database: State<'_, TaskDatabase>,
  mj_creds_manager: State<'_, MidjourneyCredentialManager>,
  grok_creds_manager: State<'_, GrokCredentialManager>,
  grok_image_prompt_queue: State<'_, GrokImagePromptQueue>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  sora_creds_manager: State<'_, SoraCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
) -> Response<TauriGenerateImageResponse, TauriGenerateImageErrorType, ()> {
  let legacy_model = request.model.and_then(map_to_text_to_image_model);

  let legacy_request = EnqueueTextToImageRequest {
    provider: request.provider,
    model: legacy_model,
    prompt: request.prompt,
    aspect_ratio: None,
    common_aspect_ratio: None,
    image_resolution: None,
    common_resolution: None,
    quality: None, // TODO: Convert enums::CommonQuality to app's CommonQuality
    number_images: request.batch_size,
    image_media_tokens: request.image_media_tokens,
    frontend_caller: request.frontend_caller,
    frontend_subscriber_id: request.frontend_subscriber_id,
    frontend_subscriber_payload: request.frontend_subscriber_payload,
  };

  let result = enqueue_text_to_image_command(
    legacy_request, app, app_data_root, app_env_configs, artcraft_usage_tracker,
    provider_priority_store, task_database, mj_creds_manager,
    grok_creds_manager, grok_image_prompt_queue, storyteller_creds_manager,
    sora_creds_manager, sora_task_queue,
  ).await;

  map_legacy_result(result)
}

// ── Proxy to edit image ──

async fn proxy_to_edit_image_command(
  request: TauriGenerateImageRequest,
  app: AppHandle,
  app_data_root: State<'_, AppDataRoot>,
  app_env_configs: State<'_, AppEnvConfigs>,
  artcraft_usage_tracker: State<'_, ArtcraftUsageTracker>,
  provider_priority_store: State<'_, ProviderPriorityStore>,
  task_database: State<'_, TaskDatabase>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  sora_creds_manager: State<'_, SoraCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
) -> Response<TauriGenerateImageResponse, TauriGenerateImageErrorType, ()> {
  let legacy_model = request.model.and_then(map_to_image_edit_model);

  // Build image_media_tokens: prepend canvas image if present.
  let mut image_tokens = request.image_media_tokens.unwrap_or_default();
  if let Some(canvas_token) = request.canvas_image_media_token {
    image_tokens.insert(0, canvas_token);
  }
  let image_media_tokens = if image_tokens.is_empty() { None } else { Some(image_tokens) };

  let legacy_request = EnqueueEditImageCommand {
    provider: request.provider,
    model: legacy_model,
    image_media_tokens,
    scene_image_media_token: request.scene_image_media_token,
    prompt: request.prompt.unwrap_or_default(),
    disable_system_prompt: request.enable_system_prompt.map(|e| !e),
    image_count: request.batch_size,
    aspect_ratio: None,
    common_aspect_ratio: None,
    image_quality: None,
    image_resolution: None,
    quality: None, // TODO: Convert enums::CommonQuality to app's CommonQuality
    horizontal_angle: request.adjust_horizontal_angle,
    vertical_angle: request.adjust_vertical_angle,
    zoom: request.adjust_zoom,
    frontend_caller: request.frontend_caller,
    frontend_subscriber_id: request.frontend_subscriber_id,
    frontend_subscriber_payload: request.frontend_subscriber_payload,
  };

  let result = enqueue_edit_image_command(
    app, legacy_request, app_data_root, app_env_configs, artcraft_usage_tracker,
    provider_priority_store, task_database, storyteller_creds_manager,
    sora_creds_manager, sora_task_queue,
  ).await;

  map_legacy_result(result)
}

// ── Proxy to inpaint ──

async fn proxy_to_image_inpaint_command(
  request: TauriGenerateImageRequest,
  app: AppHandle,
  app_data_root: State<'_, AppDataRoot>,
  app_env_configs: State<'_, AppEnvConfigs>,
  artcraft_usage_tracker: State<'_, ArtcraftUsageTracker>,
  provider_priority_store: State<'_, ProviderPriorityStore>,
  task_database: State<'_, TaskDatabase>,
  storyteller_creds_manager: State<'_, StorytellerCredentialManager>,
  sora_creds_manager: State<'_, SoraCredentialManager>,
  sora_task_queue: State<'_, SoraTaskQueue>,
) -> Response<TauriGenerateImageResponse, TauriGenerateImageErrorType, ()> {
  let legacy_model = request.model.and_then(map_to_inpaint_model);

  // Source image: canvas_image_media_token or first image_media_token.
  let source_image = request.canvas_image_media_token
    .or_else(|| request.image_media_tokens.as_ref().and_then(|t| t.first().cloned()));

  let legacy_request = EnqueueInpaintImageCommand {
    provider: request.provider,
    model: legacy_model,
    image_media_token: source_image,
    mask_image_media_token: request.inpainting_mask_image_media_token,
    mask_image_raw_bytes: request.inpainting_mask_image_raw_bytes,
    prompt: request.prompt.unwrap_or_default(),
    image_count: request.batch_size,
    quality: None, // TODO: Convert enums::CommonQuality to app's CommonQuality
    require_matching_dimensions: None,
    frontend_caller: request.frontend_caller,
    frontend_subscriber_id: request.frontend_subscriber_id,
    frontend_subscriber_payload: request.frontend_subscriber_payload,
  };

  let result = enqueue_image_inpaint_command(
    app, legacy_request, app_data_root, app_env_configs, artcraft_usage_tracker,
    provider_priority_store, task_database, storyteller_creds_manager,
    sora_creds_manager, sora_task_queue,
  ).await;

  map_legacy_result(result)
}

// ── Model mapping helpers ──

fn map_to_text_to_image_model(model: TauriImageModel) -> Option<TextToImageModel> {
  match model {
    TauriImageModel::Flux1Dev => Some(TextToImageModel::Flux1Dev),
    TauriImageModel::Flux1Schnell => Some(TextToImageModel::Flux1Schnell),
    TauriImageModel::FluxPro11 => Some(TextToImageModel::FluxPro11),
    TauriImageModel::FluxPro11Ultra => Some(TextToImageModel::FluxPro11Ultra),
    TauriImageModel::GrokImage => Some(TextToImageModel::GrokImage),
    TauriImageModel::Recraft3 => Some(TextToImageModel::Recraft3),
    TauriImageModel::GptImage1 => Some(TextToImageModel::GptImage1),
    TauriImageModel::GptImage1p5 => Some(TextToImageModel::GptImage1p5),
    TauriImageModel::GptImage2 => Some(TextToImageModel::GptImage2),
    TauriImageModel::Gemini25Flash => Some(TextToImageModel::Gemini25Flash),
    TauriImageModel::NanoBanana => Some(TextToImageModel::NanoBanana),
    TauriImageModel::NanoBanana2 => Some(TextToImageModel::NanoBanana2),
    TauriImageModel::NanoBananaPro => Some(TextToImageModel::NanoBananaPro),
    TauriImageModel::Seedream4 => Some(TextToImageModel::Seedream4),
    TauriImageModel::Seedream4p5 => Some(TextToImageModel::Seedream4p5),
    TauriImageModel::Seedream5Lite => Some(TextToImageModel::Seedream5Lite),
    TauriImageModel::Midjourney => Some(TextToImageModel::Midjourney),
    _ => None,
  }
}

fn map_to_image_edit_model(model: TauriImageModel) -> Option<ImageEditModel> {
  match model {
    TauriImageModel::FluxProKontextMax => Some(ImageEditModel::FluxProKontextMax),
    TauriImageModel::Gemini25Flash => Some(ImageEditModel::Gemini25Flash),
    TauriImageModel::NanoBanana => Some(ImageEditModel::NanoBanana),
    TauriImageModel::NanoBanana2 => Some(ImageEditModel::NanoBanana2),
    TauriImageModel::NanoBananaPro => Some(ImageEditModel::NanoBananaPro),
    TauriImageModel::GptImage1 => Some(ImageEditModel::GptImage1),
    TauriImageModel::GptImage1p5 => Some(ImageEditModel::GptImage1p5),
    TauriImageModel::Seedream4 => Some(ImageEditModel::Seedream4),
    TauriImageModel::Seedream4p5 => Some(ImageEditModel::Seedream4p5),
    TauriImageModel::Seedream5Lite => Some(ImageEditModel::Seedream5Lite),
    TauriImageModel::QwenEdit2511Angles => Some(ImageEditModel::QwenEdit2511Angles),
    TauriImageModel::Flux2LoraAngles => Some(ImageEditModel::Flux2LoraAngles),
    _ => None,
  }
}

fn map_to_inpaint_model(model: TauriImageModel) -> Option<ImageInpaintModel> {
  match model {
    TauriImageModel::FluxDevJuggernaut => Some(ImageInpaintModel::FluxDevJuggernaut),
    TauriImageModel::FluxPro1 => Some(ImageInpaintModel::FluxPro1),
    TauriImageModel::FluxProKontextMax => Some(ImageInpaintModel::FluxProKontextMax),
    TauriImageModel::Gemini25Flash => Some(ImageInpaintModel::Gemini25Flash),
    _ => None,
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

  Err(CommandErrorResponseWrapper {
    status: CommandErrorStatus::ServerError,
    error_message: Some(format!("{:?}", err)),
    error_type: Some(TauriGenerateImageErrorType::ServerError),
    error_details: None,
  })
}

/// Map any legacy command result to our unified response type.
fn map_legacy_result<S, E: Serialize, D: Serialize>(
  result: Result<S, CommandErrorResponseWrapper<E, D>>,
) -> Response<TauriGenerateImageResponse, TauriGenerateImageErrorType, ()> {
  match result {
    Ok(_) => Ok(TauriGenerateImageResponse {}.into()),
    Err(legacy_err) => {
      warn!("Legacy command proxy failed: {:?}", legacy_err.error_message);
      Err(CommandErrorResponseWrapper {
        status: legacy_err.status,
        error_message: legacy_err.error_message,
        error_type: Some(TauriGenerateImageErrorType::ServerError),
        error_details: None,
      })
    }
  }
}
