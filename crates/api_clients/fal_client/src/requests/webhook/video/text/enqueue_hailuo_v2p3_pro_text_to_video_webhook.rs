use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::traits::fal_request_cost_calculator_trait::{FalRequestCostCalculator, UsdCents};
use crate::requests::http::video::text::http_hailuo_v2p3_pro_text_to_video::{hailuo_v2p3_pro_text_to_video, HailuoV2p3ProTextToVideoInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct EnqueueHailuoV2p3ProTextToVideoArgs<'a, R: IntoUrl> {
  // Request required
  pub prompt: String,

  // Optional args
  pub prompt_optimizer: Option<bool>,

  // Fulfillment
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

impl <U: IntoUrl> FalRequestCostCalculator for EnqueueHailuoV2p3ProTextToVideoArgs<'_, U> {
  fn calculate_cost_in_cents(&self) -> UsdCents {
    /// "Your request will cost $0.49 per video generation."
    49
  }
}


/// Hailuo 2.3 Pro Text-to-Video
/// https://fal.ai/models/fal-ai/minimax/hailuo-2.3/pro/text-to-video
pub async fn enqueue_hailuo_v2p3_pro_text_to_video_webhook<R: IntoUrl>(
  args: EnqueueHailuoV2p3ProTextToVideoArgs<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {

  let prompt_optimizer = args.prompt_optimizer.unwrap_or(true);

  let request = HailuoV2p3ProTextToVideoInput {
    prompt: args.prompt,
    // Optionals
    prompt_optimizer: Some(prompt_optimizer),
  };

  let result = hailuo_v2p3_pro_text_to_video(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::video::text::enqueue_hailuo_v2p3_pro_text_to_video_webhook::{enqueue_hailuo_v2p3_pro_text_to_video_webhook, EnqueueHailuoV2p3ProTextToVideoArgs};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/home/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = EnqueueHailuoV2p3ProTextToVideoArgs {
      prompt: "a gray alien with big eyes dressed in an american flag tank top gives the peace symbol, it then barbecues some hot dogs on the grill".to_string(),
      prompt_optimizer: Some(true),
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_hailuo_v2p3_pro_text_to_video_webhook(args).await?;

    Ok(())
  }
}
