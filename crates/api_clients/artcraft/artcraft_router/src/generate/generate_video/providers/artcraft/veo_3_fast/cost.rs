use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::artcraft::veo_3_fast::request::ArtcraftVeo3FastRequestState;

/// Per-second rates in hundredths of a US cent.
const CENTI_CENTS_PER_SECOND_AUDIO_OFF: u64 = 1_150;
const CENTI_CENTS_PER_SECOND_AUDIO_ON: u64 = 1_725;

#[derive(Clone, Debug)]
pub struct ArtcraftVeo3FastCostState {
  pub duration_seconds: u64,
  pub generate_audio: bool,
}

impl ArtcraftVeo3FastCostState {
  pub fn from_request(request: &ArtcraftVeo3FastRequestState) -> Self {
    Self {
      duration_seconds: duration_seconds_for_cost(request.request.duration_seconds),
      // Unset defaults to audio on.
      generate_audio: request.request.generate_audio.unwrap_or(true),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let rate = if self.generate_audio {
      CENTI_CENTS_PER_SECOND_AUDIO_ON
    } else {
      CENTI_CENTS_PER_SECOND_AUDIO_OFF
    };
    let cost_in_usd_cents = (rate * self.duration_seconds).div_ceil(100);

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

/// Mirrors Veo 3's `duration_seconds_for_cost`: s≤4 → 4, s≤6 → 6, else → 8
/// (incl. None and 7+).
fn duration_seconds_for_cost(d: Option<u16>) -> u64 {
  match d {
    Some(s) if s <= 4 => 4,
    Some(s) if s <= 6 => 6,
    _ => 8,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents(duration_seconds: Option<u16>, generate_audio: Option<bool>) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Veo3Fast,
      provider: RouterProvider::Artcraft,
      prompt: Some("test".to_string()),
      duration_seconds,
      generate_audio,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn audio_off_4s_is_46() { assert_eq!(cost_cents(Some(4), Some(false)), 46); }

  #[test]
  fn audio_off_6s_is_69() { assert_eq!(cost_cents(Some(6), Some(false)), 69); }

  #[test]
  fn audio_off_8s_is_92() { assert_eq!(cost_cents(Some(8), Some(false)), 92); }

  #[test]
  fn audio_on_4s_is_69() { assert_eq!(cost_cents(Some(4), Some(true)), 69); }

  #[test]
  fn audio_on_6s_is_104() {
    // 1725 × 6 = 10350 hundredth-cents → 104 cents (rounded up).
    assert_eq!(cost_cents(Some(6), Some(true)), 104);
  }

  #[test]
  fn audio_on_8s_is_138() { assert_eq!(cost_cents(Some(8), Some(true)), 138); }

  #[test]
  fn default_duration_is_8s() {
    assert_eq!(cost_cents(None, Some(false)), cost_cents(Some(8), Some(false)));
  }

  #[test]
  fn audio_default_is_on() {
    assert_eq!(cost_cents(Some(8), None), cost_cents(Some(8), Some(true)));
  }

}
