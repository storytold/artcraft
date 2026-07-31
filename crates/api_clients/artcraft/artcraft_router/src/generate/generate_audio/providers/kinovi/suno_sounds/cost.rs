use kinovi_web_client::generate::audio::generate_suno_sound::{
  GenerateSunoSoundRequest, KinoviSunoSoundKey, KinoviSunoSoundType,
};

use crate::generate::generate_audio::audio_generation_cost_estimate::AudioGenerationCostEstimate;
use crate::generate::generate_audio::providers::kinovi::suno_sounds::request::KinoviSunoSoundsRequestState;

/// Suno Sounds is flat priced, so the cost state carries no request fields.
#[derive(Clone, Debug)]
pub struct KinoviSunoSoundsCostState;

impl KinoviSunoSoundsCostState {
  pub fn from_request(_request: &KinoviSunoSoundsRequestState) -> Self {
    Self
  }

  pub fn estimate_cost(&self) -> AudioGenerationCostEstimate {
    // Cost math is owned by kinovi_web_client's binding — the router just
    // forwards the result so router cost ≡ binding cost by construction.
    let pricing_request = GenerateSunoSoundRequest {
      prompt: String::new(),
      sound_type: KinoviSunoSoundType::SingleHit,
      bpm: None,
      key: KinoviSunoSoundKey::Auto,
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
  use crate::generate::generate_audio::providers::kinovi::suno_sounds::build::build_kinovi_suno_sounds_state;

  use super::*;

  #[test]
  fn flat_cost_is_two_cents() {
    let estimate = KinoviSunoSoundsCostState.estimate_cost();
    assert_eq!(estimate.cost_in_usd_cents, Some(2));
    assert_eq!(estimate.cost_in_credits, Some(4));
  }

  #[test]
  fn cost_from_built_request_is_two_cents() {
    let builder = GenerateAudioRequestBuilder {
      model: RouterAudioModel::SunoSounds,
      provider: RouterProvider::KinoviWeb,
      prompt: Some("thunder".to_string()),
      is_loopable: Some(true),
      bpm: Some(60),
      ..Default::default()
    };
    let state = build_kinovi_suno_sounds_state(builder).expect("build");
    let estimate = KinoviSunoSoundsCostState::from_request(&state).estimate_cost();
    assert_eq!(estimate.cost_in_usd_cents, Some(2));
  }
}
