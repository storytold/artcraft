use crate::generate::generate_image::image_generation_cost_estimate::ImageGenerationCostEstimate;
use crate::generate::generate_image::providers::artcraft::gpt_image_2p5_common_cost::ArtcraftGptImage2p5CostInputs;
use crate::generate::generate_image::providers::artcraft::gpt_image_2p5_flare::request::ArtcraftGptImage2p5FlareRequestState;

/// Cost state for Artcraft GPT Image 2.5 Flare. The price table is shared with the other
/// GPT Image 2.5 variant; see `gpt_image_2p5_common_cost`.
#[derive(Clone, Debug)]
pub struct ArtcraftGptImage2p5FlareCostState {
  inputs: ArtcraftGptImage2p5CostInputs,
}

impl ArtcraftGptImage2p5FlareCostState {
  pub fn from_request(request: &ArtcraftGptImage2p5FlareRequestState) -> Self {
    Self { inputs: ArtcraftGptImage2p5CostInputs::from_omni_request(&request.request) }
  }

  pub fn estimate_cost(&self) -> ImageGenerationCostEstimate {
    self.inputs.estimate_cost()
  }
}

#[cfg(test)]
mod tests {
  use tokens::tokens::media_files::MediaFileToken;

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

  // (reference_images, quality, aspect_ratio, resolution, batch, expected_cents)
  const CASES: &[(usize, Option<Q>, Option<Ar>, Option<R>, u16, u64)] = &[
    (0, None,            None,                        None,           1,  4),
    (0, Some(Q::Low),    Some(Ar::Square),            None,           1,  1),
    (0, Some(Q::Medium), Some(Ar::Square),            None,           1,  2),
    (0, Some(Q::High),   Some(Ar::Square),            None,           1,  6),
    (0, Some(Q::High),   Some(Ar::Square),            None,           4, 24),
    (0, Some(Q::High),   Some(Ar::SquareHd),          None,           1, 10),
    (0, Some(Q::High),   Some(Ar::Square),            Some(R::TwoK),  1, 10),
    (0, Some(Q::High),   Some(Ar::Square),            Some(R::FourK), 1, 14),
    (0, Some(Q::High),   Some(Ar::WideFourByThree),   None,           1,  4),
    (0, Some(Q::High),   Some(Ar::WideSixteenByNine), None,           1,  5),
    (0, Some(Q::High),   Some(Ar::WideSixteenByNine), Some(R::OneK),  1,  3),
    (0, Some(Q::High),   Some(Ar::WideSixteenByNine), Some(R::FourK), 1, 12),
    (0, Some(Q::Medium), Some(Ar::TallNineBySixteen), Some(R::ThreeK), 2, 6),
    (0, Some(Q::High),   Some(Ar::Auto),              None,           1, 12),
    (1, None,            None,                        None,           1, 12),
    (1, Some(Q::High),   Some(Ar::Square),            None,           1,  7),
    (4, Some(Q::High),   Some(Ar::Square),            None,           1, 10),
    (1, Some(Q::High),   Some(Ar::Square),            None,           4, 28),
    (1, Some(Q::Low),    Some(Ar::Square),            None,           1,  2),
  ];

  #[test]
  fn costs_through_build2() {
    for &(refs, quality, aspect_ratio, resolution, batch, expected) in CASES {
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
      Some(ImageListRef::MediaFileTokens((0..refs).map(|_| MediaFileToken::generate()).collect()))
    };
    GenerateImageRequestBuilder {
      model: RouterImageModel::GptImage2p5Flare,
      provider: RouterProvider::Artcraft,
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
