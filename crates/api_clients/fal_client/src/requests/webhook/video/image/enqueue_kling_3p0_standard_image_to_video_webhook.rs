use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::webhook::video::text::enqueue_kling_3p0_standard_text_to_video_webhook::EnqueueKling3p0StandardTextToVideoDuration;
use crate::requests::http::video::http_kling_3p0_standard_image_to_video::{kling_3p0_standard_image_to_video, Kling3p0StandardImageToVideoInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueKling3p0StandardImageToVideoArgs<'a, R: IntoUrl> {
  pub prompt: String,
  pub image_url: String,

  // Optional args
  pub end_image_url: Option<String>,
  pub generate_audio: Option<bool>,
  pub negative_prompt: Option<String>,
  pub duration: Option<EnqueueKling3p0StandardTextToVideoDuration>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

impl <U: IntoUrl> FalRequestCostCalculator for EnqueueKling3p0StandardImageToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Same pricing as text-to-video for Kling 3.0 Standard:
    //   Audio off: $0.168/second
    //   Audio on:  $0.252/second
    let generate_audio = self.generate_audio.unwrap_or(true);
    let duration_secs = self.duration
        .unwrap_or(EnqueueKling3p0StandardTextToVideoDuration::FiveSeconds)
        .to_seconds();

    let rate = if generate_audio { 252u64 } else { 168u64 };
    (rate * duration_secs + 9) / 10
  }
}

/// Kling 3.0 Standard Image-to-Video
/// https://fal.ai/models/fal-ai/kling-video/v3/standard/image-to-video
pub async fn enqueue_kling_3p0_standard_image_to_video_webhook<R: IntoUrl>(
  args: EnqueueKling3p0StandardImageToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|d| d.to_str().to_string());

  let request = Kling3p0StandardImageToVideoInput {
    prompt: args.prompt,
    image_url: args.image_url,
    end_image_url: args.end_image_url,
    aspect_ratio: None, // Not applicable for image-to-video
    generate_audio: args.generate_audio,
    duration,
    negative_prompt: args.negative_prompt,
    cfg_scale: None,
  };

  let result = kling_3p0_standard_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use strum::IntoEnumIterator;
  use test_data::web::image_urls::TREX_SKELETON_IMAGE_URL;

  #[test]
  fn test_cost() {
    let api_key = FalApiKey::from_str("");

    let mut args = EnqueueKling3p0StandardImageToVideoArgs {
      prompt: "the t-rex skeleton comes alive and roars".to_string(),
      image_url: TREX_SKELETON_IMAGE_URL.to_string(),
      end_image_url: None,
      generate_audio: Some(false),
      negative_prompt: None,
      duration: Some(EnqueueKling3p0StandardTextToVideoDuration::FiveSeconds),
      webhook_url: "https://example.com/webhook",
      api_key: &api_key,
    };

    // Audio off: $0.168/sec
    // 5s: (168 * 5 + 9) / 10 = 849 / 10 = 84
    assert_eq!(args.calculate_cost_in_cents(), 84);

    // 10s: (168 * 10 + 9) / 10 = 1689 / 10 = 168
    args.duration = Some(EnqueueKling3p0StandardTextToVideoDuration::TenSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 168);

    // 15s: (168 * 15 + 9) / 10 = 2529 / 10 = 252
    args.duration = Some(EnqueueKling3p0StandardTextToVideoDuration::FifteenSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 252);

    // Audio on: $0.252/sec
    args.generate_audio = Some(true);

    // 5s: (252 * 5 + 9) / 10 = 1269 / 10 = 126
    args.duration = Some(EnqueueKling3p0StandardTextToVideoDuration::FiveSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 126);

    // 10s: (252 * 10 + 9) / 10 = 2529 / 10 = 252
    args.duration = Some(EnqueueKling3p0StandardTextToVideoDuration::TenSeconds);
    assert_eq!(args.calculate_cost_in_cents(), 252);
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueKling3p0StandardImageToVideoArgs {
      image_url: TREX_SKELETON_IMAGE_URL.to_string(),
      prompt: "the t-rex skeleton gets off the podium and begins walking toward the camera".to_string(),
      duration: Some(EnqueueKling3p0StandardTextToVideoDuration::FiveSeconds),
      generate_audio: Some(true),
      negative_prompt: None,
      end_image_url: None,
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_kling_3p0_standard_image_to_video_webhook(args).await?;
    println!("result: {:?}", result);

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_durations() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for dur in EnqueueKling3p0StandardTextToVideoDuration::iter() {
      println!("--- duration: {:?} ---", dur);
      let args = EnqueueKling3p0StandardImageToVideoArgs {
        image_url: TREX_SKELETON_IMAGE_URL.to_string(),
        prompt: "the skeleton slowly turns its head and opens its jaw".to_string(),
        duration: Some(dur),
        generate_audio: Some(false),
        negative_prompt: None,
        end_image_url: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_kling_3p0_standard_image_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }
}
