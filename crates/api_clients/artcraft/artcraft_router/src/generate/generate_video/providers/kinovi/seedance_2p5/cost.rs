use kinovi_web_client::generate::video::generate_seedance_2p5::{
  GenerateSeedance2p5Request, KinoviSeedance2p5Modality, KinoviSeedance2p5OutputResolution,
  MAX_BILLED_INPUT_SECONDS, MIN_BILLED_INPUT_SECONDS,
};
use kinovi_web_client::pricing::kinovi_cost_calculator_trait::KinoviCostCalculatorTrait;

use crate::api::video_list_ref::VideoListRef;
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::kinovi::seedance_2p5::draft::KinoviSeedance2p5DraftState;
use crate::generate::generate_video::providers::kinovi::seedance_2p5::request::KinoviSeedance2p5RequestState;

/// Seedance 2.5 pricing depends on the resolution, the output duration, and
/// — when reference videos are attached — the total seconds of reference
/// video input, which are billed on top of the output duration (at a lower
/// per-second rate). Input seconds are clamped to
/// [`MAX_BILLED_INPUT_SECONDS`] — the model accepts at most 30 seconds of
/// video.
pub struct KinoviSeedance2p5CostState {
  pub resolution: Option<KinoviSeedance2p5OutputResolution>,
  pub duration_seconds: u8,
  pub has_video_references: bool,
  pub total_input_seconds: Option<u8>,
}

impl KinoviSeedance2p5CostState {
  pub fn from_request(request: &KinoviSeedance2p5RequestState) -> Self {
    let has_video_references = matches!(
      &request.request.modality,
      KinoviSeedance2p5Modality::Reference { reference_video_urls: Some(urls), .. } if !urls.is_empty()
    );

    Self {
      resolution: request.request.output_resolution,
      duration_seconds: request.request.duration_seconds,
      has_video_references,
      total_input_seconds: request.request.total_input_seconds,
    }
  }

  pub fn from_draft(draft: &KinoviSeedance2p5DraftState) -> Self {
    let has_video_references = draft.unhandled_request_state
      .as_ref()
      .and_then(|remaining| remaining.reference_videos.as_ref())
      .is_some_and(|videos| match videos {
        VideoListRef::MediaFileTokens(tokens) => !tokens.is_empty(),
        VideoListRef::Urls(urls) => !urls.is_empty(),
      });

    Self {
      resolution: draft.resolution,
      duration_seconds: draft.duration_seconds,
      has_video_references,
      total_input_seconds: draft.total_input_seconds,
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Delegate to the kinovi_web_client calculator via a pricing-only
    // request. Only the modality's video references, the resolution, the
    // duration, and the input seconds affect the price.
    let modality = if self.has_video_references {
      KinoviSeedance2p5Modality::Reference {
        aspect_ratio: None,
        reference_image_urls: None,
        reference_video_urls: Some(vec!["https://pricing-only.invalid/ref.mp4".to_string()]),
        reference_audio_urls: None,
      }
    } else {
      KinoviSeedance2p5Modality::Reference {
        aspect_ratio: None,
        reference_image_urls: None,
        reference_video_urls: None,
        reference_audio_urls: None,
      }
    };

    // NB: The kinovi calculator clamps measured values and bills the
    // worst-case maximum for unknown (None) or zero inputs. Zero passes
    // through unclamped so that worst-case fallback applies — clamping it up
    // to the minimum here would understate the cost.
    let total_input_seconds = self.total_input_seconds
      .map(|seconds| match seconds {
        0 => 0,
        measured => measured.clamp(MIN_BILLED_INPUT_SECONDS, MAX_BILLED_INPUT_SECONDS),
      });

    let pricing_request = GenerateSeedance2p5Request {
      prompt: String::new(),
      modality,
      output_resolution: self.resolution,
      duration_seconds: self.duration_seconds,
      total_input_seconds,
      use_face_blur_hack: None,
    };

    // Enterprise tier: what generations actually cost us (our discounted
    // per-model credit rate at our bulk credit purchase rate).
    let costs = pricing_request.calculate_enterprise_costs();
    // 2.5 bills whole credits at 480p/720p, so the rounding below is exact
    // there; 1080p bills fractional credits (103.25/sec) and rounds to the
    // nearest credit. The USD cents (the authoritative charge) are rounded
    // up.
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
  use kinovi_web_client::generate::video::generate_seedance_2p5::KinoviSeedance2p5OutputResolution as KinoviOutputResolution;

  use super::*;

  // ── Credits without video references (26/sec at 480p, 59/sec at 720p,
  //    103.25/sec at 1080p enterprise) ──

  mod credits_without_video_references {
    use super::*;

    #[test]
    fn credits_480p() {
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 5, false, None), 130);
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 10, false, None), 260);
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 30, false, None), 780);
    }

    #[test]
    fn credits_720p() {
      assert_eq!(credits(Some(KinoviOutputResolution::SevenTwentyP), 5, false, None), 295);
      assert_eq!(credits(Some(KinoviOutputResolution::SevenTwentyP), 30, false, None), 1770);
    }

    #[test]
    fn credits_1080p() {
      // 103.25/sec enterprise; fractional totals round to the nearest credit
      // (516.25 → 516, 1032.5 → 1033, 3097.5 → 3098).
      assert_eq!(credits(Some(KinoviOutputResolution::TenEightyP), 5, false, None), 516);
      assert_eq!(credits(Some(KinoviOutputResolution::TenEightyP), 10, false, None), 1033);
      assert_eq!(credits(Some(KinoviOutputResolution::TenEightyP), 30, false, None), 3098);
    }

    #[test]
    fn default_resolution_is_720p() {
      assert_eq!(credits(None, 10, false, None), credits(Some(KinoviOutputResolution::SevenTwentyP), 10, false, None));
    }

    #[test]
    fn input_seconds_ignored_without_video_references() {
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 10, false, Some(60)), 260);
    }
  }

  // ── Credits with video references (16/sec at 480p, 35/sec at 720p,
  //    61.69/sec at 1080p enterprise, over output duration + input seconds) ──

  mod credits_with_video_references {
    use super::*;

    #[test]
    fn thirty_second_output_with_ten_input_seconds_bills_forty() {
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 30, true, Some(10)), 16 * 40);
      assert_eq!(credits(Some(KinoviOutputResolution::SevenTwentyP), 30, true, Some(10)), 35 * 40);
      // 61.69/sec enterprise × 40 = 2467.6 → 2468 credits.
      assert_eq!(credits(Some(KinoviOutputResolution::TenEightyP), 30, true, Some(10)), 2468);
    }

    #[test]
    fn fourteen_input_seconds_bill_forty_four() {
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 30, true, Some(14)), 16 * 44);
    }

    #[test]
    fn missing_input_seconds_bill_the_worst_case_maximum() {
      // Unknown input duration with video references attached: the kinovi
      // estimator assumes the 30-second maximum so the provider-cost
      // estimate never undershoots the actual charge.
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 10, true, None), 16 * 40);
    }

    #[test]
    fn input_seconds_clamp_to_max_billed_input_seconds() {
      // 200 input seconds clamp to 30: 30s output + 30 = 60 billed seconds.
      assert_eq!(credits(Some(KinoviOutputResolution::FourEightyP), 30, true, Some(200)), 16 * 60);
      assert_eq!(
        credits(Some(KinoviOutputResolution::FourEightyP), 30, true, Some(200)),
        credits(Some(KinoviOutputResolution::FourEightyP), 30, true, Some(30)),
      );
    }
  }

  // ── USD cents (rounded up) ──

  #[test]
  fn usd_cents_are_rounded_up() {
    // 130 credits → 13000/243.16 = 53.4627 → 54¢.
    let estimate = cost_state(Some(KinoviOutputResolution::FourEightyP), 5, false, None).estimate_cost();
    assert_eq!(estimate.cost_in_usd_cents, Some(54));
  }

  // ── Estimate flags ──

  #[test]
  fn estimate_flags() {
    let estimate = cost_state(Some(KinoviOutputResolution::FourEightyP), 5, false, None).estimate_cost();
    assert!(!estimate.is_free);
    assert!(!estimate.is_unlimited);
    assert!(!estimate.is_rate_limited);
    assert!(!estimate.has_watermark);
    assert!(estimate.failures_are_refunded.is_none());
  }

  // ── Helpers ──

  fn cost_state(
    resolution: Option<KinoviOutputResolution>,
    duration_seconds: u8,
    has_video_references: bool,
    total_input_seconds: Option<u8>,
  ) -> KinoviSeedance2p5CostState {
    KinoviSeedance2p5CostState { resolution, duration_seconds, has_video_references, total_input_seconds }
  }

  fn credits(
    resolution: Option<KinoviOutputResolution>,
    duration_seconds: u8,
    has_video_references: bool,
    total_input_seconds: Option<u8>,
  ) -> u64 {
    cost_state(resolution, duration_seconds, has_video_references, total_input_seconds)
      .estimate_cost()
      .cost_in_credits
      .unwrap()
  }
}
