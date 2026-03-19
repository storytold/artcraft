use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::video::image::http_pixverse_v5_image_to_video::{pixverse_v5_image_to_video, PixverseV5ImageToVideoInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueuePixverseV5ImageToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,
  pub image_url: String,

  // Optional args
  pub negative_prompt: Option<String>,
  
  // NB: eight-second videos do not work with 1080P
  // NB: Defaults to 5 seconds
  pub duration: Option<EnqueuePixverseV5ImageToVideoDurationSeconds>,
  pub aspect_ratio: Option<EnqueuePixverseV5ImageToVideoAspectRatio>,

  // NB: Defaults to 720p
  pub resolution: Option<EnqueuePixverseV5ImageToVideoResolution>,
  pub style: Option<EnqueuePixverseV5ImageToVideoStyle>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueuePixverseV5ImageToVideoDurationSeconds {
  Five,
  Eight,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueuePixverseV5ImageToVideoResolution {
  ThreeSixtyP,
  FiveFortyP,
  SevenTwentyP,
  TenEightyP,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueuePixverseV5ImageToVideoAspectRatio {
  Square,
  SixteenByNine,
  FourByThree,
  NineBySixteen,
  ThreeByFour,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueuePixverseV5ImageToVideoStyle {
  Anime,
  Animation3d,
  Clay,
  Comic,
  Cyberpunk,
}

impl <U: IntoUrl> FalRequestCostCalculator for EnqueuePixverseV5ImageToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "For 5s video your request will cost
    //  $0.15 for 360p and 540p,
    //  $0.2 for 720p and
    //  $0.4 for 1080p.
    //  For $1 you can run this model with approximately 2 times."
    let duration = self.duration.unwrap_or(EnqueuePixverseV5ImageToVideoDurationSeconds::Five);
    let resolution = self.resolution.unwrap_or(EnqueuePixverseV5ImageToVideoResolution::SevenTwentyP);
    match (duration, resolution) {
      // Five seconds
      (EnqueuePixverseV5ImageToVideoDurationSeconds::Five, EnqueuePixverseV5ImageToVideoResolution::ThreeSixtyP) => 15, // $0.15
      (EnqueuePixverseV5ImageToVideoDurationSeconds::Five, EnqueuePixverseV5ImageToVideoResolution::FiveFortyP) => 15, // $0.15
      (EnqueuePixverseV5ImageToVideoDurationSeconds::Five, EnqueuePixverseV5ImageToVideoResolution::SevenTwentyP) => 20, // $0.20
      (EnqueuePixverseV5ImageToVideoDurationSeconds::Five, EnqueuePixverseV5ImageToVideoResolution::TenEightyP) => 40, // $0.40
      // Ten seconds
      (EnqueuePixverseV5ImageToVideoDurationSeconds::Eight, EnqueuePixverseV5ImageToVideoResolution::ThreeSixtyP) => 30, // NB: Doubling since unclear
      (EnqueuePixverseV5ImageToVideoDurationSeconds::Eight, EnqueuePixverseV5ImageToVideoResolution::FiveFortyP) => 30, // NB: Doubling since unclear
      (EnqueuePixverseV5ImageToVideoDurationSeconds::Eight, EnqueuePixverseV5ImageToVideoResolution::SevenTwentyP) => 40, // NB: Doubling since unclear
      (EnqueuePixverseV5ImageToVideoDurationSeconds::Eight, EnqueuePixverseV5ImageToVideoResolution::TenEightyP) => 80, // NB: Doubling since unclear
    }
  }
}


/// Pixverse 5 Image-to-Video
/// https://fal.ai/models/fal-ai/pixverse/v5/image-to-video
pub async fn enqueue_pixverse_v5_image_to_video_webhook<R: IntoUrl>(
  args: EnqueuePixverseV5ImageToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|resolution| match resolution {
        EnqueuePixverseV5ImageToVideoDurationSeconds::Five => "5",
        EnqueuePixverseV5ImageToVideoDurationSeconds::Eight=> "8",
      })
      .map(|s| s.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|aspect_ratio| match aspect_ratio {
        EnqueuePixverseV5ImageToVideoAspectRatio::Square => "1:1",
        EnqueuePixverseV5ImageToVideoAspectRatio::SixteenByNine => "16:9",
        EnqueuePixverseV5ImageToVideoAspectRatio::FourByThree => "4:3",
        EnqueuePixverseV5ImageToVideoAspectRatio::NineBySixteen => "9:16",
        EnqueuePixverseV5ImageToVideoAspectRatio::ThreeByFour => "3:4",
      })
      .map(|s| s.to_string());

  let resolution = args.resolution
      .map(|resolution| match resolution {
        EnqueuePixverseV5ImageToVideoResolution::ThreeSixtyP => "360p",
        EnqueuePixverseV5ImageToVideoResolution::FiveFortyP => "540p",
        EnqueuePixverseV5ImageToVideoResolution::SevenTwentyP => "720p",
        EnqueuePixverseV5ImageToVideoResolution::TenEightyP => "1080p",
      })
      .map(|s| s.to_string());

  let style = args.style
      .map(|style| match style {
        EnqueuePixverseV5ImageToVideoStyle::Anime => "anime",
        EnqueuePixverseV5ImageToVideoStyle::Animation3d => "3d_animation",
        EnqueuePixverseV5ImageToVideoStyle::Clay => "clay",
        EnqueuePixverseV5ImageToVideoStyle::Comic => "comic",
        EnqueuePixverseV5ImageToVideoStyle::Cyberpunk => "cyberpunk",
      })
      .map(|s| s.to_string());

  let request = PixverseV5ImageToVideoInput {
    prompt: args.prompt,
    image_url: args.image_url,
    // Optionals
    duration,
    negative_prompt: args.negative_prompt,
    aspect_ratio,
    resolution,
    style,
    // Constant
    seed: None,
  };

  let result = pixverse_v5_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::image::enqueue_pixverse_v5_image_to_video_webhook::{enqueue_pixverse_v5_image_to_video_webhook, EnqueuePixverseV5ImageToVideoArgs, EnqueuePixverseV5ImageToVideoAspectRatio, EnqueuePixverseV5ImageToVideoDurationSeconds, EnqueuePixverseV5ImageToVideoResolution, EnqueuePixverseV5ImageToVideoStyle};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::TREX_SKELETON_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/home/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueuePixverseV5ImageToVideoArgs {
      image_url: TREX_SKELETON_IMAGE_URL.to_string(),
      prompt: "the t-rex skeleton gets off the podium and begins walking to the camera. the camera orbits slightly. The t-rex gets close and then bites.".to_string(),
      negative_prompt: None,
      duration: Some(EnqueuePixverseV5ImageToVideoDurationSeconds::Five),
      style: Some(EnqueuePixverseV5ImageToVideoStyle::Cyberpunk),
      aspect_ratio: Some(EnqueuePixverseV5ImageToVideoAspectRatio::FourByThree),
      resolution: Some(EnqueuePixverseV5ImageToVideoResolution::TenEightyP),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_pixverse_v5_image_to_video_webhook(args).await?;

    Ok(())
  }
}
