use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_splat_cost_and_generate_request::OmniGenSplatCostAndGenerateRequest;
use worldlabs_api_client::pricing::check_pricing::InputType;

use crate::generate::generate_splat::splat_generation_cost_estimate::SplatGenerationCostEstimate;

/// Flat prices for a splat model by input type, in USD cents.
#[derive(Copy, Clone, Debug)]
pub(crate) struct ArtcraftSplatPriceTable {
  pub image_panorama: u64,
  pub text: u64,
  pub image_non_panorama: u64,
  pub multi_image: u64,
  pub video: u64,
}

impl ArtcraftSplatPriceTable {
  pub(crate) fn cost_in_usd_cents(&self, input_type: InputType) -> u64 {
    match input_type {
      InputType::ImagePanorama => self.image_panorama,
      InputType::Text => self.text,
      InputType::ImageNonPanorama => self.image_non_panorama,
      InputType::MultiImage => self.multi_image,
      InputType::Video => self.video,
    }
  }
}

/// Derive the pricing input type from a forwarded omni splat request.
/// Mirrors the request-assembly derivation: video wins over images, two or
/// more images are multi-image, one image is panorama/non-panorama, and
/// anything else prices as text.
pub(crate) fn derive_input_type_for_pricing(
  request: &OmniGenSplatCostAndGenerateRequest,
) -> InputType {
  let image_count = request.reference_image_media_tokens.as_ref()
    .map(|tokens| tokens.len())
    .unwrap_or(0);

  if request.reference_video_media_token.is_some() {
    InputType::Video
  } else if image_count >= 2 {
    InputType::MultiImage
  } else if image_count == 1 {
    if request.is_panoramic == Some(true) {
      InputType::ImagePanorama
    } else {
      InputType::ImageNonPanorama
    }
  } else {
    InputType::Text
  }
}

pub(crate) fn artcraft_splat_cost_estimate(cost_in_usd_cents: u64) -> SplatGenerationCostEstimate {
  SplatGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
    failures_are_refunded: None,
  }
}
