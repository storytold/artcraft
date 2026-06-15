use std::time::Duration;

use anyhow::Result;
use base64::Engine as _;

/// Fetch an image URL and return (base64 data, mime type) ready to hand
/// to rmcp's `Content::image`. Used to inline-render the generated image
/// in chat instead of a "show image" link.
pub async fn fetch_image_for_inline(url: &str) -> Result<(String, String)> {
  let client = reqwest::Client::builder()
    .timeout(Duration::from_secs(30))
    .gzip(true)
    .build()?;

  let response = client.get(url).send().await?.error_for_status()?;

  let mime = response
    .headers()
    .get(reqwest::header::CONTENT_TYPE)
    .and_then(|v| v.to_str().ok())
    .map(|s| s.split(';').next().unwrap_or(s).trim().to_string())
    .unwrap_or_else(|| guess_mime_from_url(url).to_string());

  let bytes = response.bytes().await?;
  let data_b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
  Ok((data_b64, mime))
}

fn guess_mime_from_url(url: &str) -> &'static str {
  let lower = url.split('?').next().unwrap_or(url).to_ascii_lowercase();
  if lower.ends_with(".png") {
    "image/png"
  } else if lower.ends_with(".jpg") || lower.ends_with(".jpeg") {
    "image/jpeg"
  } else if lower.ends_with(".webp") {
    "image/webp"
  } else if lower.ends_with(".gif") {
    "image/gif"
  } else {
    "image/png"
  }
}
