use seedance2pro_web_client::generate::audio::generate_suno_remix::{
  GenerateSunoRemixRequest, KinoviSunoRemixSource,
};

use crate::generate::generate_audio::audio_generation_cost_estimate::AudioGenerationCostEstimate;
use crate::generate::generate_audio::providers::kinovi::suno_remix::draft::KinoviSunoRemixDraftState;
use crate::generate::generate_audio::providers::kinovi::suno_remix::request::KinoviSunoRemixRequestState;

/// Suno Remix is flat priced, so the cost state carries no request fields.
#[derive(Clone, Debug)]
pub struct KinoviSunoRemixCostState;

impl KinoviSunoRemixCostState {
  pub fn from_request(_request: &KinoviSunoRemixRequestState) -> Self {
    Self
  }

  pub fn from_draft(_draft: &KinoviSunoRemixDraftState) -> Self {
    Self
  }

  pub fn estimate_cost(&self) -> AudioGenerationCostEstimate {
    // Cost math is owned by seedance2pro_web_client's binding — the router just
    // forwards the result so router cost ≡ binding cost by construction.
    let pricing_request = GenerateSunoRemixRequest {
      prompt: String::new(),
      source: KinoviSunoRemixSource::AudioUrl("pricing-placeholder".to_string()),
      style_tags: None,
      keep_lyrics: false,
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
  use crate::generate::generate_audio::providers::kinovi::suno_remix::build::build_kinovi_suno_remix_draft;

  use super::*;

  #[test]
  fn flat_cost_is_seven_cents() {
    let estimate = KinoviSunoRemixCostState.estimate_cost();
    assert_eq!(estimate.cost_in_usd_cents, Some(7));
    assert_eq!(estimate.cost_in_credits, Some(16));
  }

  #[test]
  fn cost_from_draft_is_seven_cents() {
    let builder = GenerateAudioRequestBuilder {
      model: RouterAudioModel::SunoRemix,
      provider: RouterProvider::Seedance2Pro,
      prompt: Some("make this electronic".to_string()),
      audio_references: Some(AudioListRef::Urls(vec!["https://example.com/a.mp3".to_string()])),
      ..Default::default()
    };
    let draft = build_kinovi_suno_remix_draft(builder).expect("build");
    let estimate = KinoviSunoRemixCostState::from_draft(&draft).estimate_cost();
    assert_eq!(estimate.cost_in_usd_cents, Some(7));
  }
}
