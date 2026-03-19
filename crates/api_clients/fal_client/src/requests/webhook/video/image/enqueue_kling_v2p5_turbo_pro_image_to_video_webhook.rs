use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::video::image::http_kling_v2p5_turbo_pro_image_to_video::{kling_v2p5_turbo_pro_image_to_video, KlingV2p5TurboProImageToVideoInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueKlingV2p5TurboProImageToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,
  pub image_url: String,

  // Optional args
  pub tail_image_url: Option<String>,
  pub negative_prompt: Option<String>,

  pub duration: Option<EnqueueKlingV2p5TurboProImageToVideoDurationSeconds>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Copy, Clone, Debug)]
pub enum EnqueueKlingV2p5TurboProImageToVideoDurationSeconds {
  Five,
  Ten,
}

impl <U: IntoUrl> FalRequestCostCalculator for EnqueueKlingV2p5TurboProImageToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "For 5s video your request will cost $0.35.
    //  For every additional second you will be charged $0.07."
    match self.duration {
      None => 35, // $0.35
      Some(EnqueueKlingV2p5TurboProImageToVideoDurationSeconds::Five) => 35, // $0.35
      Some(EnqueueKlingV2p5TurboProImageToVideoDurationSeconds::Ten) => 70, // $0.35 + (5 * $0.07) = $0.70
    }
  }
}


/// Kling 2.5 Turbo Pro Image-to-Video
/// https://fal.ai/models/fal-ai/kling-video/v2.5-turbo/pro/image-to-video
pub async fn enqueue_kling_v2p5_turbo_pro_image_to_video_webhook<R: IntoUrl>(
  args: EnqueueKlingV2p5TurboProImageToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  // NB: Defaults to 5 seconds
  let duration = args.duration
      .map(|resolution| match resolution {
        EnqueueKlingV2p5TurboProImageToVideoDurationSeconds::Five => "5",
        EnqueueKlingV2p5TurboProImageToVideoDurationSeconds::Ten => "10",
      })
      .map(|resolution| resolution.to_string());

  let request = KlingV2p5TurboProImageToVideoInput {
    prompt: args.prompt,
    image_url: args.image_url,
    // Optionals
    duration,
    tail_image_url: args.tail_image_url,
    negative_prompt: args.negative_prompt,
    // Constants
    cfg_scale: None,
  };

  let result = kling_v2p5_turbo_pro_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::image::enqueue_kling_v2p5_turbo_pro_image_to_video_webhook::{enqueue_kling_v2p5_turbo_pro_image_to_video_webhook, EnqueueKlingV2p5TurboProImageToVideoArgs, EnqueueKlingV2p5TurboProImageToVideoDurationSeconds};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::TREX_SKELETON_IMAGE_URL;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/home/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueKlingV2p5TurboProImageToVideoArgs {
      image_url: TREX_SKELETON_IMAGE_URL.to_string(),
      prompt: "the t-rex skeleton gets off the podium and begins walking to the camera. the camera orbits slightly. The t-rex gets close and then bites.".to_string(),
      negative_prompt: None,
      tail_image_url: None,
      duration: Some(EnqueueKlingV2p5TurboProImageToVideoDurationSeconds::Five),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_kling_v2p5_turbo_pro_image_to_video_webhook(args).await?;

    Ok(())
  }
}
