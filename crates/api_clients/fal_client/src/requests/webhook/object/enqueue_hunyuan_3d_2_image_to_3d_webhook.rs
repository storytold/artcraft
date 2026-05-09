use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::object::http_hunyuan3d_v2_image_to_3d::{hunyuan3d_v2_image_to_3d, Hunyuan3dV2ImageTo3dInput};
use crate::requests::core_api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct Hunyuan3d2Args<'a, R: IntoUrl> {
  pub request: Hunyuan3d2Request,
  pub webhook_url: R,
  pub api_key: &'a FalApiKey,
}

#[derive(Clone, Debug)]
pub struct Hunyuan3d2Request {
  pub image_url: String,
}

pub async fn enqueue_hunyuan_3d_2_image_to_3d_webhook<R: IntoUrl>(
  args: Hunyuan3d2Args<'_, R>
) -> Result<WebhookResponse, FalErrorPlus> {
  let req = args.request;

  let request = Hunyuan3dV2ImageTo3dInput {
    input_image_url: req.image_url,
    textured_mesh: Some(true),
    guidance_scale: None,
    num_inference_steps: None,
    octree_resolution: None,
    seed: None,
  };

  let result = hunyuan3d_v2_image_to_3d(request)
      .with_api_key(&args.api_key.0)
      .queue_webhook(args.webhook_url)
      .await;

  result.map_err(|err| classify_fal_error(err))
}
