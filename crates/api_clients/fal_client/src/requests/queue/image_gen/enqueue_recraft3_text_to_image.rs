use crate::creds::fal_api_key::FalApiKey;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::model::enqueued_request::EnqueuedRequest;
use fal::endpoints::fal_ai::recraft_v3::recraft_v3;
use fal::endpoints::fal_ai::recraft_v3::ImageSizeProperty;
use fal::endpoints::fal_ai::recraft_v3::TextToImageInput;
use futures::StreamExt;
use std::io::Write;

pub struct Recraft3TextToImageArgs<'a> {
  pub prompt: &'a str,
  pub api_key: &'a FalApiKey,
  // TODO: Size parameter
}

pub async fn enqueue_recraft3_text_to_image(args: Recraft3TextToImageArgs<'_>) -> Result<EnqueuedRequest, FalErrorPlus> {
  let request = TextToImageInput {
    image_size: Some(ImageSizeProperty::SquareHd),
    prompt: args.prompt.to_string(),
    style: None, // eg. "realistic_image"
    style_id: None, // LoRA.
    colors: None, // Preferable colors. We can offer this later.
  };

  let result = recraft_v3(request)
      .with_api_key(&args.api_key.0)
      .queue()
      .await;

  let result = match result {
    Ok(result) => result,
    Err(err) => return Err(FalErrorPlus::from(err)),
  };
  
  Ok(EnqueuedRequest::from_queue_response(&result)?)
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::queue::image_gen::enqueue_recraft3_text_to_image::{enqueue_recraft3_text_to_image, Recraft3TextToImageArgs};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test_recraft3() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);
    
    let args = Recraft3TextToImageArgs {
      prompt: "a corgi looks out over the water",
      api_key: &api_key,
    };

    let result = enqueue_recraft3_text_to_image(args).await?;

    Ok(())
  }
}
