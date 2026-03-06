use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::video::http_sora_2_pro_image_to_video::{sora_2_pro_image_to_video, Sora2ProImageToVideoInput};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use fal::webhook::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueSora2ProImageToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,
  pub image_url: String,

  // Optional args
  pub resolution: Option<EnqueueSora2ProImageToVideoResolution>,
  pub duration: Option<EnqueueSora2ProImageToVideoDurationSeconds>,
  pub aspect_ratio: Option<EnqueueSora2ProImageToVideoAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug, strum::EnumIter)]
pub enum EnqueueSora2ProImageToVideoDurationSeconds {
  Four,
  Eight,
  Twelve,
}

#[derive(Copy, Clone, Debug, strum::EnumIter)]
pub enum EnqueueSora2ProImageToVideoResolution {
  Auto,
  SevenTwentyP,
  TenEightyP,
}

#[derive(Copy, Clone, Debug, strum::EnumIter)]
pub enum EnqueueSora2ProImageToVideoAspectRatio {
  Auto,
  NineBySixteen,
  SixteenByNine,
}

impl <U: IntoUrl> FalRequestCostCalculator for EnqueueSora2ProImageToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // Pricing: $0.30/s for 720p and $0.50/s for 1080p.
    let duration = self.duration.unwrap_or(EnqueueSora2ProImageToVideoDurationSeconds::Four);
    let resolution = self.resolution.unwrap_or(EnqueueSora2ProImageToVideoResolution::Auto);

    match (duration, resolution) {
      (EnqueueSora2ProImageToVideoDurationSeconds::Four, EnqueueSora2ProImageToVideoResolution::Auto) => 120,
      (EnqueueSora2ProImageToVideoDurationSeconds::Four, EnqueueSora2ProImageToVideoResolution::SevenTwentyP) => 120,
      (EnqueueSora2ProImageToVideoDurationSeconds::Four, EnqueueSora2ProImageToVideoResolution::TenEightyP) => 200,
      (EnqueueSora2ProImageToVideoDurationSeconds::Eight, EnqueueSora2ProImageToVideoResolution::Auto) => 240,
      (EnqueueSora2ProImageToVideoDurationSeconds::Eight, EnqueueSora2ProImageToVideoResolution::SevenTwentyP) => 240,
      (EnqueueSora2ProImageToVideoDurationSeconds::Eight, EnqueueSora2ProImageToVideoResolution::TenEightyP) => 400,
      (EnqueueSora2ProImageToVideoDurationSeconds::Twelve, EnqueueSora2ProImageToVideoResolution::Auto) => 360,
      (EnqueueSora2ProImageToVideoDurationSeconds::Twelve, EnqueueSora2ProImageToVideoResolution::SevenTwentyP) => 360,
      (EnqueueSora2ProImageToVideoDurationSeconds::Twelve, EnqueueSora2ProImageToVideoResolution::TenEightyP) => 600,
    }
  }
}

/// Sora 2 Pro Image-to-Video
/// https://fal.ai/models/fal-ai/sora-2/image-to-video/pro
pub async fn enqueue_sora_2_pro_image_to_video_webhook<R: IntoUrl>(
  args: EnqueueSora2ProImageToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|d| match d {
        EnqueueSora2ProImageToVideoDurationSeconds::Four => 4,
        EnqueueSora2ProImageToVideoDurationSeconds::Eight => 8,
        EnqueueSora2ProImageToVideoDurationSeconds::Twelve => 12,
      });

  let resolution = args.resolution
      .map(|r| match r {
        EnqueueSora2ProImageToVideoResolution::Auto => "auto",
        EnqueueSora2ProImageToVideoResolution::SevenTwentyP => "720p",
        EnqueueSora2ProImageToVideoResolution::TenEightyP => "1080p",
      })
      .map(|r| r.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|ar| match ar {
        EnqueueSora2ProImageToVideoAspectRatio::Auto => "auto",
        EnqueueSora2ProImageToVideoAspectRatio::NineBySixteen => "9:16",
        EnqueueSora2ProImageToVideoAspectRatio::SixteenByNine => "16:9",
      })
      .map(|ar| ar.to_string());

  let request = Sora2ProImageToVideoInput {
    prompt: args.prompt,
    image_url: args.image_url,
    duration,
    resolution,
    aspect_ratio,
    delete_video: Some(false),
  };

  let result = sora_2_pro_image_to_video(request)
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

    let args = EnqueueSora2ProImageToVideoArgs {
      image_url: TREX_SKELETON_IMAGE_URL.to_string(),
      prompt: "the t-rex skeleton gets off the podium and begins walking to the camera. the camera orbits slightly. The t-rex gets close and then bites.".to_string(),
      duration: Some(EnqueueSora2ProImageToVideoDurationSeconds::Twelve),
      aspect_ratio: Some(EnqueueSora2ProImageToVideoAspectRatio::SixteenByNine),
      resolution: Some(EnqueueSora2ProImageToVideoResolution::TenEightyP),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_sora_2_pro_image_to_video_webhook(args).await?;
    println!("result: {:?}", result);

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_aspect_ratios() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for ar in EnqueueSora2ProImageToVideoAspectRatio::iter() {
      println!("--- aspect ratio: {:?} ---", ar);
      let args = EnqueueSora2ProImageToVideoArgs {
        image_url: TREX_SKELETON_IMAGE_URL.to_string(),
        prompt: "the skeleton comes alive and roars at the camera".to_string(),
        duration: Some(EnqueueSora2ProImageToVideoDurationSeconds::Four),
        aspect_ratio: Some(ar),
        resolution: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_sora_2_pro_image_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_durations() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for dur in EnqueueSora2ProImageToVideoDurationSeconds::iter() {
      println!("--- duration: {:?} ---", dur);
      let args = EnqueueSora2ProImageToVideoArgs {
        image_url: TREX_SKELETON_IMAGE_URL.to_string(),
        prompt: "the skeleton slowly turns its head".to_string(),
        duration: Some(dur),
        aspect_ratio: Some(EnqueueSora2ProImageToVideoAspectRatio::SixteenByNine),
        resolution: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_sora_2_pro_image_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_resolutions() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for res in EnqueueSora2ProImageToVideoResolution::iter() {
      println!("--- resolution: {:?} ---", res);
      let args = EnqueueSora2ProImageToVideoArgs {
        image_url: TREX_SKELETON_IMAGE_URL.to_string(),
        prompt: "the skeleton slowly comes alive".to_string(),
        duration: Some(EnqueueSora2ProImageToVideoDurationSeconds::Four),
        aspect_ratio: Some(EnqueueSora2ProImageToVideoAspectRatio::SixteenByNine),
        resolution: Some(res),
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_sora_2_pro_image_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }
}
