use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::video::image::http_kling_v1p6_pro_image_to_video::{kling_v1p6_pro_image_to_video, KlingV1p6ProImageToVideoInput};
use crate::requests::core_api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct Kling1p6ProArgs<'a, R: IntoUrl> {
  pub request: Kling1p6ProRequest,
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Clone, Debug)]
pub struct Kling1p6ProRequest {
  pub image_url: String,
  pub end_frame_image_url: Option<String>,
  pub prompt: String,
  pub duration: Kling1p6ProDuration,
  pub aspect_ratio: Kling1p6ProAspectRatio,
}

#[derive(Copy, Clone, Debug)]
pub enum Kling1p6ProDuration {
  Default,
  FiveSeconds,
  TenSeconds,
}

#[derive(Copy, Clone, Debug)]
pub enum Kling1p6ProAspectRatio {
  Square, // 1:1
  WideSixteenNine, // 16:9
  TallNineSixteen, // 9:16
}

impl FalRequestCostCalculator for Kling1p6ProRequest {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    // "Your request will cost $0.095 per second."
    match self.duration {
      Kling1p6ProDuration::Default => 48, // $0.095 * 5 = $0.475 (round up)
      Kling1p6ProDuration::FiveSeconds => 48, // $0.095 * 5 = $0.475 (round up)
      Kling1p6ProDuration::TenSeconds => 95, // $0.095 * 10 = $0.95
    }
  }
}


/// Kling 1.6 Pro Image-to-Video
/// https://fal.ai/models/fal-ai/kling-video/v1.6/pro/image-to-video
pub async fn enqueue_kling_v1p6_pro_image_to_video_webhook<R: IntoUrl>(
  args: Kling1p6ProArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {
  let req = args.request;

  let duration = match req.duration {
    Kling1p6ProDuration::Default => None, // defaults to "5"
    Kling1p6ProDuration::FiveSeconds => Some("5".to_string()), // Gross...
    Kling1p6ProDuration::TenSeconds => Some("10".to_string()),
  };

  let aspect_ratio = match req.aspect_ratio {
    Kling1p6ProAspectRatio::Square => Some("1:1".to_string()),
    Kling1p6ProAspectRatio::WideSixteenNine => Some("16:9".to_string()),
    Kling1p6ProAspectRatio::TallNineSixteen => Some("9:16".to_string()),
  };

  let request = KlingV1p6ProImageToVideoInput {
    image_url: req.image_url,
    tail_image_url: req.end_frame_image_url,
    prompt: req.prompt,
    aspect_ratio,
    duration,
    // Maybe expose these later
    cfg_scale: None,
    negative_prompt: None,
  };

  let result = kling_v1p6_pro_image_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::image::enqueue_kling_v1p6_pro_image_to_video_webhook::{enqueue_kling_v1p6_pro_image_to_video_webhook, Kling1p6ProArgs, Kling1p6ProRequest, Kling1p6ProAspectRatio, Kling1p6ProDuration};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_data::web::image_urls::{JUNO_AT_LAKE_IMAGE_URL, TALL_MOCHI_WITH_GLASSES_IMAGE_URL};

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Kling1p6ProArgs {
      request: Kling1p6ProRequest {
        image_url: TALL_MOCHI_WITH_GLASSES_IMAGE_URL.to_string(),
        end_frame_image_url: Some(JUNO_AT_LAKE_IMAGE_URL.to_string()),
        prompt: "shiba in glasses runs to the lake and stands by the shore".to_string(),
        duration: Kling1p6ProDuration::Default,
        aspect_ratio: Kling1p6ProAspectRatio::WideSixteenNine,
      },
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_kling_v1p6_pro_image_to_video_webhook(args).await?;

    Ok(())
  }
}
