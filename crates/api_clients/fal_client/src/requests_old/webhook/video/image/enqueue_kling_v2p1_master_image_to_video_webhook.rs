use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests_old::http::video::image::http_kling_v2p1_master_image_to_video::{kling_v2p1_master_image_to_video, KlingV2p1MasterImageToVideoInput};
use crate::requests::core_api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};

pub struct Kling2p1MasterArgs<'a, R: IntoUrl> {
  pub request: Kling2p1MasterRequest,
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Clone, Debug)]
pub struct Kling2p1MasterRequest {
  pub image_url: String,
  pub prompt: String,
  pub duration: Kling2p1MasterDuration,
  pub aspect_ratio: Kling2p1MasterAspectRatio,
}

#[derive(Copy, Clone, Debug)]
pub enum Kling2p1MasterDuration {
  Default,
  FiveSeconds,
  TenSeconds,
}

#[derive(Copy, Clone, Debug)]
pub enum Kling2p1MasterAspectRatio {
  Square, // 1:1
  WideSixteenNine, // 16:9
  TallNineSixteen, // 9:16
}

impl FalRequestCostCalculator for Kling2p1MasterRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "For 5s video your request will cost $1.40.
    //  For every additional second you will be charged $0.28."
    match self.duration {
      Kling2p1MasterDuration::Default => 140, // $1.40 for 5 seconds
      Kling2p1MasterDuration::FiveSeconds => 140, // $1.40 for 5 seconds
      Kling2p1MasterDuration::TenSeconds => 280, // $1.40 + (0.28 * 5) = $2.80
    }
  }
}


/// Kling 2.1 Master Image-to-Video
/// https://fal.ai/models/fal-ai/kling-video/v2.1/master/image-to-video
pub async fn enqueue_kling_v2p1_master_image_to_video_webhook<R: IntoUrl>(
  args: Kling2p1MasterArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {
  let req = args.request;

  let duration = match req.duration {
    Kling2p1MasterDuration::Default => None, // defaults to "5"
    Kling2p1MasterDuration::FiveSeconds => Some("5".to_string()), // Gross...
    Kling2p1MasterDuration::TenSeconds => Some("10".to_string()),
  };

  let aspect_ratio = match req.aspect_ratio {
    Kling2p1MasterAspectRatio::Square => Some("1:1".to_string()),
    Kling2p1MasterAspectRatio::WideSixteenNine => Some("16:9".to_string()),
    Kling2p1MasterAspectRatio::TallNineSixteen => Some("9:16".to_string()),
  };

  let request = KlingV2p1MasterImageToVideoInput {
    image_url: req.image_url,
    prompt: req.prompt,
    aspect_ratio,
    duration,
    // Maybe expose these later
    cfg_scale: None,
    negative_prompt: None,
    tail_image_url: None,
  };

  let result = kling_v2p1_master_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}


#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests_old::webhook::video::image::enqueue_kling_v2p1_master_image_to_video_webhook::{enqueue_kling_v2p1_master_image_to_video_webhook, Kling2p1MasterArgs, Kling2p1MasterRequest, Kling2p1MasterAspectRatio, Kling2p1MasterDuration};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test_kling21_master_video() -> AnyhowResult<()> {
    let image_url = "https://cdn-2.fakeyou.com/media/3/4/h/f/s/34hfsmt8e38rvne6mwa4pwbxr6292sgy/image_34hfsmt8e38rvne6mwa4pwbxr6292sgy.png";

    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Kling2p1MasterArgs {
      request: Kling2p1MasterRequest {
        image_url: image_url.to_string(),
        prompt: "a shot of the mountains, the camera rotates around to show the mountain range, the sun begins to set, and the moon becomes visible".to_string(),
        duration: Kling2p1MasterDuration::Default,
        aspect_ratio: Kling2p1MasterAspectRatio::WideSixteenNine,
      },
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_kling_v2p1_master_image_to_video_webhook(args).await?;

    Ok(())
  }
}
