use seedance2pro_client::requests::generate_video::generate_video::{KinoviAspectRatio, KinoviBatchCount, KinoviGenerateVideoRequest, KinoviModelType, KinoviOutputResolution};
use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::draft::KinoviSeedance2p0DraftState;
use crate::generate::generate_video_v2::providers::kinovi::seedance_2p0::request::KinoviSeedance2p0RequestState;

pub struct KinoviSeedance2p0CostState {
  pub resolution: KinoviOutputResolution,
  pub duration_seconds: u8,
  pub batch_count: KinoviBatchCount,
  pub has_video_reference: bool,
}

impl KinoviSeedance2p0CostState {
  pub fn from_request(request: &KinoviSeedance2p0RequestState) -> Self {
    Self {
      resolution: request.request.output_resolution.unwrap_or(KinoviOutputResolution::SevenTwentyP),
      duration_seconds: request.request.duration_seconds,
      batch_count: request.request.batch_count,
      has_video_reference: request.request.reference_video_urls.is_some(),
    }
  }

  pub fn from_draft(draft: &KinoviSeedance2p0DraftState) -> Self {
    Self {
      resolution: draft.resolution.unwrap_or(KinoviOutputResolution::SevenTwentyP),
      duration_seconds: draft.duration_seconds,
      batch_count: draft.batch_count,
      has_video_reference: draft.remaining_request
          .as_ref()
          .map(|rem| &rem.reference_videos)
          .is_some(),
    }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    let request = KinoviGenerateVideoRequest {
      // Pricing factors
      model_type: KinoviModelType::Seedance2Pro,
      output_resolution: Some(self.resolution),
      duration_seconds: self.duration_seconds,
      batch_count: self.batch_count,
      reference_video_urls: if self.has_video_reference {
        Some(vec!["https://example.com".to_string()])
      } else {
        None
      },
      // No impact on price
      prompt: "".to_string(),
      aspect_ratio: KinoviAspectRatio::Portrait9x16,
      start_frame_url: None,
      end_frame_url: None,
      reference_image_urls: None,
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
