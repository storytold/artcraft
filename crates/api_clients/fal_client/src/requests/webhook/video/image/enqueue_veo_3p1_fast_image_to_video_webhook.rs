use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::video::image::http_veo_3p1_fast_image_to_video::{veo_3p1_fast_image_to_video, Veo3p1FastImageToVideoInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueVeo3p1FastImageToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,

  // Starting frame
  pub image_url: String,

  // Optional args
  pub duration: Option<EnqueueVeo3p1FastImageToVideoDurationSeconds>,
  pub aspect_ratio: Option<EnqueueVeo3p1FastImageToVideoAspectRatio>,
  pub resolution: Option<EnqueueVeo3p1FastImageToVideoResolution>,
  pub generate_audio: Option<bool>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueVeo3p1FastImageToVideoDurationSeconds {
  Four,
  Six,
  Eight,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueVeo3p1FastImageToVideoAspectRatio {
  Auto,
  SixteenByNine,
  NineBySixteen,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueVeo3p1FastImageToVideoResolution {
  SevenTwentyP,
  TenEightyP,
}


impl <R: IntoUrl> FalRequestCostCalculator for EnqueueVeo3p1FastImageToVideoArgs<'_, R> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "For every second of video you generated, you will be charged
    // $0.10 (audio off) or
    // $0.15 (audio on).
    // For example, a 5s video with audio on will cost $0.75."
    let duration = self.duration
        .unwrap_or(EnqueueVeo3p1FastImageToVideoDurationSeconds::Eight);

    let generate_audio = self.generate_audio.unwrap_or(true);

    match (duration, generate_audio) {
      (EnqueueVeo3p1FastImageToVideoDurationSeconds::Four, false) => 40,
      (EnqueueVeo3p1FastImageToVideoDurationSeconds::Six, false) => 60,
      (EnqueueVeo3p1FastImageToVideoDurationSeconds::Eight, false) => 80,
      (EnqueueVeo3p1FastImageToVideoDurationSeconds::Four, true) => 60,
      (EnqueueVeo3p1FastImageToVideoDurationSeconds::Six, true) => 90,
      (EnqueueVeo3p1FastImageToVideoDurationSeconds::Eight, true) => 120,
    }
  }
}


/// Veo 3.1 Fast Image-to-Video
/// https://fal.ai/models/fal-ai/veo3.1/fast/image-to-video
pub async fn enqueue_veo_3p1_fast_image_to_video_webhook<R: IntoUrl>(
  args: EnqueueVeo3p1FastImageToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|resolution| match resolution {
        EnqueueVeo3p1FastImageToVideoDurationSeconds::Four => "4s",
        EnqueueVeo3p1FastImageToVideoDurationSeconds::Six => "6s",
        EnqueueVeo3p1FastImageToVideoDurationSeconds::Eight=> "8s",
      })
      .map(|s| s.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|aspect_ratio| match aspect_ratio {
        EnqueueVeo3p1FastImageToVideoAspectRatio::Auto => "auto",
        EnqueueVeo3p1FastImageToVideoAspectRatio::SixteenByNine => "16:9",
        EnqueueVeo3p1FastImageToVideoAspectRatio::NineBySixteen => "9:16",
      })
      .map(|s| s.to_string());

  let resolution = args.resolution
      .map(|resolution| match resolution {
        EnqueueVeo3p1FastImageToVideoResolution::SevenTwentyP => "720p",
        EnqueueVeo3p1FastImageToVideoResolution::TenEightyP => "1080p",
      })
      .map(|s| s.to_string());

  let request = Veo3p1FastImageToVideoInput {
    prompt: args.prompt,
    image_url: args.image_url,
    generate_audio: args.generate_audio,
    // Optionals
    duration,
    aspect_ratio,
    resolution,
  };

  let result = veo_3p1_fast_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::image::enqueue_veo_3p1_fast_image_to_video_webhook::{enqueue_veo_3p1_fast_image_to_video_webhook, EnqueueVeo3p1FastImageToVideoArgs, EnqueueVeo3p1FastImageToVideoAspectRatio, EnqueueVeo3p1FastImageToVideoDurationSeconds, EnqueueVeo3p1FastImageToVideoResolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::TALL_CORGI_SHIBA_TREASURE_OCEAN_URL;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/home/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueVeo3p1FastImageToVideoArgs {
      image_url: TALL_CORGI_SHIBA_TREASURE_OCEAN_URL.to_string(),
      prompt: "There is a tiny ocean island with a corgi and shiba and treasure chest on it. The corgi and shiba are barking at the chest, when suddenly the island launches itself into the air. The camera tracks the island and follows it up high in the sky. The sun beams over the horizon. The dogs are happy and bark. The gold coins gleam in the sun.".to_string(),
      duration: Some(EnqueueVeo3p1FastImageToVideoDurationSeconds::Four),
      aspect_ratio: Some(EnqueueVeo3p1FastImageToVideoAspectRatio::SixteenByNine),
      resolution: Some(EnqueueVeo3p1FastImageToVideoResolution::TenEightyP),
      generate_audio: Some(true),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_veo_3p1_fast_image_to_video_webhook(args).await?;

    Ok(())
  }
}
