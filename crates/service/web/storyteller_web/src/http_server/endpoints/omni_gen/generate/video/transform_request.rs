use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_router::api::audio_list_ref::AudioListRef;
use artcraft_router::api::common_aspect_ratio::CommonAspectRatio as CommonAspectRatioRouter;
use artcraft_router::api::common_resolution::CommonResolution as CommonResolutionRouter;
use artcraft_router::api::common_video_model::CommonVideoModel as CommonVideoModelRouter;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::image_ref::ImageRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::api::video_list_ref::VideoListRef;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::generate::generate_video::generate_video_request::GenerateVideoRequest;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio as CommonAspectRatioEnum;
use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;
use enums::common::generation::common_video_model::CommonVideoModel as CommonVideoModelEnum;

fn convert_model(
  model: &CommonVideoModelEnum,
) -> Result<CommonVideoModelRouter, AdvancedCommonWebError> {
  let json = serde_json::to_string(model)?;
  serde_json::from_str(&json).map_err(|e| {
    AdvancedCommonWebError::BadInputWithSimpleMessage(
      format!("Unsupported video model: {}", e),
    )
  })
}

fn convert_aspect_ratio(
  ar: &CommonAspectRatioEnum,
) -> Result<CommonAspectRatioRouter, AdvancedCommonWebError> {
  let json = serde_json::to_string(ar)?;
  serde_json::from_str(&json).map_err(|e| {
    AdvancedCommonWebError::BadInputWithSimpleMessage(
      format!("Unsupported aspect ratio: {}", e),
    )
  })
}

fn convert_resolution(
  res: &CommonResolutionEnum,
) -> Result<CommonResolutionRouter, AdvancedCommonWebError> {
  let json = serde_json::to_string(res)?;
  serde_json::from_str(&json).map_err(|e| {
    AdvancedCommonWebError::BadInputWithSimpleMessage(
      format!("Unsupported resolution: {}", e),
    )
  })
}

pub fn hydrate_to_router_request(
  request: &OmniGenVideoCostAndGenerateRequest,
) -> Result<GenerateVideoRequest<'_>, AdvancedCommonWebError> {
  let api_model = request.model.as_ref()
    .ok_or_else(|| AdvancedCommonWebError::BadInputWithSimpleMessage(
      "model is required".to_string(),
    ))?;

  let model = convert_model(api_model)?;

  let aspect_ratio = request.aspect_ratio.as_ref()
    .map(convert_aspect_ratio)
    .transpose()?;

  let resolution = request.resolution.as_ref()
    .map(convert_resolution)
    .transpose()?;

  Ok(GenerateVideoRequest {
    model,
    provider: Provider::Artcraft,
    prompt: request.prompt.as_deref(),
    negative_prompt: request.negative_prompt.as_deref(),
    start_frame: request.start_frame_image_media_token.as_ref()
      .map(ImageRef::MediaFileToken),
    end_frame: request.end_frame_image_media_token.as_ref()
      .map(ImageRef::MediaFileToken),
    reference_images: request.reference_image_media_tokens.as_ref()
      .map(ImageListRef::MediaFileTokens),
    reference_videos: request.reference_video_media_tokens.as_ref()
      .map(VideoListRef::MediaFileTokens),
    reference_audio: request.reference_audio_media_tokens.as_ref()
      .map(AudioListRef::MediaFileTokens),
    reference_character_tokens: None,
    resolution,
    aspect_ratio,
    duration_seconds: request.duration_seconds,
    video_batch_count: request.video_batch_count,
    generate_audio: request.generate_audio,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
    idempotency_token: request.idempotency_token.as_deref(),
  })
}
