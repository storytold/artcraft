use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::video::text::http_pixverse_v5_text_to_video::{pixverse_v5_text_to_video, PixverseV5TextToVideoInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueuePixverseV5TextToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,

  // Optional args
  pub negative_prompt: Option<String>,

  // NB: eight-second videos do not work with 1080P
  pub duration: Option<EnqueuePixverseV5TextToVideoDurationSeconds>,
  pub aspect_ratio: Option<EnqueuePixverseV5TextToVideoAspectRatio>,
  pub resolution: Option<EnqueuePixverseV5TextToVideoResolution>,
  pub style: Option<EnqueuePixverseV5TextToVideoStyle>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueuePixverseV5TextToVideoDurationSeconds {
  Five,
  Eight,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueuePixverseV5TextToVideoResolution {
  ThreeSixtyP,
  FiveFortyP,
  SevenTwentyP,
  TenEightyP,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueuePixverseV5TextToVideoAspectRatio {
  Square,
  SixteenByNine,
  FourByThree,
  NineBySixteen,
  ThreeByFour,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueuePixverseV5TextToVideoStyle {
  Anime,
  Animation3d,
  Clay,
  Comic,
  Cyberpunk,
}

pub async fn enqueue_pixverse_v5_text_to_video_webhook<R: IntoUrl>(
  args: EnqueuePixverseV5TextToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|resolution| match resolution {
        EnqueuePixverseV5TextToVideoDurationSeconds::Five => "5",
        EnqueuePixverseV5TextToVideoDurationSeconds::Eight=> "8",
      })
      .map(|s| s.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|aspect_ratio| match aspect_ratio {
        EnqueuePixverseV5TextToVideoAspectRatio::Square => "1:1",
        EnqueuePixverseV5TextToVideoAspectRatio::SixteenByNine => "16:9",
        EnqueuePixverseV5TextToVideoAspectRatio::FourByThree => "4:3",
        EnqueuePixverseV5TextToVideoAspectRatio::NineBySixteen => "9:16",
        EnqueuePixverseV5TextToVideoAspectRatio::ThreeByFour => "3:4",
      })
      .map(|s| s.to_string());

  let resolution = args.resolution
      .map(|resolution| match resolution {
        EnqueuePixverseV5TextToVideoResolution::ThreeSixtyP => "360p",
        EnqueuePixverseV5TextToVideoResolution::FiveFortyP => "540p",
        EnqueuePixverseV5TextToVideoResolution::SevenTwentyP => "720p",
        EnqueuePixverseV5TextToVideoResolution::TenEightyP => "1080p",
      })
      .map(|s| s.to_string());

  let style = args.style
      .map(|style| match style {
        EnqueuePixverseV5TextToVideoStyle::Anime => "anime",
        EnqueuePixverseV5TextToVideoStyle::Animation3d => "3d_animation",
        EnqueuePixverseV5TextToVideoStyle::Clay => "clay",
        EnqueuePixverseV5TextToVideoStyle::Comic => "comic",
        EnqueuePixverseV5TextToVideoStyle::Cyberpunk => "cyberpunk",
      })
      .map(|s| s.to_string());

  let request = PixverseV5TextToVideoInput {
    prompt: args.prompt,
    // Optionals
    duration,
    negative_prompt: args.negative_prompt,
    aspect_ratio,
    resolution,
    style,
    // Constant
    seed: None,
  };

  let result = pixverse_v5_text_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::text::enqueue_pixverse_v5_text_to_video_webhook::{enqueue_pixverse_v5_text_to_video_webhook, EnqueuePixverseV5TextToVideoArgs, EnqueuePixverseV5TextToVideoAspectRatio, EnqueuePixverseV5TextToVideoDurationSeconds, EnqueuePixverseV5TextToVideoResolution, EnqueuePixverseV5TextToVideoStyle};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/home/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueuePixverseV5TextToVideoArgs {
      prompt: "an angry racoon shakes its fist at the garbage truck as it drives away, the camera orbits the racoon. the racoon sighs".to_string(),
      negative_prompt: None,
      duration: Some(EnqueuePixverseV5TextToVideoDurationSeconds::Eight),
      style: Some(EnqueuePixverseV5TextToVideoStyle::Anime),
      aspect_ratio: Some(EnqueuePixverseV5TextToVideoAspectRatio::FourByThree),
      resolution: Some(EnqueuePixverseV5TextToVideoResolution::SevenTwentyP),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_pixverse_v5_text_to_video_webhook(args).await?;

    Ok(())
  }
}
