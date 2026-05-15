//! Distillation step for the omni-gen image endpoints.
//!
//! Takes a hydrated [`GenerateImageRequestBuilder`] plus pre-resolved
//! media URLs and produces a fully self-contained
//! [`DistilledImageRequest`] holding:
//!   - the (private) router request, kept for inspection in tests / debugging
//!   - the [`ImageGenerationCostEstimate`] (Artcraft provider, what we bill on)
//!   - the [`ImageGenerationPlan`] (Fal provider, what we actually execute)

#[cfg(test)]
use std::collections::HashMap;

use log::warn;
#[cfg(test)]
use url::Url;

#[cfg(test)]
use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
use artcraft_router::api::image_list_ref::ImageListRef;
use artcraft_router::api::provider::Provider;
use artcraft_router::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use artcraft_router::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use artcraft_router::generate::generate_image::image_generation_plan::ImageGenerationPlan;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_responses::advanced_common_web_error::AdvancedCommonWebError;
#[cfg(test)]
use crate::http_server::endpoints::omni_gen::generate::image::hydrate_to_router_request::hydrate_to_router_request;
use crate::util::lookup::lookup_media_files_as_cdn_url_list_and_map::MediaFilesAsCdnUrlListAndMap;

pub(crate) trait DistillImageRequestInput {
  fn to_router_builder(&self) -> Result<GenerateImageRequestBuilder, AdvancedCommonWebError>;
}

impl DistillImageRequestInput for GenerateImageRequestBuilder {
  fn to_router_builder(&self) -> Result<GenerateImageRequestBuilder, AdvancedCommonWebError> {
    Ok(self.clone())
  }
}

#[cfg(test)]
impl DistillImageRequestInput for OmniGenImageCostAndGenerateRequest {
  fn to_router_builder(&self) -> Result<GenerateImageRequestBuilder, AdvancedCommonWebError> {
    hydrate_to_router_request(self)
  }
}

pub(crate) trait DistillImageMediaInput {
  fn image_url_for_token(&self, token: &MediaFileToken) -> Option<String>;
}

impl DistillImageMediaInput for MediaFilesAsCdnUrlListAndMap {
  fn image_url_for_token(&self, token: &MediaFileToken) -> Option<String> {
    self.token_to_url_map.get(token).cloned()
  }
}

#[cfg(test)]
impl DistillImageMediaInput for HashMap<MediaFileToken, Url> {
  fn image_url_for_token(&self, token: &MediaFileToken) -> Option<String> {
    self.get(token).map(|url| url.to_string())
  }
}

/// Self-contained, owned representation of a fully-distilled omni-gen image
/// request: the router request, the bill-on cost estimate, and the executable
/// plan, all in one place.
pub struct DistilledImageRequest {
  /// The fully-built router request.
  pub request: GenerateImageRequestBuilder,

  /// Cost estimate as computed by the Artcraft provider — this is what we bill on.
  pub cost: ImageGenerationCostEstimate,

  /// Execution plan as computed by the Fal provider — what we hand to the router.
  pub plan: ImageGenerationPlan,
}

impl DistilledImageRequest {
  /// Borrow the execution plan.
  pub fn plan(&self) -> &ImageGenerationPlan {
    &self.plan
  }

  /// Borrow the underlying router request. Useful for tests / debugging.
  #[allow(dead_code)]
  pub(crate) fn request(&self) -> &GenerateImageRequestBuilder {
    &self.request
  }
}

/// Build a [`DistilledImageRequest`] from an already-hydrated router request
/// and pre-resolved media URLs.
///
/// Media should already have been resolved by the caller. Distillation does no I/O.
///
/// Returns `BadInputWithSimpleMessage` if any image media token referenced by
/// the request is missing from the hydration map.
pub(crate) fn distill_image_request<M: DistillImageMediaInput>(
  request: &impl DistillImageRequestInput,
  media_file_hydration_map: Option<&M>,
) -> Result<DistilledImageRequest, AdvancedCommonWebError> {
  // 1. Start from the router request built by the shared handler layer.
  let mut initial = request.to_router_builder()?;

  // 2. If we have media tokens, resolve them to URLs for the execution request.
  let image_input_urls = build_image_input_urls(
    initial.image_inputs.as_ref(),
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
  let cost_request = GenerateImageRequestBuilder {
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
  image_inputs: Option<&ImageListRef>,
  hydration_map: Option<&impl DistillImageMediaInput>,
) -> Result<Option<Vec<String>>, AdvancedCommonWebError> {
  let tokens = match image_inputs {
    Some(ImageListRef::MediaFileTokens(tokens)) if !tokens.is_empty() => tokens,
    _ => return Ok(None),
  };

  let map = hydration_map.ok_or_else(|| {
    AdvancedCommonWebError::BadInputWithSimpleMessage(
      "image_media_tokens supplied but no hydration map was provided".to_string(),
    )
  })?;

  let mut urls: Vec<String> = Vec::with_capacity(tokens.len());
  for token in tokens {
    match map.image_url_for_token(token) {
      Some(url) => urls.push(url),
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
