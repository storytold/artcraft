use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use crate::model::enqueued_request::EnqueuedRequest;
use fal::endpoints::fal_ai::kling_video::v1_6::pro::image_to_video::{image_to_video, ProImageToVideoRequest};
use fal_client::file_to_base64_url::file_to_base64_url;
use futures::StreamExt;
use std::io::Write;
use std::path::Path;

pub struct Kling16ProArgs<'a, P: AsRef<Path>> {
  pub image_path: P,
  pub prompt: &'a str,
  pub api_key: &'a FalApiKey,
  pub duration: Kling16ProDuration,
  pub aspect_ratio: Kling16ProAspectRatio,
}

#[derive(Copy, Clone, Debug)]
pub enum Kling16ProDuration {
  Default,
  FiveSeconds,
  TenSeconds,
}

#[derive(Copy, Clone, Debug)]
pub enum Kling16ProAspectRatio {
  Square, // 1:1
  WideSixteenNine, // 16:9
  TallNineSixteen, // 9:16
}

pub async fn enqueue_kling_16_pro_image_to_video<P: AsRef<Path>>(args: Kling16ProArgs<'_, P>) -> Result<EnqueuedRequest, FalErrorPlus> {
  let image_url = file_to_base64_url(args.image_path)?;

  let duration = match args.duration{
    Kling16ProDuration::Default => None,
    Kling16ProDuration::FiveSeconds => Some("5".to_string()), // Gross...
    Kling16ProDuration::TenSeconds => Some("10".to_string()),
  };
  
  let aspect_ratio = match args.aspect_ratio {
    Kling16ProAspectRatio::Square => Some("1:1".to_string()),
    Kling16ProAspectRatio::WideSixteenNine => Some("16:9".to_string()),
    Kling16ProAspectRatio::TallNineSixteen => Some("9:16".to_string()),
  };

  let request = ProImageToVideoRequest {
    image_url,
    prompt: args.prompt.to_string(),
    aspect_ratio,
    duration,
    // Maybe expose these later
    cfg_scale: None,
    negative_prompt: None,
    tail_image_url: None,
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
  use crate::requests::queue::video_gen::enqueue_kling_16_pro_image_to_video::{enqueue_kling_16_pro_image_to_video, Kling16ProArgs, Kling16ProAspectRatio, Kling16ProDuration};
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_utils::test_file_path::test_file_path;

  #[tokio::test]
  #[ignore]
  async fn test_kling16_video() -> AnyhowResult<()> {
    let image = test_file_path("test_data/image/juno.jpg")?;

    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;

    let api_key = FalApiKey::from_str(&secret);

    let args = Kling16ProArgs {
      image_path: image,
      prompt: "a corgi looks out over the water",
      api_key: &api_key,
      duration: Kling16ProDuration::Default,
      aspect_ratio: Kling16ProAspectRatio::Square,
    };

    let result = enqueue_kling_16_pro_image_to_video(args).await?;

    Ok(())
  }
}
