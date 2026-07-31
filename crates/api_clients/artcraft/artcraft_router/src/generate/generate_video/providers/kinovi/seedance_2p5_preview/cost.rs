use kinovi_web_client::generate::video::generate_seedance_2p5_preview::{
  GenerateSeedance2p5PreviewRequest, KinoviSeedance2p5PreviewOutputResolution,
};

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::kinovi::seedance_2p5_preview::draft::KinoviSeedance2p5PreviewDraftState;
use crate::generate::generate_video::providers::kinovi::seedance_2p5_preview::request::KinoviSeedance2p5PreviewRequestState;

/// Only the resolution and duration matter — Seedance 2.5 Preview has no
/// video-reference surcharge and no batching, so references never change the
/// price.
pub struct KinoviSeedance2p5PreviewCostState {
  pub resolution: Option<KinoviSeedance2p5PreviewOutputResolution>,
  pub duration_seconds: u8,
}

impl KinoviSeedance2p5PreviewCostState {
  pub fn from_request(request: &KinoviSeedance2p5PreviewRequestState) -> Self {
    Self {
      resolution: request.request.output_resolution,
      duration_seconds: request.request.duration_seconds,
    }
  }

  pub fn from_draft(draft: &KinoviSeedance2p5PreviewDraftState) -> Self {
    Self {
      resolution: draft.resolution,
      duration_seconds: draft.duration_seconds,
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let pricing_request = GenerateSeedance2p5PreviewRequest {
      output_resolution: self.resolution,
      duration_seconds: self.duration_seconds,

      // No impact on price (references never affect 2.5 Preview pricing)
      prompt: String::new(),
      aspect_ratio: None,
      reference_image_urls: None,
      reference_video_urls: None,
      reference_audio_urls: None,
      use_face_blur_hack: None,
    };

    let costs = pricing_request.calculate_costs();
    // 2.5 Preview bills fractional credits (46.81/sec at 480p). The router's
    // credit field is an integer, so round to the nearest credit; the USD
    // cents (the authoritative charge) are already rounded up.
    let cost_in_credits = costs.kinovi_credits.round() as u64;
    let cost_in_usd_cents = costs.usd_cents_rounded_up;

    VideoGenerationCostEstimate {
      cost_in_credits: Some(cost_in_credits),
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
  use kinovi_web_client::generate::video::generate_seedance_2p5_preview::KinoviSeedance2p5PreviewOutputResolution as KinoviOutputResolution;

  use super::*;

  // ── Credits (rounded to the nearest whole credit for the integer field) ──

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_480p() {
      // 46.81 credits/s: 187.24 → 187, 702.15 → 702, 1170.25 → 1170.
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 4), 187);
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 10), 468);
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 15), 702);
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 20), 936);
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 25), 1170);
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 30), 1404);
    }

    #[test]
    fn credits_720p() {
      // 93.62 credits/s: 374.48 → 374, 1404.3 → 1404, 2808.6 → 2809.
      assert_eq!(credits(Some(KinoviOutputResolution::SevenTwentyP), 4), 374);
      assert_eq!(credits(Some(KinoviOutputResolution::SevenTwentyP), 10), 936);
      assert_eq!(credits(Some(KinoviOutputResolution::SevenTwentyP), 15), 1404);
      assert_eq!(credits(Some(KinoviOutputResolution::SevenTwentyP), 20), 1872);
      assert_eq!(credits(Some(KinoviOutputResolution::SevenTwentyP), 25), 2341);
      assert_eq!(credits(Some(KinoviOutputResolution::SevenTwentyP), 30), 2809);
    }

    #[test]
    fn default_resolution_is_720p() {
      assert_eq!(credits(None, 10), credits(Some(KinoviOutputResolution::SevenTwentyP), 10));
    }
  }

  // ── USD cents (rounded up) ──

  mod usd_cents_tests {
    use super::*;

    #[test]
    fn cents_480p() {
      // 187.24 credits → 18724/243 = 77.05 → 78¢; 702.15 → 288.95 → 289¢.
      assert_eq!(usd_cents(Some(KinoviOutputResolution::FourEightyP), 4), 78);
      assert_eq!(usd_cents(Some(KinoviOutputResolution::FourEightyP), 15), 289);
    }

    #[test]
    fn cents_720p() {
      // 374.48 credits → 37448/243 = 154.11 → 155¢; 2808.6 → 1155.80 → 1156¢.
      assert_eq!(usd_cents(Some(KinoviOutputResolution::SevenTwentyP), 4), 155);
      assert_eq!(usd_cents(Some(KinoviOutputResolution::SevenTwentyP), 30), 1156);
    }
  }

  // ── Estimate flags ──

  #[test]
  fn estimate_flags() {
    let estimate = cost_state(Some(KinoviOutputResolution::FourEightyP), 4).estimate_cost();
    assert!(!estimate.is_free);
    assert!(!estimate.is_unlimited);
    assert!(!estimate.is_rate_limited);
    assert!(!estimate.has_watermark);
    assert!(estimate.failures_are_refunded.is_none());
  }

  // ── Helpers ──

  fn cost_state(resolution: Option<KinoviOutputResolution>, duration_seconds: u8) -> KinoviSeedance2p5PreviewCostState {
    KinoviSeedance2p5PreviewCostState { resolution, duration_seconds }
  }

  fn credits(resolution: Option<KinoviOutputResolution>, duration_seconds: u8) -> u64 {
    cost_state(resolution, duration_seconds).estimate_cost().cost_in_credits.unwrap()
  }

  fn usd_cents(resolution: Option<KinoviOutputResolution>, duration_seconds: u8) -> u64 {
    cost_state(resolution, duration_seconds).estimate_cost().cost_in_usd_cents.unwrap()
  }
}
