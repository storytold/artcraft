use seedance2pro_client::generate::video::generate_happy_horse_1p0::{
  GenerateHappyHorse1p0Request, KinoviHappyHorse1p0BatchCount,
  KinoviHappyHorse1p0OutputResolution,
};

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::kinovi::happy_horse_1p0::draft::KinoviHappyHorse1p0DraftState;
use crate::generate::generate_video_v2::providers::kinovi::happy_horse_1p0::request::KinoviHappyHorse1p0RequestState;

pub struct KinoviHappyHorse1p0CostState {
  pub resolution: Option<KinoviHappyHorse1p0OutputResolution>,
  pub duration_seconds: u8,
  pub batch_count: Option<KinoviHappyHorse1p0BatchCount>,
}

impl KinoviHappyHorse1p0CostState {
  pub fn from_request(request: &KinoviHappyHorse1p0RequestState) -> Self {
    Self {
      resolution: request.request.output_resolution,
      duration_seconds: request.request.duration_seconds,
      batch_count: request.request.batch_count,
    }
  }

  pub fn from_draft(draft: &KinoviHappyHorse1p0DraftState) -> Self {
    Self {
      resolution: draft.resolution,
      duration_seconds: draft.duration_seconds,
      batch_count: draft.batch_count,
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let pricing_request = GenerateHappyHorse1p0Request {
      output_resolution: self.resolution,
      duration_seconds: self.duration_seconds,
      batch_count: self.batch_count,

      // No impact on price
      prompt: String::new(),
      aspect_ratio: None,
      start_frame_url: None,
    };

    let cost_in_credits = pricing_request.estimate_credits();
    let cost_in_usd_cents = pricing_request.estimate_cost_in_usd_cents();

    VideoGenerationCostEstimate {
      cost_in_credits: Some(cost_in_credits as u64),
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
  use crate::api::common_resolution::CommonResolution;
  use crate::api::provider::Provider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video_v2::video_generation_draft::VideoGenerationDraftRequest;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;

  // ── 720p pricing (33 credits/sec) ──

  mod pricing_720p {
    use super::*;

    #[test]
    fn credits_720p_every_duration() {
      assert_eq!(credits(None, 3), 99);
      assert_eq!(credits(None, 4), 132);
      assert_eq!(credits(None, 5), 165);
      assert_eq!(credits(None, 6), 198);
      assert_eq!(credits(None, 7), 231);
      assert_eq!(credits(None, 8), 264);
      assert_eq!(credits(None, 9), 297);
      assert_eq!(credits(None, 10), 330);
      assert_eq!(credits(None, 11), 363);
      assert_eq!(credits(None, 12), 396);
      assert_eq!(credits(None, 13), 429);
      assert_eq!(credits(None, 14), 462);
      assert_eq!(credits(None, 15), 495);
    }

    #[test]
    fn explicit_720p_same_as_default() {
      let default = credits(None, 5);
      let explicit = credits(Some(KinoviHappyHorse1p0OutputResolution::SevenTwentyP), 5);
      assert_eq!(default, explicit);
    }

    #[test]
    fn usd_cents_720p() {
      // 165 credits / 193 * 100 = 85.49 → 85¢
      assert_eq!(usd_cents(None, 5, None), 85);
      // 495 credits / 193 * 100 = 256.48 → 256¢
      assert_eq!(usd_cents(None, 15, None), 256);
    }
  }

  // ── 1080p pricing (66 credits/sec) ──

  mod pricing_1080p {
    use super::*;

    #[test]
    fn credits_1080p_every_duration() {
      let r = Some(KinoviHappyHorse1p0OutputResolution::TenEightyP);
      assert_eq!(credits(r, 3), 198);
      assert_eq!(credits(r, 4), 264);
      assert_eq!(credits(r, 5), 330);
      assert_eq!(credits(r, 6), 396);
      assert_eq!(credits(r, 7), 462);
      assert_eq!(credits(r, 8), 528);
      assert_eq!(credits(r, 9), 594);
      assert_eq!(credits(r, 10), 660);
      assert_eq!(credits(r, 11), 726);
      assert_eq!(credits(r, 12), 792);
      assert_eq!(credits(r, 13), 858);
      assert_eq!(credits(r, 14), 924);
      assert_eq!(credits(r, 15), 990);
    }

    #[test]
    fn usd_cents_1080p() {
      let r = Some(KinoviHappyHorse1p0OutputResolution::TenEightyP);
      // 330 credits / 193 * 100 = 170.98 → 171¢
      assert_eq!(usd_cents(r, 5, None), 171);
      // 990 credits / 193 * 100 = 512.95 → 513¢
      assert_eq!(usd_cents(r, 15, None), 513);
    }
  }

  // ── Batch multiplier ──

  mod batch_tests {
    use super::*;

    #[test]
    fn batch_2_doubles_credits() {
      let base = credits(None, 5);
      let batch2 = credits_with_batch(None, 5, Some(KinoviHappyHorse1p0BatchCount::Two));
      assert_eq!(batch2, base * 2);
    }

    #[test]
    fn batch_4_quadruples_credits() {
      let base = credits(None, 5);
      let batch4 = credits_with_batch(None, 5, Some(KinoviHappyHorse1p0BatchCount::Four));
      assert_eq!(batch4, base * 4);
    }

    #[test]
    fn batch_applies_to_1080p() {
      let r = Some(KinoviHappyHorse1p0OutputResolution::TenEightyP);
      let base = credits(r, 5);
      let batch4 = credits_with_batch(r, 5, Some(KinoviHappyHorse1p0BatchCount::Four));
      assert_eq!(batch4, base * 4);
    }
  }

  // ── Relative pricing ──

  mod relative_pricing {
    use super::*;

    #[test]
    fn r1080p_is_double_720p() {
      for dur in 3..=15u8 {
        let c720 = credits(None, dur);
        let c1080 = credits(Some(KinoviHappyHorse1p0OutputResolution::TenEightyP), dur);
        assert_eq!(c1080, c720 * 2, "1080p should be 2× 720p at {}s", dur);
      }
    }

    #[test]
    fn cost_scales_with_duration() {
      let c3 = credits(None, 3);
      let c10 = credits(None, 10);
      let c15 = credits(None, 15);
      assert!(c3 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn not_free() {
      let est = KinoviHappyHorse1p0CostState {
        resolution: None, duration_seconds: 5, batch_count: None,
      }.estimate_cost();
      assert!(!est.is_free);
    }
  }

  // ── from_draft() ──

  mod from_draft_tests {
    use super::*;

    #[test]
    fn from_draft_720p_default() {
      let draft = make_draft(5, 1, None);
      let cost = KinoviHappyHorse1p0CostState::from_draft(&draft);
      assert_eq!(cost.duration_seconds, 5);
      assert_eq!(cost.estimate_cost().cost_in_credits, Some(165));
    }

    #[test]
    fn from_draft_1080p_batch_4() {
      let draft = make_draft(5, 4, Some(CommonResolution::TenEightyP));
      let cost = KinoviHappyHorse1p0CostState::from_draft(&draft);
      assert_eq!(cost.estimate_cost().cost_in_credits, Some(330 * 4));
    }
  }

  // ── from_request() ──

  mod from_request_tests {
    use super::*;

    #[test]
    fn from_request_default() {
      let req = make_request_state(None, 5, None);
      let cost = KinoviHappyHorse1p0CostState::from_request(&req);
      assert_eq!(cost.estimate_cost().cost_in_credits, Some(165));
    }

    #[test]
    fn from_request_1080p() {
      let req = make_request_state(
        Some(KinoviHappyHorse1p0OutputResolution::TenEightyP), 5, None,
      );
      let cost = KinoviHappyHorse1p0CostState::from_request(&req);
      assert_eq!(cost.estimate_cost().cost_in_credits, Some(330));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(171));
    }
  }

  // ── Cross-check: draft matches request ──

  mod cross_check {
    use super::*;

    #[test]
    fn draft_and_request_produce_same_cost() {
      let draft = make_draft(5, 1, Some(CommonResolution::SevenTwentyP));
      let req = make_request_state(
        Some(KinoviHappyHorse1p0OutputResolution::SevenTwentyP), 5, None,
      );
      let draft_cost = KinoviHappyHorse1p0CostState::from_draft(&draft).estimate_cost();
      let req_cost = KinoviHappyHorse1p0CostState::from_request(&req).estimate_cost();
      assert_eq!(draft_cost.cost_in_usd_cents, req_cost.cost_in_usd_cents);
      assert_eq!(draft_cost.cost_in_credits, req_cost.cost_in_credits);
    }

    #[test]
    fn draft_and_request_produce_same_cost_1080p_batch_2() {
      let draft = make_draft(10, 2, Some(CommonResolution::TenEightyP));
      let req = make_request_state(
        Some(KinoviHappyHorse1p0OutputResolution::TenEightyP), 10,
        Some(KinoviHappyHorse1p0BatchCount::Two),
      );
      let draft_cost = KinoviHappyHorse1p0CostState::from_draft(&draft).estimate_cost();
      let req_cost = KinoviHappyHorse1p0CostState::from_request(&req).estimate_cost();
      assert_eq!(draft_cost.cost_in_usd_cents, req_cost.cost_in_usd_cents);
      assert_eq!(draft_cost.cost_in_credits, req_cost.cost_in_credits);
    }
  }

  // ── Helpers ──

  fn credits(
    resolution: Option<KinoviHappyHorse1p0OutputResolution>,
    duration_seconds: u8,
  ) -> u64 {
    credits_with_batch(resolution, duration_seconds, None)
  }

  fn credits_with_batch(
    resolution: Option<KinoviHappyHorse1p0OutputResolution>,
    duration_seconds: u8,
    batch_count: Option<KinoviHappyHorse1p0BatchCount>,
  ) -> u64 {
    KinoviHappyHorse1p0CostState { resolution, duration_seconds, batch_count }
      .estimate_cost()
      .cost_in_credits
      .unwrap()
  }

  fn usd_cents(
    resolution: Option<KinoviHappyHorse1p0OutputResolution>,
    duration_seconds: u8,
    batch_count: Option<KinoviHappyHorse1p0BatchCount>,
  ) -> u64 {
    KinoviHappyHorse1p0CostState { resolution, duration_seconds, batch_count }
      .estimate_cost()
      .cost_in_usd_cents
      .unwrap()
  }

  fn make_draft(
    duration_seconds: u16,
    video_batch_count: u16,
    resolution: Option<CommonResolution>,
  ) -> KinoviHappyHorse1p0DraftState {
    use crate::api::common_video_model::CommonVideoModel;
    let builder = GenerateVideoRequestBuilder {
      model: CommonVideoModel::HappyHorse1p0,
      provider: Provider::Seedance2Pro,
      resolution,
      duration_seconds: Some(duration_seconds),
      video_batch_count: Some(video_batch_count),
      ..Default::default()
    };

    match builder.build2().expect("build2 should succeed") {
      VideoGenerationDraftOrRequest::Draft(
        VideoGenerationDraftRequest::KinoviHappyHorse1p0(draft)
      ) => draft,
      _ => panic!("expected KinoviHappyHorse1p0 draft"),
    }
  }

  fn make_request_state(
    resolution: Option<KinoviHappyHorse1p0OutputResolution>,
    duration_seconds: u8,
    batch_count: Option<KinoviHappyHorse1p0BatchCount>,
  ) -> KinoviHappyHorse1p0RequestState {
    KinoviHappyHorse1p0RequestState {
      request: GenerateHappyHorse1p0Request {
        prompt: "test".to_string(),
        aspect_ratio: None,
        output_resolution: resolution,
        batch_count,
        duration_seconds,
        start_frame_url: None,
      },
    }
  }
}
