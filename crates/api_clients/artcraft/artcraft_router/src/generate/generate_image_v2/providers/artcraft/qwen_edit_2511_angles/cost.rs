use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image_v2::providers::artcraft::qwen_edit_2511_angles::request::ArtcraftQwenEdit2511AnglesRequestState;

/// Cost state for Artcraft Qwen Edit 2511 Angles. Pricing mirrors v1
/// (`estimate_image_cost_artcraft_qwen_edit_2511_angles`): 4¢ per output image.
#[derive(Clone, Debug)]
pub struct ArtcraftQwenEdit2511AnglesCostState {
  pub num_images: u16,
}

impl ArtcraftQwenEdit2511AnglesCostState {
  pub fn from_request(request: &ArtcraftQwenEdit2511AnglesRequestState) -> Self {
    Self {
      num_images: request.request.image_batch_count.unwrap_or(1),
    }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    let cost_in_usd_cents = 4u64 * self.num_images as u64;
    ImageGenerationCostEstimate {
      cost_in_credits: Some(cost_in_usd_cents),
      cost_in_usd_cents: Some(cost_in_usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
      failures_are_refunded: None,
    }
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
  use tokens::tokens::media_files::MediaFileToken;

  fn cost_cents(image_batch_count: u16) -> u64 {
    let builder = GenerateImageRequestBuilder {
      model: CommonImageModel::QwenEdit2511Angles,
      provider: Provider::Artcraft,
      prompt: None,
      image_inputs: Some(ImageListRef::MediaFileTokens(vec![MediaFileToken::new_from_str("mf_test")])),
      resolution: None,
      aspect_ratio: None,
      quality: None,
      image_batch_count: Some(image_batch_count),
      horizontal_angle: Some(45.0),
      vertical_angle: Some(-15.0),
      zoom: Some(2.0),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
    };
    builder.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn one_image_costs_4_cents() { assert_eq!(cost_cents(1), 4); }

  #[test]
  fn two_images_costs_8_cents() { assert_eq!(cost_cents(2), 8); }

  #[test]
  fn three_images_costs_12_cents() { assert_eq!(cost_cents(3), 12); }

  #[test]
  fn four_images_costs_16_cents() { assert_eq!(cost_cents(4), 16); }
}
