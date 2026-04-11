use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::webhook_response::WebhookResponse;
use crate::requests::http::video::text::http_veo_3_text_to_video::{
  veo_3_text_to_video, Veo3TextToVideoInput,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{
  FalRequestCostCalculator, UsdCents,
};
use reqwest::IntoUrl;

pub struct Veo3TextToVideoArgs<'a, V: IntoUrl> {
  pub prompt: &'a str,
  pub negative_prompt: Option<&'a str>,
  pub duration: Veo3T2vDuration,
  pub aspect_ratio: Veo3T2vAspectRatio,
  pub resolution: Veo3T2vResolution,
  pub generate_audio: bool,
  pub webhook_url: V,
  pub api_key: &'a FalApiKey,
}

/// Duration for Veo 3 text-to-video. Default is 8 seconds.
#[derive(Copy, Clone, Debug)]
pub enum Veo3T2vDuration {
  Default, // Default is 8 seconds
  FourSeconds,
  SixSeconds,
  EightSeconds,
}

/// Aspect ratio for Veo 3 text-to-video.
/// Only 16:9 and 9:16 are supported. No Auto, no Square.
#[derive(Copy, Clone, Debug)]
pub enum Veo3T2vAspectRatio {
  Default, // Default is 16:9
  WideSixteenNine, // 16:9
  TallNineSixteen, // 9:16
}

/// Resolution for Veo 3 text-to-video.
#[derive(Copy, Clone, Debug)]
pub enum Veo3T2vResolution {
  Default,
  SevenTwentyP,
  TenEightyP,
}

impl<V: IntoUrl> FalRequestCostCalculator for Veo3TextToVideoArgs<'_, V> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // $0.20/sec audio off, $0.40/sec audio on.
    match (self.duration, self.generate_audio) {
      (Veo3T2vDuration::FourSeconds, false) => 80,
      (Veo3T2vDuration::SixSeconds, false) => 120,
      (Veo3T2vDuration::EightSeconds, false) => 160,
      (Veo3T2vDuration::Default, false) => 160,
      (Veo3T2vDuration::FourSeconds, true) => 160,
      (Veo3T2vDuration::SixSeconds, true) => 240,
      (Veo3T2vDuration::EightSeconds, true) => 320,
      (Veo3T2vDuration::Default, true) => 320,
    }
  }
}

/// Veo 3 Text-to-Video
/// https://fal.ai/models/fal-ai/veo3
pub async fn enqueue_veo_3_text_to_video_webhook<V: IntoUrl>(
  args: Veo3TextToVideoArgs<'_, V>,
) -> Result<WebhookResponse, FalErrorPlus> {
  let duration = match args.duration {
    Veo3T2vDuration::Default => None,
    Veo3T2vDuration::FourSeconds => Some("4s".to_string()),
    Veo3T2vDuration::SixSeconds => Some("6s".to_string()),
    Veo3T2vDuration::EightSeconds => Some("8s".to_string()),
  };

  let aspect_ratio = match args.aspect_ratio {
    Veo3T2vAspectRatio::Default => None,
    Veo3T2vAspectRatio::WideSixteenNine => Some("16:9".to_string()),
    Veo3T2vAspectRatio::TallNineSixteen => Some("9:16".to_string()),
  };

  let resolution = match args.resolution {
    Veo3T2vResolution::Default => None,
    Veo3T2vResolution::SevenTwentyP => Some("720p".to_string()),
    Veo3T2vResolution::TenEightyP => Some("1080p".to_string()),
  };

  let request = Veo3TextToVideoInput {
    prompt: args.prompt.to_string(),
    aspect_ratio,
    resolution,
    duration,
    generate_audio: Some(args.generate_audio),
    negative_prompt: args.negative_prompt.map(|s| s.to_string()),
  };

  let result = veo_3_text_to_video(request)
    .with_api_key(&args.api_key.0)
    .queue_webhook(args.webhook_url)
    .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::text::enqueue_veo_3_text_to_video_webhook::{
    enqueue_veo_3_text_to_video_webhook, Veo3TextToVideoArgs, Veo3T2vAspectRatio,
    Veo3T2vDuration, Veo3T2vResolution,
  };
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test_veo_3_text_to_video() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = Veo3TextToVideoArgs {
      prompt: "a drone shot of a coastal sunset with waves crashing on rocks",
      negative_prompt: None,
      api_key: &api_key,
      duration: Veo3T2vDuration::EightSeconds,
      aspect_ratio: Veo3T2vAspectRatio::WideSixteenNine,
      resolution: Veo3T2vResolution::TenEightyP,
      generate_audio: true,
      webhook_url: "https://example.com/webhook",
    };

    let _result = enqueue_veo_3_text_to_video_webhook(args).await?;
    Ok(())
  }
}
