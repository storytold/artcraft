use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::object::http_hunyuan3d_v21_image_to_3d::{hunyuan3d_v21_image_to_3d, Hunyuan3dV21ImageTo3dInput};
use crate::requests::core_api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct Hunyuan3d21Args<'a, R: IntoUrl> {
  pub request: Hunyuan3d21Request,
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Clone, Debug)]
pub struct Hunyuan3d21Request {
  pub image_url: String,
}

pub async fn enqueue_hunyuan_3d_2_1_image_to_3d_webhook<R: IntoUrl>(
  args: Hunyuan3d21Args<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {
  let req = args.request;

  let request = Hunyuan3dV21ImageTo3dInput {
    input_image_url: req.image_url,
    textured_mesh: Some(true),
    // TODO: Maybe expose these later
    guidance_scale: None,
    num_inference_steps: None,
    octree_resolution: None,
    seed: None,
  };

  let result = hunyuan3d_v21_image_to_3d(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::webhook::object::enqueue_hunyuan_3d_21_image_to_3d_webhook::{enqueue_hunyuan_3d_2_1_image_to_3d_webhook, Hunyuan3d21Args, Hunyuan3d21Request};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test_hunyuan3d_21() -> AnyhowResult<()> {
    let image_url = "https://cdn-2.fakeyou.com/media/p/a/c/7/j/pac7jgp2tkehm7j7sm4sky1fpnkrnbve/image_pac7jgp2tkehm7j7sm4sky1fpnkrnbve.png";

    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Hunyuan3d21Args {
      request: Hunyuan3d21Request {
        image_url: image_url.to_string(),
      },
      api_key: &api_key,
      webhook_url: "https://example.com/webhook",
    };

    let result = enqueue_hunyuan_3d_2_1_image_to_3d_webhook(args).await?;

    Ok(())
  }
}
