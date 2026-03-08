use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::webhook::video::text::enqueue_kling_3p0_pro_text_to_video_webhook::EnqueueKling3p0ProTextToVideoDuration;
use crate::requests::http::video::http_kling_3p0_pro_image_to_video::{kling_3p0_pro_image_to_video, Kling3p0ProImageToVideoInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueKling3p0ProImageToVideoArgs<'a, R: IntoUrl> {
  pub prompt: String,
  pub image_url: String,

  // Optional args
  pub end_image_url: Option<String>,
  pub generate_audio: Option<bool>,
  pub negative_prompt: Option<String>,
  pub duration: Option<EnqueueKling3p0ProTextToVideoDuration>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

impl <U: IntoUrl> FalRequestCostCalculator for EnqueueKling3p0ProImageToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Same pricing as text-to-video for Kling 3.0 Pro:
    //   Audio off: $0.224/second
    //   Audio on:  $0.336/second
    let generate_audio = self.generate_audio.unwrap_or(true);
    let duration_secs = self.duration
        .unwrap_or(EnqueueKling3p0ProTextToVideoDuration::FiveSeconds)
        .to_seconds();

    let rate = if generate_audio { 336u64 } else { 224u64 };
    (rate * duration_secs + 9) / 10
  }
}

/// Kling 3.0 Pro Image-to-Video
/// https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video
pub async fn enqueue_kling_3p0_pro_image_to_video_webhook<R: IntoUrl>(
  args: EnqueueKling3p0ProImageToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|d| d.to_str().to_string());

  let request = Kling3p0ProImageToVideoInput {
    prompt: args.prompt,
    image_url: args.image_url,
    end_image_url: args.end_image_url,
    aspect_ratio: None,
    generate_audio: args.generate_audio,
    duration,
    negative_prompt: args.negative_prompt,
    cfg_scale: None,
  };

  let result = kling_3p0_pro_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_cost_pro_i2v_audio_off_5s() {
    let api_key = FalApiKey::from_str("");
    let args = EnqueueKling3p0ProImageToVideoArgs {
      prompt: String::new(),
      image_url: String::new(),
      end_image_url: None,
      generate_audio: Some(false),
      negative_prompt: None,
      duration: Some(EnqueueKling3p0ProTextToVideoDuration::FiveSeconds),
      webhook_url: "https://example.com",
      api_key: &api_key,
    };
    // $0.224 * 5 = $1.12 = 112 cents
    assert_eq!(args.calculate_cost_in_cents(), 112);
  }

  #[test]
  fn test_cost_pro_i2v_audio_on_10s() {
    let api_key = FalApiKey::from_str("");
    let args = EnqueueKling3p0ProImageToVideoArgs {
      prompt: String::new(),
      image_url: String::new(),
      end_image_url: None,
      generate_audio: Some(true),
      negative_prompt: None,
      duration: Some(EnqueueKling3p0ProTextToVideoDuration::TenSeconds),
      webhook_url: "https://example.com",
      api_key: &api_key,
    };
    // $0.336 * 10 = $3.36 = 336 cents
    assert_eq!(args.calculate_cost_in_cents(), 336);
  }
}
