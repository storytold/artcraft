use enums::common::generation::common_resolution::CommonResolution as CommonResolutionEnum;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::providers::artcraft::seedream_5p0_pro_ultra::request::ArtcraftSeedream5p0ProUltraRequestState;

/// Customer-facing price per image at 1k resolution (the default), in USD cents.
const USD_CENTS_PER_IMAGE_1K: u64 = 18;

/// Customer-facing price per image at 2k resolution, in USD cents.
const USD_CENTS_PER_IMAGE_2K: u64 = 30;

/// Cost state for Artcraft Seedream 5.0 Pro Ultra. Pricing is per image and
/// resolution-dependent:
///
///   1K (default) → 18¢, 2K → 30¢. 3K/4K fall back to 2K pricing; 0.5K and
///   legacy video resolutions (480p/720p/1080p) fall back to 1K.
#[derive(Clone, Debug)]
pub struct ArtcraftSeedream5p0ProUltraCostState {
  pub resolution: Option<CommonResolutionEnum>,
  pub num_images: u16,
}

impl ArtcraftSeedream5p0ProUltraCostState {
  pub fn from_request(request: &ArtcraftSeedream5p0ProUltraRequestState) -> Self {
    Self {
      resolution: request.request.resolution,
      num_images: request.request.image_batch_count.unwrap_or(1),
    }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    let cost_per_image: u64 = cost_per_image_in_cents(self.resolution);
    let cost_in_usd_cents = cost_per_image * self.num_images as u64;
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

fn cost_per_image_in_cents(resolution: Option<CommonResolutionEnum>) -> u64 {
  use CommonResolutionEnum as R;
  match resolution {
    None
    | Some(R::HalfK)
    | Some(R::OneK)
    | Some(R::FourEightyP)
    | Some(R::SevenTwentyP)
    | Some(R::TenEightyP) => USD_CENTS_PER_IMAGE_1K,
    Some(R::TwoK) | Some(R::ThreeK) | Some(R::FourK) => USD_CENTS_PER_IMAGE_2K,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::router_image_model::RouterImageModel;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_resolution::RouterResolution;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;

  fn estimate(resolution: Option<RouterResolution>, image_batch_count: u16) -> ImageGenerationCostEstimate {
    let builder = GenerateImageRequestBuilder {
      model: RouterImageModel::Seedream5p0ProUltra,
      provider: RouterProvider::Artcraft,
      prompt: Some("an anime girl riding a dinosaur".to_string()),
      image_inputs: None,
      resolution,
      aspect_ratio: None,
      quality: None,
      image_batch_count: Some(image_batch_count),
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
    };
    builder.build2().unwrap().estimate_cost().unwrap()
  }

  fn cost_cents(resolution: Option<RouterResolution>, image_batch_count: u16) -> u64 {
    estimate(resolution, image_batch_count).cost_in_usd_cents.unwrap()
  }

  // ── Default / 1K (18¢) ──

  #[test]
  fn default_resolution_one_image_is_18c() { assert_eq!(cost_cents(None, 1), 18); }

  #[test]
  fn one_k_one_image_is_18c() { assert_eq!(cost_cents(Some(RouterResolution::OneK), 1), 18); }

  #[test]
  fn one_k_four_images_is_72c() { assert_eq!(cost_cents(Some(RouterResolution::OneK), 4), 72); }

  // ── 2K (30¢) ──

  #[test]
  fn two_k_one_image_is_30c() { assert_eq!(cost_cents(Some(RouterResolution::TwoK), 1), 30); }

  #[test]
  fn two_k_four_images_is_120c() { assert_eq!(cost_cents(Some(RouterResolution::TwoK), 4), 120); }

  // ── Fallbacks ──

  #[test]
  fn four_k_falls_back_to_two_k_pricing() {
    assert_eq!(
      ArtcraftSeedream5p0ProUltraCostState {
        resolution: Some(CommonResolutionEnum::FourK),
        num_images: 1,
      }.estimate_cost().cost_in_usd_cents,
      Some(30),
    );
  }

  #[test]
  fn half_k_falls_back_to_one_k_pricing() {
    assert_eq!(
      ArtcraftSeedream5p0ProUltraCostState {
        resolution: Some(CommonResolutionEnum::HalfK),
        num_images: 1,
      }.estimate_cost().cost_in_usd_cents,
      Some(18),
    );
  }

  // ── Credits track USD cents exactly (1 credit = 1 cent) ──

  #[test]
  fn credits_equal_usd_cents() {
    for batch in 1..=4u16 {
      let one_k = estimate(Some(RouterResolution::OneK), batch);
      assert_eq!(one_k.cost_in_credits, one_k.cost_in_usd_cents, "1k batch {}", batch);
      let two_k = estimate(Some(RouterResolution::TwoK), batch);
      assert_eq!(two_k.cost_in_credits, two_k.cost_in_usd_cents, "2k batch {}", batch);
    }
  }

  // ── The price must exceed the base Seedream 5.0 Pro price ──

  #[test]
  fn price_exceeds_base_seedream_5p0_pro_price() {
    use crate::generate::generate_image::providers::artcraft::seedream_5p0_pro::cost::ArtcraftSeedream5p0ProCostState;

    for resolution in [None, Some(CommonResolutionEnum::OneK), Some(CommonResolutionEnum::TwoK)] {
      for num_images in [1u16, 4] {
        let ultra_cents = ArtcraftSeedream5p0ProUltraCostState { resolution, num_images }
          .estimate_cost().cost_in_usd_cents.unwrap();
        let base_cents = ArtcraftSeedream5p0ProCostState { resolution, num_images }
          .estimate_cost().cost_in_usd_cents.unwrap();
        assert!(
          ultra_cents > base_cents,
          "ultra price {}¢ must exceed base price {}¢ ({:?} batch {})",
          ultra_cents, base_cents, resolution, num_images,
        );
      }
    }
  }

  // ── The Artcraft price must cover the Kinovi provider cost ──

  #[test]
  fn price_covers_kinovi_cost() {
    use kinovi_web_client::generate::image::generate_seedream_5p0_pro::{
      KinoviSeedream5p0ProBatchCount, KinoviSeedream5p0ProResolution,
    };
    use crate::generate::generate_image::providers::kinovi::seedream_5p0_pro::cost::KinoviSeedream5p0ProCostState;

    let cases = [
      (RouterResolution::OneK, KinoviSeedream5p0ProResolution::OneK, 1u16, KinoviSeedream5p0ProBatchCount::One),
      (RouterResolution::OneK, KinoviSeedream5p0ProResolution::OneK, 4u16, KinoviSeedream5p0ProBatchCount::Four),
      (RouterResolution::TwoK, KinoviSeedream5p0ProResolution::TwoK, 1u16, KinoviSeedream5p0ProBatchCount::One),
      (RouterResolution::TwoK, KinoviSeedream5p0ProResolution::TwoK, 4u16, KinoviSeedream5p0ProBatchCount::Four),
    ];
    for (router_res, kinovi_res, batch, kinovi_batch) in cases {
      let artcraft_cents = cost_cents(Some(router_res), batch);
      let kinovi_cents = KinoviSeedream5p0ProCostState {
        resolution: kinovi_res,
        batch_count: kinovi_batch,
      }.estimate_cost().cost_in_usd_cents.unwrap();
      assert!(
        artcraft_cents > kinovi_cents,
        "artcraft price {}¢ must exceed kinovi cost {}¢ ({:?} batch {})",
        artcraft_cents, kinovi_cents, router_res, batch,
      );
    }
  }

  // ── Flags ──

  #[test]
  fn cost_flags_are_correct() {
    let cost = ArtcraftSeedream5p0ProUltraCostState { resolution: None, num_images: 1 }.estimate_cost();
    assert!(!cost.is_free);
    assert!(!cost.is_unlimited);
    assert!(!cost.is_rate_limited);
    assert!(!cost.has_watermark);
    assert_eq!(cost.failures_are_refunded, None);
  }
}
