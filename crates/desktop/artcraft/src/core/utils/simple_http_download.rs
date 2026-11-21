use errors::AnyhowResult;
use reqwest::Client;
use reqwest::Url;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::Path;

const USER_AGENT: &str = "storyteller-client/1.0";

/// Downloads a (binary) file to a filesystem path. Good for images, etc. Not great for large files.
pub async fn simple_http_download<P: AsRef<Path>>(url: &Url, download_path: P) -> AnyhowResult<()> {
  let client = Client::builder()
      .gzip(true)
      .build()?;

  let response = client.get(url.clone()) // NB: No IntoUrl for &Url.
      .header("User-Agent", USER_AGENT)
      .header("Accept", "*/*")
      .send()
      .await?;

  //let response : Response = reqwest::get(url).await?;
  let bytes = response.bytes().await?;

  let mut file = OpenOptions::new()
      .create(true) // To create a new file
      .write(true)
      .truncate(true)
      .open(download_path)?;

  file.write_all(&bytes)?;

  Ok(())
}
