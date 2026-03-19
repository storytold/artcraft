use crate::creds::fal_api_key::FalApiKey;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::model::enqueued_request::EnqueuedRequest;
use fal::endpoints::fal_ai::flux_pro::v1_1_ultra::v1_1_ultra;
use fal::endpoints::fal_ai::flux_pro::v1_1_ultra::FluxProUltraTextToImageInput;
use futures::StreamExt;
use std::io::Write;

pub struct FluxPro11UltraTextToImageArgs<'a> {
  pub prompt: &'a str,
  pub api_key: &'a FalApiKey,
  // TODO: Size parameter
}

pub async fn enqueue_flux_pro_11_ultra_text_to_image(args: FluxPro11UltraTextToImageArgs<'_>) -> Result<EnqueuedRequest, FalErrorPlus> {
  let request = FluxProUltraTextToImageInput {
    prompt: args.prompt.to_string(),
    // Maybe expose
    aspect_ratio: None, // Default is "16:9"
    num_images: Some(1), // Default is 1
    seed: None,
    raw: Some(true), // Generate less processed, more natural-looking images. Default is false.
    // Maybe abstract
    enable_safety_checker: Some(false),
    safety_tolerance: Some("5".to_string()), // 1 is most strict, 5 is most permissive
    // Constants
    output_format: Some("png".to_string()),
    sync_mode: None, // Synchronous / slow
  };

  let result = v1_1_ultra(request)
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
  use crate::requests::queue::image_gen::enqueue_flux_pro_11_ultra_text_to_image::{enqueue_flux_pro_11_ultra_text_to_image, FluxPro11UltraTextToImageArgs};
  use errors::AnyhowResult;
  use std::fs::read_to_string;

  #[tokio::test]
  #[ignore]
  async fn test_flux_pro() -> AnyhowResult<()> {
    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);
    
    let args = FluxPro11UltraTextToImageArgs {
      prompt: "a corgi smiles at the camera, inside retro video game store, lots of sci-fi props from Cowboy Bebop, photorealistic",
      api_key: &api_key,
    };

    let result = enqueue_flux_pro_11_ultra_text_to_image(args).await?;

    Ok(())
  }
}
