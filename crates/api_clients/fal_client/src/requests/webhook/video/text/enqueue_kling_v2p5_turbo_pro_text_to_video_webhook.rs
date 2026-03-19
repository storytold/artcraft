use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::video::text::http_kling_v2p5_turbo_pro_text_to_video::{kling_v2p5_turbo_pro_text_to_video, KlingV2p5TurboProTextToVideoInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueKlingV2p5TurboProTextToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,

  // Optional args
  pub negative_prompt: Option<String>,
  pub duration: Option<EnqueueKlingV2p5TurboProTextToVideoDurationSeconds>,
  pub aspect_ratio: Option<EnqueueKlingV2p5TurboProTextToVideoAspectRatio>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueKlingV2p5TurboProTextToVideoDurationSeconds {
  Five,
  Ten,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueKlingV2p5TurboProTextToVideoAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}


impl <U: IntoUrl> FalRequestCostCalculator for EnqueueKlingV2p5TurboProTextToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "For 5s video your request will cost $0.35.
    //  For every additional second you will be charged $0.07."
    match self.duration {
      None => 35, // $0.35
      Some(EnqueueKlingV2p5TurboProTextToVideoDurationSeconds::Five) => 35, // $0.35
      Some(EnqueueKlingV2p5TurboProTextToVideoDurationSeconds::Ten) => 70, // $0.35 + (5 * $0.07) = $0.70
    }
  }
}


/// Kling 2.5 Turbo Pro Text-to-Video
/// https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/text-to-video
pub async fn enqueue_kling_v2p5_turbo_pro_text_to_video_webhook<R: IntoUrl>(
  args: EnqueueKlingV2p5TurboProTextToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let duration = args.duration
      .map(|resolution| match resolution {
        EnqueueKlingV2p5TurboProTextToVideoDurationSeconds::Five => "5",
        EnqueueKlingV2p5TurboProTextToVideoDurationSeconds::Ten => "10",
      })
      .map(|s| s.to_string());
  
  let aspect_ratio = args.aspect_ratio
      .map(|aspect| match aspect {
        EnqueueKlingV2p5TurboProTextToVideoAspectRatio::Square => "1:1",
        EnqueueKlingV2p5TurboProTextToVideoAspectRatio::SixteenByNine => "16:9",
        EnqueueKlingV2p5TurboProTextToVideoAspectRatio::NineBySixteen => "9:16",
      })
      .map(|s| s.to_string());

  let request = KlingV2p5TurboProTextToVideoInput {
    prompt: args.prompt,
    // Optionals
    duration,
    aspect_ratio,
    negative_prompt: args.negative_prompt,
    // Constants
    cfg_scale: None,
  };

  let result = kling_v2p5_turbo_pro_text_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::text::enqueue_kling_v2p5_turbo_pro_text_to_video_webhook::{enqueue_kling_v2p5_turbo_pro_text_to_video_webhook, EnqueueKlingV2p5TurboProTextToVideoArgs, EnqueueKlingV2p5TurboProTextToVideoAspectRatio, EnqueueKlingV2p5TurboProTextToVideoDurationSeconds};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/home/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueKlingV2p5TurboProTextToVideoArgs {
      prompt: "an owl flies by an abandoned castle at dusk. the camera tracks the flying owl. the castle stones are damp and gritty. there are lots of trees. fireflies dance over the fields".to_string(),
      negative_prompt: None,
      aspect_ratio: Some(EnqueueKlingV2p5TurboProTextToVideoAspectRatio::SixteenByNine),
      duration: Some(EnqueueKlingV2p5TurboProTextToVideoDurationSeconds::Five),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_kling_v2p5_turbo_pro_text_to_video_webhook(args).await?;

    Ok(())
  }
}
