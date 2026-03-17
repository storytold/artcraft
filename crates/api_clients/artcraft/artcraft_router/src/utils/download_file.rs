use crate::errors::artcraft_router_error::ArtcraftRouterError;

/// Download a file from a URL, returning its bytes.
pub async fn download_file(url: &str) -> Result<Vec<u8>, ArtcraftRouterError> {
  let response = reqwest::get(url)
    .await
    .map_err(|err| ArtcraftRouterError::FileDownload(format!("Failed to download {}: {}", url, err)))?;

  if !response.status().is_success() {
    return Err(ArtcraftRouterError::FileDownload(
      format!("Download failed for {} with status {}", url, response.status())
    ));
  }

  response.bytes()
    .await
    .map(|b| b.to_vec())
    .map_err(|err| ArtcraftRouterError::FileDownload(format!("Failed to read bytes from {}: {}", url, err)))
}
