//! Distillation step for the omni-gen video endpoints.
//!
//! Takes a raw [`OmniGenVideoCostAndGenerateRequest`] plus a (pre-computed)
//! `MediaFileToken -> Url` map and produces a fully self-contained
//! [`DistilledVideoRequest`] holding:
//!   - the (private) router request, kept for inspection in tests / debugging
//!   - the [`VideoGenerationCostEstimate`] (Artcraft provider, what we bill on)
//!   - the [`VideoGenerationPlan`] (execution provider, what we actually execute)

use std::collections::HashMap;

use log::warn;
use url::Url;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_router::api::audio_list_ref::AudioListRef;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::image_ref::ImageRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::api::video_list_ref::VideoListRef;
use artcraft_router::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use artcraft_router::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use artcraft_router::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

use super::distill_helper::hydrate_to_router_request::hydrate_to_router_request;

/// Self-contained, owned representation of a fully-distilled omni-gen video
/// request: the router request, the bill-on cost estimate, and the executable
/// plan, all in one place.
pub struct DistilledVideoRequest {
  request: GenerateVideoRequestBuilder,

  /// Cost estimate as computed by the Artcraft provider — this is what we bill on.
  pub cost: VideoGenerationCostEstimate,

  /// Execution plan as computed by the execution provider — what we hand to the router.
  pub plan: VideoGenerationPlan,

  /// The provider used for execution (Fal, Seedance2Pro, etc.).
  pub execution_provider: Provider,
}

impl DistilledVideoRequest {
  /// Borrow the execution plan.
  pub fn plan(&self) -> &VideoGenerationPlan {
    &self.plan
  }

  /// Borrow the underlying router request. Useful for tests / debugging.
  #[allow(dead_code)]
  pub(crate) fn request(&self) -> &GenerateVideoRequestBuilder {
    &self.request
  }
}

/// Build a [`DistilledVideoRequest`] from a raw API request and a pre-computed
/// `MediaFileToken -> Url` hydration map.
pub fn distill_video_request(
  request: &OmniGenVideoCostAndGenerateRequest,
  media_file_hydration_map: Option<&HashMap<MediaFileToken, Url>>,
  execution_provider: Provider,
) -> Result<DistilledVideoRequest, AdvancedCommonWebError> {
  // 1. Convert the raw API request into a router request.
  let initial = hydrate_to_router_request(request)?;

  // 2. Cost estimate (Artcraft provider).
  //    `initial` already has media fields in token form (from hydrate_to_router_request),
  //    which is exactly what the Artcraft cost builder needs. Just swap the provider.
  let cost: VideoGenerationCostEstimate = {
    let cost_request = GenerateVideoRequestBuilder {
      provider: Provider::Artcraft,
      ..initial.clone()
    };
    let cost_plan = cost_request.build().map_err(|e| {
      warn!("Failed to build cost plan during video distillation: {}", e);
      AdvancedCommonWebError::from_error(e)
    })?;
    cost_plan.estimate_costs()
  };

  // 3. Resolve media tokens to URLs for the execution request.
  let start_frame_url = resolve_single_media_token(
    request.start_frame_image_media_token.as_ref(),
    media_file_hydration_map,
  )?;
  let end_frame_url = resolve_single_media_token(
    request.end_frame_image_media_token.as_ref(),
    media_file_hydration_map,
  )?;
  let reference_image_urls = resolve_media_token_list(
    request.reference_image_media_tokens.as_ref(),
    media_file_hydration_map,
  )?;
  let reference_video_urls = resolve_media_token_list(
    request.reference_video_media_tokens.as_ref(),
    media_file_hydration_map,
  )?;
  let reference_audio_urls = resolve_media_token_list(
    request.reference_audio_media_tokens.as_ref(),
    media_file_hydration_map,
  )?;

  // 4. Build the execution request with resolved URLs.
  let exec_request = GenerateVideoRequestBuilder {
    model: initial.model,
    provider: execution_provider,
    prompt: initial.prompt,
    negative_prompt: initial.negative_prompt,
    start_frame: start_frame_url.map(ImageRef::Url),
    end_frame: end_frame_url.map(ImageRef::Url),
    reference_images: reference_image_urls.map(ImageListRef::Urls),
    reference_videos: reference_video_urls.map(VideoListRef::Urls),
    reference_audio: reference_audio_urls.map(AudioListRef::Urls),
    reference_character_tokens: None,
    resolution: initial.resolution,
    aspect_ratio: initial.aspect_ratio,
    duration_seconds: initial.duration_seconds,
    video_batch_count: initial.video_batch_count,
    generate_audio: initial.generate_audio,
    request_mismatch_mitigation_strategy: initial.request_mismatch_mitigation_strategy,
    idempotency_token: initial.idempotency_token,
  };

  // 5. Build the execution plan.
  let plan = exec_request.build().map_err(|e| {
    warn!("Failed to build video generation plan during distillation: {}", e);
    AdvancedCommonWebError::from_error(e)
  })?;

  Ok(DistilledVideoRequest {
    request: exec_request,
    cost,
    plan,
    execution_provider,
  })
}

/// Resolve a single optional media token to its URL string.
fn resolve_single_media_token(
  token: Option<&MediaFileToken>,
  hydration_map: Option<&HashMap<MediaFileToken, Url>>,
) -> Result<Option<String>, AdvancedCommonWebError> {
  let token = match token {
    Some(t) => t,
    None => return Ok(None),
  };

  let map = hydration_map.ok_or_else(|| {
    AdvancedCommonWebError::BadInputWithSimpleMessage(
      "media token supplied but no hydration map was provided".to_string(),
    )
  })?;

  match map.get(token) {
    Some(url) => Ok(Some(url.to_string())),
    None => Err(AdvancedCommonWebError::BadInputWithSimpleMessage(format!(
      "Media token not found in hydration map: {:?}",
      token
    ))),
  }
}

/// Resolve a list of media tokens to their URL strings.
fn resolve_media_token_list(
  tokens: Option<&Vec<MediaFileToken>>,
  hydration_map: Option<&HashMap<MediaFileToken, Url>>,
) -> Result<Option<Vec<String>>, AdvancedCommonWebError> {
  let tokens = match tokens {
    Some(tokens) if !tokens.is_empty() => tokens,
    _ => return Ok(None),
  };

  let map = hydration_map.ok_or_else(|| {
    AdvancedCommonWebError::BadInputWithSimpleMessage(
      "media tokens supplied but no hydration map was provided".to_string(),
    )
  })?;

  let mut urls: Vec<String> = Vec::with_capacity(tokens.len());
  for token in tokens {
    match map.get(token) {
      Some(url) => urls.push(url.to_string()),
      None => {
        return Err(AdvancedCommonWebError::BadInputWithSimpleMessage(format!(
          "Media token not found in hydration map: {:?}",
          token
        )));
      }
    }
  }

  Ok(Some(urls))
}
