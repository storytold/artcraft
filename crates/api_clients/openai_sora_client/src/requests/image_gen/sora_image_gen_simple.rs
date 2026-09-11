use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::error::sora_error::SoraError;
use crate::requests::image_gen::common::{ImageSize, NumImages, SoraImageGenResponse};
use crate::requests::image_gen::image_gen_http_request::{image_gen_http_request, OperationType, RawSoraImageGenRequest, VideoGenType};
use std::time::Duration;

pub struct SoraImageGenSimpleRequest<'a> {
  pub prompt: String,
  pub num_images: NumImages,
  pub image_size: ImageSize,
  pub credentials: &'a SoraCredentialSet,
  pub request_timeout: Option<Duration>,
}

pub async fn sora_image_gen_simple(args: SoraImageGenSimpleRequest<'_>) -> Result<SoraImageGenResponse, SoraError> {
  let sora_request = RawSoraImageGenRequest {
    r#type: VideoGenType::ImageGen,
    operation: OperationType::SimpleCompose,
    prompt: args.prompt,
    n_variants: args.num_images.as_count(),
    width: args.image_size.as_width(),
    height: args.image_size.as_height(),
    n_frames: 1,
    inpaint_items: vec![],
  };

  let result = image_gen_http_request(
    sora_request, 
    args.credentials, 
    args.request_timeout
  ).await?;

  Ok(SoraImageGenResponse {
    task_id: result.id,
  })
}

#[cfg(test)]
mod tests {
  use crate::requests::image_gen::common::{ImageSize, NumImages};
  use crate::requests::image_gen::sora_image_gen_simple::{sora_image_gen_simple, SoraImageGenSimpleRequest};
  use crate::test_utils::get_test_credentials::get_test_credentials;
  use errors::AnyhowResult;

  #[ignore] // You can manually run "ignore" tests in the IDE, but they won't run in CI.
  #[tokio::test]
  pub async fn manual_test() -> AnyhowResult<()> {
    let creds = get_test_credentials()?;

    let response = sora_image_gen_simple(SoraImageGenSimpleRequest {
      prompt: "A pirate ship catches on fire as an alien ufo attacks it, photorealistic".to_string(),
      num_images: NumImages::One,
      image_size: ImageSize::Square,
      credentials: &creds,
      request_timeout: None,
    }).await?;

    println!("task_id: {}", response.task_id);

    assert!(response.task_id.0.starts_with("task_"));
    assert_eq!(1, 2);
    Ok(())
  }
}