use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::video::image::http_seedance_1_lite_image_to_video::{seedance_1_lite_image_to_video, Seedance1LiteImageToVideoInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct Seedance1LiteArgs<'a, U: IntoUrl, T: IntoUrl, V: IntoUrl> {
  pub image_url: U,
  pub end_frame_image_url: Option<T>,
  pub prompt: &'a str,
  pub duration: Seedance1LiteDuration,
  pub resolution: Seedance1LiteResolution,
  pub aspect_ratio: Option<Seedance1LiteAspectRatio>,
  pub camera_fixed: bool,
  pub seed: Option<u32>,
  pub api_key: &'a FalApiKey,
  pub webhook_url: V,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Seedance1LiteDuration {
  FiveSeconds,
  TenSeconds,
}

#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum Seedance1LiteResolution {
  FourEightyP, // 480p
  SevenTwentyP, // 720p
  TenEightyP, // 1080p
}

/// Possible enum values: 21:9, 16:9, 4:3, 1:1, 3:4, 9:16, auto
#[derive(Copy, Clone, Debug)]
pub enum Seedance1LiteAspectRatio {
  Auto,
  TwentyOneByNine,
  SixteenByNine,
  FourByThree,
  Square,
  ThreeByFour,
  NineBySixteen,
}


impl <U: IntoUrl, T: IntoUrl, V: IntoUrl> FalRequestCostCalculator for Seedance1LiteArgs<'_, U, T, V> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "Each 720p 5 second video costs $0.18.
    //  For other resolutions, 1 million video tokens costs $1.8.
    //  tokens(video) = (height x width x FPS x duration) / 1024."

    if self.resolution == Seedance1LiteResolution::SevenTwentyP
        && self.duration == Seedance1LiteDuration::FiveSeconds
    {
      return 18;
    }

    // TODO: Only correct for some aspect ratios for now.
    let (width, height) = match self.resolution {
      Seedance1LiteResolution::FourEightyP => (640u32, 480u32), // NB: Only for 4:3 !
      Seedance1LiteResolution::SevenTwentyP => (1280, 720), // NB: Only for 16:9 !
      Seedance1LiteResolution::TenEightyP => (1920, 1080),
    };

    let duration = match self.duration {
      Seedance1LiteDuration::FiveSeconds => 5.0,
      Seedance1LiteDuration::TenSeconds => 10.0,
    };

    // TODO: Not sure if FPS is right.
    //  Inferred from https://help.scenario.com/en/articles/seedance-models-the-essentials/
    const FPS : f64 = 30.0;

    let tokens = (height as f64) * (width as f64) * FPS * duration;
    let tokens = tokens / 1024.0;

    let cost = tokens * 1.8 / 1_000_000.0;
    let cost = cost * 100.0; // Dollars to cents.
    let cost = cost.ceil(); // NB: This is probably what Fal does.

    cost as UsdCents
  }
}


/// Seedance 1.0 Lite Image-to-Video
/// https://fal.ai/models/fal-ai/bytedance/seedance/v1/lite/image-to-video
pub async fn enqueue_seedance_1_lite_image_to_video_webhook<U: IntoUrl, T: IntoUrl, V: IntoUrl>(
  args: Seedance1LiteArgs<'_, U, T, V>
) -> Result<WebhookResponse, FalErrorPlus> {
  let duration = match args.duration {
    Seedance1LiteDuration::FiveSeconds => Some("5".to_string()),
    Seedance1LiteDuration::TenSeconds => Some("10".to_string()),
  };
  
  let resolution = match args.resolution {
    Seedance1LiteResolution::FourEightyP => Some("480p".to_string()),
    Seedance1LiteResolution::SevenTwentyP => Some("720p".to_string()),
    Seedance1LiteResolution::TenEightyP => Some("1080p".to_string()),
  };

  /// Possible enum values: 21:9, 16:9, 4:3, 1:1, 3:4, 9:16, auto
  let aspect_ratio = args.aspect_ratio
      .map(|r| match r {
        Seedance1LiteAspectRatio::Auto => "auto",
        Seedance1LiteAspectRatio::TwentyOneByNine => "21:9",
        Seedance1LiteAspectRatio::SixteenByNine => "16:9",
        Seedance1LiteAspectRatio::FourByThree => "4:3",
        Seedance1LiteAspectRatio::Square => "1:1",
        Seedance1LiteAspectRatio::ThreeByFour => "3:4",
        Seedance1LiteAspectRatio::NineBySixteen => "9:16",
      })
      .map(|s| s.to_string());

  let image_url = args.image_url.as_str().to_string();

  let end_image_url = args.end_frame_image_url
      .map(|url| url.as_str().to_string());

  let request = Seedance1LiteImageToVideoInput {
    image_url,
    end_image_url,
    prompt: args.prompt.to_string(),
    duration,
    resolution,
    aspect_ratio,
    // TODO: Add these later
    camera_fixed: None,
    seed: -1,
    // Static
    enable_safety_checker: Some(false),
  };

  let result = seedance_1_lite_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}


#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::image::enqueue_seedance_1_lite_image_to_video_webhook::{enqueue_seedance_1_lite_image_to_video_webhook, Seedance1LiteArgs, Seedance1LiteDuration, Seedance1LiteResolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{JUNO_AT_LAKE_IMAGE_URL, TALL_MOCHI_WITH_GLASSES_IMAGE_URL};
  use crate::requests::traits::fal_request_cost_calculator_trait::FalRequestCostCalculator;

  #[test]
  fn test_cost() {
    let api_key = FalApiKey::from_str("");

    let mut args = Seedance1LiteArgs {
      image_url: "",
      end_frame_image_url: Some(""),
      prompt: "",
      api_key: &api_key,
      camera_fixed: false,
      duration: Seedance1LiteDuration::FiveSeconds,
      resolution: Seedance1LiteResolution::SevenTwentyP,
      aspect_ratio: None,
      seed: None,
      webhook_url: "https://example.com/webhook",
    };

    // NB: Constant value specified by FAL
    args.duration = Seedance1LiteDuration::FiveSeconds;
    args.resolution = Seedance1LiteResolution::SevenTwentyP;
    let cost = args.calculate_cost_in_cents();
    assert_eq!(cost, 18);

    // NB: Calculations follow...
    args.duration = Seedance1LiteDuration::FiveSeconds;
    args.resolution = Seedance1LiteResolution::TenEightyP;
    let cost = args.calculate_cost_in_cents();
    assert_eq!(cost, 55);

    args.duration = Seedance1LiteDuration::FiveSeconds;
    args.resolution = Seedance1LiteResolution::FourEightyP;
    let cost = args.calculate_cost_in_cents();
    assert_eq!(cost, 9);

    args.duration = Seedance1LiteDuration::TenSeconds;
    args.resolution = Seedance1LiteResolution::TenEightyP;
    let cost = args.calculate_cost_in_cents();
    assert_eq!(cost, 110);
  }

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Seedance1LiteArgs {
      image_url: TALL_MOCHI_WITH_GLASSES_IMAGE_URL,
      end_frame_image_url: Some(JUNO_AT_LAKE_IMAGE_URL.to_string()),
      prompt: "shiba in glasses runs to the lake and stands by the shore",
      api_key: &api_key,
      camera_fixed: false,
      duration: Seedance1LiteDuration::FiveSeconds,
      resolution: Seedance1LiteResolution::SevenTwentyP,
      aspect_ratio: None,
      seed: None,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_seedance_1_lite_image_to_video_webhook(args).await?;

    Ok(())
  }
}
