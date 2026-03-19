use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::video::image::http_seedance_1_pro_image_to_video::{seedance_1_pro_image_to_video, Seedance1ProImageToVideoInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct Seedance1ProArgs<'a, U: IntoUrl, V: IntoUrl> {
  pub image_url: U,
  pub webhook_url: V,
  pub prompt: &'a str,
  pub api_key: &'a FalApiKey,
  pub camera_fixed: bool,
  pub duration: Seedance1ProDuration,
  pub resolution: Seedance1ProResolution,
  pub seed: Option<u32>,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Seedance1ProDuration {
  ThreeSeconds,
  FourSeconds,
  FiveSeconds,
  SixSeconds,
  SevenSeconds,
  EightSeconds,
  NineSeconds,
  TenSeconds,
  ElevenSeconds,
  TwelveSeconds,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Seedance1ProResolution {
  FourEightyP, // 480p
  SevenTwentyP, // 720p
  TenEightyP, // 1080p
}


impl <U: IntoUrl, V: IntoUrl> FalRequestCostCalculator for Seedance1ProArgs<'_, U, V> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "Each 1080p 5 second video costs roughly $0.62.
    //  For other resolutions, 1 million video tokens costs $2.5.
    //  tokens(video) = (height x width x FPS x duration) / 1024."

    if self.resolution == Seedance1ProResolution::TenEightyP
        && self.duration == Seedance1ProDuration::FiveSeconds
    {
      return 62;
    }

    // TODO: Only correct for some aspect ratios for now.
    let (width, height) = match self.resolution {
      Seedance1ProResolution::FourEightyP => (640u32, 480u32), // NB: Only for 4:3 !
      Seedance1ProResolution::SevenTwentyP => (1280, 720), // NB: Only for 16:9 !
      Seedance1ProResolution::TenEightyP => (1920, 1080),
    };

    let duration = match self.duration {
      Seedance1ProDuration::ThreeSeconds => 3.0,
      Seedance1ProDuration::FourSeconds => 4.0,
      Seedance1ProDuration::FiveSeconds => 5.0,
      Seedance1ProDuration::SixSeconds => 6.0,
      Seedance1ProDuration::SevenSeconds => 7.0,
      Seedance1ProDuration::EightSeconds => 8.0,
      Seedance1ProDuration::NineSeconds => 9.0,
      Seedance1ProDuration::TenSeconds => 10.0,
      Seedance1ProDuration::ElevenSeconds => 11.0,
      Seedance1ProDuration::TwelveSeconds => 12.0,
    };

    // TODO: Not sure if FPS is right.
    //  Inferred from https://help.scenario.com/en/articles/seedance-models-the-essentials/
    const FPS : f64 = 30.0;

    let tokens = (height as f64) * (width as f64) * FPS * duration;
    let tokens = tokens / 1024.0;

    let cost = tokens * 2.5 / 1_000_000.0;
    let cost = cost * 100.0; // Dollars to cents.
    let cost = cost.ceil(); // NB: This is probably what Fal does.

    cost as UsdCents
  }
}

/// Seedance 1.0 Pro Image-to-Video
/// https://fal.ai/models/fal-ai/bytedance/seedance/v1/pro/image-to-video
pub async fn enqueue_seedance_1_pro_image_to_video_webhook<U: IntoUrl, V: IntoUrl>(
  args: Seedance1ProArgs<'_, U, V>
) -> Result<WebhookResponse, FalErrorPlus> {
  let duration = match args.duration {
    Seedance1ProDuration::ThreeSeconds => Some("3".to_string()),
    Seedance1ProDuration::FourSeconds => Some("4".to_string()),
    Seedance1ProDuration::FiveSeconds => Some("5".to_string()),
    Seedance1ProDuration::SixSeconds => Some("6".to_string()),
    Seedance1ProDuration::SevenSeconds => Some("7".to_string()),
    Seedance1ProDuration::EightSeconds => Some("8".to_string()),
    Seedance1ProDuration::NineSeconds => Some("9".to_string()), 
    Seedance1ProDuration::TenSeconds => Some("10".to_string()),
    Seedance1ProDuration::ElevenSeconds => Some("11".to_string()),
    Seedance1ProDuration::TwelveSeconds => Some("12".to_string()),
  };
  
  let resolution = match args.resolution {
    Seedance1ProResolution::FourEightyP => Some("480p".to_string()),
    Seedance1ProResolution::SevenTwentyP => Some("720p".to_string()),
    Seedance1ProResolution::TenEightyP => Some("1080p".to_string()),
  };

  let image_url = args.image_url.as_str().to_string();

  let request = Seedance1ProImageToVideoInput {
    image_url,
    prompt: args.prompt.to_string(),
    duration,
    resolution,
    // TODO: Add these later
    camera_fixed: None,
    // Static
    enable_safety_checker: Some(false),
  };

  let result = seedance_1_pro_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}


#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;
  use crate::requests::webhook::video::image::enqueue_seedance_1_pro_image_to_video_webhook::{enqueue_seedance_1_pro_image_to_video_webhook, Seedance1ProArgs, Seedance1ProDuration, Seedance1ProResolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::TALL_MOCHI_WITH_GLASSES_IMAGE_URL;

  #[test]
  fn test_cost() {
    let api_key = FalApiKey::from_str("");

    let mut args = Seedance1ProArgs {
      image_url: "",
      prompt: "",
      api_key: &api_key,
      camera_fixed: false,
      duration: Seedance1ProDuration::FiveSeconds,
      resolution: Seedance1ProResolution::TenEightyP,
      seed: None,
      webhook_url: "https://example.com/webhook",
    };

    // NB: Constant value specified by FAL
    args.duration = Seedance1ProDuration::FiveSeconds;
    args.resolution = Seedance1ProResolution::TenEightyP;
    let cost = args.calculate_cost_in_cents();
    assert_eq!(cost, 62);

    // NB: Calculations follow...
    args.duration = Seedance1ProDuration::FiveSeconds;
    args.resolution = Seedance1ProResolution::SevenTwentyP;
    let cost = args.calculate_cost_in_cents();
    assert_eq!(cost, 34);

    args.duration = Seedance1ProDuration::TenSeconds;
    args.resolution = Seedance1ProResolution::SevenTwentyP;
    let cost = args.calculate_cost_in_cents();
    assert_eq!(cost, 68);

    args.duration = Seedance1ProDuration::TenSeconds;
    args.resolution = Seedance1ProResolution::TenEightyP;
    let cost = args.calculate_cost_in_cents();
    assert_eq!(cost, 152);
  }

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Seedance1ProArgs {
      image_url: TALL_MOCHI_WITH_GLASSES_IMAGE_URL,
      prompt: "shiba in glasses runs to the lake and stands by the shore",
      api_key: &api_key,
      camera_fixed: false,
      duration: Seedance1ProDuration::FiveSeconds,
      resolution: Seedance1ProResolution::SevenTwentyP,
      seed: None,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_seedance_1_pro_image_to_video_webhook(args).await?;

    Ok(())
  }
}
