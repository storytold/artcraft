use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::plan::artcraft::plan_generate_image_artcraft_gpt_image_1::{
  ArtcraftGptImage1Quality, ArtcraftGptImage1Size, PlanArtcraftGptImage1,
};

pub(crate) fn estimate_image_cost_artcraft_gpt_image_1(
  plan: &PlanArtcraftGptImage1<'_>,
) -> ImageGenerationCostEstimate {
  // What we charge in the legacy storyteller-web handlers (BYOK pricing
  // approximation, kept for parity with `enqueue_gpt_image_1_byok_*` cost):
  //   Auto:    17¢/image (treated as High)
  //   Low:      1¢/image
  //   Medium:   4¢/image
  //   High:    17¢/image
  // Cost is independent of image size on the artcraft (BYOK) tier.
  let cost_per_image: u64 = match plan.quality {
    ArtcraftGptImage1Quality::Auto => 17,
    ArtcraftGptImage1Quality::Low => 1,
    ArtcraftGptImage1Quality::Medium => 4,
    ArtcraftGptImage1Quality::High => 17,
  };

  // Reference `image_size` so the field is exercised in coverage; pricing
  // currently doesn't depend on it.
  let _ = plan.image_size.unwrap_or(ArtcraftGptImage1Size::Square);

  let cost_in_usd_cents = cost_per_image * plan.num_images.as_u64();

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
  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_image_model::CommonImageModel;
  use crate::api::provider::Provider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request::GenerateImageRequest;

  fn estimate_usd_cents(image_batch_count: u16, aspect_ratio: Option<CommonAspectRatio>) -> u64 {
    let request = GenerateImageRequest {
      model: CommonImageModel::GptImage1,
      provider: Provider::Artcraft,
      prompt: None,
      image_inputs: None,
      resolution: None,
      aspect_ratio,
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

  // The artcraft (BYOK) tier defaults plan.quality to High = 17¢/image and is
  // independent of size.

  #[test]
  fn default_quality_one_image_costs_17_cents() {
    assert_eq!(estimate_usd_cents(1, None), 17);
  }

  #[test]
  fn default_quality_two_images_costs_34_cents() {
    assert_eq!(estimate_usd_cents(2, None), 34);
  }

  #[test]
  fn default_quality_three_images_costs_51_cents() {
    assert_eq!(estimate_usd_cents(3, None), 51);
  }

  #[test]
  fn default_quality_four_images_costs_68_cents() {
    assert_eq!(estimate_usd_cents(4, None), 68);
  }

  #[test]
  fn cost_is_independent_of_aspect_ratio() {
    // The BYOK tier doesn't price by image size — square, wide, tall, auto
    // and unset all bill the same.
    let ars = [
      None,
      Some(CommonAspectRatio::Square),
      Some(CommonAspectRatio::SquareHd),
      Some(CommonAspectRatio::WideSixteenByNine),
      Some(CommonAspectRatio::TallNineBySixteen),
      Some(CommonAspectRatio::Auto),
      Some(CommonAspectRatio::Auto2k),
      Some(CommonAspectRatio::Auto4k),
    ];
    for ar in ars {
      assert_eq!(
        estimate_usd_cents(1, ar),
        17,
        "expected 17¢ regardless of aspect ratio (got {:?})",
        ar,
      );
    }
  }
}
