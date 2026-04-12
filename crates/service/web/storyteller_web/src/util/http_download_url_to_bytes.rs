use bytes::Bytes;
use log::warn;
use std::error::Error;
use std::fmt::{Display, Formatter};
use wreq::{Client, StatusCode};

const USER_AGENT: &str = "storyteller-web/1.0";

// TODO(bt, 2025-06-03): Don't load the entire file into memory!

#[derive(Debug)]
pub enum DownloadFileToBytesError {
  WreqError(wreq::Error),
  BadResponseError {
    status_code: StatusCode,
    body: Bytes,
    url: String,
  }
}

/// Downloads a (binary) file to memory. Good for images, etc. Not great for large files.
pub async fn http_download_url_to_bytes(url: &str) -> Result<Bytes, DownloadFileToBytesError> {
  let client = Client::builder()
      .gzip(true)
      .build()?;

  let response = client.get(url) // NB: No IntoUrl for &Url.
      .header("User-Agent", USER_AGENT)
      .header("Accept", "*/*")
      .send()
      .await?;

  let status = response.status();
  let bytes = response.bytes().await?;

  if !status.is_success() {
    warn!("Error downloading URL (status={}): {:?}", status.as_u16(), url);

    return Err(DownloadFileToBytesError::BadResponseError {
      status_code: status,
      body: bytes,
      url: url.to_string(),
    });
  }

  Ok(bytes)
}

impl Error for DownloadFileToBytesError {
  fn source(&self) -> Option<&(dyn Error + 'static)> {
    match self {
      DownloadFileToBytesError::WreqError(e) => Some(e),
      DownloadFileToBytesError::BadResponseError { .. } => None,
    }
  }
}

impl Display for DownloadFileToBytesError {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    match self {
      DownloadFileToBytesError::WreqError(e) => write!(f, "Wreq error: {}", e),
      DownloadFileToBytesError::BadResponseError { status_code, body, url } => {
        write!(f, "Bad response (status={}) fetching {} : {:?}", status_code.as_u16(), url, body)
      }
    }
  }
}

impl From<wreq::Error> for DownloadFileToBytesError {
  fn from(e: wreq::Error) -> Self {
    DownloadFileToBytesError::WreqError(e)
  }
}
