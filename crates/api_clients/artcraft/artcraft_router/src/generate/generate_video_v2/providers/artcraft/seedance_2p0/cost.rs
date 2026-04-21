use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{
  Seedance2p0BatchCount, Seedance2p0OutputResolution,
};

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0::request::ArtcraftSeedance2p0RequestState;

// ── Pricing constants ──
//
// ArtCraft credits: 100 credits = $1.00. Credits always equal USD cents.
//
// The per-second USD cost varies by resolution. We compute cents directly
// from the upstream credit rates and their credit-package prices,
// then set ArtCraft credits = cents.

/// USD cents per second by resolution, derived from Upstream rates:
///   480p:  15 upstream-credits/sec ÷ 193 upstream-credits/$1 × 100 ≈ 7.772 ¢/s
///   720p:  40 upstream-credits/sec ÷ 250 upstream-credits/$1 × 100 = 16.0 ¢/s
///   1080p: 90 upstream-credits/sec ÷ 193 upstream-credits/$1 × 100 ≈ 46.632 ¢/s
///
/// We keep these as f64 because per-second rates are fractional; rounding
/// happens once at the end after multiplying by duration × batch.
const CENTS_PER_SECOND_480P: f64 = 7.772;
const CENTS_PER_SECOND_720P: f64 = 16.0;
const CENTS_PER_SECOND_1080P: f64 = 46.632;

pub struct ArtcraftSeedance2p0CostState {
  pub resolution: Seedance2p0OutputResolution,
  pub duration_seconds: u8,
  pub batch_count: Seedance2p0BatchCount,
  pub has_video_reference: bool,
}

impl ArtcraftSeedance2p0CostState {
  pub fn from_request(request: &ArtcraftSeedance2p0RequestState) -> Self {
    let resolution = request.request.output_resolution
      .unwrap_or(Seedance2p0OutputResolution::SevenTwentyP);
    let duration_seconds = request.request.duration_seconds.unwrap_or(5);
    let batch_count = request.request.batch_count
      .unwrap_or(Seedance2p0BatchCount::One);
    let has_video_reference = request.request.reference_video_media_tokens
      .as_ref()
      .is_some_and(|tokens| !tokens.is_empty());

    Self { resolution, duration_seconds, batch_count, has_video_reference }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let cents_per_second = match self.resolution {
      Seedance2p0OutputResolution::FourEightyP => CENTS_PER_SECOND_480P,
      Seedance2p0OutputResolution::SevenTwentyP => CENTS_PER_SECOND_720P,
      Seedance2p0OutputResolution::TenEightyP => CENTS_PER_SECOND_1080P,
    };

    let batch_multiplier: f64 = match self.batch_count {
      Seedance2p0BatchCount::One => 1.0,
      Seedance2p0BatchCount::Two => 2.0,
      Seedance2p0BatchCount::Four => 4.0,
    };

    let usd_cents = (self.duration_seconds as f64 * cents_per_second * batch_multiplier).round() as u64;

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
  use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{
    Seedance2p0BatchCount, Seedance2p0MultiFunctionVideoGenRequest, Seedance2p0OutputResolution,
  };
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::common_resolution::CommonResolution;
  use crate::api::provider::Provider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0::request::ArtcraftSeedance2p0RequestState;

  use super::*;

  // ── 720p pricing ──

  mod pricing_720p {
    use super::*;

    #[test]
    fn cost_720p_batch_1() {
      assert_eq!(usd_cents(Seedance2p0OutputResolution::SevenTwentyP, 4, Seedance2p0BatchCount::One), 64);
      assert_eq!(usd_cents(Seedance2p0OutputResolution::SevenTwentyP, 5, Seedance2p0BatchCount::One), 80);
      assert_eq!(usd_cents(Seedance2p0OutputResolution::SevenTwentyP, 6, Seedance2p0BatchCount::One), 96);
      assert_eq!(usd_cents(Seedance2p0OutputResolution::SevenTwentyP, 7, Seedance2p0BatchCount::One), 112);
      assert_eq!(usd_cents(Seedance2p0OutputResolution::SevenTwentyP, 10, Seedance2p0BatchCount::One), 160);
      assert_eq!(usd_cents(Seedance2p0OutputResolution::SevenTwentyP, 15, Seedance2p0BatchCount::One), 240);
    }

    #[test]
    fn cost_720p_batch_2() {
      assert_eq!(usd_cents(Seedance2p0OutputResolution::SevenTwentyP, 4, Seedance2p0BatchCount::Two), 128);
      assert_eq!(usd_cents(Seedance2p0OutputResolution::SevenTwentyP, 5, Seedance2p0BatchCount::Two), 160);
      assert_eq!(usd_cents(Seedance2p0OutputResolution::SevenTwentyP, 15, Seedance2p0BatchCount::Two), 480);
    }

    #[test]
    fn cost_720p_batch_4() {
      assert_eq!(usd_cents(Seedance2p0OutputResolution::SevenTwentyP, 4, Seedance2p0BatchCount::Four), 256);
      assert_eq!(usd_cents(Seedance2p0OutputResolution::SevenTwentyP, 5, Seedance2p0BatchCount::Four), 320);
      assert_eq!(usd_cents(Seedance2p0OutputResolution::SevenTwentyP, 15, Seedance2p0BatchCount::Four), 960);
    }
  }

  // ── 480p pricing ──

  mod pricing_480p {
    use super::*;

    #[test]
    fn cost_480p_batch_1() {
      assert_eq!(usd_cents(Seedance2p0OutputResolution::FourEightyP, 4, Seedance2p0BatchCount::One), 31);
      assert_eq!(usd_cents(Seedance2p0OutputResolution::FourEightyP, 5, Seedance2p0BatchCount::One), 39);
      assert_eq!(usd_cents(Seedance2p0OutputResolution::FourEightyP, 10, Seedance2p0BatchCount::One), 78);
      assert_eq!(usd_cents(Seedance2p0OutputResolution::FourEightyP, 15, Seedance2p0BatchCount::One), 117);
    }

    #[test]
    fn cost_480p_batch_2() {
      assert_eq!(usd_cents(Seedance2p0OutputResolution::FourEightyP, 5, Seedance2p0BatchCount::Two), 78);
    }

    #[test]
    fn cost_480p_batch_4() {
      assert_eq!(usd_cents(Seedance2p0OutputResolution::FourEightyP, 5, Seedance2p0BatchCount::Four), 155);
    }
  }

  // ── 1080p pricing ──

  mod pricing_1080p {
    use super::*;

    #[test]
    fn cost_1080p_batch_1() {
      assert_eq!(usd_cents(Seedance2p0OutputResolution::TenEightyP, 4, Seedance2p0BatchCount::One), 187);
      assert_eq!(usd_cents(Seedance2p0OutputResolution::TenEightyP, 5, Seedance2p0BatchCount::One), 233);
      assert_eq!(usd_cents(Seedance2p0OutputResolution::TenEightyP, 10, Seedance2p0BatchCount::One), 466);
      assert_eq!(usd_cents(Seedance2p0OutputResolution::TenEightyP, 15, Seedance2p0BatchCount::One), 699);
    }

    #[test]
    fn cost_1080p_batch_2() {
      assert_eq!(usd_cents(Seedance2p0OutputResolution::TenEightyP, 5, Seedance2p0BatchCount::Two), 466);
    }

    #[test]
    fn cost_1080p_batch_4() {
      assert_eq!(usd_cents(Seedance2p0OutputResolution::TenEightyP, 5, Seedance2p0BatchCount::Four), 933);
    }
  }

  // ── Relative pricing ──

  mod relative_pricing_tests {
    use super::*;

    #[test]
    fn cost_480p_cheaper_than_720p_cheaper_than_1080p() {
      let c480 = usd_cents(Seedance2p0OutputResolution::FourEightyP, 5, Seedance2p0BatchCount::One);
      let c720 = usd_cents(Seedance2p0OutputResolution::SevenTwentyP, 5, Seedance2p0BatchCount::One);
      let c1080 = usd_cents(Seedance2p0OutputResolution::TenEightyP, 5, Seedance2p0BatchCount::One);
      assert!(c480 < c720, "480p ({}) should be cheaper than 720p ({})", c480, c720);
      assert!(c720 < c1080, "720p ({}) should be cheaper than 1080p ({})", c720, c1080);
    }

    #[test]
    fn cost_scales_with_duration() {
      let c4 = usd_cents(Seedance2p0OutputResolution::SevenTwentyP, 4, Seedance2p0BatchCount::One);
      let c10 = usd_cents(Seedance2p0OutputResolution::SevenTwentyP, 10, Seedance2p0BatchCount::One);
      let c15 = usd_cents(Seedance2p0OutputResolution::SevenTwentyP, 15, Seedance2p0BatchCount::One);
      assert!(c4 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn cost_scales_with_batch() {
      let b1 = usd_cents(Seedance2p0OutputResolution::TenEightyP, 5, Seedance2p0BatchCount::One);
      let b2 = usd_cents(Seedance2p0OutputResolution::TenEightyP, 5, Seedance2p0BatchCount::Two);
      let b4 = usd_cents(Seedance2p0OutputResolution::TenEightyP, 5, Seedance2p0BatchCount::Four);
      assert!(b1 < b2);
      assert!(b2 < b4);
    }
  }

  // ── Video reference does NOT affect cost (yet) ──

  #[test]
  fn video_reference_does_not_affect_cost() {
    let base = ArtcraftSeedance2p0CostState {
      resolution: Seedance2p0OutputResolution::SevenTwentyP,
      duration_seconds: 5,
      batch_count: Seedance2p0BatchCount::One,
      has_video_reference: false,
    };
    let without = base.estimate_cost();
    let with = ArtcraftSeedance2p0CostState { has_video_reference: true, ..base }.estimate_cost();
    assert_eq!(without.cost_in_usd_cents, with.cost_in_usd_cents);
    assert_eq!(without.cost_in_credits, with.cost_in_credits);
  }

  // ── from_request() tests ──

  mod from_request_tests {
    use super::*;

    #[test]
    fn from_request_720p() {
      let req = make_request_state(Some(Seedance2p0OutputResolution::SevenTwentyP), 5, Seedance2p0BatchCount::One, false);
      let cost = ArtcraftSeedance2p0CostState::from_request(&req);
      assert!(matches!(cost.resolution, Seedance2p0OutputResolution::SevenTwentyP));
      assert_eq!(cost.duration_seconds, 5);
      assert!(matches!(cost.batch_count, Seedance2p0BatchCount::One));
      assert!(!cost.has_video_reference);
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(80));
    }

    #[test]
    fn from_request_none_defaults_to_720p() {
      let req = make_request_state(None, 5, Seedance2p0BatchCount::One, false);
      let cost = ArtcraftSeedance2p0CostState::from_request(&req);
      assert!(matches!(cost.resolution, Seedance2p0OutputResolution::SevenTwentyP));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(80));
    }

    #[test]
    fn from_request_480p() {
      let req = make_request_state(Some(Seedance2p0OutputResolution::FourEightyP), 5, Seedance2p0BatchCount::One, false);
      let cost = ArtcraftSeedance2p0CostState::from_request(&req);
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(39));
    }

    #[test]
    fn from_request_1080p_batch_2() {
      let req = make_request_state(Some(Seedance2p0OutputResolution::TenEightyP), 5, Seedance2p0BatchCount::Two, false);
      let cost = ArtcraftSeedance2p0CostState::from_request(&req);
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(466));
    }

    #[test]
    fn from_request_with_video_reference() {
      let req = make_request_state(Some(Seedance2p0OutputResolution::SevenTwentyP), 5, Seedance2p0BatchCount::One, true);
      let cost = ArtcraftSeedance2p0CostState::from_request(&req);
      assert!(cost.has_video_reference);
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(80));
    }
  }

  // ── Cross-check: Artcraft v2 matches Kinovi v2 via GenerateVideoRequestBuilder ──

  mod cross_check_with_kinovi_via_builder {
    use crate::api::common_video_model::CommonVideoModel;

    use super::*;

    /// Combinatorial test: build the same request with Provider::Artcraft and
    /// Provider::Seedance2Pro, then compare USD cents. They must match for all
    /// resolution × duration × batch combinations.
    #[test]
    fn artcraft_matches_kinovi_all_combos() {
      let resolutions = [
        Some(CommonResolution::FourEightyP),
        Some(CommonResolution::SevenTwentyP),
        None, // defaults to 720p
        Some(CommonResolution::TenEightyP),
      ];
      let durations: [u16; 4] = [4, 5, 10, 15];
      let batches: [u16; 3] = [1, 2, 4];

      for res in &resolutions {
        for dur in &durations {
          for batch in &batches {
            let artcraft = GenerateVideoRequestBuilder {
              model: CommonVideoModel::Seedance2p0,
              provider: Provider::Artcraft,
              resolution: *res,
              duration_seconds: Some(*dur),
              video_batch_count: Some(*batch),
              ..Default::default()
            };

            let kinovi = GenerateVideoRequestBuilder {
              model: CommonVideoModel::Seedance2p0,
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

  // ── Cross-check: Artcraft v2 matches v1 estimate_video_cost_artcraft_seedance2p0 ──

  mod cross_check_with_v1 {
    use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::Seedance2p0AspectRatio;
    use tokens::tokens::media_files::MediaFileToken;

    use crate::generate::generate_video::cost::artcraft::estimate_video_cost_artcraft_seedance2p0::estimate_video_cost_artcraft_seedance2p0;
    use crate::generate::generate_video::plan::artcraft::plan_generate_video_artcraft_seedance2p0::PlanArtcraftSeedance2p0;

    use super::*;

    /// Combinatorial test: compare v2 ArtcraftSeedance2p0CostState against
    /// v1 estimate_video_cost_artcraft_seedance2p0 for all resolution ×
    /// duration × batch combinations.
    #[test]
    fn v2_matches_v1_all_combos() {
      let resolutions = [
        (Some(CommonResolution::FourEightyP), Seedance2p0OutputResolution::FourEightyP),
        (Some(CommonResolution::SevenTwentyP), Seedance2p0OutputResolution::SevenTwentyP),
        (None, Seedance2p0OutputResolution::SevenTwentyP), // None defaults to 720p
        (Some(CommonResolution::TenEightyP), Seedance2p0OutputResolution::TenEightyP),
      ];
      let durations: [u8; 4] = [4, 5, 10, 15];
      let batches = [
        (Seedance2p0BatchCount::One, Seedance2p0BatchCount::One),
        (Seedance2p0BatchCount::Two, Seedance2p0BatchCount::Two),
        (Seedance2p0BatchCount::Four, Seedance2p0BatchCount::Four),
      ];

      for (v1_res, v2_res) in &resolutions {
        for dur in &durations {
          for (v1_batch, v2_batch) in &batches {
            // v1: construct a PlanArtcraftSeedance2p0 and call the v1 cost function
            let v1_plan = PlanArtcraftSeedance2p0 {
              prompt: None,
              start_frame: None,
              end_frame: None,
              reference_images: None,
              reference_videos: None,
              reference_audio: None,
              reference_characters: None,
              aspect_ratio: Some(Seedance2p0AspectRatio::Square1x1),
              resolution: *v1_res,
              duration_seconds: Some(*dur),
              batch_count: *v1_batch,
              idempotency_token: "test".to_string(),
            };
            let v1_cost = estimate_video_cost_artcraft_seedance2p0(&v1_plan);

            // v2: construct cost state directly
            let v2_cost = ArtcraftSeedance2p0CostState {
              resolution: *v2_res,
              duration_seconds: *dur,
              batch_count: *v2_batch,
              has_video_reference: false,
            }.estimate_cost();

            assert_eq!(
              v2_cost.cost_in_usd_cents, v1_cost.cost_in_usd_cents,
              "USD cents mismatch: res={:?} dur={}s batch={:?} — v2={:?}, v1={:?}",
              v1_res, dur, v1_batch,
              v2_cost.cost_in_usd_cents, v1_cost.cost_in_usd_cents,
            );

            assert_eq!(
              v2_cost.cost_in_credits, v1_cost.cost_in_credits,
              "Credits mismatch: res={:?} dur={}s batch={:?} — v2={:?}, v1={:?}",
              v1_res, dur, v1_batch,
              v2_cost.cost_in_credits, v1_cost.cost_in_credits,
            );
          }
        }
      }
    }
  }

  // ── Credits spot checks ──

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_equal_usd_cents() {
      // ArtCraft credits: 100 credits = $1.00, so credits always equal cents.
      for res in [
        Seedance2p0OutputResolution::FourEightyP,
        Seedance2p0OutputResolution::SevenTwentyP,
        Seedance2p0OutputResolution::TenEightyP,
      ] {
        for dur in [4, 5, 10, 15] {
          for batch in [Seedance2p0BatchCount::One, Seedance2p0BatchCount::Two, Seedance2p0BatchCount::Four] {
            assert_eq!(
              credits(res, dur, batch),
              usd_cents(res, dur, batch),
              "credits should equal usd_cents for {:?} {}s {:?}", res, dur, batch,
            );
          }
        }
      }
    }

    #[test]
    fn credits_720p() {
      assert_eq!(credits(Seedance2p0OutputResolution::SevenTwentyP, 5, Seedance2p0BatchCount::One), 80);
    }

    #[test]
    fn credits_480p() {
      assert_eq!(credits(Seedance2p0OutputResolution::FourEightyP, 5, Seedance2p0BatchCount::One), 39);
    }

    #[test]
    fn credits_1080p() {
      assert_eq!(credits(Seedance2p0OutputResolution::TenEightyP, 5, Seedance2p0BatchCount::One), 233);
    }
  }

  // ── Builder round-trip ──

  mod builder_round_trip {
    use super::*;

    #[test]
    fn build2_then_estimate_cost_720p() {
      let builder = GenerateVideoRequestBuilder {
        provider: Provider::Artcraft,
        resolution: Some(CommonResolution::SevenTwentyP),
        duration_seconds: Some(5),
        video_batch_count: Some(1),
        ..Default::default()
      };
      let result = builder.build2().expect("build2 should succeed");
      let cost = result.estimate_cost().expect("estimate_cost should succeed");
      assert_eq!(cost.cost_in_usd_cents, Some(80));
    }

    #[test]
    fn build2_then_estimate_cost_1080p_batch_4() {
      let builder = GenerateVideoRequestBuilder {
        provider: Provider::Artcraft,
        resolution: Some(CommonResolution::TenEightyP),
        duration_seconds: Some(5),
        video_batch_count: Some(4),
        ..Default::default()
      };
      let result = builder.build2().expect("build2 should succeed");
      let cost = result.estimate_cost().expect("estimate_cost should succeed");
      assert_eq!(cost.cost_in_usd_cents, Some(933));
    }
  }

  // ── Helpers ──

  fn usd_cents(
    resolution: Seedance2p0OutputResolution,
    duration_seconds: u8,
    batch_count: Seedance2p0BatchCount,
  ) -> u64 {
    ArtcraftSeedance2p0CostState { resolution, duration_seconds, batch_count, has_video_reference: false }
      .estimate_cost()
      .cost_in_usd_cents
      .unwrap()
  }

  fn credits(
    resolution: Seedance2p0OutputResolution,
    duration_seconds: u8,
    batch_count: Seedance2p0BatchCount,
  ) -> u64 {
    ArtcraftSeedance2p0CostState { resolution, duration_seconds, batch_count, has_video_reference: false }
      .estimate_cost()
      .cost_in_credits
      .unwrap()
  }

  fn make_request_state(
    resolution: Option<Seedance2p0OutputResolution>,
    duration_seconds: u8,
    batch_count: Seedance2p0BatchCount,
    with_video_ref: bool,
  ) -> ArtcraftSeedance2p0RequestState {
    let reference_video_media_tokens = if with_video_ref {
      Some(vec![MediaFileToken::new("mf_testvid".to_string())])
    } else {
      None
    };

    ArtcraftSeedance2p0RequestState {
      request: Seedance2p0MultiFunctionVideoGenRequest {
        uuid_idempotency_token: "test-idem".to_string(),
        prompt: Some("test".to_string()),
        start_frame_media_token: None,
        end_frame_media_token: None,
        reference_image_media_tokens: None,
        reference_video_media_tokens,
        reference_audio_media_tokens: None,
        reference_character_tokens: None,
        aspect_ratio: None,
        output_resolution: resolution,
        duration_seconds: Some(duration_seconds),
        batch_count: Some(batch_count),
      },
    }
  }
}
