use artcraft_api_defs::generate::video::multi_function::seedance_2p0_multi_function_video_gen::{
  Seedance2p0BatchCount, Seedance2p0OutputResolution,
};

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::artcraft::seedance_2p0::request::ArtcraftSeedance2p0RequestState;

// ── Pricing constants ──

/// Credits consumed per second of video by resolution tier.
const CREDITS_PER_SECOND_480P: u64 = 15;
const CREDITS_PER_SECOND_720P: u64 = 40;
const CREDITS_PER_SECOND_1080P: u64 = 90;

/// Credits per dollar — determines the USD conversion rate.
/// 720p uses legacy pricing (25,000 credits for $99.99 ~ 250/dollar).
/// 480p and 1080p use new pricing (22,000 credits for $114 ~ 193/dollar).
const CREDITS_PER_DOLLAR_720P: f64 = 250.0;
const CREDITS_PER_DOLLAR_480P: f64 = 193.0;
const CREDITS_PER_DOLLAR_1080P: f64 = 193.0;

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
    let credits_per_second = match self.resolution {
      Seedance2p0OutputResolution::FourEightyP => CREDITS_PER_SECOND_480P,
      Seedance2p0OutputResolution::SevenTwentyP => CREDITS_PER_SECOND_720P,
      Seedance2p0OutputResolution::TenEightyP => CREDITS_PER_SECOND_1080P,
    };

    let batch_multiplier: u64 = match self.batch_count {
      Seedance2p0BatchCount::One => 1,
      Seedance2p0BatchCount::Two => 2,
      Seedance2p0BatchCount::Four => 4,
    };

    let credits = (self.duration_seconds as u64) * credits_per_second * batch_multiplier;

    let credits_per_dollar = match self.resolution {
      Seedance2p0OutputResolution::FourEightyP => CREDITS_PER_DOLLAR_480P,
      Seedance2p0OutputResolution::SevenTwentyP => CREDITS_PER_DOLLAR_720P,
      Seedance2p0OutputResolution::TenEightyP => CREDITS_PER_DOLLAR_1080P,
    };

    let usd_cents = (credits as f64 / credits_per_dollar * 100.0).round() as u64;

    VideoGenerationCostEstimate {
      cost_in_credits: Some(credits),
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
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

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

  // ── Cross-check: Artcraft v2 matches Kinovi v2 pricing ──

  mod cross_check_with_kinovi {
    use seedance2pro_client::requests::generate_video::generate_video::{
      KinoviBatchCount, KinoviOutputResolution,
    };

    use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::cost::KinoviSeedance2p0CostState;

    use super::*;

    #[test]
    fn matches_kinovi_720p_5s_b1() {
      assert_prices_match(Seedance2p0OutputResolution::SevenTwentyP, KinoviOutputResolution::SevenTwentyP, 5, Seedance2p0BatchCount::One, KinoviBatchCount::One);
    }

    #[test]
    fn matches_kinovi_720p_15s_b2() {
      assert_prices_match(Seedance2p0OutputResolution::SevenTwentyP, KinoviOutputResolution::SevenTwentyP, 15, Seedance2p0BatchCount::Two, KinoviBatchCount::Two);
    }

    #[test]
    fn matches_kinovi_480p_5s_b1() {
      assert_prices_match(Seedance2p0OutputResolution::FourEightyP, KinoviOutputResolution::FourEightyP, 5, Seedance2p0BatchCount::One, KinoviBatchCount::One);
    }

    #[test]
    fn matches_kinovi_480p_10s_b4() {
      assert_prices_match(Seedance2p0OutputResolution::FourEightyP, KinoviOutputResolution::FourEightyP, 10, Seedance2p0BatchCount::Four, KinoviBatchCount::Four);
    }

    #[test]
    fn matches_kinovi_1080p_5s_b1() {
      assert_prices_match(Seedance2p0OutputResolution::TenEightyP, KinoviOutputResolution::TenEightyP, 5, Seedance2p0BatchCount::One, KinoviBatchCount::One);
    }

    #[test]
    fn matches_kinovi_1080p_10s_b2() {
      assert_prices_match(Seedance2p0OutputResolution::TenEightyP, KinoviOutputResolution::TenEightyP, 10, Seedance2p0BatchCount::Two, KinoviBatchCount::Two);
    }

    #[test]
    fn matches_kinovi_720p_4s_b4() {
      assert_prices_match(Seedance2p0OutputResolution::SevenTwentyP, KinoviOutputResolution::SevenTwentyP, 4, Seedance2p0BatchCount::Four, KinoviBatchCount::Four);
    }

    #[test]
    fn matches_kinovi_1080p_15s_b4() {
      assert_prices_match(Seedance2p0OutputResolution::TenEightyP, KinoviOutputResolution::TenEightyP, 15, Seedance2p0BatchCount::Four, KinoviBatchCount::Four);
    }

    fn assert_prices_match(
      artcraft_res: Seedance2p0OutputResolution,
      kinovi_res: KinoviOutputResolution,
      duration_seconds: u8,
      artcraft_batch: Seedance2p0BatchCount,
      kinovi_batch: KinoviBatchCount,
    ) {
      let artcraft_cost = ArtcraftSeedance2p0CostState {
        resolution: artcraft_res,
        duration_seconds,
        batch_count: artcraft_batch,
        has_video_reference: false,
      }.estimate_cost();

      let kinovi_cost = KinoviSeedance2p0CostState {
        resolution: kinovi_res,
        duration_seconds,
        batch_count: kinovi_batch,
        has_video_reference: false,
      }.estimate_cost();

      assert_eq!(
        artcraft_cost.cost_in_usd_cents, kinovi_cost.cost_in_usd_cents,
        "USD cents mismatch for {:?} {}s {:?}: artcraft={:?}, kinovi={:?}",
        artcraft_res, duration_seconds, artcraft_batch,
        artcraft_cost.cost_in_usd_cents, kinovi_cost.cost_in_usd_cents,
      );
    }
  }

  // ── Credits spot checks ──

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_720p() {
      assert_eq!(credits(Seedance2p0OutputResolution::SevenTwentyP, 5, Seedance2p0BatchCount::One), 200);
    }

    #[test]
    fn credits_480p() {
      assert_eq!(credits(Seedance2p0OutputResolution::FourEightyP, 5, Seedance2p0BatchCount::One), 75);
    }

    #[test]
    fn credits_1080p() {
      assert_eq!(credits(Seedance2p0OutputResolution::TenEightyP, 5, Seedance2p0BatchCount::One), 450);
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
