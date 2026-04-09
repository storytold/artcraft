//! Distillation step for the omni-gen image endpoints.
//!
//! Takes a raw [`OmniGenImageCostAndGenerateRequest`] plus a (pre-computed)
//! `MediaFileToken -> Url` map and produces a fully self-contained
//! [`DistilledImageRequest`] holding:
//!   - the (private) router request, kept for inspection in tests / debugging
//!   - the [`ImageGenerationCostEstimate`] (Artcraft provider, what we bill on)
//!   - the [`ImageGenerationPlan`] (Fal provider, what we actually execute)
//!
//! All borrows inside `request` and `plan` resolve to heap data owned by the
//! returned struct, so it has no caller-managed lifetimes and can be moved /
//! returned freely. Tests can construct one in isolation and assert against
//! its `cost` / `plan` directly.

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
///
/// Borrows inside `request` and `plan` point into the boxed owned data fields
/// below; those boxes live for the lifetime of `Self`, so the borrows are
/// always valid. Construct exclusively via [`distill_image_request`].
pub struct DistilledImageRequest {
  // Owned heap-stable backing data for the borrows in `request` / `plan`.
  // These boxes are never moved out and outlive both `request` and `plan` by
  // virtue of being dropped together with them when `Self` is dropped.
  // SAFETY backing for the lifetime erasure performed in `distill_image_request`.
  _owned_image_input_urls: Option<Box<Vec<String>>>,
  _owned_prompt: Option<Box<String>>,
  _owned_idempotency_token: Option<Box<String>>,

  /// The fully-built router request, with `provider = Fal` so it matches the
  /// plan we actually execute. Private — useful for tests / debugging only.
  ///
  /// Borrows inside this request point into the `_owned_*` boxes above. Access
  /// only via [`DistilledImageRequest::request`] (an accessor that ties the
  /// returned reference to `&self`) — never moved out, otherwise the borrows
  /// would dangle once the boxes are dropped with `Self`.
  request: GenerateImageRequest<'static>,

  /// Cost estimate as computed by the Artcraft provider — this is what we bill on.
  pub cost: ImageGenerationCostEstimate,

  /// Execution plan as computed by the Fal provider — what we hand to the router.
  ///
  /// Borrows inside this plan point into the `_owned_*` boxes above (and into
  /// `request`, which itself points into them). Access only via
  /// [`DistilledImageRequest::plan`] — moving the plan out of `Self` would
  /// dangle the borrows once the boxes are dropped.
  plan: ImageGenerationPlan<'static>,
}

impl DistilledImageRequest {
  /// Borrow the execution plan. The returned reference's lifetime is tied to
  /// `&self`, so the plan can never outlive the boxes that back its borrows.
  pub fn plan(&self) -> &ImageGenerationPlan<'_> {
    // SAFETY: the plan was constructed with `'static` borrows that actually
    // point into `self._owned_*`. Re-binding the lifetime to `&self` exposes
    // the true invariant to callers.
    &self.plan
  }

  /// Borrow the underlying router request. Useful for tests / debugging.
  /// (Same lifetime invariant as [`Self::plan`].)
  #[allow(dead_code)]
  pub(crate) fn request(&self) -> &GenerateImageRequest<'_> {
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
  // 1. Convert the raw API request into a router request (still borrowing
  //    from `request`).
  let initial = hydrate_to_router_request(request)?;

  // 2. Hoist every borrowed field into an owned `Box` so the resulting
  //    DistilledImageRequest doesn't borrow from the caller's `request`.
  let owned_prompt: Option<Box<String>> = initial.prompt.map(|s| Box::new(s.to_string()));
  let owned_idempotency_token: Option<Box<String>> =
    initial.idempotency_token.map(|s| Box::new(s.to_string()));

  let owned_image_input_urls: Option<Box<Vec<String>>> = build_owned_image_input_urls(
    request.image_media_tokens.as_ref(),
    media_file_hydration_map,
  )?;

  // 3. Build a `GenerateImageRequest<'static>` whose borrows point into the
  //    owned boxes from step 2.
  //
  //    SAFETY: each box lives in `Self` for the entire lifetime of the returned
  //    DistilledImageRequest, and the 'static-typed borrows we synthesize here
  //    are never exposed outside of `Self`. The plan / request fields can only
  //    be accessed through `&self`, so the borrows can never outlive the boxes.
  let prompt_static: Option<&'static str> = owned_prompt.as_deref().map(|s: &String| {
    let raw: *const str = s.as_str();
    unsafe { &*raw }
  });
  let idempotency_static: Option<&'static str> = owned_idempotency_token
    .as_deref()
    .map(|s: &String| {
      let raw: *const str = s.as_str();
      unsafe { &*raw }
    });
  let image_inputs_static: Option<ImageListRef<'static>> =
    owned_image_input_urls.as_deref().map(|v: &Vec<String>| {
      let raw: *const Vec<String> = v;
      ImageListRef::Urls(unsafe { &*raw })
    });

  // The "canonical" request used for both billing and execution.
  // Provider here is Fal (what we'll actually execute against). The cost path
  // below builds a sibling request with provider = Artcraft.
  let request_static: GenerateImageRequest<'static> = GenerateImageRequest {
    model: initial.model,
    provider: Provider::Fal,
    prompt: prompt_static,
    image_inputs: image_inputs_static,
    resolution: initial.resolution,
    aspect_ratio: initial.aspect_ratio,
    quality: initial.quality,
    image_batch_count: initial.image_batch_count,
    horizontal_angle: initial.horizontal_angle,
    vertical_angle: initial.vertical_angle,
    zoom: initial.zoom,
    request_mismatch_mitigation_strategy: initial.request_mismatch_mitigation_strategy,
    generation_mode_mismatch_strategy: initial.generation_mode_mismatch_strategy,
    idempotency_token: idempotency_static,
  };

  // 4. Cost estimate. Always use the Artcraft provider for billing regardless
  //    of which provider executes the request — that's what the user is paying for.
  let cost_request = GenerateImageRequest {
    provider: Provider::Artcraft,
    ..request_static.clone()
  };
  let cost_plan = cost_request.build().map_err(|e| {
    warn!("Failed to build cost plan during distillation: {}", e);
    AdvancedCommonWebError::from_error(e)
  })?;
  let cost: ImageGenerationCostEstimate = cost_plan.estimate_costs();
  // The cost plan borrows into `cost_request` which is about to be dropped;
  // `cost` is owned data so this is fine.
  drop(cost_plan);
  drop(cost_request);

  // 5. Execution plan. Built from the Fal-flavored canonical request. The plan
  //    borrows from the request, which in turn borrows from the owned boxes —
  //    so the plan's borrows resolve to heap-stable data inside `Self`.
  //
  //    SAFETY: the borrow we hand to `build()` is `&'static`, justified by the
  //    same invariants as above (the underlying data lives for the lifetime of
  //    the returned DistilledImageRequest).
  let plan: ImageGenerationPlan<'static> = {
    let request_ref: &'static GenerateImageRequest<'static> = unsafe {
      let raw: *const GenerateImageRequest<'static> = &request_static;
      &*raw
    };
    request_ref.build().map_err(|e| {
      warn!("Failed to build image generation plan during distillation: {}", e);
      AdvancedCommonWebError::from_error(e)
    })?
  };

  Ok(DistilledImageRequest {
    _owned_image_input_urls: owned_image_input_urls,
    _owned_prompt: owned_prompt,
    _owned_idempotency_token: owned_idempotency_token,
    request: request_static,
    cost,
    plan,
  })
}

/// Build the owned `Vec<String>` of image input URLs from the raw token list +
/// hydration map. Errors out if any token referenced by the request is missing
/// from the hydration map.
fn build_owned_image_input_urls(
  image_media_tokens: Option<&Vec<MediaFileToken>>,
  hydration_map: Option<&HashMap<MediaFileToken, Url>>,
) -> Result<Option<Box<Vec<String>>>, AdvancedCommonWebError> {
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

  Ok(Some(Box::new(urls)))
}
