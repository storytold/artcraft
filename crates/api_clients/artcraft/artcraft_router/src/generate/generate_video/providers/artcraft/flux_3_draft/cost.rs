use crate::generate::generate_video::providers::artcraft::flux_3_draft::request::ArtcraftFlux3DraftRequestState;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;

/// Per-second rate in hundredths of a US cent. Drafts always render 720p, so
/// resolution does not affect the bill.
const GENERATION_RATE_HUNDREDTH_CENTS_PER_SEC: u64 = 690;

#[derive(Clone, Debug)]
pub struct ArtcraftFlux3DraftCostState {
  pub duration_seconds: u64,
}

impl ArtcraftFlux3DraftCostState {
  pub fn from_request(request: &ArtcraftFlux3DraftRequestState) -> Self {
    Self {
      // Flux 3 Draft defaults None → 5s (the shortest selectable duration).
      duration_seconds: request.request.duration_seconds.map(u64::from).unwrap_or(5),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Round up to the next whole cent.
    let cost_in_usd_cents =
      (GENERATION_RATE_HUNDREDTH_CENTS_PER_SEC * self.duration_seconds).div_ceil(100);

    VideoGenerationCostEstimate {
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
  use crate::api::router_provider::RouterProvider;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::providers::artcraft::flux_3_draft::build::build_artcraft_flux_3_draft_state;
  use crate::generate::generate_video::providers::artcraft::flux_3_draft::cost::ArtcraftFlux3DraftCostState;

  #[test]
  fn default_settings_5s_is_35() { assert_eq!(cost_cents(Some(5), None), 35); }

  #[test]
  fn default_duration_is_5s() { assert_eq!(cost_cents(None, None), 35); }

  #[test]
  fn twenty_seconds_is_138() { assert_eq!(cost_cents(Some(20), None), 138); }

  /// Drafts always render 720p; a requested resolution does not change the
  /// bill.
  #[test]
  fn cost_ignores_resolution() {
    for resolution in [None, Some(RouterResolution::SevenTwentyP), Some(RouterResolution::TenEightyP)] {
      assert_eq!(cost_cents(Some(5), resolution), 35, "resolution={resolution:?}");
    }
  }

  #[test]
  fn odd_duration_rounds_up_to_whole_cents() {
    // 7s generation: 690 × 7 = 4830 hundredth-cents → 49 cents.
    assert_eq!(cost_cents(Some(7), None), 49);
  }

  fn cost_cents(
    duration_seconds: Option<u16>,
    resolution: Option<RouterResolution>,
  ) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Flux3Draft,
      provider: RouterProvider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      resolution,
      ..Default::default()
    };
    let state = build_artcraft_flux_3_draft_state(b).unwrap();
    ArtcraftFlux3DraftCostState::from_request(&state).estimate_cost().cost_in_usd_cents.unwrap()
  }
}
