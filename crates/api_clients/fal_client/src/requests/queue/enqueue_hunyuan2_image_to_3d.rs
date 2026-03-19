use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::model::enqueued_request::EnqueuedRequest;
use fal::endpoints::fal_ai::hunyuan3d::v2::v2;
use fal::endpoints::fal_ai::hunyuan3d::v2::Hunyuan3DInput;
use fal_client::file_to_base64_url::file_to_base64_url;
use futures::StreamExt;
use std::io::Write;
use std::path::Path;

pub struct Hunyuan2Args<'a, P: AsRef<Path>> {
  pub image_path: P,
  pub api_key: &'a FalApiKey,
}

pub async fn enqueue_hunyuan2_image_to_3d<P: AsRef<Path>>(args: Hunyuan2Args<'_, P>) -> Result<EnqueuedRequest, FalErrorPlus> {
  let image_url = file_to_base64_url(args.image_path)?;

  let request = Hunyuan3DInput {
    input_image_url: image_url,
    textured_mesh: Some(true),
    guidance_scale: None,
    num_inference_steps: None,
    octree_resolution: None,
    seed: None,
  };

  let result = v2(request)
      .with_api_key(&args.api_key.0)
      .queue()
      .await;
  
  let result = match result {
    Ok(result) => result,
    Err(err) => return Err(classify_fal_error(err)),
  };
  
  Ok(EnqueuedRequest::from_queue_response(&result)?)
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::queue::enqueue_hunyuan2_image_to_3d::{enqueue_hunyuan2_image_to_3d, Hunyuan2Args};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_utils::test_file_path::test_file_path;

  #[tokio::test]
  #[ignore]
  async fn test() -> AnyhowResult<()> {
    let image = test_file_path("test_data/image/juno.jpg")?;

    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Hunyuan2Args {
      image_path: image,
      api_key: &api_key,
    };

    let result = enqueue_hunyuan2_image_to_3d(args).await?;

    Ok(())
  }
}
