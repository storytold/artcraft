use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::video::image::http_kling_v2p5_turbo_standard_image_to_video::{kling_v2p5_turbo_standard_image_to_video, KlingV2p5TurboStandardImageToVideoInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueKlingV2p5TurboStandardImageToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,
  pub image_url: String,

  // Optional args
  pub negative_prompt: Option<String>,
  pub duration: Option<EnqueueKlingV2p5TurboStandardImageToVideoDurationSeconds>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueKlingV2p5TurboStandardImageToVideoDurationSeconds {
  Five,
  Ten,
}


impl <U: IntoUrl> FalRequestCostCalculator for EnqueueKlingV2p5TurboStandardImageToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "For 5s video your request will cost $0.21.
    //  For every additional second you will be charged $0.042."
    match self.duration {
      None => 21, // $0.21
      Some(EnqueueKlingV2p5TurboStandardImageToVideoDurationSeconds::Five) => 21, // $0.21
      Some(EnqueueKlingV2p5TurboStandardImageToVideoDurationSeconds::Ten) => 42, // $0.21 + (5 * $0.042) = $0.42
    }
  }
}

/// Kling 2.5 Turbo Standard Image-to-Video
/// https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/standard/image-to-video
pub async fn enqueue_kling_v2p5_turbo_standard_image_to_video_webhook<R: IntoUrl>(
  args: EnqueueKlingV2p5TurboStandardImageToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  // NB: Defaults to 5 seconds.
  let duration = args.duration
      .map(|resolution| match resolution {
        EnqueueKlingV2p5TurboStandardImageToVideoDurationSeconds::Five => "5",
        EnqueueKlingV2p5TurboStandardImageToVideoDurationSeconds::Ten => "10",
      })
      .map(|resolution| resolution.to_string());

  let request = KlingV2p5TurboStandardImageToVideoInput {
    prompt: args.prompt,
    image_url: args.image_url,
    // Optionals
    duration,
    negative_prompt: args.negative_prompt,
    // Constants
    cfg_scale: None,
  };

  let result = kling_v2p5_turbo_standard_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::image::enqueue_kling_v2p5_turbo_standard_image_to_video_webhook::{enqueue_kling_v2p5_turbo_standard_image_to_video_webhook, EnqueueKlingV2p5TurboStandardImageToVideoArgs, EnqueueKlingV2p5TurboStandardImageToVideoDurationSeconds};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::TREX_SKELETON_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/home/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueKlingV2p5TurboStandardImageToVideoArgs {
      image_url: TREX_SKELETON_IMAGE_URL.to_string(),
      prompt: "the t-rex skeleton gets off the podium and begins walking to the camera. the camera orbits slightly. The t-rex gets close and then bites.".to_string(),
      negative_prompt: None,
      duration: Some(EnqueueKlingV2p5TurboStandardImageToVideoDurationSeconds::Five),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_kling_v2p5_turbo_standard_image_to_video_webhook(args).await?;

    Ok(())
  }
}
