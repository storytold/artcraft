use fal_client::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

use crate::generate::generate_audio::audio_generation_cost_estimate::AudioGenerationCostEstimate;
use crate::generate::generate_audio::providers::fal::seed_audio_1p0::request::FalSeedAudio1p0RequestState;

#[derive(Clone, Debug)]
pub struct FalSeedAudio1p0CostState {
  pub cost_in_usd_cents: u64,
}

impl FalSeedAudio1p0CostState {
  pub fn from_request(request: &FalSeedAudio1p0RequestState) -> Self {
    // Cost math is owned by fal_client's per-endpoint
    // `FalRequestCostCalculator` implementations. The router state just
    // forwards the result so router cost ≡ fal_client cost by construction.
    Self {
      cost_in_usd_cents: request.request.calculate_cost_in_cents(),
    }
  }

  pub fn estimate_cost(&self) -> AudioGenerationCostEstimate {
    AudioGenerationCostEstimate {
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
  use crate::api::router_audio_model::RouterAudioModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_audio::generate_audio_request_builder::GenerateAudioRequestBuilder;
  use crate::generate::generate_audio::providers::fal::seed_audio_1p0::build::build_fal_seed_audio_1p0_state;

  use super::*;

  #[test]
  fn estimate_is_nineteen_cents() {
    let state = build_fal_seed_audio_1p0_state(base_builder()).expect("build");
    let estimate = FalSeedAudio1p0CostState::from_request(&state).estimate_cost();
    assert_eq!(estimate.cost_in_usd_cents, Some(19));
    assert_eq!(estimate.cost_in_credits, Some(19));
  }

  #[test]
  fn options_do_not_change_the_estimate() {
    let tuned = GenerateAudioRequestBuilder {
      sample_rate_hz: Some(48_000),
      speed: Some(2.0),
      volume: Some(0.5),
      pitch: Some(-12.0),
      ..base_builder()
    };
    let base_state = build_fal_seed_audio_1p0_state(base_builder()).expect("build");
    let tuned_state = build_fal_seed_audio_1p0_state(tuned).expect("build");
    assert_eq!(
      FalSeedAudio1p0CostState::from_request(&base_state).cost_in_usd_cents,
      FalSeedAudio1p0CostState::from_request(&tuned_state).cost_in_usd_cents,
    );
  }

  // ── Helpers ──

  fn base_builder() -> GenerateAudioRequestBuilder {
    GenerateAudioRequestBuilder {
      model: RouterAudioModel::SeedAudio1p0,
      provider: RouterProvider::Fal,
      prompt: Some("a calm narrator describes ocean waves".to_string()),
      ..Default::default()
    }
  }
}
