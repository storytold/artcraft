use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use artcraft_client::endpoints::omni_gen::generate::image::omni_gen_image::omni_gen_image_generate;
use enums::common::generation::common_image_model::CommonImageModel;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info};

use crate::core::commands::enqueue::generate_error::{GenerateError, MissingCredentialsReason};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::commands::generate::generate_image::tauri_image_model::TauriImageModel;
use crate::core::events::generation_events::common::GenerationModel;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;

pub async fn handle_artcraft_via_omni_endpoint(
  request: &TauriGenerateImageRequest,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  let model = request.model.ok_or(GenerateError::no_model_specified())?;

  let omni_model = map_to_common_image_model(model)
    .ok_or(GenerateError::NotYetImplemented(
      format!("Model {:?} is not supported via the omni endpoint", model),
    ))?;

  let generation_model = map_to_generation_model(model);

  let creds = match storyteller_creds_manager.get_credentials()? {
    Some(creds) => creds,
    None => return Err(GenerateError::MissingCredentials(MissingCredentialsReason::NeedsStorytellerCredentials)),
  };

  // Build the omni gen request.
  let mut image_media_tokens = request.image_media_tokens.clone().unwrap_or_default();

  // Prepend canvas image if present.
  if let Some(canvas_token) = &request.canvas_image_media_token {
    image_media_tokens.insert(0, canvas_token.clone());
  }

  let image_media_tokens = if image_media_tokens.is_empty() { None } else { Some(image_media_tokens) };

  let omni_request = OmniGenImageCostAndGenerateRequest {
    idempotency_token: None,
    model: Some(omni_model),
    prompt: request.prompt.clone(),
    image_media_tokens,
    resolution: None, // TODO: Convert from request.resolution
    aspect_ratio: None, // TODO: Convert from request.aspect_ratio
    quality: request.quality,
    image_batch_count: request.batch_size.map(|n| n as u16),
    adjust_horizontal_angle: request.adjust_horizontal_angle,
    adjust_vertical_angle: request.adjust_vertical_angle,
    adjust_zoom: request.adjust_zoom,
  };

  info!("Sending image generation via omni endpoint: model={:?}", omni_model);

  let response = omni_gen_image_generate(
    &app_env_configs.storyteller_host,
    Some(&creds),
    omni_request,
  ).await.map_err(|err| {
    error!("Omni image generation failed: {:?}", err);
    GenerateError::from(err)
  })?;

  info!("Omni image generation succeeded: job_token={}", response.inference_job_token.as_str());

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::ImageGeneration,
    model: Some(generation_model),
    provider: GenerationProvider::Artcraft,
    provider_job_id: Some(response.inference_job_token.to_string()),
  })
}

// ── Model mapping helpers ──

fn map_to_common_image_model(model: TauriImageModel) -> Option<CommonImageModel> {
  match model {
    TauriImageModel::Flux1Dev => Some(CommonImageModel::Flux1Dev),
    TauriImageModel::Flux1Schnell => Some(CommonImageModel::Flux1Schnell),
    TauriImageModel::FluxPro11 => Some(CommonImageModel::FluxPro11),
    TauriImageModel::FluxPro11Ultra => Some(CommonImageModel::FluxPro11Ultra),
    TauriImageModel::Gemini25Flash => Some(CommonImageModel::NanoBanana), // NB: Alias for Nano Banana
    TauriImageModel::GptImage1 => Some(CommonImageModel::GptImage1),
    TauriImageModel::GptImage1p5 => Some(CommonImageModel::GptImage1p5),
    TauriImageModel::GptImage2 => Some(CommonImageModel::GptImage2),
    TauriImageModel::NanoBanana => Some(CommonImageModel::NanoBanana),
    TauriImageModel::NanoBanana2 => Some(CommonImageModel::NanoBanana2),
    TauriImageModel::NanoBananaPro => Some(CommonImageModel::NanoBananaPro),
    TauriImageModel::Seedream4 => Some(CommonImageModel::Seedream4),
    TauriImageModel::Seedream4p5 => Some(CommonImageModel::Seedream4p5),
    TauriImageModel::Seedream5Lite => Some(CommonImageModel::Seedream5Lite),
    // Models not in CommonImageModel (Grok, Recraft, Midjourney, edit-only, inpaint-only)
    _ => None,
  }
}

fn map_to_generation_model(model: TauriImageModel) -> GenerationModel {
  match model {
    TauriImageModel::Flux1Dev => GenerationModel::Flux1Dev,
    TauriImageModel::Flux1Schnell => GenerationModel::Flux1Schnell,
    TauriImageModel::Flux2LoraAngles => GenerationModel::Flux2LoraAngles,
    TauriImageModel::FluxDevJuggernaut => GenerationModel::FluxDevJuggernaut,
    TauriImageModel::FluxPro1 => GenerationModel::FluxPro1,
    TauriImageModel::FluxPro11 => GenerationModel::FluxPro11,
    TauriImageModel::FluxPro11Ultra => GenerationModel::FluxPro11Ultra,
    TauriImageModel::FluxProKontextMax => GenerationModel::FluxProKontextMax,
    TauriImageModel::Gemini25Flash => GenerationModel::NanoBanana, // NB: Alias for Nano Banana
    TauriImageModel::GptImage1 => GenerationModel::GptImage1,
    TauriImageModel::GptImage1p5 => GenerationModel::GptImage1p5,
    TauriImageModel::GptImage2 => GenerationModel::GptImage2,
    TauriImageModel::GrokImage => GenerationModel::GrokImage,
    TauriImageModel::NanoBanana => GenerationModel::NanoBanana,
    TauriImageModel::NanoBanana2 => GenerationModel::NanoBanana2,
    TauriImageModel::NanoBananaPro => GenerationModel::NanoBananaPro,
    TauriImageModel::QwenEdit2511Angles => GenerationModel::QwenEdit2511Angles,
    TauriImageModel::Seedream4 => GenerationModel::Seedream4,
    TauriImageModel::Seedream4p5 => GenerationModel::Seedream4p5,
    TauriImageModel::Seedream5Lite => GenerationModel::Seedream5Lite,
    // TODO:
    TauriImageModel::Midjourney => GenerationModel::Flux1Dev, // Fallback
    TauriImageModel::Recraft3 => GenerationModel::Flux1Dev, // Fallback
  }
}
