use seedance2pro_client::requests::generate_video::generate_video::{KinoviAspectRatio, KinoviBatchCount, KinoviGenerateVideoRequest, KinoviModelType, KinoviOutputResolution};
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::draft::KinoviSeedance2p0DraftState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::request::KinoviSeedance2p0RequestState;

pub struct KinoviSeedance2p0CostState {
  pub resolution: KinoviOutputResolution,
  pub duration_seconds: u8,
  pub batch_count: KinoviBatchCount,

  /// Forward-looking: Kinovi charges for this. We need to take it into
  /// account in the future.
  pub has_video_reference: bool,
}

impl KinoviSeedance2p0CostState {
  pub fn from_request(request: &KinoviSeedance2p0RequestState) -> Self {
    Self {
      resolution: request.request.output_resolution.unwrap_or(KinoviOutputResolution::SevenTwentyP),
      duration_seconds: request.request.duration_seconds,
      batch_count: request.request.batch_count,
      has_video_reference: request.request.reference_video_urls
        .as_ref()
        .is_some_and(|urls| !urls.is_empty()),
    }
  }

  pub fn from_draft(draft: &KinoviSeedance2p0DraftState) -> Self {
    let has_video_reference = draft.unhandled_request_state
      .as_ref()
      .and_then(|rem| rem.reference_videos.as_ref())
      .is_some();

    Self {
      resolution: draft.resolution.unwrap_or(KinoviOutputResolution::SevenTwentyP),
      duration_seconds: draft.duration_seconds,
      batch_count: draft.batch_count,
      has_video_reference,
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let request = KinoviGenerateVideoRequest {
      // Pricing factors
      model_type: KinoviModelType::Seedance2Pro,
      output_resolution: Some(self.resolution),
      duration_seconds: self.duration_seconds,
      batch_count: self.batch_count,

      // NB: has_video_reference is tracked but does not affect price yet.
      // When Kinovi starts charging for video references, add cost here.

      // No impact on price
      prompt: String::new(),
      aspect_ratio: KinoviAspectRatio::Portrait9x16,
      start_frame_url: None,
      end_frame_url: None,
      reference_image_urls: None,
      reference_video_urls: None,
      reference_audio_urls: None,
      character_ids: None,
      use_face_blur_hack: None,
    };

    let cost_in_credits = request.estimate_credits();
    let cost_in_usd_cents = request.estimate_cost_in_usd_cents();

    VideoGenerationCostEstimate {
      cost_in_credits: Some(cost_in_credits as u64),
      cost_in_usd_cents: Some(cost_in_usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::provider::Provider;
  use crate::api::video_list_ref::VideoListRef;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video_v2::video_generation_draft::VideoGenerationDraftRequest;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

  // ── 720p pricing ──

  mod pricing_720p {
    use super::*;

    #[test]
    fn cost_720p_batch_1() {
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 4, KinoviBatchCount::One), 64);
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::One), 80);
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 6, KinoviBatchCount::One), 96);
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 7, KinoviBatchCount::One), 112);
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 10, KinoviBatchCount::One), 160);
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 15, KinoviBatchCount::One), 240);
    }

    #[test]
    fn cost_720p_batch_2() {
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 4, KinoviBatchCount::Two), 128);
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::Two), 160);
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 15, KinoviBatchCount::Two), 480);
    }

    #[test]
    fn cost_720p_batch_4() {
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 4, KinoviBatchCount::Four), 256);
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::Four), 320);
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 15, KinoviBatchCount::Four), 960);
    }
  }

  // ── 480p pricing ──

  mod pricing_480p {
    use super::*;

    #[test]
    fn cost_480p_batch_1() {
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 4, KinoviBatchCount::One), 31);
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 5, KinoviBatchCount::One), 39);
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 10, KinoviBatchCount::One), 78);
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 15, KinoviBatchCount::One), 117);
    }

    #[test]
    fn cost_480p_batch_2() {
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 5, KinoviBatchCount::Two), 78);
    }

    #[test]
    fn cost_480p_batch_4() {
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 5, KinoviBatchCount::Four), 155);
    }
  }

  // ── 1080p pricing ──

  mod pricing_1080p {
    use super::*;

    #[test]
    fn cost_1080p_batch_1() {
      assert_eq!(usd_cents(KinoviOutputResolution::TenEightyP, 4, KinoviBatchCount::One), 187);
      assert_eq!(usd_cents(KinoviOutputResolution::TenEightyP, 5, KinoviBatchCount::One), 233);
      assert_eq!(usd_cents(KinoviOutputResolution::TenEightyP, 10, KinoviBatchCount::One), 466);
      assert_eq!(usd_cents(KinoviOutputResolution::TenEightyP, 15, KinoviBatchCount::One), 699);
    }

    #[test]
    fn cost_1080p_batch_2() {
      assert_eq!(usd_cents(KinoviOutputResolution::TenEightyP, 5, KinoviBatchCount::Two), 466);
    }

    #[test]
    fn cost_1080p_batch_4() {
      assert_eq!(usd_cents(KinoviOutputResolution::TenEightyP, 5, KinoviBatchCount::Four), 933);
    }
  }

  // ── Relative pricing ──

  mod relative_pricing_tests {
    use super::*;

    #[test]
    fn cost_480p_cheaper_than_720p_cheaper_than_1080p() {
      let c480 = usd_cents(KinoviOutputResolution::FourEightyP, 5, KinoviBatchCount::One);
      let c720 = usd_cents(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::One);
      let c1080 = usd_cents(KinoviOutputResolution::TenEightyP, 5, KinoviBatchCount::One);
      assert!(c480 < c720, "480p ({}) should be cheaper than 720p ({})", c480, c720);
      assert!(c720 < c1080, "720p ({}) should be cheaper than 1080p ({})", c720, c1080);
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
      let b1 = usd_cents(KinoviOutputResolution::TenEightyP, 5, KinoviBatchCount::One);
      let b2 = usd_cents(KinoviOutputResolution::TenEightyP, 5, KinoviBatchCount::Two);
      let b4 = usd_cents(KinoviOutputResolution::TenEightyP, 5, KinoviBatchCount::Four);
      assert!(b1 < b2);
      assert!(b2 < b4);
    }
  }

  // -- Video reference does NOT affect cost (yet) --

  #[test]
  fn video_reference_does_not_affect_cost() {
    let base = KinoviSeedance2p0CostState {
      resolution: KinoviOutputResolution::SevenTwentyP,
      duration_seconds: 5,
      batch_count: KinoviBatchCount::One,
      has_video_reference: false,
    };
    let without = base.estimate_cost();
    let with = KinoviSeedance2p0CostState { has_video_reference: true, ..base }.estimate_cost();
    assert_eq!(without.cost_in_usd_cents, with.cost_in_usd_cents);
    assert_eq!(without.cost_in_credits, with.cost_in_credits);
  }

  // ── from_request() tests ──

  mod from_request_tests {
    use super::*;

    #[test]
    fn from_request_720p() {
      let req = make_request_state(Some(KinoviOutputResolution::SevenTwentyP), 5, KinoviBatchCount::One, false);
      let cost = KinoviSeedance2p0CostState::from_request(&req);
      assert!(matches!(cost.resolution, KinoviOutputResolution::SevenTwentyP));
      assert_eq!(cost.duration_seconds, 5);
      assert!(matches!(cost.batch_count, KinoviBatchCount::One));
      assert!(!cost.has_video_reference);
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(80));
    }

    #[test]
    fn from_request_none_defaults_to_720p() {
      let req = make_request_state(None, 5, KinoviBatchCount::One, false);
      let cost = KinoviSeedance2p0CostState::from_request(&req);
      assert!(matches!(cost.resolution, KinoviOutputResolution::SevenTwentyP));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(80));
    }

    #[test]
    fn from_request_480p() {
      let req = make_request_state(Some(KinoviOutputResolution::FourEightyP), 5, KinoviBatchCount::One, false);
      let cost = KinoviSeedance2p0CostState::from_request(&req);
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(39));
    }

    #[test]
    fn from_request_1080p_batch_2() {
      let req = make_request_state(Some(KinoviOutputResolution::TenEightyP), 5, KinoviBatchCount::Two, false);
      let cost = KinoviSeedance2p0CostState::from_request(&req);
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(466));
    }

    #[test]
    fn from_request_with_video_reference() {
      let req = make_request_state(Some(KinoviOutputResolution::SevenTwentyP), 5, KinoviBatchCount::One, true);
      let cost = KinoviSeedance2p0CostState::from_request(&req);
      assert!(cost.has_video_reference);
      // Video refs don't affect cost yet
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(80));
    }

    #[test]
    fn from_request_without_video_reference() {
      let req = make_request_state(Some(KinoviOutputResolution::SevenTwentyP), 5, KinoviBatchCount::One, false);
      let cost = KinoviSeedance2p0CostState::from_request(&req);
      assert!(!cost.has_video_reference);
    }
  }

  // ── from_draft() tests ──

  mod from_draft_tests {
    use super::*;

    #[test]
    fn from_draft_720p_default() {
      let draft = make_draft(5, 1, None, false);
      let cost = KinoviSeedance2p0CostState::from_draft(&draft);
      assert!(matches!(cost.resolution, KinoviOutputResolution::SevenTwentyP));
      assert_eq!(cost.duration_seconds, 5);
      assert!(matches!(cost.batch_count, KinoviBatchCount::One));
      assert!(!cost.has_video_reference);
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(80));
    }

    #[test]
    fn from_draft_480p() {
      let draft = make_draft(5, 1, Some(CommonResolution::FourEightyP), false);
      let cost = KinoviSeedance2p0CostState::from_draft(&draft);
      assert!(matches!(cost.resolution, KinoviOutputResolution::FourEightyP));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(39));
    }

    #[test]
    fn from_draft_1080p_batch_4() {
      let draft = make_draft(5, 4, Some(CommonResolution::TenEightyP), false);
      let cost = KinoviSeedance2p0CostState::from_draft(&draft);
      assert!(matches!(cost.resolution, KinoviOutputResolution::TenEightyP));
      assert!(matches!(cost.batch_count, KinoviBatchCount::Four));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(933));
    }

    #[test]
    fn from_draft_with_video_reference() {
      let draft = make_draft(5, 1, None, true);
      let cost = KinoviSeedance2p0CostState::from_draft(&draft);
      assert!(cost.has_video_reference);
      // Video refs don't affect cost yet
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(80));
    }

    #[test]
    fn from_draft_without_video_reference() {
      let draft = make_draft(5, 1, None, false);
      let cost = KinoviSeedance2p0CostState::from_draft(&draft);
      assert!(!cost.has_video_reference);
    }

    #[test]
    fn from_draft_duration_15_batch_2() {
      let draft = make_draft(15, 2, Some(CommonResolution::SevenTwentyP), false);
      let cost = KinoviSeedance2p0CostState::from_draft(&draft);
      assert_eq!(cost.duration_seconds, 15);
      assert!(matches!(cost.batch_count, KinoviBatchCount::Two));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(480));
    }
  }

  // ── Cross-check: from_draft matches from_request ──

  mod cross_check_tests {
    use super::*;

    #[test]
    fn draft_and_request_produce_same_cost() {
      // 720p, 5s, batch 1
      let draft = make_draft(5, 1, Some(CommonResolution::SevenTwentyP), false);
      let req = make_request_state(Some(KinoviOutputResolution::SevenTwentyP), 5, KinoviBatchCount::One, false);
      let draft_cost = KinoviSeedance2p0CostState::from_draft(&draft).estimate_cost();
      let req_cost = KinoviSeedance2p0CostState::from_request(&req).estimate_cost();
      assert_eq!(draft_cost.cost_in_usd_cents, req_cost.cost_in_usd_cents);
      assert_eq!(draft_cost.cost_in_credits, req_cost.cost_in_credits);
    }

    #[test]
    fn draft_and_request_produce_same_cost_1080p() {
      let draft = make_draft(10, 2, Some(CommonResolution::TenEightyP), false);
      let req = make_request_state(Some(KinoviOutputResolution::TenEightyP), 10, KinoviBatchCount::Two, false);
      let draft_cost = KinoviSeedance2p0CostState::from_draft(&draft).estimate_cost();
      let req_cost = KinoviSeedance2p0CostState::from_request(&req).estimate_cost();
      assert_eq!(draft_cost.cost_in_usd_cents, req_cost.cost_in_usd_cents);
      assert_eq!(draft_cost.cost_in_credits, req_cost.cost_in_credits);
    }
  }

  // ── Credits spot checks ──

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_720p() {
      assert_eq!(credits(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::One), 200);
    }

    #[test]
    fn credits_480p() {
      assert_eq!(credits(KinoviOutputResolution::FourEightyP, 5, KinoviBatchCount::One), 75);
    }

    #[test]
    fn credits_1080p() {
      assert_eq!(credits(KinoviOutputResolution::TenEightyP, 5, KinoviBatchCount::One), 450);
    }
  }

  // ── Helpers ──

  fn usd_cents(
    resolution: KinoviOutputResolution,
    duration_seconds: u8,
    batch_count: KinoviBatchCount,
  ) -> u64 {
    KinoviSeedance2p0CostState { resolution, duration_seconds, batch_count, has_video_reference: false }
      .estimate_cost()
      .cost_in_usd_cents
      .unwrap()
  }

  fn credits(
    resolution: KinoviOutputResolution,
    duration_seconds: u8,
    batch_count: KinoviBatchCount,
  ) -> u64 {
    KinoviSeedance2p0CostState { resolution, duration_seconds, batch_count, has_video_reference: false }
      .estimate_cost()
      .cost_in_credits
      .unwrap()
  }

  /// Build a draft via the builder to test from_draft().
  fn make_draft(
    duration_seconds: u16,
    video_batch_count: u16,
    resolution: Option<CommonResolution>,
    with_video_ref: bool,
  ) -> KinoviSeedance2p0DraftState {
    let reference_videos = if with_video_ref {
      Some(VideoListRef::Urls(vec!["https://example.com/video.mp4".to_string()]))
    } else {
      None
    };

    let builder = GenerateVideoRequestBuilder {
      provider: Provider::Seedance2Pro,
      resolution,
      reference_videos,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(video_batch_count),
      ..Default::default()
    };

    match builder.build2().expect("build2 should succeed") {
      VideoGenerationDraftOrRequest::Draft(
        VideoGenerationDraftRequest::KinoviSeedance2p0(draft)
      ) => draft,
      _ => panic!("expected KinoviSeedance2p0 draft"),
    }
  }

  /// Build a request state for from_request() tests.
  fn make_request_state(
    resolution: Option<KinoviOutputResolution>,
    duration_seconds: u8,
    batch_count: KinoviBatchCount,
    with_video_ref: bool,
  ) -> KinoviSeedance2p0RequestState {
    let reference_video_urls = if with_video_ref {
      Some(vec!["https://cdn.seedance2-pro.com/video.mp4".to_string()])
    } else {
      None
    };

    KinoviSeedance2p0RequestState {
      request: KinoviGenerateVideoRequest {
        model_type: KinoviModelType::Seedance2Pro,
        prompt: "test".to_string(),
        aspect_ratio: KinoviAspectRatio::Landscape16x9,
        output_resolution: resolution,
        duration_seconds,
        batch_count,
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
