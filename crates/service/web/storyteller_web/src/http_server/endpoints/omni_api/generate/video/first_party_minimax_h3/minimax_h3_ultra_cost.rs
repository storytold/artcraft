//! Pricing for first-party Minimax H3 Ultra.
//!
//! TODO(2026-08-06): Placeholder rates copied from the existing Minimax H3
//! pricing. Finalize once first-party GPU inference costs are known.

use artcraft_api_defs::omni_api::generate_requests::omni_api_video_generate_request::OmniApiVideoGenerateRequest;
use enums::common::generation::common_resolution::CommonResolution;

/// Per-second rates in hundredths of a US cent.
const LOW_RES_RATE_HUNDREDTH_CENTS_PER_SEC: u64 = 1_840;
const HIGH_RES_RATE_HUNDREDTH_CENTS_PER_SEC: u64 = 2_990;

/// Minimax H3 defaults None → 5s.
const DEFAULT_DURATION_SECONDS: u64 = 5;

/// Estimate the user-facing Minimax H3 Ultra cost in USD cents.
/// System credits = cents (same convention as the v2 pipeline).
pub fn estimate_minimax_h3_ultra_cost_usd_cents(request: &OmniApiVideoGenerateRequest) -> u64 {
  let duration_seconds = request.duration_seconds
    .map(u64::from)
    .unwrap_or(DEFAULT_DURATION_SECONDS);

  let rate = if is_2k(request.resolution) {
    HIGH_RES_RATE_HUNDREDTH_CENTS_PER_SEC
  } else {
    LOW_RES_RATE_HUNDREDTH_CENTS_PER_SEC
  };

  // Round up to the next whole cent.
  (rate * duration_seconds).div_ceil(100)
}

/// Minimax H3 renders 768P or 2K; 1080p and above land on the 2K tier, while
/// 720p and below render at 768P. The default (unset) resolution is 2K.
fn is_2k(resolution: Option<CommonResolution>) -> bool {
  match resolution {
    None => true, // defaults to 2K
    Some(CommonResolution::TenEightyP)
    | Some(CommonResolution::OneK)
    | Some(CommonResolution::TwoK)
    | Some(CommonResolution::ThreeK)
    | Some(CommonResolution::FourK) => true,
    Some(CommonResolution::HalfK)
    | Some(CommonResolution::FourEightyP)
    | Some(CommonResolution::SevenTwentyP) => false,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn default_resolution_5s_is_150() {
    assert_eq!(cost_cents(None, None), 150);
  }

  #[test]
  fn low_res_5s_is_92() {
    assert_eq!(cost_cents(Some(5), Some(CommonResolution::SevenTwentyP)), 92);
  }

  #[test]
  fn high_res_10s_is_299() {
    assert_eq!(cost_cents(Some(10), Some(CommonResolution::TenEightyP)), 299);
  }

  #[test]
  fn odd_duration_rounds_up_to_whole_cents() {
    // 7s high res: 2990 × 7 = 20930 hundredth-cents → 210 cents.
    assert_eq!(cost_cents(Some(7), None), 210);
  }

  fn cost_cents(duration_seconds: Option<u16>, resolution: Option<CommonResolution>) -> u64 {
    let request = OmniApiVideoGenerateRequest {
      idempotency_token: None,
      model: None,
      prompt: None,
      negative_prompt: None,
      start_frame_image_media_token: None,
      start_frame_image_url: None,
      end_frame_image_media_token: None,
      end_frame_image_url: None,
      reference_image_media_tokens: None,
      reference_image_urls: None,
      reference_video_media_tokens: None,
      reference_video_urls: None,
      reference_audio_media_tokens: None,
      reference_audio_urls: None,
      reference_character_tokens: None,
      resolution,
      aspect_ratio: None,
      bitrate: None,
      quality: None,
      duration_seconds,
      video_batch_count: None,
      generate_audio: None,
    };
    estimate_minimax_h3_ultra_cost_usd_cents(&request)
  }
}
