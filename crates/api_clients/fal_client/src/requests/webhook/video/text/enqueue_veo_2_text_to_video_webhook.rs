use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::api::webhook_response::WebhookResponse;
use crate::requests::http::video::text::http_veo_2_text_to_video::{
  veo_2_text_to_video, Veo2TextToVideoInput,
};
use crate::requests::traits::fal_request_cost_calculator_trait::{
  FalRequestCostCalculator, UsdCents,
};
// Re-use the same duration/aspect-ratio enums as image-to-video.
pub use crate::requests::webhook::video::image::enqueue_veo_2_image_to_video_webhook::{
  Veo2AspectRatio, Veo2Duration,
};
use reqwest::IntoUrl;

pub struct Veo2TextToVideoArgs<'a, V: IntoUrl> {
  pub prompt: &'a str,
  pub negative_prompt: Option<&'a str>,
  pub duration: Veo2Duration,
  pub aspect_ratio: Veo2AspectRatio,
  pub webhook_url: V,
  pub api_key: &'a FalApiKey,
}

impl<V: IntoUrl> FalRequestCostCalculator for Veo2TextToVideoArgs<'_, V> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Same pricing as image-to-video:
    // "For 5s video your request will cost $2.50.
    // For every additional second you will be charged $0.50."
    match self.duration {
      Veo2Duration::Default => 250,
      Veo2Duration::FiveSeconds => 250,
      Veo2Duration::SixSeconds => 300,
      Veo2Duration::SevenSeconds => 350,
      Veo2Duration::EightSeconds => 400,
    }
  }
}

/// Veo 2 Text-to-Video
/// https://fal.ai/models/fal-ai/veo2
pub async fn enqueue_veo_2_text_to_video_webhook<V: IntoUrl>(
  args: Veo2TextToVideoArgs<'_, V>,
) -> Result<WebhookResponse, FalErrorPlus> {
  let duration = match args.duration {
    Veo2Duration::Default => None,
    Veo2Duration::FiveSeconds => Some("5s".to_string()),
    Veo2Duration::SixSeconds => Some("6s".to_string()),
    Veo2Duration::SevenSeconds => Some("7s".to_string()),
    Veo2Duration::EightSeconds => Some("8s".to_string()),
  };

  let aspect_ratio = match args.aspect_ratio {
    Veo2AspectRatio::Auto => None, // Let the API default (16:9)
    Veo2AspectRatio::AutoPreferPortrait => Some("9:16".to_string()),
    Veo2AspectRatio::WideSixteenNine => Some("16:9".to_string()),
    Veo2AspectRatio::TallNineSixteen => Some("9:16".to_string()),
  };

  let request = Veo2TextToVideoInput {
    prompt: args.prompt.to_string(),
    aspect_ratio,
    duration,
    negative_prompt: args.negative_prompt.map(|s| s.to_string()),
  };

  let result = veo_2_text_to_video(request)
    .with_api_key(&args.api_key.0)
    .queue_webhook(args.webhook_url)
    .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::text::enqueue_veo_2_text_to_video_webhook::{
    enqueue_veo_2_text_to_video_webhook, Veo2TextToVideoArgs, Veo2AspectRatio, Veo2Duration,
  };
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test_veo_2_text_to_video() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = Veo2TextToVideoArgs {
      prompt: "a drone shot of a coastal sunset with waves crashing on rocks",
      negative_prompt: None,
      api_key: &api_key,
      duration: Veo2Duration::FiveSeconds,
      aspect_ratio: Veo2AspectRatio::WideSixteenNine,
      webhook_url: "https://example.com/webhook",
    };

    let _result = enqueue_veo_2_text_to_video_webhook(args).await?;
    Ok(())
  }
}
