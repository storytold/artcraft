use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::model::enqueued_request::EnqueuedRequest;
use fal::endpoints::fal_ai::minimax::image_to_video::image_to_video;
use fal::endpoints::fal_ai::minimax::image_to_video::ImageToVideoRequest;
use fal_client::file_to_base64_url::file_to_base64_url;
use futures::StreamExt;
use std::io::Write;
use std::path::Path;

pub struct Minimax01Args<'a, P: AsRef<Path>> {
  pub image_path: P,
  pub prompt: &'a str,
  pub api_key: &'a FalApiKey,
}

pub async fn enqueue_minimax_01_image_to_video<P: AsRef<Path>>(args: Minimax01Args<'_, P>) -> Result<EnqueuedRequest, FalErrorPlus> {
  let image_url = file_to_base64_url(args.image_path)?;

  let request = ImageToVideoRequest {
    image_url,
    prompt: args.prompt.to_string(),
    prompt_optimizer: None,
  };

  let result = image_to_video(request)
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
  use crate::requests::queue::video_gen::enqueue_minimax_01_image_to_video::{enqueue_minimax_01_image_to_video, Minimax01Args};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_utils::test_file_path::test_file_path;

  #[tokio::test]
  #[ignore]
  async fn test_minimax_video() -> AnyhowResult<()> {
    let image = test_file_path("test_data/image/juno.jpg")?;

    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Minimax01Args {
      image_path: image,
      prompt: "a dog jumps into the water",
      api_key: &api_key,
    };

    let result = enqueue_minimax_01_image_to_video(args).await?;
    
    println!("Request ID: {:?}", result.request_id);

    Ok(())
  }
}
