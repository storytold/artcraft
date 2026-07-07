use seedance2pro_client::generate::audio::generate_suno_music::GenerateSunoMusicRequest;

use crate::generate::generate_audio::audio_generation_cost_estimate::AudioGenerationCostEstimate;
use crate::generate::generate_audio::providers::kinovi::suno_music::request::KinoviSunoMusicRequestState;

/// Suno Music is flat priced, so the cost state carries no request fields.
#[derive(Clone, Debug)]
pub struct KinoviSunoMusicCostState;

impl KinoviSunoMusicCostState {
  pub fn from_request(_request: &KinoviSunoMusicRequestState) -> Self {
    Self
  }

  pub fn estimate_cost(&self) -> AudioGenerationCostEstimate {
    // Cost math is owned by seedance2pro_client's binding — the router just
    // forwards the result so router cost ≡ binding cost by construction.
    let pricing_request = GenerateSunoMusicRequest {
      prompt: String::new(),
      style_tags: None,
      instrumental: false,
    };
    let costs = pricing_request.calculate_costs();

    AudioGenerationCostEstimate {
      cost_in_credits: Some(costs.kinovi_credits),
      cost_in_usd_cents: Some(costs.usd_cents_rounded_up),
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
  use crate::generate::generate_audio::providers::kinovi::suno_music::build::build_kinovi_suno_music_state;

  use super::*;

  #[test]
  fn flat_cost_is_seven_cents() {
    let estimate = KinoviSunoMusicCostState.estimate_cost();
    assert_eq!(estimate.cost_in_usd_cents, Some(7));
    assert_eq!(estimate.cost_in_credits, Some(16));
  }

  #[test]
  fn cost_from_built_request_is_seven_cents() {
    let builder = GenerateAudioRequestBuilder {
      model: RouterAudioModel::SunoMusic,
      provider: RouterProvider::Seedance2Pro,
      prompt: Some("a song".to_string()),
      ..Default::default()
    };
    let state = build_kinovi_suno_music_state(builder).expect("build");
    let estimate = KinoviSunoMusicCostState::from_request(&state).estimate_cost();
    assert_eq!(estimate.cost_in_usd_cents, Some(7));
  }
}
