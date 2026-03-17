use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::download_error::DownloadError;

/// Download a file from a URL, returning its bytes.
pub async fn download_file(url: &str) -> Result<Vec<u8>, ArtcraftRouterError> {
  let response = reqwest::get(url)
    .await
    .map_err(|err| DownloadError::ReqwestDownload {
      url: url.to_string(),
      maybe_status: err.status(),
      error: err,
    })?;

  let status = response.status();
  if !status.is_success() {
    return Err(DownloadError::BadStatus {
      url: url.to_string(),
      status_code: status.as_u16(),
    }.into());
  }

  response.bytes()
    .await
    .map(|b| b.to_vec())
    .map_err(|err| DownloadError::ReqwestDownload {
      url: url.to_string(),
      maybe_status: err.status(),
      error: err,
    }.into())
}
