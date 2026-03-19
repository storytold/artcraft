use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::video::image::http_sora_2_image_to_video::{sora_2_image_to_video, Sora2ImageToVideoInput};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueSora2ImageToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,
  pub image_url: String,

  // Optional args
  pub duration: Option<EnqueueSora2ImageToVideoDurationSeconds>,
  pub resolution: Option<EnqueueSora2ImageToVideoResolution>,
  pub aspect_ratio: Option<EnqueueSora2ImageToVideoAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug, strum::EnumIter)]
pub enum EnqueueSora2ImageToVideoDurationSeconds {
  Four,
  Eight,
  Twelve,
}

#[derive(Copy, Clone, Debug, strum::EnumIter)]
pub enum EnqueueSora2ImageToVideoResolution {
  Auto,
  SevenTwentyP,
}

#[derive(Copy, Clone, Debug, strum::EnumIter)]
pub enum EnqueueSora2ImageToVideoAspectRatio {
  Auto,
  NineBySixteen,
  SixteenByNine,
}

impl <U: IntoUrl> FalRequestCostCalculator for EnqueueSora2ImageToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "The pricing is $0.1/s for Sora 2."
    let duration = self.duration.unwrap_or(EnqueueSora2ImageToVideoDurationSeconds::Four);
    match duration {
      EnqueueSora2ImageToVideoDurationSeconds::Four => 40,   // $0.10 * 4
      EnqueueSora2ImageToVideoDurationSeconds::Eight => 80,  // $0.10 * 8
      EnqueueSora2ImageToVideoDurationSeconds::Twelve => 120 // $0.10 * 12
    }
  }
}

/// Sora 2 Image-to-Video
/// https://fal.ai/models/fal-ai/sora-2/image-to-video
pub async fn enqueue_sora_2_image_to_video_webhook<R: IntoUrl>(
  args: EnqueueSora2ImageToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|d| match d {
        EnqueueSora2ImageToVideoDurationSeconds::Four => 4,
        EnqueueSora2ImageToVideoDurationSeconds::Eight => 8,
        EnqueueSora2ImageToVideoDurationSeconds::Twelve => 12,
      });

  let resolution = args.resolution
      .map(|r| match r {
        EnqueueSora2ImageToVideoResolution::Auto => "auto",
        EnqueueSora2ImageToVideoResolution::SevenTwentyP => "720p",
      })
      .map(|r| r.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|ar| match ar {
        EnqueueSora2ImageToVideoAspectRatio::Auto => "auto",
        EnqueueSora2ImageToVideoAspectRatio::NineBySixteen => "9:16",
        EnqueueSora2ImageToVideoAspectRatio::SixteenByNine => "16:9",
      })
      .map(|ar| ar.to_string());

  let request = Sora2ImageToVideoInput {
    prompt: args.prompt,
    image_url: args.image_url,
    duration,
    resolution,
    aspect_ratio,
    delete_video: Some(false),
  };

  let result = sora_2_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::fal_api_key::FalApiKey;
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use strum::IntoEnumIterator;
  use test_data::web::image_urls::TREX_SKELETON_IMAGE_URL;

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueSora2ImageToVideoArgs {
      image_url: TREX_SKELETON_IMAGE_URL.to_string(),
      prompt: "the t-rex skeleton gets off the podium and begins walking to the camera. the camera orbits slightly. The t-rex gets close and then bites.".to_string(),
      duration: Some(EnqueueSora2ImageToVideoDurationSeconds::Twelve),
      aspect_ratio: Some(EnqueueSora2ImageToVideoAspectRatio::SixteenByNine),
      resolution: Some(EnqueueSora2ImageToVideoResolution::SevenTwentyP),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_sora_2_image_to_video_webhook(args).await?;
    println!("result: {:?}", result);

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_aspect_ratios() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for ar in EnqueueSora2ImageToVideoAspectRatio::iter() {
      println!("--- aspect ratio: {:?} ---", ar);
      let args = EnqueueSora2ImageToVideoArgs {
        image_url: TREX_SKELETON_IMAGE_URL.to_string(),
        prompt: "the skeleton comes alive and roars at the camera".to_string(),
        duration: Some(EnqueueSora2ImageToVideoDurationSeconds::Four),
        aspect_ratio: Some(ar),
        resolution: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_sora_2_image_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_durations() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for dur in EnqueueSora2ImageToVideoDurationSeconds::iter() {
      println!("--- duration: {:?} ---", dur);
      let args = EnqueueSora2ImageToVideoArgs {
        image_url: TREX_SKELETON_IMAGE_URL.to_string(),
        prompt: "the skeleton slowly turns its head".to_string(),
        duration: Some(dur),
        aspect_ratio: Some(EnqueueSora2ImageToVideoAspectRatio::SixteenByNine),
        resolution: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_sora_2_image_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_resolutions() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for res in EnqueueSora2ImageToVideoResolution::iter() {
      println!("--- resolution: {:?} ---", res);
      let args = EnqueueSora2ImageToVideoArgs {
        image_url: TREX_SKELETON_IMAGE_URL.to_string(),
        prompt: "the skeleton slowly comes alive".to_string(),
        duration: Some(EnqueueSora2ImageToVideoDurationSeconds::Four),
        aspect_ratio: Some(EnqueueSora2ImageToVideoAspectRatio::SixteenByNine),
        resolution: Some(res),
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_sora_2_image_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }
}
