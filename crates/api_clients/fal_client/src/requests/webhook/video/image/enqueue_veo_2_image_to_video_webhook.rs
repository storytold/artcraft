use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::video::image::http_veo_2_image_to_video::{veo_2_image_to_video, Veo2ImageToVideoInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct Veo2Args<'a, U: IntoUrl, V: IntoUrl> {
  pub image_url: U,
  pub webhook_url: V,
  pub prompt: &'a str,
  pub api_key: &'a FalApiKey,
  pub duration: Veo2Duration,
  pub aspect_ratio: Veo2AspectRatio,
}

#[derive(Copy, Clone, Debug)]
pub enum Veo2Duration {
  Default, // NB: Default is 5 seconds
  FiveSeconds,
  SixSeconds,
  SevenSeconds,
  EightSeconds,
}

#[derive(Copy, Clone, Debug)]
pub enum Veo2AspectRatio {
  Auto,
  AutoPreferPortrait,
  WideSixteenNine, // 16:9
  TallNineSixteen, // 9:16
}

impl <U: IntoUrl, V: IntoUrl> FalRequestCostCalculator for Veo2Args<'_, U, V> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "For 5s video your request will cost $2.50.
    // For every aditional second you will be charged $0.50."
    match self.duration {
      Veo2Duration::Default => 250,
      Veo2Duration::FiveSeconds => 250,
      Veo2Duration::SixSeconds => 300,
      Veo2Duration::SevenSeconds => 350,
      Veo2Duration::EightSeconds => 400,
    }
  }
}


/// Veo 2 Image-to-Video
/// https://fal.ai/models/fal-ai/veo2/image-to-video
pub async fn enqueue_veo_2_image_to_video_webhook<U: IntoUrl, V: IntoUrl>(
  args: Veo2Args<'_, U, V>
) -> Result<WebhookResponse, FalErrorPlus> {
  let duration = match args.duration {
    Veo2Duration::Default => None, // NB: Default is 5 seconds.
    Veo2Duration::FiveSeconds => Some("5s".to_string()),
    Veo2Duration::SixSeconds => Some("6s".to_string()),
    Veo2Duration::SevenSeconds => Some("7s".to_string()),
    Veo2Duration::EightSeconds => Some("8s".to_string()),
  };
  
  let aspect_ratio = match args.aspect_ratio {
    Veo2AspectRatio::Auto => Some("auto".to_string()),
    Veo2AspectRatio::AutoPreferPortrait => Some("auto_prefer_portrait".to_string()),
    Veo2AspectRatio::WideSixteenNine => Some("16:9".to_string()),
    Veo2AspectRatio::TallNineSixteen => Some("9:16".to_string()),
  };

  let image_url = args.image_url.as_str().to_string();

  let request = Veo2ImageToVideoInput {
    image_url,
    prompt: args.prompt.to_string(),
    aspect_ratio,
    duration,
    // Maybe expose these later
  };

  let result = veo_2_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}


#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::image::enqueue_veo_2_image_to_video_webhook::{enqueue_veo_2_image_to_video_webhook, Veo2Args, Veo2AspectRatio, Veo2Duration};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test_kling21_pro_video() -> AnyhowResult<()> {
    let image_url = "https://cdn-2.fakeyou.com/media/3/4/h/f/s/34hfsmt8e38rvne6mwa4pwbxr6292sgy/image_34hfsmt8e38rvne6mwa4pwbxr6292sgy.png";

    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Veo2Args {
      image_url: image_url,
      prompt: "a shot of the mountains as the sun sets and reveals the moon and stars",
      api_key: &api_key,
      duration: Veo2Duration::Default,
      aspect_ratio: Veo2AspectRatio::WideSixteenNine,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_veo_2_image_to_video_webhook(args).await?;

    Ok(())
  }
}
