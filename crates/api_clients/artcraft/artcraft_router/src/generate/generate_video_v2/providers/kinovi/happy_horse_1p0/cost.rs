use seedance2pro_client::requests::workflow_run_task::workflow_run_task::{
  KinoviAspectRatioRaw, KinoviBatchCountRaw, KinoviModelTypeRaw,
  KinoviOutputResolutionRaw, WorkflowRunTaskRequest,
};

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::kinovi::happy_horse_1p0::draft::KinoviHappyHorse1p0DraftState;
use crate::generate::generate_video_v2::providers::kinovi::happy_horse_1p0::request::KinoviHappyHorse1p0RequestState;

pub struct KinoviHappyHorse1p0CostState {
  pub resolution: Option<KinoviOutputResolutionRaw>,
  pub duration_seconds: u8,
  pub batch_count: KinoviBatchCountRaw,
}

impl KinoviHappyHorse1p0CostState {
  pub fn from_request(request: &KinoviHappyHorse1p0RequestState) -> Self {
    Self {
      resolution: request.request.output_resolution.map(map_output_resolution),
      duration_seconds: request.request.duration_seconds,
      batch_count: map_batch_count(request.request.batch_count),
    }
  }

  pub fn from_draft(draft: &KinoviHappyHorse1p0DraftState) -> Self {
    Self {
      resolution: draft.resolution.map(map_output_resolution),
      duration_seconds: draft.duration_seconds,
      batch_count: map_batch_count(draft.batch_count),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let raw_request = WorkflowRunTaskRequest {
      model_type: KinoviModelTypeRaw::HappyHorse1p0,
      output_resolution: self.resolution,
      duration_seconds: self.duration_seconds,
      batch_count: self.batch_count,

      // No impact on price
      prompt: String::new(),
      aspect_ratio: KinoviAspectRatioRaw::Landscape16x9,
      start_frame_url: None,
      end_frame_url: None,
      reference_image_urls: None,
      reference_video_urls: None,
      reference_audio_urls: None,
      character_ids: None,
      use_face_blur_hack: None,
    };

    let cost_in_credits = raw_request.estimate_credits();
    let cost_in_usd_cents = raw_request.estimate_cost_in_usd_cents();

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

// ── Mapping helpers ──

use seedance2pro_client::generate::video::generate_happy_horse_1p0::{
  KinoviHappyHorse1p0BatchCount, KinoviHappyHorse1p0OutputResolution,
};

fn map_output_resolution(res: KinoviHappyHorse1p0OutputResolution) -> KinoviOutputResolutionRaw {
  match res {
    KinoviHappyHorse1p0OutputResolution::SevenTwentyP => KinoviOutputResolutionRaw::SevenTwentyP,
    KinoviHappyHorse1p0OutputResolution::TenEightyP => KinoviOutputResolutionRaw::TenEightyP,
  }
}

fn map_batch_count(bc: Option<KinoviHappyHorse1p0BatchCount>) -> KinoviBatchCountRaw {
  match bc {
    None | Some(KinoviHappyHorse1p0BatchCount::One) => KinoviBatchCountRaw::One,
    Some(KinoviHappyHorse1p0BatchCount::Two) => KinoviBatchCountRaw::Two,
    Some(KinoviHappyHorse1p0BatchCount::Four) => KinoviBatchCountRaw::Four,
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

  // ── 720p pricing ──

  mod pricing_720p {
    use super::*;

    #[test]
    fn cost_720p_batch_1() {
      assert_eq!(usd_cents(Some(KinoviOutputResolutionRaw::SevenTwentyP), 4, KinoviBatchCountRaw::One), 83);
      assert_eq!(usd_cents(Some(KinoviOutputResolutionRaw::SevenTwentyP), 5, KinoviBatchCountRaw::One), 104);
      assert_eq!(usd_cents(Some(KinoviOutputResolutionRaw::SevenTwentyP), 10, KinoviBatchCountRaw::One), 207);
      assert_eq!(usd_cents(Some(KinoviOutputResolutionRaw::SevenTwentyP), 15, KinoviBatchCountRaw::One), 311);
    }

    #[test]
    fn cost_720p_batch_2() {
      assert_eq!(usd_cents(Some(KinoviOutputResolutionRaw::SevenTwentyP), 5, KinoviBatchCountRaw::Two), 207);
    }

    #[test]
    fn cost_720p_batch_4() {
      assert_eq!(usd_cents(Some(KinoviOutputResolutionRaw::SevenTwentyP), 5, KinoviBatchCountRaw::Four), 415);
    }

    #[test]
    fn default_resolution_same_as_720p() {
      let default = usd_cents(None, 5, KinoviBatchCountRaw::One);
      let explicit = usd_cents(Some(KinoviOutputResolutionRaw::SevenTwentyP), 5, KinoviBatchCountRaw::One);
      assert_eq!(default, explicit);
    }
  }

  // ── 1080p pricing ──

  mod pricing_1080p {
    use super::*;

    #[test]
    fn cost_1080p_batch_1() {
      assert_eq!(usd_cents(Some(KinoviOutputResolutionRaw::TenEightyP), 4, KinoviBatchCountRaw::One), 187);
      assert_eq!(usd_cents(Some(KinoviOutputResolutionRaw::TenEightyP), 5, KinoviBatchCountRaw::One), 233);
      assert_eq!(usd_cents(Some(KinoviOutputResolutionRaw::TenEightyP), 10, KinoviBatchCountRaw::One), 466);
      assert_eq!(usd_cents(Some(KinoviOutputResolutionRaw::TenEightyP), 15, KinoviBatchCountRaw::One), 699);
    }

    #[test]
    fn cost_1080p_batch_2() {
      assert_eq!(usd_cents(Some(KinoviOutputResolutionRaw::TenEightyP), 5, KinoviBatchCountRaw::Two), 466);
    }

    #[test]
    fn cost_1080p_batch_4() {
      assert_eq!(usd_cents(Some(KinoviOutputResolutionRaw::TenEightyP), 5, KinoviBatchCountRaw::Four), 933);
    }
  }

  // ── Relative pricing ──

  mod relative_pricing {
    use super::*;

    #[test]
    fn cost_720p_cheaper_than_1080p() {
      let c720 = usd_cents(Some(KinoviOutputResolutionRaw::SevenTwentyP), 5, KinoviBatchCountRaw::One);
      let c1080 = usd_cents(Some(KinoviOutputResolutionRaw::TenEightyP), 5, KinoviBatchCountRaw::One);
      assert!(c720 < c1080, "720p ({}) should be cheaper than 1080p ({})", c720, c1080);
    }

    #[test]
    fn cost_scales_with_duration() {
      let c4 = usd_cents(None, 4, KinoviBatchCountRaw::One);
      let c10 = usd_cents(None, 10, KinoviBatchCountRaw::One);
      let c15 = usd_cents(None, 15, KinoviBatchCountRaw::One);
      assert!(c4 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn cost_scales_with_batch() {
      let b1 = usd_cents(None, 5, KinoviBatchCountRaw::One);
      let b2 = usd_cents(None, 5, KinoviBatchCountRaw::Two);
      let b4 = usd_cents(None, 5, KinoviBatchCountRaw::Four);
      assert!(b1 < b2);
      assert!(b2 < b4);
    }

    #[test]
    fn not_free() {
      let est = KinoviHappyHorse1p0CostState {
        resolution: None, duration_seconds: 5, batch_count: KinoviBatchCountRaw::One,
      }.estimate_cost();
      assert!(!est.is_free);
    }
  }

  // ── from_draft() tests ──

  mod from_draft_tests {
    use super::*;

    #[test]
    fn from_draft_720p_default() {
      let draft = make_draft(5, 1, None);
      let cost = KinoviHappyHorse1p0CostState::from_draft(&draft);
      assert!(cost.resolution.is_none());
      assert_eq!(cost.duration_seconds, 5);
      assert!(matches!(cost.batch_count, KinoviBatchCountRaw::One));
    }

    #[test]
    fn from_draft_1080p_batch_4() {
      let draft = make_draft(5, 4, Some(CommonResolution::TenEightyP));
      let cost = KinoviHappyHorse1p0CostState::from_draft(&draft);
      assert!(matches!(cost.resolution, Some(KinoviOutputResolutionRaw::TenEightyP)));
      assert!(matches!(cost.batch_count, KinoviBatchCountRaw::Four));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(933));
    }
  }

  // ── from_request() tests ──

  mod from_request_tests {
    use super::*;

    #[test]
    fn from_request_default() {
      let req = make_request_state(None, 5, None);
      let cost = KinoviHappyHorse1p0CostState::from_request(&req);
      assert!(cost.resolution.is_none());
      assert_eq!(cost.duration_seconds, 5);
      assert!(matches!(cost.batch_count, KinoviBatchCountRaw::One));
    }

    #[test]
    fn from_request_1080p() {
      let req = make_request_state(
        Some(KinoviHappyHorse1p0OutputResolution::TenEightyP), 5, None,
      );
      let cost = KinoviHappyHorse1p0CostState::from_request(&req);
      assert!(matches!(cost.resolution, Some(KinoviOutputResolutionRaw::TenEightyP)));
      assert_eq!(cost.estimate_cost().cost_in_usd_cents, Some(233));
    }
  }

  // ── Cross-check: from_draft matches from_request ──

  mod cross_check {
    use super::*;

    #[test]
    fn draft_and_request_produce_same_cost_720p() {
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
    fn draft_and_request_produce_same_cost_1080p() {
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

  // ── Credits spot checks ──

  mod credits {
    use super::*;

    #[test]
    fn credits_720p() {
      let est = KinoviHappyHorse1p0CostState {
        resolution: Some(KinoviOutputResolutionRaw::SevenTwentyP),
        duration_seconds: 5,
        batch_count: KinoviBatchCountRaw::One,
      }.estimate_cost();
      assert_eq!(est.cost_in_credits, Some(200));
    }

    #[test]
    fn credits_1080p() {
      let est = KinoviHappyHorse1p0CostState {
        resolution: Some(KinoviOutputResolutionRaw::TenEightyP),
        duration_seconds: 5,
        batch_count: KinoviBatchCountRaw::One,
      }.estimate_cost();
      assert_eq!(est.cost_in_credits, Some(450));
    }
  }

  // ── Helpers ──

  fn usd_cents(
    resolution: Option<KinoviOutputResolutionRaw>,
    duration_seconds: u8,
    batch_count: KinoviBatchCountRaw,
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
      request: seedance2pro_client::generate::video::generate_happy_horse_1p0::GenerateHappyHorse1p0Request {
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
