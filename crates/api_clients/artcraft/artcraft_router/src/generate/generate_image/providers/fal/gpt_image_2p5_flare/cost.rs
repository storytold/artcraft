use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::providers::fal::gpt_image_2p5_flare::request::FalGptImage2p5FlareRequestState;

/// Cost state for Fal GPT Image 2.5 Flare. Delegates to `fal_client`'s calculator, which
/// prices by output dimensions (aspect ratio and resolution tier), quality, batch size and,
/// for edits, the number of reference images.
#[derive(Clone, Debug)]
pub struct FalGptImage2p5FlareCostState {
  cost_in_usd_cents: u64,
}

impl FalGptImage2p5FlareCostState {
  pub fn from_request(request: &FalGptImage2p5FlareRequestState) -> Self {
    let cost_in_usd_cents = match request {
      FalGptImage2p5FlareRequestState::TextToImage(request) => request.calculate_cost_in_cents(),
      FalGptImage2p5FlareRequestState::EditImage(request) => request.calculate_cost_in_cents(),
    };
    Self { cost_in_usd_cents }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    ImageGenerationCostEstimate {
      cost_in_credits: Some(self.cost_in_usd_cents),
      cost_in_usd_cents: Some(self.cost_in_usd_cents),
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
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::router_aspect_ratio::RouterAspectRatio;
  use crate::api::router_image_model::RouterImageModel;
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_quality::RouterQuality;
  use crate::api::router_resolution::RouterResolution;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
  use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
  use RouterAspectRatio as Ar;
  use RouterQuality as Q;
  use RouterResolution as R;

  // (quality, aspect_ratio, resolution, batch, expected_cents) — text-to-image
  const TEXT_CASES: &[(Option<Q>, Option<Ar>, Option<R>, u16, u64)] = &[
    (None,            None,                    None,          1,  4), // Fal default: landscape_4_3, high
    (Some(Q::Low),    Some(Ar::Square),        None,          1,  1),
    (Some(Q::Medium), Some(Ar::Square),        None,          1,  2),
    (Some(Q::High),   Some(Ar::Square),        None,          1,  6),
    (Some(Q::High),   Some(Ar::Square),        None,          4, 24),
    (Some(Q::High),   Some(Ar::SquareHd),      None,          1,  9),
    (Some(Q::High),   Some(Ar::Square),        Some(R::TwoK), 1,  9),
    (Some(Q::High),   Some(Ar::Square),        Some(R::FourK), 1, 13),
    (Some(Q::High),   Some(Ar::WideFourByThree), None,        1,  4),
    (Some(Q::High),   Some(Ar::TallThreeByFour), None,        1,  4),
    (Some(Q::High),   Some(Ar::WideSixteenByNine), None,      1,  4),
    (Some(Q::High),   Some(Ar::WideSixteenByNine), Some(R::OneK), 1, 3),
    (Some(Q::High),   Some(Ar::WideSixteenByNine), Some(R::FourK), 1, 11),
    (Some(Q::Medium), Some(Ar::TallNineBySixteen), Some(R::ThreeK), 2, 4),
    (Some(Q::High),   Some(Ar::Auto),          None,          1, 11),
    (Some(Q::High),   Some(Ar::Auto4k),        None,          1, 11),
  ];

  // (reference_images, quality, aspect_ratio, resolution, batch, expected_cents) — edit
  const EDIT_CASES: &[(usize, Option<Q>, Option<Ar>, Option<R>, u16, u64)] = &[
    (1, None,          None,             None,          1, 11), // Fal default: auto, high
    (1, Some(Q::Low),  Some(Ar::Square), None,          1,  2),
    (1, Some(Q::High), Some(Ar::Square), None,          1,  7),
    (3, Some(Q::High), Some(Ar::Square), None,          1,  8),
    (1, Some(Q::High), Some(Ar::Square), None,          4, 28),
    (1, Some(Q::High), Some(Ar::WideSixteenByNine), Some(R::FourK), 1, 11),
    (2, Some(Q::High), Some(Ar::Auto),   None,          1, 12),
  ];

  #[test]
  fn text_to_image_costs() {
    for &(quality, aspect_ratio, resolution, batch, expected) in TEXT_CASES {
      assert_eq!(cost_cents(0, quality, aspect_ratio, resolution, batch), expected, "{quality:?} {aspect_ratio:?} {resolution:?} x{batch}");
    }
  }

  #[test]
  fn edit_image_costs() {
    for &(refs, quality, aspect_ratio, resolution, batch, expected) in EDIT_CASES {
      assert_eq!(cost_cents(refs, quality, aspect_ratio, resolution, batch), expected, "{refs} refs {quality:?} {aspect_ratio:?} {resolution:?} x{batch}");
    }
  }

  #[test]
  fn estimate_flags() {
    let cost = builder(0, Some(Q::High), Some(Ar::Square), None, 1).build2().unwrap().estimate_cost().unwrap();
    assert_eq!(cost.cost_in_credits, cost.cost_in_usd_cents);
    assert!(!cost.is_free);
    assert!(!cost.is_unlimited);
    assert!(!cost.is_rate_limited);
    assert!(!cost.has_watermark);
  }

  fn cost_cents(refs: usize, quality: Option<Q>, aspect_ratio: Option<Ar>, resolution: Option<R>, batch: u16) -> u64 {
    builder(refs, quality, aspect_ratio, resolution, batch)
      .build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  fn builder(refs: usize, quality: Option<Q>, aspect_ratio: Option<Ar>, resolution: Option<R>, batch: u16) -> GenerateImageRequestBuilder {
    let image_inputs = if refs == 0 {
      None
    } else {
      Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string(); refs]))
    };
    GenerateImageRequestBuilder {
      model: RouterImageModel::GptImage2p5Flare,
      provider: RouterProvider::Fal,
      prompt: Some("a cat in space".to_string()),
      image_inputs,
      resolution,
      aspect_ratio,
      quality,
      image_batch_count: Some(batch),
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
    }
  }
}
