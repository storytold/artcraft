use artcraft_api_defs::generate::image::angle::qwen_edit_2511_edit_image_angle::QwenEdit2511EditImageAngleNumImages;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_qwen_edit_2511_angles::PlanArtcraftQwenEdit2511Angles;

pub(crate) fn estimate_image_cost_artcraft_qwen_edit_2511_angles(
  plan: &PlanArtcraftQwenEdit2511Angles<'_>,
) -> ImageGenerationCostEstimate {
  // Pricing: $0.04/image (4 cents). 1 credit = 1 USD cent.
  let cost_per_image: u64 = 4;

  let num_images: u64 = match plan.num_images {
    QwenEdit2511EditImageAngleNumImages::One => 1,
    QwenEdit2511EditImageAngleNumImages::Two => 2,
    QwenEdit2511EditImageAngleNumImages::Three => 3,
    QwenEdit2511EditImageAngleNumImages::Four => 4,
  };

  let cost_in_usd_cents = cost_per_image * num_images;

  ImageGenerationCostEstimate {
    cost_in_credits: Some(cost_in_usd_cents),
    cost_in_usd_cents: Some(cost_in_usd_cents),
    is_free: false,
    is_unlimited: false,
    is_rate_limited: false,
    has_watermark: false,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request::GenerateImageRequest;
  use tokens::tokens::media_files::MediaFileToken;

  fn estimate_usd_cents(image_batch_count: u16) -> u64 {
    let tokens = vec![MediaFileToken::new_from_str("test_token")];
    let request = GenerateImageRequest {
      model: CommonImageModel::QwenEdit2511Angles,
      provider: Provider::Artcraft,
      prompt: None,
      image_inputs: Some(ImageListRef::MediaFileTokens(&tokens)),
      resolution: None,
      aspect_ratio: None,
      image_batch_count: Some(image_batch_count),
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
    };
    request.build()
      .expect("build should succeed")
      .estimate_costs()
      .cost_in_usd_cents
      .expect("cost_in_usd_cents should be present")
  }

  #[test]
  fn test_estimate_cost_usd_cents() {
    // $0.04/image = 4 cents each
    assert_eq!(estimate_usd_cents(1), 4);
    assert_eq!(estimate_usd_cents(2), 8);
    assert_eq!(estimate_usd_cents(3), 12);
    assert_eq!(estimate_usd_cents(4), 16);
  }
}
