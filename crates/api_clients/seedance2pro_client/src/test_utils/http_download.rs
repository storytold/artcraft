use errors::AnyhowResult;

/// Download a URL to bytes. For use in tests only.
#[cfg(test)]
pub async fn http_download_to_bytes(url: &str) -> AnyhowResult<Vec<u8>> {
  let response = wreq::get(url).send().await?;
  let bytes = response.bytes().await?;
  Ok(bytes.to_vec())
}
