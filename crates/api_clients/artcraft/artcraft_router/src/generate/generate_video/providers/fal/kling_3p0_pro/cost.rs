use fal_client::requests_old::webhook::video::image::enqueue_kling_3p0_pro_image_to_video_webhook::EnqueueKling3p0ProImageToVideoDuration;
use fal_client::requests_old::webhook::video::text::enqueue_kling_3p0_pro_text_to_video_webhook::EnqueueKling3p0ProTextToVideoDuration;

use crate::generate::generate_video::video_generation_cost_estimate::VideoGenerationCostEstimate;
use crate::generate::generate_video::providers::fal::kling_3p0_pro::request::{
  FalKling3p0ProMode, FalKling3p0ProRequestState,
};

#[derive(Clone, Debug)]
pub struct FalKling3p0ProCostState {
  pub duration_seconds: u64,
  pub generate_audio: bool,
}

impl FalKling3p0ProCostState {
  pub fn from_request(request: &FalKling3p0ProRequestState) -> Self {
    let (duration_seconds, generate_audio) = match &request.mode {
      FalKling3p0ProMode::TextToVideo(req) => (
        t2v_duration_seconds(req.duration),
        req.generate_audio.unwrap_or(true),
      ),
      FalKling3p0ProMode::ImageToVideo(req) => (
        i2v_duration_seconds(req.duration),
        req.generate_audio.unwrap_or(true),
      ),
    };
    Self { duration_seconds, generate_audio }
  }

  pub fn estimate_cost(&self) -> VideoGenerationCostEstimate {
    // Mirrors fal_client kling_3p0_pro:
    //   audio off: $0.224/sec  (rate=224 in tenths-of-cents)
    //   audio on:  $0.336/sec  (rate=336)
    // ceiling-divided to whole cents.
    let rate: u64 = if self.generate_audio { 336 } else { 224 };
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
fn t2v_duration_seconds(d: Option<EnqueueKling3p0ProTextToVideoDuration>) -> u64 {
  use EnqueueKling3p0ProTextToVideoDuration as D;
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

fn i2v_duration_seconds(d: Option<EnqueueKling3p0ProImageToVideoDuration>) -> u64 {
  use EnqueueKling3p0ProImageToVideoDuration as D;
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
      model: RouterVideoModel::Kling3p0Pro,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      duration_seconds,
      generate_audio,
      ..Default::default()
    };
    b.build2().unwrap().estimate_cost().unwrap().cost_in_usd_cents.unwrap()
  }

  #[test]
  fn audio_on_5s_is_168() {
    // rate=336, (336*5 + 9) / 10 = 1689/10 = 168.
    assert_eq!(cost_cents(Some(5), Some(true)), 168);
  }

  #[test]
  fn audio_off_5s_is_112() {
    // rate=224, (224*5 + 9) / 10 = 1129/10 = 112.
    assert_eq!(cost_cents(Some(5), Some(false)), 112);
  }

  #[test]
  fn audio_on_10s_is_336() {
    assert_eq!(cost_cents(Some(10), Some(true)), 336);
  }

  #[test]
  fn audio_off_15s_is_336() {
    // rate=224, (224*15 + 9) / 10 = 3369/10 = 336.
    assert_eq!(cost_cents(Some(15), Some(false)), 336);
  }

  #[test]
  fn default_duration_is_5s() {
    assert_eq!(cost_cents(None, Some(true)), cost_cents(Some(5), Some(true)));
  }
}
