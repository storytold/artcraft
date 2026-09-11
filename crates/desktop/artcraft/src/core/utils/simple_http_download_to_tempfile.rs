use errors::AnyhowResult;
use reqwest::Client;
use reqwest::Url;
use std::io::Write;
use tempfile::NamedTempFile;

const USER_AGENT: &str = "storyteller-client/1.0";

/// Downloads a (binary) file to a filesystem path. Good for images, etc. Not great for large files.
pub async fn simple_http_download_to_tempfile(url: &Url, temp_file: &mut NamedTempFile) -> AnyhowResult<()> {
  let client = Client::builder()
      .gzip(true)
      .build()?;

  let response = client.get(url.clone()) // NB: No IntoUrl for &Url.
      .header("User-Agent", USER_AGENT)
      .header("Accept", "*/*")
      .send()
      .await?;

  let bytes = response.bytes().await?;

  temp_file.write_all(&bytes)?;

  Ok(())
}
