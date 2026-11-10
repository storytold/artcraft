use artcraft_client::endpoints::prompts::create_prompt::create_prompt;
use artcraft_router::api::image_ref::ImageRef;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::video_list_ref::VideoListRef;
use artcraft_router::api::audio_list_ref::AudioListRef;
use artcraft_router::api::router_provider::RouterProvider;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::errors::artcraft_router_error::ArtcraftRouterError;
use artcraft_router::errors::provider_error::ProviderError;
use artcraft_router::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use artcraft_router::generate::generate_video::generate_video_response::GenerateVideoResponse;
use artcraft_router::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use enums::common::generation_provider::GenerationProvider;
use enums::tauri::tasks::task_type::TaskType;
use log::warn;
use enums::by_table::media_files::media_file_class::MediaFileClass;
use artcraft_client::endpoints::media_files::get_media_file::get_media_file;
use wavespeed_client::WaveSpeedClient;

use crate::core::api_adapters::models::video::tauri_video_model_to_generation_model::tauri_video_model_to_generation_model;
use crate::core::api_adapters::models::video::tauri_video_model_to_router_model::tauri_video_model_to_router_model;
use crate::core::commands::enqueue::generate_error::{BadInputReason, GenerateError, MissingCredentialsReason};
use crate::core::commands::enqueue::task_enqueue_success::TaskEnqueueSuccess;
use crate::core::commands::generate::common::router_video_request_to_artcraft_prompt::router_video_request_to_artcraft_prompt;
use crate::core::commands::generate::generate_image::providers::artcraft_router::utils::map_media_files_to_urls::map_media_file_tokens_to_cdn_urls;
use crate::core::commands::generate::generate_video::request::TauriGenerateVideoRequest;
use crate::core::providers::credentials::payload::provider_credential_payload::ProviderCredentialPayload;
use crate::core::providers::credentials::provider_credential_key::ProviderCredentialKey;
use crate::core::providers::credentials::provider_credential_loading_cache::ProviderCredentialLoadingCache;
use crate::core::state::app_env_configs::app_env_configs::AppEnvConfigs;
use crate::core::state::data_dir::app_data_root::AppDataRoot;
use crate::core::utils::provider_image_context::ProviderImageContext;
use crate::core::utils::provider_submission::ProviderSubmission;
use crate::services::storyteller::state::storyteller_credential_manager::StorytellerCredentialManager;

pub async fn handle_wavespeed_video(request: &TauriGenerateVideoRequest, app_env_configs: &AppEnvConfigs, app_data_root: &AppDataRoot, credential_cache: &ProviderCredentialLoadingCache, storyteller_creds_manager: &StorytellerCredentialManager) -> Result<TaskEnqueueSuccess, GenerateError> {
  let maybe_creds = storyteller_creds_manager.get_signed_in_credentials()?;
  let model = request.model.ok_or_else(GenerateError::no_model_specified)?;
  validate_media_access(request, maybe_creds.is_some())?;
  if request.reference_character_tokens.as_ref().is_some_and(|tokens| !tokens.is_empty()) {
    return Err(GenerateError::BadInput(BadInputReason::WrongImageArguments("WaveSpeed does not accept ArtCraft character tokens".into())));
  }
  let payload = credential_cache.get_credentials(ProviderCredentialKey::WaveSpeedApiKey).map_err(|error| GenerateError::AnyhowError(anyhow::anyhow!("Could not load WaveSpeed credentials: {error:?}")))?;
  let Some(ProviderCredentialPayload::ApiKey(api_key)) = payload else {
    return Err(GenerateError::MissingCredentials(MissingCredentialsReason::NeedsWaveSpeedApiKey));
  };
  let client = WaveSpeedClient::new(api_key.as_str()).map_err(ProviderError::WaveSpeed).map_err(ArtcraftRouterError::from)?;
  let mut tokens = Vec::new();
  if let Some(token) = &request.start_frame_image_media_token {
    tokens.push(token.clone());
  }
  if let Some(token) = &request.end_frame_image_media_token {
    tokens.push(token.clone());
  }
  if maybe_creds.is_none() && !tokens.is_empty() {
    return Err(GenerateError::needs_storyteller_credentials());
  }
  let has_references = [&request.reference_image_media_tokens, &request.reference_video_media_tokens, &request.reference_audio_media_tokens].iter().any(|tokens| tokens.as_ref().is_some_and(|tokens| !tokens.is_empty()));
  if has_references && maybe_creds.is_none() {
    return Err(GenerateError::needs_storyteller_credentials());
  }
  let mode = request.wavespeed_mode.unwrap_or(if has_references { wavespeed_client::VideoMode::Reference } else { wavespeed_client::VideoMode::Generate });
  let video_limit = reference_video_limit(mode);
  let reference_images = resolve_references(&request.reference_image_media_tokens, app_env_configs, MediaFileClass::Image, 9, None).await?;
  let reference_videos = resolve_references(&request.reference_video_media_tokens, app_env_configs, MediaFileClass::Video, 3, video_limit).await?;
  let reference_audio = resolve_references(&request.reference_audio_media_tokens, app_env_configs, MediaFileClass::Audio, 3, Some(15000)).await?;
  if tokens.iter().any(|token| crate::core::utils::local_generations::is_local_token(token.as_str())) {
    return Err(GenerateError::BadInput(BadInputReason::WrongImageArguments("Local images must be uploaded before using them as video frames".into())));
  }
  let urls = map_media_file_tokens_to_cdn_urls(&tokens, &app_env_configs.storyteller_host).await?;
  let mut urls = urls.into_iter();
  let start_frame = if request.start_frame_image_media_token.is_some() { urls.next().map(ImageRef::Url) } else { None };
  let end_frame = if request.end_frame_image_media_token.is_some() { urls.next().map(ImageRef::Url) } else { None };
  let builder = GenerateVideoRequestBuilder { model: tauri_video_model_to_router_model(model), provider: RouterProvider::WaveSpeed, prompt: request.prompt.clone(), negative_prompt: request.negative_prompt.clone(), start_frame, end_frame, reference_images: reference_images.map(ImageListRef::Urls), reference_videos: reference_videos.map(VideoListRef::Urls), reference_audio: reference_audio.map(AudioListRef::Urls), aspect_ratio: request.aspect_ratio, resolution: request.resolution, duration_seconds: request.duration_seconds, generate_audio: request.generate_audio, video_batch_count: request.video_batch_count, request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut, ..Default::default() };
  let VideoGenerationDraftOrRequest::Request(generation) = artcraft_router::generate::generate_video::providers::wavespeed::build::build_wavespeed_video_mode(builder.clone(), mode)? else {
    return Err(GenerateError::NotYetImplemented("WaveSpeed video cannot send a draft".into()));
  };
  let maybe_prompt_token = if let Some(creds) = &maybe_creds {
    match create_prompt(&app_env_configs.storyteller_host, Some(creds), router_video_request_to_artcraft_prompt(&builder)).await {
      Ok(response) => Some(response.prompt_token),
      Err(error) => {
        warn!("Could not record WaveSpeed video prompt: {error:?}");
        None
      },
    }
  } else {
    None
  };
  let context = ProviderImageContext { prompt: request.prompt.clone().unwrap_or_default(), model_id: serde_json::to_value(tauri_video_model_to_generation_model(model)).map_err(anyhow::Error::from)?.as_str().unwrap_or("unknown").to_owned(), local_only: maybe_creds.is_none() };
  let mut receipt = ProviderSubmission::begin(app_data_root, context, TaskType::VideoGeneration, app_env_configs.storyteller_host.to_api_hostname_and_scheme(), request.frontend_caller, request.frontend_subscriber_id.clone(), request.frontend_subscriber_payload.clone())?;
  let GenerateVideoResponse::WaveSpeed(response) = generation.send_request(&RouterClient::WaveSpeed(client)).await? else {
    return Err(GenerateError::ResponseHadNoJobTokens);
  };
  let success = TaskEnqueueSuccess { task_type: TaskType::VideoGeneration, model: Some(tauri_video_model_to_generation_model(model)), provider: GenerationProvider::WaveSpeed, provider_job_id: Some(response.prediction_id), maybe_queue_status_url: None, maybe_queue_response_url: None, maybe_prompt_token };
  receipt.accept(app_data_root, &success)?;
  Ok(success)
}

async fn resolve_references(tokens: &Option<Vec<tokens::tokens::media_files::MediaFileToken>>, config: &AppEnvConfigs, class: MediaFileClass, maximum: usize, maybe_duration_limit: Option<u64>) -> Result<Option<Vec<String>>, GenerateError> {
  let Some(tokens) = tokens.as_ref().filter(|tokens| !tokens.is_empty()) else {
    return Ok(None);
  };
  if tokens.len() > maximum {
    return Err(GenerateError::BadInput(BadInputReason::WrongImageArguments("Too many WaveSpeed references".into())));
  }
  if tokens.iter().any(|token| crate::core::utils::local_generations::is_local_token(token.as_str())) {
    return Err(GenerateError::BadInput(BadInputReason::WrongImageArguments("Upload local media to your cloud library before using it as a reference".into())));
  }
  let mut urls = Vec::new();
  let mut total_millis = 0u64;
  for token in tokens {
    let response = tokio::time::timeout(std::time::Duration::from_secs(60), get_media_file(&config.storyteller_host, token)).await.map_err(anyhow::Error::from)??;
    validate_reference_metadata(class, response.media_file.media_class, response.media_file.maybe_duration_millis, maybe_duration_limit, &mut total_millis)?;
    urls.push(response.media_file.media_links.cdn_url.to_string());
  }
  Ok(Some(urls))
}

fn validate_media_access(request: &TauriGenerateVideoRequest, signed_in: bool) -> Result<(), GenerateError> {
  let frames = [&request.start_frame_image_media_token, &request.end_frame_image_media_token];
  let references = [&request.reference_image_media_tokens, &request.reference_video_media_tokens, &request.reference_audio_media_tokens];
  let tokens = frames.into_iter().filter_map(Option::as_ref).chain(references.into_iter().filter_map(Option::as_ref).flatten());
  for token in tokens {
    if crate::core::utils::local_generations::is_local_token(token.as_str()) {
      return Err(GenerateError::BadInput(BadInputReason::WrongImageArguments("Upload local media to your cloud library before using it as a reference".into())));
    }
    if !signed_in {
      return Err(GenerateError::needs_storyteller_credentials());
    }
  }
  Ok(())
}

fn validate_reference_metadata(expected: MediaFileClass, actual: MediaFileClass, maybe_duration: Option<u64>, maybe_limit: Option<u64>, total: &mut u64) -> Result<(), GenerateError> {
  if actual != expected {
    return Err(GenerateError::BadInput(BadInputReason::WrongImageArguments("Reference has the wrong media type".into())));
  }
  if let Some(limit) = maybe_limit {
    let duration = maybe_duration.filter(|duration| *duration > 0).ok_or_else(|| GenerateError::BadInput(BadInputReason::WrongImageArguments("Reference duration is unavailable or zero".into())))?;
    let duration = if actual == MediaFileClass::Video { duration.max(2000) } else { duration };
    *total = total.saturating_add(duration);
    if *total > limit {
      return Err(GenerateError::BadInput(BadInputReason::WrongImageArguments("Combined reference duration must not exceed 15 seconds".into())));
    }
  }
  Ok(())
}

fn reference_video_limit(mode: wavespeed_client::VideoMode) -> Option<u64> {
  match mode {
    wavespeed_client::VideoMode::Edit | wavespeed_client::VideoMode::Extend => None,
    _ => Some(15000),
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use wavespeed_client::VideoMode;

  #[test]
  fn source_videos_do_not_inherit_the_reference_duration_limit() {
    assert_eq!(reference_video_limit(VideoMode::Reference), Some(15000));
    assert_eq!(reference_video_limit(VideoMode::Edit), None);
    assert_eq!(reference_video_limit(VideoMode::Extend), None);
  }

  #[test]
  fn validates_reference_type_duration_and_combined_budget() {
    let mut total = 0;
    assert!(validate_reference_metadata(MediaFileClass::Video, MediaFileClass::Image, Some(1000), Some(15000), &mut total).is_err());
    for duration in [None, Some(0)] {
      assert!(validate_reference_metadata(MediaFileClass::Video, MediaFileClass::Video, duration, Some(15000), &mut total).is_err());
    }
    validate_reference_metadata(MediaFileClass::Video, MediaFileClass::Video, Some(8000), Some(15000), &mut total).unwrap();
    validate_reference_metadata(MediaFileClass::Video, MediaFileClass::Video, Some(7000), Some(15000), &mut total).unwrap();
    assert!(validate_reference_metadata(MediaFileClass::Video, MediaFileClass::Video, Some(1), Some(15000), &mut total).is_err());
    validate_reference_metadata(MediaFileClass::Video, MediaFileClass::Video, Some(30000), None, &mut total).unwrap();
  }

  #[test]
  fn rejects_signed_out_or_local_references_before_loading_provider_credentials() {
    let request: TauriGenerateVideoRequest = serde_json::from_value(serde_json::json!({"provider":"wavespeed","model":"seedance_2p0","reference_video_media_tokens":["mf_reference"]})).unwrap();
    assert!(matches!(validate_media_access(&request, false), Err(GenerateError::MissingCredentials(_))));
    validate_media_access(&request, true).unwrap();
    let request: TauriGenerateVideoRequest = serde_json::from_value(serde_json::json!({"provider":"wavespeed","model":"seedance_2p0","start_frame_image_media_token":"local_file_saved"})).unwrap();
    assert!(matches!(validate_media_access(&request, true), Err(GenerateError::BadInput(_))));
  }
}
