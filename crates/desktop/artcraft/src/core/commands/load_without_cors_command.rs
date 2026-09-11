use futures::TryFutureExt;
use log::{error, info};
use reqwest::Client;
use tauri::ipc::Response;

/// Request a URL and load it without worrying about CORS.
#[tauri::command]
pub async fn load_without_cors_command(url: String) -> Result<Response, String> {

  info!("load_without_cors_command for URL: {}", url);

  // TODO(bt,2025-07-22): Make sure the URL is valid and safe to fetch. Check an allowlist.

  // TODO(bt,2025-07-22): Should we cache clients so we don't need to SSL handshake every time?
  let client = Client::builder()
      .gzip(true)
      .build()
      .map_err(|e| {
        error!("Failed to create HTTP client: {:?}", e);
        format!("Failed to create HTTP client: {:?}", e)
      })?;

  let response = client.get(url.clone())
      .send()
      .await
      .map_err(|e| {
        error!("Failed to send HTTP request: {:?}", e);
        format!("Failed to send HTTP request: {:?}", e)
      })?;

  if response.status() != 200 {
    return Err(format!("Failed to fetch URL: {}. Status: {}", url, response.status()));
  }

  let bytes = response.bytes()
      .await
      .map_err(|e| {
        error!("Failed to read response bytes: {:?}", e);
        format!("Failed to read response bytes: {:?}", e)
      })?;

  Ok(Response::new(bytes.to_vec()))
}
