use crate::creds::fal_api_key::FalApiKey;
use crate::error::classify_fal_error::classify_fal_error;
use crate::error::fal_error_plus::FalErrorPlus;
use fal::endpoints::fal_ai::imageutils::rembg::RemoveBackgroundInput;
use fal::prelude::fal_ai::imageutils::rembg::rembg;
use fal::prelude::*;
use fal_client::file_to_base64_url::file_to_base64_url;
use futures::StreamExt;
use std::path::Path;
use url::Url;

pub struct RemBgResponse {
  pub image_url: Url,
}

/// remove background using `fal_ai/imageutils/rembg`
pub async fn remove_background_rembg<P: AsRef<Path>>(image_path: P, api_key: &FalApiKey) -> Result<RemBgResponse, FalErrorPlus> {
  let image_url = file_to_base64_url(image_path)?;
  
  let request = RemoveBackgroundInput {
    image_url,
    crop_to_bbox: None,
    sync_mode: None
  };

  let result = rembg(request)
      .with_api_key(&api_key.0)
      .queue()
      .await;

  let result = match result {
    Ok(result) => result,
    Err(err) => return Err(classify_fal_error(err)),
  };

  let mut stream = result.stream(true).await?;

  while let Some(status) = stream.next().await {
    let status = status?;
    if status.status == Status::Completed {
      break;
    }
  }

  let output = result.response().await?;

  let url = Url::parse(&output.image.url)?;
  
  Ok(RemBgResponse {
    image_url: url,
  })
}

#[cfg(test)]
mod tests {
  use crate::creds::fal_api_key::FalApiKey;
  use crate::requests::queue::remove_background_rembg::remove_background_rembg;
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_utils::test_file_path::test_file_path;

  #[tokio::test]
  #[ignore]
  async fn test_remove_background_rembg() -> AnyhowResult<()> {
    let image = test_file_path("test_data/image/juno.jpg")?;

    // XXX: Don't commit secrets!
    let secret = read_to_string("/Users/bt/Artcraft/credentials/fal_api_key.txt")?;
    let api_key = FalApiKey::from_str(&secret);

    let result = remove_background_rembg(image, &api_key).await?;

    Ok(())
  }
}
