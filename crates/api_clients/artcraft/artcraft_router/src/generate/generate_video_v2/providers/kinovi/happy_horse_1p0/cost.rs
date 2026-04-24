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

  fn cost_state(res: Option<KinoviOutputResolutionRaw>, dur: u8, batch: KinoviBatchCountRaw) -> KinoviHappyHorse1p0CostState {
    KinoviHappyHorse1p0CostState { resolution: res, duration_seconds: dur, batch_count: batch }
  }

  mod pricing {
    use super::*;

    #[test]
    fn default_720p_5s() {
      let est = cost_state(None, 5, KinoviBatchCountRaw::One).estimate_cost();
      assert_eq!(est.cost_in_credits, Some(200));
    }

    #[test]
    fn explicit_720p_5s() {
      let est = cost_state(Some(KinoviOutputResolutionRaw::SevenTwentyP), 5, KinoviBatchCountRaw::One).estimate_cost();
      assert_eq!(est.cost_in_credits, Some(200));
    }

    #[test]
    fn resolution_1080p_4s() {
      let est = cost_state(Some(KinoviOutputResolutionRaw::TenEightyP), 4, KinoviBatchCountRaw::One).estimate_cost();
      assert_eq!(est.cost_in_credits, Some(360));
    }

    #[test]
    fn batch_2_scales() {
      let est = cost_state(None, 5, KinoviBatchCountRaw::Two).estimate_cost();
      assert_eq!(est.cost_in_credits, Some(400));
    }

    #[test]
    fn batch_4_scales() {
      let est = cost_state(None, 5, KinoviBatchCountRaw::Four).estimate_cost();
      assert_eq!(est.cost_in_credits, Some(800));
    }

    #[test]
    fn cost_has_usd_cents() {
      let est = cost_state(None, 5, KinoviBatchCountRaw::One).estimate_cost();
      assert!(est.cost_in_usd_cents.is_some());
      assert!(est.cost_in_usd_cents.unwrap() > 0);
    }

    #[test]
    fn not_free() {
      let est = cost_state(None, 5, KinoviBatchCountRaw::One).estimate_cost();
      assert!(!est.is_free);
    }
  }
}
