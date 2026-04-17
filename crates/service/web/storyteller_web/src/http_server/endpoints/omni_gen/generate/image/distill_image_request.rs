//! Distillation step for the omni-gen image endpoints.
//!
//! Takes a raw [`OmniGenImageCostAndGenerateRequest`] plus a (pre-computed)
//! `MediaFileToken -> Url` map and produces a fully self-contained
//! [`DistilledImageRequest`] holding:
//!   - the (private) router request, kept for inspection in tests / debugging
//!   - the [`ImageGenerationCostEstimate`] (Artcraft provider, what we bill on)
//!   - the [`ImageGenerationPlan`] (Fal provider, what we actually execute)

use std::collections::HashMap;

use log::warn;
use url::Url;

use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::generate::generate_image::generate_image_request::GenerateImageRequest;
use artcraft_router::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use artcraft_router::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;

use super::distill_helper::hydrate_to_router_request::hydrate_to_router_request;

/// Self-contained, owned representation of a fully-distilled omni-gen image
/// request: the router request, the bill-on cost estimate, and the executable
/// plan, all in one place.
pub struct DistilledImageRequest {
  /// The fully-built router request.
  request: GenerateImageRequest,

  /// Cost estimate as computed by the Artcraft provider — this is what we bill on.
  pub cost: ImageGenerationCostEstimate,

  /// Execution plan as computed by the Fal provider — what we hand to the router.
  plan: ImageGenerationPlan,
}

impl DistilledImageRequest {
  /// Borrow the execution plan.
  pub fn plan(&self) -> &ImageGenerationPlan {
    &self.plan
  }

  /// Borrow the underlying router request. Useful for tests / debugging.
  #[allow(dead_code)]
  pub(crate) fn request(&self) -> &GenerateImageRequest {
    &self.request
  }
}

/// Build a [`DistilledImageRequest`] from a raw API request and a pre-computed
/// `MediaFileToken -> Url` hydration map.
///
/// The hydration map should already have been resolved by the caller (via
/// `lookup_image_urls_as_map` or equivalent) — distillation does no I/O.
///
/// Returns `BadInputWithSimpleMessage` if any image media token referenced by
/// the request is missing from the hydration map.
pub fn distill_image_request(
  request: &OmniGenImageCostAndGenerateRequest,
  media_file_hydration_map: Option<&HashMap<MediaFileToken, Url>>,
) -> Result<DistilledImageRequest, AdvancedCommonWebError> {
  // 1. Convert the raw API request into a router request.
  let mut initial = hydrate_to_router_request(request)?;

  // 2. If we have media tokens, resolve them to URLs for the execution request.
  let image_input_urls = build_image_input_urls(
    request.image_media_tokens.as_ref(),
    media_file_hydration_map,
  )?;

  // 3. Build the execution request with resolved URLs and Fal provider.
  if let Some(urls) = image_input_urls {
    initial.image_inputs = Some(ImageListRef::Urls(urls));
  }
  initial.provider = Provider::Fal;
  let fal_request = initial;

  // 4. Cost estimate. Always use the Artcraft provider for billing regardless
  //    of which provider executes the request.
  let cost_request = GenerateImageRequest {
    provider: Provider::Artcraft,
    ..fal_request.clone()
  };
  let cost_plan = cost_request.build().map_err(|e| {
    warn!("Failed to build cost plan during distillation: {}", e);
    AdvancedCommonWebError::from_error(e)
  })?;
  let cost: ImageGenerationCostEstimate = cost_plan.estimate_costs();

  // 5. Execution plan.
  let plan = fal_request.build().map_err(|e| {
    warn!("Failed to build image generation plan during distillation: {}", e);
    AdvancedCommonWebError::from_error(e)
  })?;

  Ok(DistilledImageRequest {
    request: fal_request,
    cost,
    plan,
  })
}

/// Build the owned `Vec<String>` of image input URLs from the raw token list +
/// hydration map. Errors out if any token referenced by the request is missing
/// from the hydration map.
fn build_image_input_urls(
  image_media_tokens: Option<&Vec<MediaFileToken>>,
  hydration_map: Option<&HashMap<MediaFileToken, Url>>,
) -> Result<Option<Vec<String>>, AdvancedCommonWebError> {
  let tokens = match image_media_tokens {
    Some(tokens) if !tokens.is_empty() => tokens,
    _ => return Ok(None),
  };

  let map = hydration_map.ok_or_else(|| {
    AdvancedCommonWebError::BadInputWithSimpleMessage(
      "image_media_tokens supplied but no hydration map was provided".to_string(),
    )
  })?;

  let mut urls: Vec<String> = Vec::with_capacity(tokens.len());
  for token in tokens {
    match map.get(token) {
      Some(url) => urls.push(url.to_string()),
      None => {
        return Err(AdvancedCommonWebError::BadInputWithSimpleMessage(format!(
          "Image media token not found in hydration map: {:?}",
          token
        )));
      }
    }
  }

  Ok(Some(urls))
}
