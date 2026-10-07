use artcraft_api_defs::prompts::create_prompt::CreatePromptRequest;
use artcraft_client::endpoints::prompts::create_prompt::create_prompt;
use byteplus_ark_client::requests::videos::create_video_task::create_video_task;
use byteplus_ark_client::requests::videos::video_task_types::{
  AudioRole, CreateVideoTaskRequest, ImageRole, MediaUrl, VideoContentItem, VideoRole,
};
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use log::{error, info, warn};
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;
use uuid_utils::uuid::generate_random_uuid;

use crate::core::api_adapters::models::video::tauri_video_model_to_generation_model::tauri_video_model_to_generation_model;
use crate::core::api_adapters::models::video::tauri_video_model_to_router_model::tauri_video_model_to_router_model;
use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError, MissingCredentialsReason, ProviderFailureReason};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::byteplus::byteplus_common::read_byteplus_api_key;
use crate::core::commands::generate::byteplus::byteplus_video_models::{
  byteplus_video_model_id, first_frame_sets_ratio, max_reference_images, max_reference_videos,
  seedance_ratio, seedance_resolution, ADAPTIVE_RATIO,
};
use crate::core::commands::generate::common::router_video_request_to_artcraft_prompt::{
  router_aspect_ratio_to_enums, router_resolution_to_enums, video_model_to_common_model_type,
};
use crate::core::commands::generate::generate_image::providers::artcraft_router::utils::map_media_files_to_urls::map_media_file_tokens_to_cdn_urls;
use crate::core::commands::generate::generate_video::request::{TauriGenerateVideoRequest, TauriVideoModel};
use crate::core::providers::credentials::provider_credential_loading_cache::ProviderCredentialLoadingCache;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;

/// Starts a Seedance task on BytePlus ModelArk. The returned task id is polled by the third-party
/// task polling thread until the video is ready.
pub async fn handle_byteplus_video(
  request: &TauriGenerateVideoRequest,
  app_env_configs: &AppEnvConfigs,
  credential_cache: &ProviderCredentialLoadingCache,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Result<TaskEnqueueSuccess, GenerateError> {
  let model = request.model.ok_or(GenerateError::no_model_specified())?;

  let ark_model_id = byteplus_video_model_id(model)
    .ok_or_else(|| GenerateError::BadInput(BadInputReason::WrongImageArguments(
      format!("{:?} isn't available through BytePlus", model),
    )))?;

  let api_key = match read_byteplus_api_key(credential_cache) {
    Ok(Some(api_key)) => api_key,
    Ok(None) => return Err(GenerateError::MissingCredentials(MissingCredentialsReason::NeedsBytePlusApiKey)),
    Err(err) => {
      error!("Failed to read the BytePlus API key: {:?}", err);
      return Err(GenerateError::MissingCredentials(MissingCredentialsReason::NeedsBytePlusApiKey));
    }
  };

  if request.reference_character_tokens.as_ref().is_some_and(|tokens| !tokens.is_empty()) {
    warn!("Seedance on BytePlus doesn't take ArtCraft characters; ignoring them.");
  }

  let inputs = resolve_inputs(request, app_env_configs).await?;
  check_reference_limits(model, &inputs)?;

  let has_first_frame = inputs.maybe_start_frame.is_some();
  let ratio = if has_first_frame && first_frame_sets_ratio(model) {
    ADAPTIVE_RATIO
  } else {
    seedance_ratio(request.aspect_ratio)
  };

  let prompt = request.prompt.as_deref().map(str::trim).unwrap_or_default().to_string();

  let task_request = CreateVideoTaskRequest {
    model: ark_model_id.to_string(),
    content: build_content(&prompt, &inputs),
    resolution: seedance_resolution(model, request.resolution).map(str::to_string),
    ratio: Some(ratio.to_string()),
    duration: request.duration_seconds.map(i32::from),
    generate_audio: request.generate_audio,
    seed: None,
    camera_fixed: None,
    draft: None,
    watermark: false,
  };

  let maybe_prompt_token = create_prompt_record(request, &inputs, app_env_configs, storyteller_creds_manager).await;

  info!("Creating Seedance task: model={}, ratio={}, resolution={:?}, duration={:?}",
    ark_model_id, ratio, task_request.resolution, task_request.duration);

  let task = create_video_task(&api_key, &task_request).await
    .map_err(|err| {
      warn!("Seedance task was not created: {:?}", err);
      GenerateError::ProviderFailure(ProviderFailureReason::BytePlusError(err.user_message()))
    })?;

  info!("Seedance task created: {}", task.id);

  Ok(TaskEnqueueSuccess {
    task_type: TaskType::VideoGeneration,
    model: Some(tauri_video_model_to_generation_model(model)),
    provider: GenerationProvider::Byteplus,
    provider_job_id: Some(task.id),
    maybe_queue_status_url: None,
    maybe_queue_response_url: None,
    maybe_prompt_token,
  })
}

/// The request's media as public CDN links (Seedance fetches them itself).
struct SeedanceInputs {
  maybe_start_frame: Option<String>,
  maybe_end_frame: Option<String>,
  reference_images: Vec<String>,
  reference_videos: Vec<String>,
  reference_audios: Vec<String>,
}

impl SeedanceInputs {
  fn has_references(&self) -> bool {
    !self.reference_images.is_empty() || !self.reference_videos.is_empty() || !self.reference_audios.is_empty()
  }
}

async fn resolve_inputs(
  request: &TauriGenerateVideoRequest,
  app_env_configs: &AppEnvConfigs,
) -> Result<SeedanceInputs, GenerateError> {
  let api_host = &app_env_configs.storyteller_host;

  let urls_for = |maybe_tokens: Option<&Vec<MediaFileToken>>| {
    let tokens = maybe_tokens.cloned().unwrap_or_default();
    async move {
      if tokens.is_empty() {
        Ok(Vec::new())
      } else {
        map_media_file_tokens_to_cdn_urls(&tokens, api_host).await
      }
    }
  };

  let maybe_start_frame = urls_for(request.start_frame_image_media_token.clone().map(|t| vec![t]).as_ref()).await?.pop();
  let maybe_end_frame = urls_for(request.end_frame_image_media_token.clone().map(|t| vec![t]).as_ref()).await?.pop();

  Ok(SeedanceInputs {
    maybe_start_frame,
    maybe_end_frame,
    reference_images: urls_for(request.reference_image_media_tokens.as_ref()).await?,
    reference_videos: urls_for(request.reference_video_media_tokens.as_ref()).await?,
    reference_audios: urls_for(request.reference_audio_media_tokens.as_ref()).await?,
  })
}

/// Seedance takes either keyframes or references, never both, within per-model limits.
fn check_reference_limits(
  model: TauriVideoModel,
  inputs: &SeedanceInputs,
) -> Result<(), GenerateError> {
  let has_keyframes = inputs.maybe_start_frame.is_some() || inputs.maybe_end_frame.is_some();
  if has_keyframes && inputs.has_references() {
    return Err(GenerateError::BadInput(BadInputReason::WrongImageArguments(
      "Seedance takes either start/end frames or references, not both.".to_string(),
    )));
  }

  let max_images = max_reference_images(model);
  if inputs.reference_images.len() > max_images {
    return Err(GenerateError::BadInput(BadInputReason::InvalidNumberOfInputImages {
      provided: inputs.reference_images.len() as u32,
      min: 0,
      max: max_images as u32,
    }));
  }

  let max_clips = max_reference_videos(model);
  if inputs.reference_videos.len() > max_clips || inputs.reference_audios.len() > max_clips {
    return Err(GenerateError::BadInput(BadInputReason::WrongImageArguments(
      format!("This model takes at most {} reference videos and {} audio clips.", max_clips, max_clips),
    )));
  }

  // Seedance needs a picture or a video to anchor reference audio.
  if !inputs.reference_audios.is_empty() && inputs.reference_images.is_empty() && inputs.reference_videos.is_empty() {
    return Err(GenerateError::BadInput(BadInputReason::WrongImageArguments(
      "Add a reference image or video to use reference audio.".to_string(),
    )));
  }

  Ok(())
}

fn build_content(prompt: &str, inputs: &SeedanceInputs) -> Vec<VideoContentItem> {
  let mut content = Vec::new();

  if !prompt.is_empty() {
    content.push(VideoContentItem::Text { text: prompt.to_string() });
  }

  let image = |url: &String, role: ImageRole| VideoContentItem::ImageUrl {
    image_url: MediaUrl { url: url.clone() },
    role: Some(role),
  };

  if let Some(url) = &inputs.maybe_start_frame {
    content.push(image(url, ImageRole::FirstFrame));
  }
  if let Some(url) = &inputs.maybe_end_frame {
    content.push(image(url, ImageRole::LastFrame));
  }

  content.extend(inputs.reference_images.iter().map(|url| image(url, ImageRole::ReferenceImage)));
  content.extend(inputs.reference_videos.iter().map(|url| VideoContentItem::VideoUrl {
    video_url: MediaUrl { url: url.clone() },
    role: VideoRole::ReferenceVideo,
  }));
  content.extend(inputs.reference_audios.iter().map(|url| VideoContentItem::AudioUrl {
    audio_url: MediaUrl { url: url.clone() },
    role: AudioRole::ReferenceAudio,
  }));

  content
}

/// Records the prompt in the ArtCraft backend so the gallery can show it. Fails open.
/// NB: No generation provider is sent; storyteller-web doesn't know `byteplus`.
async fn create_prompt_record(
  request: &TauriGenerateVideoRequest,
  inputs: &SeedanceInputs,
  app_env_configs: &AppEnvConfigs,
  storyteller_creds_manager: &StorytellerCredentialManager,
) -> Option<PromptToken> {
  let creds = match storyteller_creds_manager.get_credentials() {
    Ok(Some(creds)) => creds,
    _ => {
      warn!("[BytePlusVideo] No Storyteller credentials available, skipping prompt creation");
      return None;
    }
  };

  let generation_mode = if inputs.maybe_start_frame.is_some() || inputs.maybe_end_frame.is_some() {
    CommonGenerationMode::Keyframe
  } else if inputs.has_references() {
    CommonGenerationMode::Reference
  } else {
    CommonGenerationMode::Text
  };

  let prompt_request = CreatePromptRequest {
    uuid_idempotency_token: generate_random_uuid(),
    positive_prompt: request.prompt.clone(),
    negative_prompt: None,
    model_type: request.model.and_then(|model| video_model_to_common_model_type(tauri_video_model_to_router_model(model))),
    generation_provider: None,
    maybe_generation_mode: Some(generation_mode),
    maybe_aspect_ratio: request.aspect_ratio.map(router_aspect_ratio_to_enums),
    maybe_resolution: request.resolution.map(router_resolution_to_enums),
    maybe_batch_count: Some(1),
    maybe_generate_audio: request.generate_audio,
    maybe_duration_seconds: request.duration_seconds.map(u32::from),
  };

  match create_prompt(&app_env_configs.storyteller_host, Some(&creds), prompt_request).await {
    Ok(response) => Some(response.prompt_token),
    Err(err) => {
      error!("[BytePlusVideo] Failed to create prompt (continuing anyway): {:?}", err);
      None
    }
  }
}
