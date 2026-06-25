use seedance2pro_client::generate::video::generate_seedance_2p0_mini::{
  GenerateSeedance2p0MiniRequest, KinoviSeedance2p0MiniBatchCount,
  KinoviSeedance2p0MiniOutputResolution,
};

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::kinovi::seedance_2p0_mini::draft::KinoviSeedance2p0MiniDraftState;
use crate::generate::generate_video::providers::kinovi::seedance_2p0_mini::request::KinoviSeedance2p0MiniRequestState;

pub struct KinoviSeedance2p0MiniCostState {
  pub resolution: Option<KinoviSeedance2p0MiniOutputResolution>,
  pub duration_seconds: u8,
  pub batch_count: Option<KinoviSeedance2p0MiniBatchCount>,
  pub has_video_reference: bool,
}

impl KinoviSeedance2p0MiniCostState {
  pub fn from_request(request: &KinoviSeedance2p0MiniRequestState) -> Self {
    Self {
      resolution: request.request.output_resolution,
      duration_seconds: request.request.duration_seconds,
      batch_count: request.request.batch_count,
      has_video_reference: request.request.reference_video_urls
        .as_ref()
        .is_some_and(|urls| !urls.is_empty()),
    }
  }

  pub fn from_draft(draft: &KinoviSeedance2p0MiniDraftState) -> Self {
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
    let pricing_request = GenerateSeedance2p0MiniRequest {
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
      bitrate: None,
    };

    let costs = pricing_request.calculate_costs();
    // Mini credits can be fractional (e.g. 480p odd durations land on 37.5).
    // The router's credit field is an integer, so round to the nearest credit;
    // the USD cents (the authoritative charge) are already rounded up.
    let cost_in_credits = costs.total_cost.kinovi_credits.round() as u64;
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
  use seedance2pro_client::generate::video::generate_seedance_2p0_mini::{
    KinoviSeedance2p0MiniOutputResolution as KinoviOutputResolution,
    KinoviSeedance2p0MiniBatchCount as KinoviBatchCount,
  };

  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::api::video_list_ref::VideoListRef;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video::video_generation_draft::VideoGenerationDraftRequest;
  use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

  // ── USD cents: every combination (480p/720p × with/without video ref) ──

  mod pricing_480p {
    use super::*;

    #[test]
    fn without_video_reference() {
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 4, KinoviBatchCount::One, false), 13);
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 5, KinoviBatchCount::One, false), 16);
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 10, KinoviBatchCount::One, false), 31);
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 15, KinoviBatchCount::One, false), 47);
    }

    #[test]
    fn with_video_reference() {
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 4, KinoviBatchCount::One, true), 16);
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 5, KinoviBatchCount::One, true), 20);
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 10, KinoviBatchCount::One, true), 40);
      assert_eq!(usd_cents(KinoviOutputResolution::FourEightyP, 15, KinoviBatchCount::One, true), 59);
    }
  }

  mod pricing_720p {
    use super::*;

    #[test]
    fn without_video_reference() {
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 4, KinoviBatchCount::One, false), 33);
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::One, false), 42);
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 10, KinoviBatchCount::One, false), 83);
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 15, KinoviBatchCount::One, false), 124);
    }

    #[test]
    fn with_video_reference() {
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 4, KinoviBatchCount::One, true), 40);
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::One, true), 50);
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 10, KinoviBatchCount::One, true), 99);
      assert_eq!(usd_cents(KinoviOutputResolution::SevenTwentyP, 15, KinoviBatchCount::One, true), 149);
    }
  }

  // ── Credits (mini bills fractional credits, rounded for the integer field) ──

  mod credits_tests {
    use super::*;

    #[test]
    fn credits_480p() {
      // 7.5 credits/s; odd durations are fractional (37.5 → 38, 112.5 → 113).
      assert_eq!(credits(KinoviOutputResolution::FourEightyP, 4, KinoviBatchCount::One, false), 30);
      assert_eq!(credits(KinoviOutputResolution::FourEightyP, 5, KinoviBatchCount::One, false), 38);
      assert_eq!(credits(KinoviOutputResolution::FourEightyP, 10, KinoviBatchCount::One, false), 75);
      assert_eq!(credits(KinoviOutputResolution::FourEightyP, 15, KinoviBatchCount::One, false), 113);
    }

    #[test]
    fn credits_720p() {
      assert_eq!(credits(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::One, false), 100);
      assert_eq!(credits(KinoviOutputResolution::SevenTwentyP, 15, KinoviBatchCount::One, false), 300);
    }
  }

  // ── Relative pricing ──

  mod relative_pricing_tests {
    use super::*;

    #[test]
    fn cost_480p_cheaper_than_720p() {
      let c480 = usd_cents(KinoviOutputResolution::FourEightyP, 5, KinoviBatchCount::One, false);
      let c720 = usd_cents(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::One, false);
      assert!(c480 < c720, "480p ({c480}) should be cheaper than 720p ({c720})");
    }

    #[test]
    fn video_reference_costs_more() {
      for res in [KinoviOutputResolution::FourEightyP, KinoviOutputResolution::SevenTwentyP] {
        for dur in [4u8, 5, 10, 15] {
          let without = usd_cents(res, dur, KinoviBatchCount::One, false);
          let with = usd_cents(res, dur, KinoviBatchCount::One, true);
          assert!(with > without, "video ref should cost more at {res:?} {dur}s");
        }
      }
    }

    #[test]
    fn cost_scales_with_duration_and_batch() {
      let c4 = usd_cents(KinoviOutputResolution::SevenTwentyP, 4, KinoviBatchCount::One, false);
      let c15 = usd_cents(KinoviOutputResolution::SevenTwentyP, 15, KinoviBatchCount::One, false);
      assert!(c4 < c15);
      let b1 = usd_cents(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::One, false);
      let b4 = usd_cents(KinoviOutputResolution::SevenTwentyP, 5, KinoviBatchCount::Four, false);
      assert!(b1 < b4);
    }
  }

  // ── from_request() ──

  mod from_request_tests {
    use super::*;

    #[test]
    fn from_request_720p() {
      let req = make_request_state(Some(KinoviOutputResolution::SevenTwentyP), 5, KinoviBatchCount::One, false);
      let cost = KinoviSeedance2p0MiniCostState::from_request(&req);
      assert!(matches!(cost.resolution, Some(KinoviOutputResolution::SevenTwentyP)));
      assert_eq!(cost.duration_seconds, 5);
      assert!(!cost.has_video_reference);
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(42));
    }

    #[test]
    fn from_request_480p_with_video_reference() {
      let req = make_request_state(Some(KinoviOutputResolution::FourEightyP), 5, KinoviBatchCount::One, true);
      let cost = KinoviSeedance2p0MiniCostState::from_request(&req);
      assert!(cost.has_video_reference);
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(20));
    }

    #[test]
    fn from_request_none_defaults_to_720p() {
      let req = make_request_state(None, 5, KinoviBatchCount::One, false);
      let cost = KinoviSeedance2p0MiniCostState::from_request(&req);
      assert!(cost.resolution.is_none());
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(42));
    }
  }

  // ── from_draft() ──

  mod from_draft_tests {
    use super::*;

    #[test]
    fn from_draft_480p() {
      let draft = make_draft(5, 1, Some(RouterResolution::FourEightyP), false);
      let cost = KinoviSeedance2p0MiniCostState::from_draft(&draft);
      assert!(matches!(cost.resolution, Some(KinoviOutputResolution::FourEightyP)));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(16));
    }

    #[test]
    fn from_draft_with_video_reference() {
      let draft = make_draft(5, 1, Some(RouterResolution::SevenTwentyP), true);
      let cost = KinoviSeedance2p0MiniCostState::from_draft(&draft);
      assert!(cost.has_video_reference);
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(50));
    }

    #[test]
    fn from_draft_batch_8() {
      // Mini supports up to batch 8: 720p 5s × 8 = 800 credits → 80000/243 → 330¢.
      let draft = make_draft(5, 8, Some(RouterResolution::SevenTwentyP), false);
      let cost = KinoviSeedance2p0MiniCostState::from_draft(&draft);
      assert!(matches!(cost.batch_count, Some(KinoviBatchCount::Eight)));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(330));
    }
  }

  // ── Cross-check: from_draft matches from_request ──

  mod cross_check_tests {
    use super::*;

    #[test]
    fn draft_and_request_produce_same_cost() {
      let draft = make_draft(10, 2, Some(RouterResolution::FourEightyP), true);
      let req = make_request_state(Some(KinoviOutputResolution::FourEightyP), 10, KinoviBatchCount::Two, true);
      let draft_cost = KinoviSeedance2p0MiniCostState::from_draft(&draft).estimate_cost();
      let req_cost = KinoviSeedance2p0MiniCostState::from_request(&req).estimate_cost();
      assert_eq!(draft_cost.cost_in_usd_cents, req_cost.cost_in_usd_cents);
      assert_eq!(draft_cost.cost_in_credits, req_cost.cost_in_credits);
    }
  }

  // ── Helpers ──

  fn usd_cents(
    resolution: KinoviOutputResolution,
    duration_seconds: u8,
    batch_count: KinoviBatchCount,
    has_video_reference: bool,
  ) -> u64 {
    KinoviSeedance2p0MiniCostState {
      resolution: Some(resolution),
      duration_seconds,
      batch_count: Some(batch_count),
      has_video_reference,
    }
      .estimate_cost()
      .cost_in_usd_cents
      .unwrap()
  }

  fn credits(
    resolution: KinoviOutputResolution,
    duration_seconds: u8,
    batch_count: KinoviBatchCount,
    has_video_reference: bool,
  ) -> u64 {
    KinoviSeedance2p0MiniCostState {
      resolution: Some(resolution),
      duration_seconds,
      batch_count: Some(batch_count),
      has_video_reference,
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
  ) -> KinoviSeedance2p0MiniDraftState {
    let reference_videos = if with_video_ref {
      Some(VideoListRef::Urls(vec!["https://example.com/video.mp4".to_string()]))
    } else {
      None
    };

    let builder = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Seedance2p0Mini,
      provider: RouterProvider::Seedance2Pro,
      resolution,
      reference_videos,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(video_batch_count),
      ..Default::default()
    };

    match builder.build2().expect("build2 should succeed") {
      VideoGenerationDraftOrRequest::Draft(
        VideoGenerationDraftRequest::KinoviSeedance2p0Mini(draft)
      ) => draft,
      _ => panic!("expected KinoviSeedance2p0Mini draft"),
    }
  }

  /// Build a request state for from_request() tests.
  fn make_request_state(
    resolution: Option<KinoviOutputResolution>,
    duration_seconds: u8,
    batch_count: KinoviBatchCount,
    with_video_ref: bool,
  ) -> KinoviSeedance2p0MiniRequestState {
    let reference_video_urls = if with_video_ref {
      Some(vec!["https://cdn.seedance2-pro.com/video.mp4".to_string()])
    } else {
      None
    };

    KinoviSeedance2p0MiniRequestState {
      request: GenerateSeedance2p0MiniRequest {
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
        bitrate: None,
      },
    }
  }
}
