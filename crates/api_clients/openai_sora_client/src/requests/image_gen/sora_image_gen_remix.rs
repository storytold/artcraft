use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::error::sora_error::SoraError;
use crate::requests::image_gen::common::{ImageSize, NumImages, SoraImageGenResponse};
use crate::requests::image_gen::image_gen_http_request::{image_gen_http_request, InpaintItem, InpaintItemType, OperationType, RawSoraImageGenRequest, VideoGenType};
use log::info;
use std::time::Duration;

pub struct SoraImageGenRemixRequest<'a> {
  pub prompt: String,
  pub num_images: NumImages,
  pub image_size: ImageSize,
  pub sora_media_tokens: Vec<String>,
  pub credentials: &'a SoraCredentialSet,
  pub request_timeout: Option<Duration>,
}

/// The "remix" commands let you supply additional images as context.
/// Sora "media tokens" of previously uploaded images must be supplied.
pub async fn sora_image_gen_remix(request: SoraImageGenRemixRequest<'_>) -> Result<SoraImageGenResponse, SoraError> {
  let args = RawSoraImageGenRequest {
    r#type: VideoGenType::ImageGen,
    operation: OperationType::Remix,
    prompt: request.prompt,
    n_variants: request.num_images.as_count(),
    width: request.image_size.as_width(),
    height: request.image_size.as_height(),
    n_frames: 1,
    inpaint_items: request.sora_media_tokens.into_iter().map(|token| {
      InpaintItem {
        r#type: InpaintItemType::Image,
        frame_index: 0,
        preset_id: None,
        generation_id: None,
        upload_media_id: token,
        source_start_frame: 0,
        source_end_frame: 0,
        crop_bounds: None,
      }
    }).collect(),
  };

  // TODO: Replace this with debug level logging in the future.
  info!("Sending remix request: {:?}", args);

  let result = image_gen_http_request(args, request.credentials, request.request_timeout).await?;

  Ok(SoraImageGenResponse {
    task_id: result.id,
  })
}

#[cfg(test)]
mod tests {
  use crate::creds::sora_credential_builder::SoraCredentialBuilder;
  use crate::requests::image_gen::common::{ImageSize, NumImages};
  use crate::requests::image_gen::sora_image_gen_remix::{sora_image_gen_remix, SoraImageGenRemixRequest};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_utils::test_file_path::test_file_path;

  #[ignore] // You can manually run "ignore" tests in the IDE, but they won't run in CI.
  #[tokio::test]
  pub async fn manual_test() -> AnyhowResult<()> {
    let sentinel = read_to_string(test_file_path("test_data/temp/sentinel.txt")?)?;
    let sentinel = sentinel.trim().to_string();

    let cookie = read_to_string(test_file_path("test_data/temp/cookie.txt")?)?;
    let cookie = cookie.trim().to_string();

    let bearer = read_to_string(test_file_path("test_data/temp/bearer.txt")?)?;
    let bearer = bearer.trim().to_string();

    let creds = SoraCredentialBuilder::new()
        .with_cookies(&cookie)
        .with_jwt_bearer_token(&bearer)
        .with_sora_sentinel(&sentinel)
        .build()?;

    let response = sora_image_gen_remix(SoraImageGenRemixRequest {
      prompt: "Match the pose and scene layout from the uploaded image exactly. A smart dog getting kisses from another dog. Brick building. Anime style".to_string(),
      num_images: NumImages::One,
      image_size: ImageSize::Square,
      sora_media_tokens: vec!["media_01jqyhrz4detyvtzwp2p4j63ad".to_string()],
      credentials: &creds,
      request_timeout: None,
    }).await?;

    println!("task_id: {}", response.task_id);

    assert!(response.task_id.0.starts_with("task_"));
    Ok(())
  }
}
