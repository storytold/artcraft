use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::webhook::video::text::enqueue_kling_v3_standard_text_to_video_webhook::EnqueueKlingV3StandardTextToVideoDuration;
use fal::endpoints::fal_ai::kling_video::v3::kling_v3_standard_image_to_video::{kling_v3_standard_image_to_video, KlingV3StandardImageToVideoInput};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueKlingV3StandardImageToVideoArgs<'a, R: IntoUrl> {
  pub prompt: String,
  pub image_url: String,

  // Optional args
  pub end_image_url: Option<String>,
  pub generate_audio: Option<bool>,
  pub negative_prompt: Option<String>,
  pub duration: Option<EnqueueKlingV3StandardTextToVideoDuration>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

impl <U: IntoUrl> FalRequestCostCalculator for EnqueueKlingV3StandardImageToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Same pricing as text-to-video for Kling 3.0 Standard:
    //   Audio off: $0.168/second
    //   Audio on:  $0.252/second
    let generate_audio = self.generate_audio.unwrap_or(true);
    let duration_secs = self.duration
        .unwrap_or(EnqueueKlingV3StandardTextToVideoDuration::FiveSeconds)
        .to_seconds();

    let rate = if generate_audio { 252u64 } else { 168u64 };
    (rate * duration_secs + 9) / 10
  }
}

/// Kling 3.0 Standard Image-to-Video
/// https://fal.ai/models/fal-ai/kling-video/v3/standard/image-to-video
pub async fn enqueue_kling_v3_standard_image_to_video_webhook<R: IntoUrl>(
  args: EnqueueKlingV3StandardImageToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|d| d.to_str().to_string());

  let request = KlingV3StandardImageToVideoInput {
    prompt: args.prompt,
    image_url: args.image_url,
    end_image_url: args.end_image_url,
    aspect_ratio: None, // Not applicable for image-to-video
    generate_audio: args.generate_audio,
    duration,
    negative_prompt: args.negative_prompt,
    cfg_scale: None,
  };

  let result = kling_v3_standard_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_cost_standard_i2v_audio_off_5s() {
    let api_key = FalApiKey::from_str("");
    let args = EnqueueKlingV3StandardImageToVideoArgs {
      prompt: String::new(),
      image_url: String::new(),
      end_image_url: None,
      generate_audio: Some(false),
      negative_prompt: None,
      duration: Some(EnqueueKlingV3StandardTextToVideoDuration::FiveSeconds),
      webhook_url: "https://example.com",
      api_key: &api_key,
    };
    assert_eq!(args.calculate_cost_in_cents(), 84);
  }

  #[test]
  fn test_cost_standard_i2v_audio_on_10s() {
    let api_key = FalApiKey::from_str("");
    let args = EnqueueKlingV3StandardImageToVideoArgs {
      prompt: String::new(),
      image_url: String::new(),
      end_image_url: None,
      generate_audio: Some(true),
      negative_prompt: None,
      duration: Some(EnqueueKlingV3StandardTextToVideoDuration::TenSeconds),
      webhook_url: "https://example.com",
      api_key: &api_key,
    };
    // $0.252 * 10 = $2.52 = 252 cents
    assert_eq!(args.calculate_cost_in_cents(), 252);
  }
}
