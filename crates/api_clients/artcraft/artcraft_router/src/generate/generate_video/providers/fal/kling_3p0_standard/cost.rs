use fal_client::requests::webhook::video::image::enqueue_kling_3p0_standard_image_to_video_webhook::EnqueueKling3p0StandardImageToVideoDuration;
use fal_client::requests::webhook::video::text::enqueue_kling_3p0_standard_text_to_video_webhook::EnqueueKling3p0StandardTextToVideoDuration;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::fal::kling_3p0_standard::request::{
  FalKling3p0StandardMode, FalKling3p0StandardRequestState,
};

#[derive(Clone, Debug)]
pub struct FalKling3p0StandardCostState {
  pub duration_seconds: u64,
  pub generate_audio: bool,
}

impl FalKling3p0StandardCostState {
  pub fn from_request(request: &FalKling3p0StandardRequestState) -> Self {
    let (duration_seconds, generate_audio) = match &request.mode {
      FalKling3p0StandardMode::TextToVideo(req) => (
        t2v_duration_seconds(req.duration),
        req.generate_audio.unwrap_or(true),
      ),
      FalKling3p0StandardMode::ImageToVideo(req) => (
        i2v_duration_seconds(req.duration),
        req.generate_audio.unwrap_or(true),
      ),
    };
    Self { duration_seconds, generate_audio }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Mirrors fal_client kling_3p0_standard:
    //   audio off: $0.168/sec  (rate=168)
    //   audio on:  $0.252/sec  (rate=252)
    let rate: u64 = if self.generate_audio { 252 } else { 168 };
    let cost_in_usd_cents = (rate * self.duration_seconds + 9) / 10;

    VideoGenerationCostEstimate {
      cost_in_credits: Some(cost_in_usd_cents),
      cost_in_usd_cents: Some(cost_in_usd_cents),
      is_free: false,
      is_unlimited: false,
      is_rate_limited: false,
      has_watermark: false,
      failures_are_refunded: None,
    }
  }
}

/// Default duration is 5s when None per Fal client.
fn t2v_duration_seconds(d: Option<EnqueueKling3p0StandardTextToVideoDuration>) -> u64 {
  use EnqueueKling3p0StandardTextToVideoDuration as D;
  match d {
    None => 5,
    Some(D::ThreeSeconds) => 3,
    Some(D::FourSeconds) => 4,
    Some(D::FiveSeconds) => 5,
    Some(D::SixSeconds) => 6,
    Some(D::SevenSeconds) => 7,
    Some(D::EightSeconds) => 8,
    Some(D::NineSeconds) => 9,
    Some(D::TenSeconds) => 10,
    Some(D::ElevenSeconds) => 11,
    Some(D::TwelveSeconds) => 12,
    Some(D::ThirteenSeconds) => 13,
    Some(D::FourteenSeconds) => 14,
    Some(D::FifteenSeconds) => 15,
  }
}

fn i2v_duration_seconds(d: Option<EnqueueKling3p0StandardImageToVideoDuration>) -> u64 {
  use EnqueueKling3p0StandardImageToVideoDuration as D;
  match d {
    None => 5,
    Some(D::ThreeSeconds) => 3,
    Some(D::FourSeconds) => 4,
    Some(D::FiveSeconds) => 5,
    Some(D::SixSeconds) => 6,
    Some(D::SevenSeconds) => 7,
    Some(D::EightSeconds) => 8,
    Some(D::NineSeconds) => 9,
    Some(D::TenSeconds) => 10,
    Some(D::ElevenSeconds) => 11,
    Some(D::TwelveSeconds) => 12,
    Some(D::ThirteenSeconds) => 13,
    Some(D::FourteenSeconds) => 14,
    Some(D::FifteenSeconds) => 15,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

  fn cost_cents(duration_seconds: Option<u16>, generate_audio: Option<bool>) -> u64 {
    let b = GenerateVideoRequestBuilder {
      model: RouterVideoModel::Kling3p0Standard,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      generate_audio,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn audio_on_5s_is_126() {
    // rate=252, (252*5 + 9) / 10 = 1269/10 = 126.
    assert_eq!(cost_cents(Some(5), Some(true)), 126);
  }

  #[test]
  fn audio_off_5s_is_84() {
    // rate=168, (168*5 + 9) / 10 = 849/10 = 84.
    assert_eq!(cost_cents(Some(5), Some(false)), 84);
  }

  #[test]
  fn audio_on_10s_is_252() {
    assert_eq!(cost_cents(Some(10), Some(true)), 252);
  }

  #[test]
  fn audio_off_15s_is_252() {
    // (168*15 + 9) / 10 = 2529/10 = 252.
    assert_eq!(cost_cents(Some(15), Some(false)), 252);
  }
}
