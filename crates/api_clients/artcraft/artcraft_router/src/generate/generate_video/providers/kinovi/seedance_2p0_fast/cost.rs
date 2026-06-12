use seedance2pro_client::generate::video::generate_seedance_2p0_fast::{
  GenerateSeedance2p0FastRequest, KinoviSeedance2p0FastBatchCount,
  KinoviSeedance2p0FastOutputResolution,
};

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::kinovi::seedance_2p0_fast::draft::KinoviSeedance2p0FastDraftState;
use crate::generate::generate_video::providers::kinovi::seedance_2p0_fast::request::KinoviSeedance2p0FastRequestState;

pub struct KinoviSeedance2p0FastCostState {
  pub resolution: Option<KinoviSeedance2p0FastOutputResolution>,
  pub duration_seconds: u8,
  pub batch_count: Option<KinoviSeedance2p0FastBatchCount>,
  pub has_video_reference: bool,
}

impl KinoviSeedance2p0FastCostState {
  pub fn from_request(request: &KinoviSeedance2p0FastRequestState) -> Self {
    Self {
      resolution: request.request.output_resolution,
      duration_seconds: request.request.duration_seconds,
      batch_count: request.request.batch_count,
      has_video_reference: request.request.reference_video_urls
        .as_ref()
        .is_some_and(|urls| !urls.is_empty()),
    }
  }

  pub fn from_draft(draft: &KinoviSeedance2p0FastDraftState) -> Self {
    let has_video_reference = draft.unhandled_request_state
      .as_ref()
      .and_then(|rem| rem.reference_videos.as_ref())
      .is_some();

    Self {
      resolution: draft.resolution,
      duration_seconds: draft.duration_seconds,
      batch_count: Some(draft.batch_count),
      has_video_reference,
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let pricing_request = GenerateSeedance2p0FastRequest {
      output_resolution: self.resolution,
      duration_seconds: self.duration_seconds,
      batch_count: self.batch_count,

      // PRESENCE of reference videos changes the price (per-second
      // surcharge); the URL contents don't.
      reference_video_urls: if self.has_video_reference {
        Some(vec!["pricing-placeholder".to_string()])
      } else {
        None
      },

      // No impact on price
      prompt: String::new(),
      aspect_ratio: None,
      start_frame_url: None,
      end_frame_url: None,
      reference_image_urls: None,
      reference_audio_urls: None,
      character_ids: None,
      use_face_blur_hack: None,
    };

    let costs = pricing_request.calculate_costs();
    let cost_in_credits = costs.total_cost.kinovi_credits;
    let cost_in_usd_cents = costs.total_cost.usd_cents_rounded_up;

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
  use super::*;
  use crate::api::router_resolution::RouterResolution;
  use seedance2pro_client::generate::video::generate_seedance_2p0_fast::{
    KinoviSeedance2p0FastOutputResolution as KinoviOutputResolution,
    KinoviSeedance2p0FastBatchCount as KinoviBatchCount,
  };

  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::api::video_list_ref::VideoListRef;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::video_generation_draft::VideoGenerationDraftRequest;
  use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

  // ── Direct estimate_cost() tests ──
  // These must match the reference implementation values exactly.

  // -- 720p (28 credits/sec, 243 credits/$1) --

  mod pricing_720p {
    use super::*;

    #[test]
    fn cost_720p_batch_1() {
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 4, KinoviBatchCount::One), 47);
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::One), 58);
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 10, KinoviBatchCount::One), 116);
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 15, KinoviBatchCount::One), 173);
    }

    #[test]
    fn cost_720p_batch_2() {
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::Two), 116);
    }

    #[test]
    fn cost_720p_batch_4() {
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::Four), 231);
    }
  }

  // -- 480p (14 credits/sec, 243 credits/$1) --

  mod pricing_480p {
    use super::*;

    #[test]
    fn cost_480p_batch_1() {
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 4, KinoviBatchCount::One), 24);
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 5, KinoviBatchCount::One), 29);
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 10, KinoviBatchCount::One), 58);
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 15, KinoviBatchCount::One), 87);
    }

    #[test]
    fn cost_480p_batch_2() {
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 5, KinoviBatchCount::Two), 58);
    }

    #[test]
    fn cost_480p_batch_4() {
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 5, KinoviBatchCount::Four), 116);
    }
  }

  // -- Relative pricing --

  mod relative_pricing_tests {
    use super::*;

    #[test]
    fn cost_480p_cheaper_than_720p() {
      let c480 = usd_cents(KinoviOutputResolution::FourEightyP, 5, KinoviBatchCount::One);
      let c720 = usd_cents(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::One);
      assert!(c480 < c720, "480p ({}) should be cheaper than 720p ({})", c480, c720);
    }

    #[test]
    fn cost_scales_with_duration() {
      let c4 = usd_cents(KinoviOutputResolution::SevenTwentyP, 4, KinoviBatchCount::One);
      let c10 = usd_cents(KinoviOutputResolution::SevenTwentyP, 10, KinoviBatchCount::One);
      let c15 = usd_cents(KinoviOutputResolution::SevenTwentyP, 15, KinoviBatchCount::One);
      assert!(c4 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn cost_scales_with_batch() {
      let b1 = usd_cents(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::One);
      let b2 = usd_cents(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::Two);
      let b4 = usd_cents(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::Four);
      assert!(b1 < b2);
      assert!(b2 < b4);
    }
  }

  // -- Video reference does NOT affect cost (yet) --

  #[test]
  fn video_reference_adds_surcharge() {
    let base = KinoviSeedance2p0FastCostState {
      resolution: Some(KinoviOutputResolution::SevenTwentyP),
      duration_seconds: 5,
      batch_count: Some(KinoviBatchCount::One),
      has_video_reference: false,
    };
    let without = base.estimate_cost();
    let with = KinoviSeedance2p0FastCostState { has_video_reference: true, ..base }.estimate_cost();
    // Fast 720p surcharge is +6 credits/s: 140 -> 170 credits (17000/243 = 69.96 -> 70 cents).
    assert_eq!(without.cost_in_credits, Some(140));
    assert_eq!(with.cost_in_credits, Some(170));
    assert_eq!(with.cost_in_usd_cents, Some(70));
  }

  // ── from_request() tests ──

  mod from_request_tests {
    use super::*;

    #[test]
    fn from_request_720p() {
      let req = make_request_state(Some(KinoviOutputResolution::SevenTwentyP), 5, KinoviBatchCount::One, false);
      let cost = KinoviSeedance2p0FastCostState::from_request(&req);
      assert!(matches!(cost.resolution, Some(KinoviOutputResolution::SevenTwentyP)));
      assert_eq!(cost.duration_seconds, 5);
      assert!(matches!(cost.batch_count, Some(KinoviBatchCount::One)));
      assert!(!cost.has_video_reference);
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(58));
    }

    #[test]
    fn from_request_none_defaults_to_720p() {
      let req = make_request_state(None, 5, KinoviBatchCount::One, false);
      let cost = KinoviSeedance2p0FastCostState::from_request(&req);
      assert!(cost.resolution.is_none());
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(58));
    }

    #[test]
    fn from_request_480p() {
      let req = make_request_state(Some(KinoviOutputResolution::FourEightyP), 5, KinoviBatchCount::One, false);
      let cost = KinoviSeedance2p0FastCostState::from_request(&req);
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(29));
    }

    #[test]
    fn from_request_with_video_reference() {
      let req = make_request_state(Some(KinoviOutputResolution::SevenTwentyP), 5, KinoviBatchCount::One, true);
      let cost = KinoviSeedance2p0FastCostState::from_request(&req);
      assert!(cost.has_video_reference);
      // Video refs add a +6 credits/s surcharge at 720p: 170 credits -> 89 cents.
      assert_eq!(cost.estimate_cost().cost_in_credits, Some(170));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(70));
    }

    #[test]
    fn from_request_without_video_reference() {
      let req = make_request_state(Some(KinoviOutputResolution::SevenTwentyP), 5, KinoviBatchCount::One, false);
      let cost = KinoviSeedance2p0FastCostState::from_request(&req);
      assert!(!cost.has_video_reference);
    }
  }

  // ── from_draft() tests ──

  mod from_draft_tests {
    use super::*;

    #[test]
    fn from_draft_720p_default() {
      let draft = make_draft(5, 1, None, false);
      let cost = KinoviSeedance2p0FastCostState::from_draft(&draft);
      assert!(cost.resolution.is_none());
      assert_eq!(cost.duration_seconds, 5);
      assert!(matches!(cost.batch_count, Some(KinoviBatchCount::One)));
      assert!(!cost.has_video_reference);
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(58));
    }

    #[test]
    fn from_draft_480p() {
      let draft = make_draft(5, 1, Some(RouterResolution::FourEightyP), false);
      let cost = KinoviSeedance2p0FastCostState::from_draft(&draft);
      assert!(matches!(cost.resolution, Some(KinoviOutputResolution::FourEightyP)));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(29));
    }

    #[test]
    fn from_draft_with_video_reference() {
      let draft = make_draft(5, 1, None, true);
      let cost = KinoviSeedance2p0FastCostState::from_draft(&draft);
      assert!(cost.has_video_reference);
      // Video refs add a +6 credits/s surcharge at 720p: 170 credits -> 89 cents.
      assert_eq!(cost.estimate_cost().cost_in_credits, Some(170));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(70));
    }

    #[test]
    fn from_draft_without_video_reference() {
      let draft = make_draft(5, 1, None, false);
      let cost = KinoviSeedance2p0FastCostState::from_draft(&draft);
      assert!(!cost.has_video_reference);
    }

    #[test]
    fn from_draft_duration_15_batch_2() {
      let draft = make_draft(15, 2, Some(RouterResolution::SevenTwentyP), false);
      let cost = KinoviSeedance2p0FastCostState::from_draft(&draft);
      assert_eq!(cost.duration_seconds, 15);
      assert!(matches!(cost.batch_count, Some(KinoviBatchCount::Two)));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(346));
    }
  }

  // ── Cross-check: from_draft matches from_request ──

  mod cross_check_tests {
    use super::*;

    #[test]
    fn draft_and_request_produce_same_cost() {
      // 720p, 5s, batch 1
      let draft = make_draft(5, 1, Some(RouterResolution::SevenTwentyP), false);
      let req = make_request_state(Some(KinoviOutputResolution::SevenTwentyP), 5, KinoviBatchCount::One, false);
      let draft_cost = KinoviSeedance2p0FastCostState::from_draft(&draft).estimate_cost();
      let req_cost = KinoviSeedance2p0FastCostState::from_request(&req).estimate_cost();
      assert_eq!(draft_cost.cost_in_usd_cents, req_cost.cost_in_usd_cents);
      assert_eq!(draft_cost.cost_in_credits, req_cost.cost_in_credits);
    }

    #[test]
    fn draft_and_request_produce_same_cost_480p() {
      let draft = make_draft(10, 2, Some(RouterResolution::FourEightyP), false);
      let req = make_request_state(Some(KinoviOutputResolution::FourEightyP), 10, KinoviBatchCount::Two, false);
      let draft_cost = KinoviSeedance2p0FastCostState::from_draft(&draft).estimate_cost();
      let req_cost = KinoviSeedance2p0FastCostState::from_request(&req).estimate_cost();
      assert_eq!(draft_cost.cost_in_usd_cents, req_cost.cost_in_usd_cents);
      assert_eq!(draft_cost.cost_in_credits, req_cost.cost_in_credits);
    }
  }

  // ── Credits spot checks ──

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_720p() {
      assert_eq!(credits(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::One), 140);
    }

    #[test]
    fn credits_480p() {
      assert_eq!(credits(KinoviOutputResolution::FourEightyP, 5, KinoviBatchCount::One), 70);
    }
  }

  // ── Helpers ──

  fn usd_cents(
    resolution: KinoviOutputResolution,
    duration_seconds: u8,
    batch_count: KinoviBatchCount,
  ) -> u64 {
    KinoviSeedance2p0FastCostState {
      resolution: Some(resolution), duration_seconds, batch_count: Some(batch_count),
      has_video_reference: false,
    }
      .estimate_cost()
      .cost_in_usd_cents
      .unwrap()
  }

  fn credits(
    resolution: KinoviOutputResolution,
    duration_seconds: u8,
    batch_count: KinoviBatchCount,
  ) -> u64 {
    KinoviSeedance2p0FastCostState {
      resolution: Some(resolution), duration_seconds, batch_count: Some(batch_count),
      has_video_reference: false,
    }
      .estimate_cost()
      .cost_in_credits
      .unwrap()
  }

  /// Build a draft via the builder to test from_draft().
  fn make_draft(
    duration_seconds: u16,
    video_batch_count: u16,
    resolution: Option<RouterResolution>,
    with_video_ref: bool,
  ) -> KinoviSeedance2p0FastDraftState {
    let reference_videos = if with_video_ref {
      Some(VideoListRef::Urls(vec!["https://example.com/video.mp4".to_string()]))
    } else {
      None
    };

    let builder = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance2p0Fast,
      provider: RouterProvider::Seedance2Pro,
      resolution,
      reference_videos,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(video_batch_count),
      ..Default::default()
    };

    match builder.build2().expect("build2 should succeed") {
      VideoGenerationDraftOrRequest::Draft(
        VideoGenerationDraftRequest::KinoviSeedance2p0Fast(draft)
      ) => draft,
      _ => panic!("expected KinoviSeedance2p0Fast draft"),
    }
  }

  /// Build a request state for from_request() tests.
  fn make_request_state(
    resolution: Option<KinoviOutputResolution>,
    duration_seconds: u8,
    batch_count: KinoviBatchCount,
    with_video_ref: bool,
  ) -> KinoviSeedance2p0FastRequestState {
    let reference_video_urls = if with_video_ref {
      Some(vec!["https://cdn.seedance2-pro.com/video.mp4".to_string()])
    } else {
      None
    };

    KinoviSeedance2p0FastRequestState {
      request: GenerateSeedance2p0FastRequest {
        prompt: "test".to_string(),
        aspect_ratio: None,
        output_resolution: resolution,
        duration_seconds,
        batch_count: Some(batch_count),
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: None,
        reference_video_urls,
        reference_audio_urls: None,
        character_ids: None,
        use_face_blur_hack: None,
      },
    }
  }
}
