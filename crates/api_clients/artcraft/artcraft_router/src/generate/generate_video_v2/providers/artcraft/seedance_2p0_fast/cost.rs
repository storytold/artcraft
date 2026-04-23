use enums::common::generation::common_resolution::CommonResolution;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0_fast::request::ArtcraftSeedance2p0FastRequestState;

// -- Pricing constants --
//
// ArtCraft credits: 100 credits = $1.00. Credits always equal USD cents.
//
// The per-second USD cost varies by resolution. We derive cents from the
// upstream credit rates and their credit-package prices, then set
// ArtCraft credits = cents.

/// USD cents per second by resolution, derived from upstream Fast rates:
///   480p:  10 upstream-credits/sec / 193 upstream-credits/$1 * 100 ~= 5.181 c/s
///   720p:  28 upstream-credits/sec / 220 upstream-credits/$1 * 100 ~= 12.727 c/s
///
/// We keep these as f64 because per-second rates are fractional; rounding
/// happens once at the end after multiplying by duration * batch.
const CENTS_PER_SECOND_480P: f64 = 5.181;
const CENTS_PER_SECOND_720P: f64 = 12.727;

pub struct ArtcraftSeedance2p0FastCostState {
  pub resolution: CommonResolution,
  pub duration_seconds: u16,
  pub batch_count: u16,
  pub has_video_reference: bool,
}

impl ArtcraftSeedance2p0FastCostState {
  pub fn from_request(request: &ArtcraftSeedance2p0FastRequestState) -> Self {
    let resolution = request.request.resolution
      .unwrap_or(CommonResolution::SevenTwentyP);
    let duration_seconds = request.request.duration_seconds.unwrap_or(5);
    let batch_count = request.request.video_batch_count.unwrap_or(1);
    let has_video_reference = request.request.reference_video_media_tokens
      .as_ref()
      .is_some_and(|tokens| !tokens.is_empty());

    Self { resolution, duration_seconds, batch_count, has_video_reference }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let cents_per_second = match self.resolution {
      CommonResolution::FourEightyP => CENTS_PER_SECOND_480P,
      // Everything else (including 720p and unsupported resolutions) prices at 720p.
      _ => CENTS_PER_SECOND_720P,
    };

    let usd_cents = (self.duration_seconds as f64 * cents_per_second * self.batch_count as f64).round() as u64;

    // ArtCraft credits: 100 credits = $1.00, so credits = cents.
    VideoGenerationCostEstimate {
      cost_in_credits: Some(usd_cents),
      cost_in_usd_cents: Some(usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
    }
  }
}

#[cfg(test)]
mod tests {
  use enums::common::generation::common_resolution::CommonResolution;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::common_resolution::CommonResolution as CommonResolutionRouter;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::provider::Provider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  use super::*;

  // -- 720p pricing --

  mod pricing_720p {
    use super::*;

    #[test]
    fn batch_1() {
      assert_eq!(usd_cents(CommonResolution::SevenTwentyP, 4, 1), 51);
      assert_eq!(usd_cents(CommonResolution::SevenTwentyP, 5, 1), 64);
      assert_eq!(usd_cents(CommonResolution::SevenTwentyP, 10, 1), 127);
      assert_eq!(usd_cents(CommonResolution::SevenTwentyP, 15, 1), 191);
    }

    #[test]
    fn batch_2() {
      assert_eq!(usd_cents(CommonResolution::SevenTwentyP, 4, 2), 102);
      assert_eq!(usd_cents(CommonResolution::SevenTwentyP, 5, 2), 127);
      assert_eq!(usd_cents(CommonResolution::SevenTwentyP, 15, 2), 382);
    }

    #[test]
    fn batch_4() {
      assert_eq!(usd_cents(CommonResolution::SevenTwentyP, 4, 4), 204);
      assert_eq!(usd_cents(CommonResolution::SevenTwentyP, 5, 4), 255);
      assert_eq!(usd_cents(CommonResolution::SevenTwentyP, 15, 4), 764);
    }
  }

  // -- 480p pricing --

  mod pricing_480p {
    use super::*;

    #[test]
    fn batch_1() {
      assert_eq!(usd_cents(CommonResolution::FourEightyP, 4, 1), 21);
      assert_eq!(usd_cents(CommonResolution::FourEightyP, 5, 1), 26);
      assert_eq!(usd_cents(CommonResolution::FourEightyP, 10, 1), 52);
      assert_eq!(usd_cents(CommonResolution::FourEightyP, 15, 1), 78);
    }

    #[test]
    fn batch_2() {
      assert_eq!(usd_cents(CommonResolution::FourEightyP, 5, 2), 52);
    }

    #[test]
    fn batch_4() {
      assert_eq!(usd_cents(CommonResolution::FourEightyP, 5, 4), 104);
    }
  }

  // -- Relative pricing --

  mod relative_pricing_tests {
    use super::*;

    #[test]
    fn cost_480p_cheaper_than_720p() {
      let c480 = usd_cents(CommonResolution::FourEightyP, 5, 1);
      let c720 = usd_cents(CommonResolution::SevenTwentyP, 5, 1);
      assert!(c480 < c720, "480p ({}) should be cheaper than 720p ({})", c480, c720);
    }

    #[test]
    fn cost_scales_with_duration() {
      let c4 = usd_cents(CommonResolution::SevenTwentyP, 4, 1);
      let c10 = usd_cents(CommonResolution::SevenTwentyP, 10, 1);
      let c15 = usd_cents(CommonResolution::SevenTwentyP, 15, 1);
      assert!(c4 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn cost_scales_with_batch() {
      let b1 = usd_cents(CommonResolution::SevenTwentyP, 5, 1);
      let b2 = usd_cents(CommonResolution::SevenTwentyP, 5, 2);
      let b4 = usd_cents(CommonResolution::SevenTwentyP, 5, 4);
      assert!(b1 < b2);
      assert!(b2 < b4);
    }
  }

  // -- Video reference does NOT affect cost (yet) --

  #[test]
  fn video_reference_does_not_affect_cost() {
    let base = ArtcraftSeedance2p0FastCostState {
      resolution: CommonResolution::SevenTwentyP,
      duration_seconds: 5,
      batch_count: 1,
      has_video_reference: false,
    };
    let without = base.estimate_cost();
    let with = ArtcraftSeedance2p0FastCostState { has_video_reference: true, ..base }.estimate_cost();
    assert_eq!(without.cost_in_usd_cents, with.cost_in_usd_cents);
    assert_eq!(without.cost_in_credits, with.cost_in_credits);
  }

  // -- from_request() tests --

  mod from_request_tests {
    use super::*;

    #[test]
    fn from_request_720p() {
      let req = make_request_state(Some(CommonResolution::SevenTwentyP), 5, 1, false);
      let cost = ArtcraftSeedance2p0FastCostState::from_request(&req);
      assert!(matches!(cost.resolution, CommonResolution::SevenTwentyP));
      assert_eq!(cost.duration_seconds, 5);
      assert_eq!(cost.batch_count, 1);
      assert!(!cost.has_video_reference);
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(64));
    }

    #[test]
    fn from_request_none_defaults_to_720p() {
      let req = make_request_state(None, 5, 1, false);
      let cost = ArtcraftSeedance2p0FastCostState::from_request(&req);
      assert!(matches!(cost.resolution, CommonResolution::SevenTwentyP));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(64));
    }

    #[test]
    fn from_request_480p() {
      let req = make_request_state(Some(CommonResolution::FourEightyP), 5, 1, false);
      let cost = ArtcraftSeedance2p0FastCostState::from_request(&req);
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(26));
    }

    #[test]
    fn from_request_with_video_reference() {
      let req = make_request_state(Some(CommonResolution::SevenTwentyP), 5, 1, true);
      let cost = ArtcraftSeedance2p0FastCostState::from_request(&req);
      assert!(cost.has_video_reference);
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(64));
    }
  }

  // -- Cross-check: Artcraft Fast v2 matches Kinovi Fast v2 via builder --

  mod cross_check_with_kinovi_via_builder {
    use super::*;

    #[test]
    fn artcraft_fast_matches_kinovi_fast_all_combos() {
      let resolutions = [
        Some(CommonResolutionRouter::FourEightyP),
        Some(CommonResolutionRouter::SevenTwentyP),
        None,
      ];
      let durations: [u16; 4] = [4, 5, 10, 15];
      let batches: [u16; 3] = [1, 2, 4];

      for res in &resolutions {
        for dur in &durations {
          for batch in &batches {
            let artcraft = GenerateVideoRequestBuilder {
              model: CommonVideoModel::Seedance2p0Fast,
              provider: Provider::Artcraft,
              resolution: *res,
              duration_seconds: Some(*dur),
              video_batch_count: Some(*batch),
              ..Default::default()
            };

            let kinovi = GenerateVideoRequestBuilder {
              model: CommonVideoModel::Seedance2p0Fast,
              provider: Provider::Seedance2Pro,
              resolution: *res,
              duration_seconds: Some(*dur),
              video_batch_count: Some(*batch),
              ..Default::default()
            };

            let artcraft_cost = artcraft.build2()
              .expect("artcraft build2 should succeed")
              .estimate_cost()
              .expect("artcraft estimate_cost should succeed");

            let kinovi_cost = kinovi.build2()
              .expect("kinovi build2 should succeed")
              .estimate_cost()
              .expect("kinovi estimate_cost should succeed");

            assert_eq!(
              artcraft_cost.cost_in_usd_cents, kinovi_cost.cost_in_usd_cents,
              "USD cents mismatch: res={:?} dur={}s batch={} — artcraft={:?}, kinovi={:?}",
              res, dur, batch,
              artcraft_cost.cost_in_usd_cents, kinovi_cost.cost_in_usd_cents,
            );
          }
        }
      }
    }
  }

  // -- Credits --

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_equal_usd_cents() {
      for res in [CommonResolution::FourEightyP, CommonResolution::SevenTwentyP] {
        for dur in [4, 5, 10, 15] {
          for batch in [1, 2, 4] {
            let state = ArtcraftSeedance2p0FastCostState {
              resolution: res, duration_seconds: dur, batch_count: batch, has_video_reference: false,
            };
            let cost = state.estimate_cost();
            assert_eq!(cost.cost_in_credits, cost.cost_in_usd_cents);
          }
        }
      }
    }
  }

  // -- Builder round-trip --

  mod builder_round_trip {
    use super::*;

    #[test]
    fn build2_then_estimate_cost_720p() {
      let builder = GenerateVideoRequestBuilder {
        model: CommonVideoModel::Seedance2p0Fast,
        provider: Provider::Artcraft,
        resolution: Some(CommonResolutionRouter::SevenTwentyP),
        duration_seconds: Some(5),
        video_batch_count: Some(1),
        ..Default::default()
      };
      let result = builder.build2().expect("build2 should succeed");
      let cost = result.estimate_cost().expect("estimate_cost should succeed");
      assert_eq!(cost.cost_in_usd_cents, Some(64));
    }

    #[test]
    fn build2_then_estimate_cost_480p_batch_4() {
      let builder = GenerateVideoRequestBuilder {
        model: CommonVideoModel::Seedance2p0Fast,
        provider: Provider::Artcraft,
        resolution: Some(CommonResolutionRouter::FourEightyP),
        duration_seconds: Some(5),
        video_batch_count: Some(4),
        ..Default::default()
      };
      let result = builder.build2().expect("build2 should succeed");
      let cost = result.estimate_cost().expect("estimate_cost should succeed");
      assert_eq!(cost.cost_in_usd_cents, Some(104));
    }
  }

  // -- Helpers --

  fn usd_cents(resolution: CommonResolution, duration_seconds: u16, batch_count: u16) -> u64 {
    ArtcraftSeedance2p0FastCostState { resolution, duration_seconds, batch_count, has_video_reference: false }
      .estimate_cost()
      .cost_in_usd_cents
      .unwrap()
  }

  fn make_request_state(
    resolution: Option<CommonResolution>,
    duration_seconds: u16,
    batch_count: u16,
    with_video_ref: bool,
  ) -> ArtcraftSeedance2p0FastRequestState {
    use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
    use enums::common::generation::common_video_model::CommonVideoModel;

    let reference_video_media_tokens = if with_video_ref {
      Some(vec![MediaFileToken::new("mf_testvid".to_string())])
    } else {
      None
    };

    ArtcraftSeedance2p0FastRequestState {
      request: OmniGenVideoCostAndGenerateRequest {
        idempotency_token: Some("test-idem".to_string()),
        model: Some(CommonVideoModel::Seedance2p0Fast),
        prompt: Some("test".to_string()),
        negative_prompt: None,
        start_frame_image_media_token: None,
        end_frame_image_media_token: None,
        reference_image_media_tokens: None,
        reference_video_media_tokens,
        reference_audio_media_tokens: None,
        reference_character_tokens: None,
        resolution,
        aspect_ratio: None,
        quality: None,
        duration_seconds: Some(duration_seconds),
        video_batch_count: Some(batch_count),
        generate_audio: None,
      },
    }
  }
}
