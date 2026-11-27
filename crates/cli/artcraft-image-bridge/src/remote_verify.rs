use crate::ImageInfo;
use anyhow::{ensure, Context, Result};
use reqwest::{Response, Url};
use sha2::{Digest, Sha256};

const MAX_BYTES: usize = 20 * 1024 * 1024;

pub fn validate_original_url(value: &str) -> Result<Url> {
  let url = Url::parse(value).context("Invalid original URL")?;
  ensure!(
    url.scheme() == "https"
      && url.host_str() == Some("cdn-2.fakeyou.com")
      && url.port_or_known_default() == Some(443)
      && url.username().is_empty()
      && url.password().is_none()
      && url.query().is_none()
      && url.fragment().is_none()
      && url.path().starts_with("/media/"),
    "Original URL is outside the supported ArtCraft CDN; no download attempted"
  );
  Ok(url)
}

pub async fn compare_original(mut response: Response, expected: &ImageInfo) -> Result<()> {
  ensure!(
    expected.byte_size > 0 && expected.byte_size <= MAX_BYTES,
    "Stored image size exceeds verification limit"
  );
  ensure!(
    response.status() == reqwest::StatusCode::OK,
    "Original download did not return a complete successful response"
  );
  if let Some(length) = response.content_length() {
    ensure!(
      length == expected.byte_size as u64,
      "Remote original size differs from imported image"
    );
  }
  let mut hash = Sha256::new();
  let mut size = 0usize;
  while let Some(chunk) = response
    .chunk()
    .await
    .map_err(|_| anyhow::anyhow!("Original download interrupted; no verification recorded"))?
  {
    size = size
      .checked_add(chunk.len())
      .context("Original download exceeds limit")?;
    ensure!(
      size <= expected.byte_size && size <= MAX_BYTES,
      "Original download exceeds recorded size"
    );
    hash.update(&chunk);
  }
  ensure!(
    size == expected.byte_size,
    "Remote original size differs from imported image"
  );
  ensure!(
    format!("{:x}", hash.finalize()) == expected.sha256,
    "Remote original hash differs from imported image"
  );
  Ok(())
}
