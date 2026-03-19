use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::video::text::http_sora_2_text_to_video::{sora_2_text_to_video, Sora2TextToVideoInput};
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueSora2TextToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,

  // Optional args
  pub resolution: Option<EnqueueSora2TextToVideoResolution>,
  pub duration: Option<EnqueueSora2TextToVideoDurationSeconds>,
  pub aspect_ratio: Option<EnqueueSora2TextToVideoAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug, strum::EnumIter)]
pub enum EnqueueSora2TextToVideoDurationSeconds {
  Four,
  Eight,
  Twelve,
}

#[derive(Copy, Clone, Debug, strum::EnumIter)]
pub enum EnqueueSora2TextToVideoResolution {
  SevenTwentyP,
}

#[derive(Copy, Clone, Debug, strum::EnumIter)]
pub enum EnqueueSora2TextToVideoAspectRatio {
  NineBySixteen,
  SixteenByNine,
}


impl <U: IntoUrl> FalRequestCostCalculator for EnqueueSora2TextToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "The pricing is $0.1/s for Sora 2."
    let duration = self.duration.unwrap_or(EnqueueSora2TextToVideoDurationSeconds::Four);
    match duration {
      EnqueueSora2TextToVideoDurationSeconds::Four => 40,   // $0.10 * 4
      EnqueueSora2TextToVideoDurationSeconds::Eight => 80,  // $0.10 * 8
      EnqueueSora2TextToVideoDurationSeconds::Twelve => 120 // $0.10 * 12
    }
  }
}

/// Sora 2 Text-to-Video
/// https://fal.ai/models/fal-ai/sora-2/text-to-video
pub async fn enqueue_sora_2_text_to_video_webhook<R: IntoUrl>(
  args: EnqueueSora2TextToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|d| match d {
        EnqueueSora2TextToVideoDurationSeconds::Four => 4,
        EnqueueSora2TextToVideoDurationSeconds::Eight => 8,
        EnqueueSora2TextToVideoDurationSeconds::Twelve => 12,
      });

  let resolution = args.resolution
      .map(|r| match r {
        EnqueueSora2TextToVideoResolution::SevenTwentyP => "720p",
      })
      .map(|r| r.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|ar| match ar {
        EnqueueSora2TextToVideoAspectRatio::NineBySixteen => "9:16",
        EnqueueSora2TextToVideoAspectRatio::SixteenByNine => "16:9",
      })
      .map(|ar| ar.to_string());

  let request = Sora2TextToVideoInput {
    prompt: args.prompt,
    duration,
    resolution,
    aspect_ratio,
    delete_video: Some(false),
  };

  let result = sora_2_text_to_video(request)
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

  #[tokio::test]
  #[ignore] // manually run — fires a real API request and incurs cost
  async fn test() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueSora2TextToVideoArgs {
      prompt: "a dinosaur turns to the camera and asks, 'do you have adequate car insurance?' it then stomps off and attacks a brontosaurus".to_string(),
      duration: Some(EnqueueSora2TextToVideoDurationSeconds::Eight),
      aspect_ratio: Some(EnqueueSora2TextToVideoAspectRatio::NineBySixteen),
      resolution: Some(EnqueueSora2TextToVideoResolution::SevenTwentyP),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_sora_2_text_to_video_webhook(args).await?;
    println!("result: {:?}", result);

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_aspect_ratios() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for ar in EnqueueSora2TextToVideoAspectRatio::iter() {
      println!("--- aspect ratio: {:?} ---", ar);
      let args = EnqueueSora2TextToVideoArgs {
        prompt: "a snowy mountain cabin at sunrise".to_string(),
        duration: Some(EnqueueSora2TextToVideoDurationSeconds::Four),
        aspect_ratio: Some(ar),
        resolution: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_sora_2_text_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually run — fires a real API request per variant (expensive)
  async fn test_all_durations() -> AnyhowResult<()> {
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    for dur in EnqueueSora2TextToVideoDurationSeconds::iter() {
      println!("--- duration: {:?} ---", dur);
      let args = EnqueueSora2TextToVideoArgs {
        prompt: "a corgi walks in front of a giant windmill in a beautiful village at sunrise".to_string(),
        duration: Some(dur),
        aspect_ratio: Some(EnqueueSora2TextToVideoAspectRatio::SixteenByNine),
        resolution: None,
        api_key: &api_key,
        webhook_url: "https://example.com/webhook",
      };
      let result = enqueue_sora_2_text_to_video_webhook(args).await?;
      println!("result: {:?}", result);
    }

    Ok(())
  }
}
