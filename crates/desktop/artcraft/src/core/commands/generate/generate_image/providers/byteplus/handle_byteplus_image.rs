use artcraft_api_defs::prompts::create_prompt::CreatePromptRequest;
use artcraft_client::endpoints::prompts::create_prompt::create_prompt;
use base64::Engine;
use base64::engine::general_purpose::STANDARD as BASE64;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info, warn};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use uuid_utils::uuid::generate_random_uuid;

use crate::core::api_adapters::models::image::tauri_image_model_to_common_model_type::tauri_image_model_to_common_model_type;
use crate::core::api_adapters::models::image::tauri_image_model_to_generation_model::tauri_image_model_to_generation_model;
use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError, MissingCredentialsReason};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::byteplus::byteplus_common::read_byteplus_api_key;
use crate::core::commands::generate::byteplus::byteplus_image_models::{byteplus_image_model_id, max_reference_images};
use crate::core::commands::generate::byteplus::byteplus_image_size::{seedream_pro_size, seedream_size};
use crate::core::commands::generate::byteplus::image_format::detect_image_format;
use crate::core::commands::generate::generate_image::providers::artcraft_router::utils::map_media_files_to_urls::map_media_file_tokens_to_cdn_urls;
use crate::core::commands::generate::generate_image::providers::byteplus::byteplus_image_job::{ByteplusImageJob, RunningSeedreamJob};
use crate::core::commands::generate::generate_image::tauri_generate_image_request::TauriGenerateImageRequest;
use crate::core::commands::generate::generate_image::tauri_image_model::TauriImageModel;
use crate::core::providers::credentials::provider_credential_loading_cache::ProviderCredentialLoadingCache;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;

/// Seedream makes one image per request; the prompt box offers up to this many per generation.
const MAX_IMAGES_PER_GENERATION: u32 = 4;

/// Validates a Seedream request and resolves its inputs. Seedream answers synchronously, so
/// nothing is sent to BytePlus here: the caller records the task, then runs the returned job.
pub async fn handle_byteplus_image(
  request: &TauriGenerateImageRequest,
  app_env_configs: &AppEnvConfigs,
  credential_cache: &ProviderCredentialLoadingCache,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<(TaskEnqueueSuccess, ByteplusImageJob), GenerateError> {
  let model = request.model.ok_or(GenerateError::no_model_specified())?;

  let ark_model_id = byteplus_image_model_id(model)
    .ok_or_else(|| GenerateError::BadInput(BadInputReason::WrongImageArguments(
      format!("{:?} isn't available through BytePlus", model),
    )))?;

  let prompt = request.prompt.as_deref()
    .map(str::trim)
    .filter(|prompt| !prompt.is_empty())
    .ok_or_else(|| GenerateError::BadInput(BadInputReason::WrongImageArguments("Enter a prompt.".to_string())))?
    .to_string();

  let api_key = match read_byteplus_api_key(credential_cache) {
    Ok(Some(api_key)) => api_key,
    Ok(None) => return Err(GenerateError::MissingCredentials(MissingCredentialsReason::NeedsBytePlusApiKey)),
    Err(err) => {
      error!("Failed to read the BytePlus API key: {:?}", err);
      return Err(GenerateError::MissingCredentials(MissingCredentialsReason::NeedsBytePlusApiKey));
    }
  };

  if request.inpainting_mask_image_media_token.is_some() || request.inpainting_mask_image_raw_bytes.is_some() {
    warn!("Seedream doesn't take inpainting masks; ignoring the mask.");
  }

  let reference_images = resolve_reference_images(request, app_env_configs).await?;

  let max_references = max_reference_images(model);
  if reference_images.len() > max_references {
    return Err(GenerateError::BadInput(BadInputReason::InvalidNumberOfInputImages {
      provided: reference_images.len() as u32,
      min: 0,
      max: max_references as u32,
    }));
  }

  let image_count = request.batch_size.unwrap_or(1).clamp(1, MAX_IMAGES_PER_GENERATION);
  let size = match model {
    TauriImageModel::Seedream5p0Pro => seedream_pro_size(request.aspect_ratio, request.resolution),
    _ => seedream_size(request.aspect_ratio, request.resolution),
  };

  let maybe_prompt_token = create_prompt_record(
    request,
    model,
    &prompt,
    !reference_images.is_empty(),
    image_count,
    app_env_configs,
    storyteller_creds_manager,
  ).await;

  // Seedream has no job id of its own; this one ties the background job to its task row.
  let provider_job_id = format!("seedream_{}", generate_random_uuid());

  info!("Prepared Seedream job {}: model={}, size={}, references={}, images={}",
    provider_job_id, ark_model_id, size, reference_images.len(), image_count);

  let enqueue = TaskEnqueueSuccess {
    task_type: TaskType::ImageGeneration,
    model: Some(tauri_image_model_to_generation_model(model)),
    provider: GenerationProvider::Byteplus,
    provider_job_id: Some(provider_job_id.clone()),
    maybe_queue_status_url: None,
    maybe_queue_response_url: None,
    maybe_prompt_token,
  };

  let job = ByteplusImageJob {
    running: RunningSeedreamJob::register(&provider_job_id),
    provider_job_id,
    api_key,
    ark_model_id,
    prompt,
    size,
    reference_images,
    image_count,
  };

  Ok((enqueue, job))
}

/// Canvas, then scene, then reference images, as public CDN links or inline data URLs.
async fn resolve_reference_images(
  request: &TauriGenerateImageRequest,
  app_env_configs: &AppEnvConfigs,
) -> Result<Vec<String>, GenerateError> {
  let mut images = Vec::new();

  if let Some(bytes) = request.canvas_image_raw_bytes.as_deref() {
    images.push(image_bytes_to_data_url(bytes)?);
  }
  if let Some(bytes) = request.scene_image_raw_bytes.as_deref() {
    images.push(image_bytes_to_data_url(bytes)?);
  }

  let tokens: Vec<MediaFileToken> = request.canvas_image_media_token.iter()
    .chain(request.scene_image_media_token.iter())
    .chain(request.image_media_tokens.iter().flatten())
    .cloned()
    .collect();

  if !tokens.is_empty() {
    images.extend(map_media_file_tokens_to_cdn_urls(&tokens, &app_env_configs.storyteller_host).await?);
  }

  Ok(images)
}

fn image_bytes_to_data_url(bytes: &[u8]) -> Result<String, GenerateError> {
  let format = detect_image_format(bytes)
    .ok_or(GenerateError::BadInput(BadInputReason::CannotDetermineImageMimeType))?;
  Ok(format!("data:{};base64,{}", format.mime_type, BASE64.encode(bytes)))
}

/// Records the prompt in the ArtCraft backend so the gallery can show it. Fails open.
/// NB: No generation provider is sent; storyteller-web doesn't know `byteplus`.
async fn create_prompt_record(
  request: &TauriGenerateImageRequest,
  model: TauriImageModel,
  prompt: &str,
  has_reference_images: bool,
  image_count: u32,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Option<PromptToken> {
  let creds = match storyteller_creds_manager.get_credentials() {
    Ok(Some(creds)) => creds,
    _ => {
      warn!("[BytePlusImage] No Storyteller credentials available, skipping prompt creation");
      return None;
    }
  };

  let prompt_request = CreatePromptRequest {
    uuid_idempotency_token: generate_random_uuid(),
    positive_prompt: Some(prompt.to_string()),
    negative_prompt: None,
    model_type: Some(tauri_image_model_to_common_model_type(model)),
    generation_provider: None,
    maybe_generation_mode: Some(if has_reference_images { CommonGenerationMode::Edit } else { CommonGenerationMode::Text }),
    maybe_aspect_ratio: request.aspect_ratio,
    maybe_resolution: request.resolution,
    maybe_batch_count: Some(image_count as u8),
    maybe_generate_audio: None,
    maybe_duration_seconds: None,
  };

  match create_prompt(&app_env_configs.storyteller_host, Some(&creds), prompt_request).await {
    Ok(response) => Some(response.prompt_token),
    Err(err) => {
      error!("[BytePlusImage] Failed to create prompt (continuing anyway): {:?}", err);
      None
    }
  }
}
