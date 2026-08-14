use kinovi_web_client::cost::kinovi_cost_calculator_trait::KinoviCostCalculatorTrait;
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

    // Enterprise tier: what generations actually cost us (our discounted
    // per-model credit rate at our bulk credit purchase rate).
    let costs = pricing_request.calculate_enterprise_costs();
    // 2.5 Preview bills fractional credits (42.13/sec at 480p). The router's
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
      // Enterprise 42.13 credits/s: 168.52 → 169, 631.95 → 632, 1053.25 → 1053.
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 4), 169);
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 10), 421);
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 15), 632);
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 20), 843);
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 25), 1053);
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 30), 1264);
    }

    #[test]
    fn credits_720p() {
      // Enterprise 84.26 credits/s: 337.04 → 337, 1263.9 → 1264, 2106.5 → 2107.
      assert_eq!(credits(Some(KinoviOutputResolution::SevenTwentyP), 4), 337);
      assert_eq!(credits(Some(KinoviOutputResolution::SevenTwentyP), 10), 843);
      assert_eq!(credits(Some(KinoviOutputResolution::SevenTwentyP), 15), 1264);
      assert_eq!(credits(Some(KinoviOutputResolution::SevenTwentyP), 20), 1685);
      assert_eq!(credits(Some(KinoviOutputResolution::SevenTwentyP), 25), 2107);
      assert_eq!(credits(Some(KinoviOutputResolution::SevenTwentyP), 30), 2528);
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
      // 168.52 credits → 16852/243.16 = 69.30 → 70¢; 631.95 → 259.89 → 260¢.
      assert_eq!(usd_cents(Some(KinoviOutputResolution::FourEightyP), 4), 70);
      assert_eq!(usd_cents(Some(KinoviOutputResolution::FourEightyP), 15), 260);
    }

    #[test]
    fn cents_720p() {
      // 337.04 credits → 33704/243.16 = 138.61 → 139¢; 2527.8 → 1039.56 → 1040¢.
      assert_eq!(usd_cents(Some(KinoviOutputResolution::SevenTwentyP), 4), 139);
      assert_eq!(usd_cents(Some(KinoviOutputResolution::SevenTwentyP), 30), 1040);
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
