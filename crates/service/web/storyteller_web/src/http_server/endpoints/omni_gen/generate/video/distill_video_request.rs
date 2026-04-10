//! Distillation step for the omni-gen video endpoints.
//!
//! Takes a raw [`OmniGenVideoCostAndGenerateRequest`] plus a (pre-computed)
//! `MediaFileToken -> Url` map and produces a fully self-contained
//! [`DistilledVideoRequest`] holding:
//!   - the (private) router request, kept for inspection in tests / debugging
//!   - the [`VideoGenerationCostEstimate`] (Artcraft provider, what we bill on)
//!   - the [`VideoGenerationPlan`] (Fal provider, what we actually execute)
//!
//! All borrows inside `request` and `plan` resolve to heap data owned by the
//! returned struct, so it has no caller-managed lifetimes and can be moved /
//! returned freely.

use std::collections::HashMap;

use log::warn;
use url::Url;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
use artcraft_router::api::audio_list_ref::AudioListRef;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::image_ref::ImageRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::api::video_list_ref::VideoListRef;
use artcraft_router::generate::generate_video::generate_video_request::GenerateVideoRequest;
use artcraft_router::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use artcraft_router::generate::generate_video::video_generation_plan::VideoGenerationPlan;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

use super::distill_helper::hydrate_to_router_request::hydrate_to_router_request;

/// Self-contained, owned representation of a fully-distilled omni-gen video
/// request: the router request, the bill-on cost estimate, and the executable
/// plan, all in one place.
///
/// Borrows inside `request` and `plan` point into the boxed owned data fields
/// below; those boxes live for the lifetime of `Self`, so the borrows are
/// always valid.
pub struct DistilledVideoRequest {
  // Owned heap-stable backing data for the borrows in `request` / `plan`.
  _owned_prompt: Option<Box<String>>,
  _owned_negative_prompt: Option<Box<String>>,
  _owned_idempotency_token: Option<Box<String>>,
  _owned_start_frame_url: Option<Box<String>>,
  _owned_end_frame_url: Option<Box<String>>,
  _owned_reference_image_urls: Option<Box<Vec<String>>>,
  _owned_reference_video_urls: Option<Box<Vec<String>>>,
  _owned_reference_audio_urls: Option<Box<Vec<String>>>,

  request: GenerateVideoRequest<'static>,

  /// Cost estimate as computed by the Artcraft provider — this is what we bill on.
  pub cost: VideoGenerationCostEstimate,

  /// Execution plan as computed by the Fal provider — what we hand to the router.
  plan: VideoGenerationPlan<'static>,
}

impl DistilledVideoRequest {
  /// Borrow the execution plan.
  pub fn plan(&self) -> &VideoGenerationPlan<'_> {
    &self.plan
  }

  /// Borrow the underlying router request. Useful for tests / debugging.
  #[allow(dead_code)]
  pub(crate) fn request(&self) -> &GenerateVideoRequest<'_> {
    &self.request
  }
}

/// Build a [`DistilledVideoRequest`] from a raw API request and a pre-computed
/// `MediaFileToken -> Url` hydration map.
pub fn distill_video_request(
  request: &OmniGenVideoCostAndGenerateRequest,
  media_file_hydration_map: Option<&HashMap<MediaFileToken, Url>>,
) -> Result<DistilledVideoRequest, AdvancedCommonWebError> {
  // 1. Convert the raw API request into a router request.
  let initial = hydrate_to_router_request(request)?;

  // 2. Hoist every borrowed field into an owned Box.
  let owned_prompt: Option<Box<String>> = initial.prompt.map(|s| Box::new(s.to_string()));
  let owned_negative_prompt: Option<Box<String>> =
    initial.negative_prompt.map(|s| Box::new(s.to_string()));
  let owned_idempotency_token: Option<Box<String>> =
    initial.idempotency_token.map(|s| Box::new(s.to_string()));

  // Resolve media tokens to URLs.
  let owned_start_frame_url: Option<Box<String>> = resolve_single_media_token(
    request.start_frame_image_media_token.as_ref(),
    media_file_hydration_map,
  )?;
  let owned_end_frame_url: Option<Box<String>> = resolve_single_media_token(
    request.end_frame_image_media_token.as_ref(),
    media_file_hydration_map,
  )?;
  let owned_reference_image_urls: Option<Box<Vec<String>>> = resolve_media_token_list(
    request.reference_image_media_tokens.as_ref(),
    media_file_hydration_map,
  )?;
  let owned_reference_video_urls: Option<Box<Vec<String>>> = resolve_media_token_list(
    request.reference_video_media_tokens.as_ref(),
    media_file_hydration_map,
  )?;
  let owned_reference_audio_urls: Option<Box<Vec<String>>> = resolve_media_token_list(
    request.reference_audio_media_tokens.as_ref(),
    media_file_hydration_map,
  )?;

  // 3. Build a `GenerateVideoRequest<'static>` whose borrows point into the
  //    owned boxes. SAFETY: same invariant as the image version — each box
  //    lives in `Self` for the full lifetime of `DistilledVideoRequest`.
  let prompt_static: Option<&'static str> = owned_prompt.as_deref().map(|s: &String| {
    let raw: *const str = s.as_str();
    unsafe { &*raw }
  });
  let negative_prompt_static: Option<&'static str> =
    owned_negative_prompt.as_deref().map(|s: &String| {
      let raw: *const str = s.as_str();
      unsafe { &*raw }
    });
  let idempotency_static: Option<&'static str> =
    owned_idempotency_token.as_deref().map(|s: &String| {
      let raw: *const str = s.as_str();
      unsafe { &*raw }
    });

  let start_frame_static: Option<ImageRef<'static>> =
    owned_start_frame_url.as_deref().map(|s: &String| {
      let raw: *const str = s.as_str();
      ImageRef::Url(unsafe { &*raw })
    });
  let end_frame_static: Option<ImageRef<'static>> =
    owned_end_frame_url.as_deref().map(|s: &String| {
      let raw: *const str = s.as_str();
      ImageRef::Url(unsafe { &*raw })
    });
  let reference_images_static: Option<ImageListRef<'static>> =
    owned_reference_image_urls.as_deref().map(|v: &Vec<String>| {
      let raw: *const Vec<String> = v;
      ImageListRef::Urls(unsafe { &*raw })
    });
  let reference_videos_static: Option<VideoListRef<'static>> =
    owned_reference_video_urls.as_deref().map(|v: &Vec<String>| {
      let raw: *const Vec<String> = v;
      VideoListRef::Urls(unsafe { &*raw })
    });
  let reference_audio_static: Option<AudioListRef<'static>> =
    owned_reference_audio_urls.as_deref().map(|v: &Vec<String>| {
      let raw: *const Vec<String> = v;
      AudioListRef::Urls(unsafe { &*raw })
    });

  let request_static: GenerateVideoRequest<'static> = GenerateVideoRequest {
    model: initial.model,
    provider: Provider::Fal,
    prompt: prompt_static,
    negative_prompt: negative_prompt_static,
    start_frame: start_frame_static,
    end_frame: end_frame_static,
    reference_images: reference_images_static,
    reference_videos: reference_videos_static,
    reference_audio: reference_audio_static,
    reference_character_tokens: None,
    resolution: initial.resolution,
    aspect_ratio: initial.aspect_ratio,
    duration_seconds: initial.duration_seconds,
    video_batch_count: initial.video_batch_count,
    generate_audio: initial.generate_audio,
    request_mismatch_mitigation_strategy: initial.request_mismatch_mitigation_strategy,
    idempotency_token: idempotency_static,
  };

  // 4. Cost estimate (Artcraft provider).
  let cost_request = GenerateVideoRequest {
    provider: Provider::Artcraft,
    ..request_static
  };
  let cost_plan = cost_request.build().map_err(|e| {
    warn!("Failed to build cost plan during video distillation: {}", e);
    AdvancedCommonWebError::from_error(e)
  })?;
  let cost: VideoGenerationCostEstimate = cost_plan.estimate_costs();
  drop(cost_plan);
  drop(cost_request);

  // 5. Execution plan (Fal provider).
  let plan: VideoGenerationPlan<'static> = {
    let request_ref: &'static GenerateVideoRequest<'static> = unsafe {
      let raw: *const GenerateVideoRequest<'static> = &request_static;
      &*raw
    };
    request_ref.build().map_err(|e| {
      warn!("Failed to build video generation plan during distillation: {}", e);
      AdvancedCommonWebError::from_error(e)
    })?
  };

  Ok(DistilledVideoRequest {
    _owned_prompt: owned_prompt,
    _owned_negative_prompt: owned_negative_prompt,
    _owned_idempotency_token: owned_idempotency_token,
    _owned_start_frame_url: owned_start_frame_url,
    _owned_end_frame_url: owned_end_frame_url,
    _owned_reference_image_urls: owned_reference_image_urls,
    _owned_reference_video_urls: owned_reference_video_urls,
    _owned_reference_audio_urls: owned_reference_audio_urls,
    request: request_static,
    cost,
    plan,
  })
}

/// Resolve a single optional media token to its URL.
fn resolve_single_media_token(
  token: Option<&MediaFileToken>,
  hydration_map: Option<&HashMap<MediaFileToken, Url>>,
) -> Result<Option<Box<String>>, AdvancedCommonWebError> {
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
    Some(url) => Ok(Some(Box::new(url.to_string()))),
    None => Err(AdvancedCommonWebError::BadInputWithSimpleMessage(format!(
      "Media token not found in hydration map: {:?}",
      token
    ))),
  }
}

/// Resolve a list of media tokens to their URLs.
fn resolve_media_token_list(
  tokens: Option<&Vec<MediaFileToken>>,
  hydration_map: Option<&HashMap<MediaFileToken, Url>>,
) -> Result<Option<Box<Vec<String>>>, AdvancedCommonWebError> {
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

  Ok(Some(Box::new(urls)))
}
