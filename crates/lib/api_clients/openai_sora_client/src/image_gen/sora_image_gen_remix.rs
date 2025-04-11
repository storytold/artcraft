use errors::AnyhowResult;
use crate::credentials::SoraCredentials;
use crate::image_gen::common::{ImageSize, NumImages, SoraImageGenResponse};
use crate::image_gen::image_gen_http_request::{image_gen_http_request, InpaintItem, InpaintItemType, OperationType, RawSoraImageGenRequest, SoraError, VideoGenType};

pub struct SoraImageGenRemixRequest<'a> {
  pub prompt: String,
  pub num_images: NumImages,
  pub image_size: ImageSize,
  pub sora_media_tokens: Vec<String>,
  pub credentials: &'a SoraCredentials,
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

  let result = image_gen_http_request(args, &request.credentials).await?;

  Ok(SoraImageGenResponse {
    task_id: result.id,
  })
}

#[cfg(test)]
mod tests {
  use std::fs::read_to_string;
  use errors::AnyhowResult;
  use testing::test_file_path::test_file_path;
  use crate::credentials::SoraCredentials;
  use crate::image_gen::common::{ImageSize, NumImages};
  use crate::image_gen::sora_image_gen_remix::{sora_image_gen_remix, SoraImageGenRemixRequest};

  #[ignore] // You can manually run "ignore" tests in the IDE, but they won't run in CI.
  #[tokio::test]
  pub async fn manual_test() -> AnyhowResult<()> {
    let sentinel = read_to_string(test_file_path("test_data/temp/sentinel.txt")?)?;
    let sentinel = sentinel.trim().to_string();

    let cookie = read_to_string(test_file_path("test_data/temp/cookie.txt")?)?;
    let cookie = cookie.trim().to_string();

    let bearer = read_to_string(test_file_path("test_data/temp/bearer.txt")?)?;
    let bearer = bearer.trim().to_string();

    let creds = SoraCredentials {
      bearer_token: bearer,
      cookie,
      sentinel: Some(sentinel),
    };

    let response = sora_image_gen_remix(SoraImageGenRemixRequest {
      prompt: "Match the pose and scene layout from the uploaded image exactly. A smart dog getting kisses from another dog. Brick building. Anime style".to_string(),
      num_images: NumImages::One,
      image_size: ImageSize::Square,
      sora_media_tokens: vec!["media_01jqyhrz4detyvtzwp2p4j63ad".to_string()],
      credentials: &creds,
    }).await?;

    println!("task_id: {}", response.task_id);

    assert!(response.task_id.starts_with("task_"));
    Ok(())
  }
}
