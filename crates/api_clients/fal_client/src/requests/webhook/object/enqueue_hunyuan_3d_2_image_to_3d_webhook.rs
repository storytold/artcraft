use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::requests::http::object::http_hunyuan3d_v2_image_to_3d::{hunyuan3d_v2_image_to_3d, Hunyuan3dV2ImageTo3dInput};
use crate::requests::api::webhook_response::WebhookResponse;
use reqwest::IntoUrl;

pub struct Hunyuan3d2Args<'a, U: IntoUrl, V: IntoUrl> {
  pub image_url: U,
  pub webhook_url: V,
  pub api_key: &'a FalApiKey,
}

pub async fn enqueue_hunyuan_3d_2_image_to_3d_webhook<U: IntoUrl, V: IntoUrl>(
  args: Hunyuan3d2Args<'_, U, V>
) -> Result<WebhookResponse, FalErrorPlus> {
  
  let image_url = args.image_url.as_str().to_string();

  let request = Hunyuan3dV2ImageTo3dInput {
    input_image_url: image_url,
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
