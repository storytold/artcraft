use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_audio_cost_and_generate_request::OmniGenAudioCostAndGenerateRequest;
use artcraft_router::api::audio_list_ref::AudioListRef;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::router_audio_model::RouterAudioModel;
use artcraft_router::api::router_provider::RouterProvider;
use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use artcraft_router::generate::generate_audio::generate_audio_request_builder::GenerateAudioRequestBuilder;
use enums::common::generation::common_audio_model::CommonAudioModel as CommonAudioModelEnum;

use crate::http_server::common_responses::common_web_error::CommonWebError;

pub fn hydrate_to_router_request(
  request: &OmniGenAudioCostAndGenerateRequest,
) -> Result<GenerateAudioRequestBuilder, CommonWebError> {
  let api_model = request.model
    .as_ref()
    .ok_or_else(|| CommonWebError::BadInputWithSimpleMessage(
      "model is required".to_string(),
    ))?;

  let model = convert_model(api_model)?;

  Ok(GenerateAudioRequestBuilder {
    model,
    provider: RouterProvider::Artcraft,
    prompt: request.prompt.clone(),
    style_prompt: request.style_prompt.clone(),
    audio_references: request.audio_media_tokens.clone()
      .map(AudioListRef::MediaFileTokens),
    image_references: request.image_media_tokens.clone()
      .map(ImageListRef::MediaFileTokens),
    keep_lyrics: request.keep_lyrics,
    is_instrumental: request.is_instrumental,
    is_loopable: request.is_loopable,
    bpm: request.bpm,
    musical_key: request.musical_key,
    sample_rate_hz: request.sample_rate_hz,
    speed: request.speed,
    volume: request.volume,
    pitch: request.pitch,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
    idempotency_token: request.idempotency_token.clone(),
  })
}

fn convert_model(
  model: &CommonAudioModelEnum,
) -> Result<RouterAudioModel, CommonWebError> {
  let json = serde_json::to_string(model)?;
  serde_json::from_str(&json).map_err(|e| {
    CommonWebError::BadInputWithSimpleMessage(
      format!("Unsupported audio model: {}", e),
    )
  })
}
