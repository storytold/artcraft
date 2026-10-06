use crate::error::ark_api_error::{ArkApiError, ArkApiErrorKind};
use crate::error::ark_error::ArkError;
use crate::error::classify_ark_http_error::classify_ark_http_error;
use reqwest::Client;
use std::time::Duration;

/// Seedance videos can be tens of megabytes; allow slow connections to finish.
const DOWNLOAD_TIMEOUT: Duration = Duration::from_secs(600);

/// Downloads a generated result, eg. a Seedance `content.video_url`. These links are pre-signed
/// and expire after 24 hours, so no API key is sent.
pub async fn download_generated_file(url: &str) -> Result<Vec<u8>, ArkError> {
  let client = Client::builder()
      .timeout(DOWNLOAD_TIMEOUT)
      .build()
      .map_err(ArkError::ClientBuild)?;

  let response = client.get(url).send().await.map_err(ArkError::Network)?;
  let status = response.status();

  if !status.is_success() {
    let body = response.text().await.unwrap_or_default();
    return Err(match classify_ark_http_error(status, &body) {
      Err(api_error) => api_error.into(),
      Ok(()) => ArkError::Api(ArkApiError {
        kind: ArkApiErrorKind::Other,
        maybe_status_code: Some(status.as_u16()),
        maybe_code: None,
        maybe_message: None,
      }),
    });
  }

  let bytes = response.bytes().await.map_err(ArkError::Network)?;
  Ok(bytes.to_vec())
}

#[cfg(test)]
mod tests {
  use super::*;

  // Downloads an already generated result (no generation cost), to diagnose networks where
  // result downloads fail. Links expire 24 hours after generation:
  //   BYTEPLUS_LIVE_DOWNLOAD_URL=<video_url> cargo test -p byteplus_ark_client downloads_a_generated_file -- --ignored --nocapture
  #[tokio::test]
  #[ignore]
  async fn downloads_a_generated_file() {
    let Ok(url) = std::env::var("BYTEPLUS_LIVE_DOWNLOAD_URL") else {
      return;
    };
    let bytes = download_generated_file(&url).await.unwrap();
    println!("downloaded {} bytes", bytes.len());
    assert_eq!(bytes.get(4..8), Some(&b"ftyp"[..]), "expected an MP4 file");
  }
}
