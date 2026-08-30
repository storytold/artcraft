use kinovi_web_client::generate::audio::generate_suno_sample::GenerateSunoSampleRequest;

use crate::generate::generate_audio::audio_generation_cost_estimate::AudioGenerationCostEstimate;
use crate::generate::generate_audio::providers::kinovi::suno_sample::draft::KinoviSunoSampleDraftState;
use crate::generate::generate_audio::providers::kinovi::suno_sample::request::KinoviSunoSampleRequestState;

/// Suno Sample is flat priced, so the cost state carries no request fields.
#[derive(Clone, Debug)]
pub struct KinoviSunoSampleCostState;

impl KinoviSunoSampleCostState {
  pub fn from_request(_request: &KinoviSunoSampleRequestState) -> Self {
    Self
  }

  pub fn from_draft(_draft: &KinoviSunoSampleDraftState) -> Self {
    Self
  }

  pub fn estimate_cost(&self) -> AudioGenerationCostEstimate {
    // Cost math is owned by kinovi_web_client's binding — the router just
    // forwards the result so router cost ≡ binding cost by construction.
    let pricing_request = GenerateSunoSampleRequest {
      prompt: String::new(),
      audio_url: "pricing-placeholder".to_string(),
      chop_sample_start_seconds: 0,
      chop_sample_end_seconds: 30,
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
  use crate::api::audio_list_ref::AudioListRef;
  use crate::api::router_audio_model::RouterAudioModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_audio::generate_audio_request_builder::GenerateAudioRequestBuilder;
  use crate::generate::generate_audio::providers::kinovi::suno_sample::build::build_kinovi_suno_sample_draft;

  use super::*;

  #[test]
  fn flat_cost_is_seven_cents() {
    let estimate = KinoviSunoSampleCostState.estimate_cost();
    assert_eq!(estimate.cost_in_usd_cents, Some(7));
    assert_eq!(estimate.cost_in_credits, Some(16));
  }

  #[test]
  fn cost_from_draft_is_seven_cents() {
    let builder = GenerateAudioRequestBuilder {
      model: RouterAudioModel::SunoSample,
      provider: RouterProvider::KinoviWeb,
      prompt: Some("mystical RPG adventure".to_string()),
      audio_references: Some(AudioListRef::Urls(vec!["https://example.com/a.aac".to_string()])),
      ..Default::default()
    };
    let draft = build_kinovi_suno_sample_draft(builder).expect("build");
    let estimate = KinoviSunoSampleCostState::from_draft(&draft).estimate_cost();
    assert_eq!(estimate.cost_in_usd_cents, Some(7));
  }
}
