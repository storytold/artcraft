use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::video::text::http_veo_3p1_text_to_video::{veo_3p1_text_to_video, Veo3p1TextToVideoInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueVeo3p1TextToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,

  // Optional args
  pub duration: Option<EnqueueVeo3p1TextToVideoDurationSeconds>,
  pub aspect_ratio: Option<EnqueueVeo3p1TextToVideoAspectRatio>,
  pub resolution: Option<EnqueueVeo3p1TextToVideoResolution>,
  pub generate_audio: Option<bool>,
  pub enhance_prompt: Option<bool>,
  pub negative_prompt: Option<String>,
  pub seed: Option<i64>,
  pub auto_fix: Option<bool>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueVeo3p1TextToVideoDurationSeconds {
  Four,
  Six,
  Eight,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueVeo3p1TextToVideoAspectRatio {
  Auto,
  SixteenByNine,
  NineBySixteen,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueVeo3p1TextToVideoResolution {
  SevenTwentyP,
  TenEightyP,
}


impl <R: IntoUrl> FalRequestCostCalculator for EnqueueVeo3p1TextToVideoArgs<'_, R> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "For every second of video you generated, you will be charged
    //  $0.20 (audio off) or
    //  $0.40 (audio on).
    //  For example, a 5s video with audio on will cost $2."
    let duration = self.duration
        .unwrap_or(EnqueueVeo3p1TextToVideoDurationSeconds::Eight);

    let generate_audio = self.generate_audio.unwrap_or(true);

    match (duration, generate_audio) {
      (EnqueueVeo3p1TextToVideoDurationSeconds::Four, false) => 80,
      (EnqueueVeo3p1TextToVideoDurationSeconds::Six, false) => 120,
      (EnqueueVeo3p1TextToVideoDurationSeconds::Eight, false) => 160,
      (EnqueueVeo3p1TextToVideoDurationSeconds::Four, true) => 160,
      (EnqueueVeo3p1TextToVideoDurationSeconds::Six, true) => 240,
      (EnqueueVeo3p1TextToVideoDurationSeconds::Eight, true) => 320,
    }
  }
}


/// Veo 3.1 Text-to-Video
/// https://fal.ai/models/fal-ai/veo3.1
pub async fn enqueue_veo_3p1_text_to_video_webhook<R: IntoUrl>(
  args: EnqueueVeo3p1TextToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|resolution| match resolution {
        EnqueueVeo3p1TextToVideoDurationSeconds::Four => "4s",
        EnqueueVeo3p1TextToVideoDurationSeconds::Six => "6s",
        EnqueueVeo3p1TextToVideoDurationSeconds::Eight=> "8s",
      })
      .map(|s| s.to_string());

  let aspect_ratio = args.aspect_ratio
      .map(|aspect_ratio| match aspect_ratio {
        EnqueueVeo3p1TextToVideoAspectRatio::Auto => "auto",
        EnqueueVeo3p1TextToVideoAspectRatio::SixteenByNine => "16:9",
        EnqueueVeo3p1TextToVideoAspectRatio::NineBySixteen => "9:16",
      })
      .map(|s| s.to_string());

  let resolution = args.resolution
      .map(|resolution| match resolution {
        EnqueueVeo3p1TextToVideoResolution::SevenTwentyP => "720p",
        EnqueueVeo3p1TextToVideoResolution::TenEightyP => "1080p",
      })
      .map(|s| s.to_string());

  let request = Veo3p1TextToVideoInput {
    prompt: args.prompt,
    // Optionals
    duration,
    aspect_ratio,
    resolution,
    negative_prompt: args.negative_prompt,
    generate_audio: args.generate_audio,
    enhance_prompt: args.enhance_prompt,
    seed: args.seed,
    auto_fix: args.auto_fix,
  };

  let result = veo_3p1_text_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::text::enqueue_veo_3p1_text_to_video_webhook::{enqueue_veo_3p1_text_to_video_webhook, EnqueueVeo3p1TextToVideoArgs, EnqueueVeo3p1TextToVideoAspectRatio, EnqueueVeo3p1TextToVideoDurationSeconds, EnqueueVeo3p1TextToVideoResolution};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/home/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueVeo3p1TextToVideoArgs {
      prompt: "An alien space ship hovers over new york city. it looks ominous, ready to attack. suddenly, it drops a bunch of ping pong balls on the city".to_string(),
      duration: Some(EnqueueVeo3p1TextToVideoDurationSeconds::Eight),
      aspect_ratio: Some(EnqueueVeo3p1TextToVideoAspectRatio::SixteenByNine),
      resolution: Some(EnqueueVeo3p1TextToVideoResolution::TenEightyP),
      generate_audio: Some(true),
      negative_prompt: None,
      enhance_prompt: Some(true),
      auto_fix: Some(true),
      seed: None,
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_veo_3p1_text_to_video_webhook(args).await?;

    Ok(())
  }
}
