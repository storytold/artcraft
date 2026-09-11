use crate::generate::generate_audio::audio_generation_cost_estimate::AudioGenerationCostEstimate;
use crate::generate::generate_audio::providers::artcraft::suno_remix::request::ArtcraftSunoRemixRequestState;

const COST_IN_USD_CENTS: u64 = 8;

/// Suno Remix via Artcraft is flat priced, so the cost state carries no
/// request fields.
#[derive(Clone, Debug)]
pub struct ArtcraftSunoRemixCostState;

impl ArtcraftSunoRemixCostState {
  pub fn from_request(_request: &ArtcraftSunoRemixRequestState) -> Self {
    Self
  }

  pub fn estimate_cost(&self) -> AudioGenerationCostEstimate {
    AudioGenerationCostEstimate {
      cost_in_credits: Some(COST_IN_USD_CENTS),
      cost_in_usd_cents: Some(COST_IN_USD_CENTS),
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
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::audio_list_ref::AudioListRef;
  use crate::api::router_audio_model::RouterAudioModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_audio::generate_audio_request_builder::GenerateAudioRequestBuilder;

  use super::*;

  #[test]
  fn flat_cost_is_eight_cents() {
    let builder = GenerateAudioRequestBuilder {
      model: RouterAudioModel::SunoRemix,
      provider: RouterProvider::Artcraft,
      prompt: Some("make this electronic".to_string()),
      audio_references: Some(AudioListRef::MediaFileTokens(vec![
        MediaFileToken::new("mf_test123".to_string()),
      ])),
      ..Default::default()
    };
    let estimate = builder.build2().unwrap().estimate_cost().unwrap();
    assert_eq!(estimate.cost_in_usd_cents, Some(8));
    assert_eq!(estimate.cost_in_credits, Some(8));
    // Direct cost-state path matches the builder path.
    assert_eq!(ArtcraftSunoRemixCostState.estimate_cost().cost_in_usd_cents, Some(8));
  }
}
