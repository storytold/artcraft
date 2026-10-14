use crate::client::browser_user_agents::FIREFOX_143_MAC_USER_AGENT;
use crate::datatypes::api::file_id::FileId;
use crate::datatypes::api::user_id::UserId;
use crate::error::categorize_grok_http_error::categorize_grok_http_error;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::utils::user_and_file_id_to_video_url::user_and_file_id_to_video_url;
use futures::TryStreamExt;
use log::{error, info};
use std::path::Path;
use std::time::Duration;
use tempfile::NamedTempFile;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use wreq::header::{
  ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, CONNECTION, COOKIE, REFERER, UPGRADE_INSECURE_REQUESTS,
  USER_AGENT,
};
use wreq::{Client, Response, StatusCode};
use wreq_util::Emulation;

const MAX_DOWNLOAD_ERROR_BODY_BYTES: usize = 8 * 1024;

pub struct GrokDownloadVideo<'a> {
  pub cookies: &'a str,
  pub user_id: &'a UserId,
  pub file_id: &'a FileId,
  pub request_timeout: Option<Duration>,
}

pub struct DownloadedVideoBytes {
  pub bytes: Vec<u8>,
}

impl<'a> GrokDownloadVideo<'a> {

  pub async fn download_to_path<P: AsRef<Path>>(&self, path: P) -> Result<(), GrokError> {
    let response = self.send_request().await?;

    let mut stream = response.bytes_stream();

    let path = path.as_ref();
    let directory = path
        .parent()
        .filter(|parent| !parent.as_os_str().is_empty())
        .unwrap_or_else(|| Path::new("."));
    let temporary = NamedTempFile::new_in(directory)
        .map_err(|err| GrokClientError::CannotOpenLocalFileForWriting(err))?;
    let std_file = temporary.reopen()
        .map_err(|err| GrokClientError::CannotOpenLocalFileForWriting(err))?;
    let mut file = File::from_std(std_file);

    while let Some(chunk) = stream.try_next()
        .await
        .map_err(|err| GrokGenericApiError::WreqError(err))?
    {
      file.write_all(&chunk)
          .await
          .map_err(|err| GrokClientError::CannotWriteLocalFile(err))?
    }

    file.flush()
        .await
        .map_err(|err| GrokClientError::CannotWriteLocalFile(err))?;
    file.sync_all()
        .await
        .map_err(|err| GrokClientError::CannotWriteLocalFile(err))?;
    drop(file);

    temporary.persist(path)
        .map_err(|err| GrokClientError::CannotWriteLocalFile(err.error))?;

    Ok(())
  }

  pub async fn download_bytes(&self) -> Result<DownloadedVideoBytes, GrokError> {
    let response = self.send_request().await?;

    let download_bytes = response.bytes()
        .await
        .map_err(|err| {
          error!("Error reading Grok create media response body: {:?}", err);
          GrokGenericApiError::WreqError(err)
        })?;

    Ok(DownloadedVideoBytes {
      bytes: download_bytes.to_vec(),
    })
  }

  async fn send_request(&self) -> Result<Response, GrokError> {
    let client = Client::builder()
        .emulation(Emulation::Firefox143)
        .build()
        .map_err(|err| GrokClientError::WreqClientError(err))?;

    let video_url = user_and_file_id_to_video_url(&self.user_id, &self.file_id, false);

    info!("Video file URL: {}", video_url);

    let mut request_builder = client.get(&video_url)
        .header(USER_AGENT, FIREFOX_143_MAC_USER_AGENT)
        .header(ACCEPT, "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
        .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
        .header(ACCEPT_ENCODING, "gzip, deflate, br, zstd")
        .header(REFERER, "https://grok.com/")
        .header("Sec-GPC", "1")
        .header(CONNECTION, "keep-alive")
        .header(COOKIE, self.cookies.to_string())
        .header(UPGRADE_INSECURE_REQUESTS, "1")
        .header("sec-fetch-dest", "document")
        .header("sec-fetch-mode", "navigate")
        .header("sec-fetch-site", "same-site")
        .header("sec-fetch-user", "?1")
        .header("priority", "u=0, i");

    if let Some(timeout) = self.request_timeout {
      request_builder = request_builder.timeout(timeout);
    }

    let response = request_builder.send()
        .await
        .map_err(|err| GrokGenericApiError::WreqError(err))?;

    let status = response.status();
    if let Err(status) = validate_download_status(status) {
      let error_body = read_download_error_body(response).await;
      return Err(categorize_download_error(status, error_body.as_deref()))
    }

    Ok(response)
  }
}

async fn read_download_error_body(response: Response) -> Option<String> {
  let mut stream = response.bytes_stream();
  let mut body = Vec::new();

  while body.len() < MAX_DOWNLOAD_ERROR_BODY_BYTES {
    let chunk = match stream.try_next().await {
      Ok(Some(chunk)) => chunk,
      Ok(None) => break,
      Err(err) => {
        error!("Error reading Grok download error response body: {:?}", err);
        return None
      }
    };

    let remaining = MAX_DOWNLOAD_ERROR_BODY_BYTES - body.len();
    let copy_len = remaining.min(chunk.len());
    body.extend_from_slice(&chunk[..copy_len]);

    if copy_len < chunk.len() {
      break
    }
  }

  Some(String::from_utf8_lossy(&body).into_owned())
}

fn validate_download_status(status: StatusCode) -> Result<(), StatusCode> {
  if status.is_success() {
    return Ok(())
  }

  Err(status)
}

fn categorize_download_error(status: StatusCode, maybe_body: Option<&str>) -> GrokError {
  categorize_grok_http_error(status, maybe_body)
}

#[cfg(test)]
mod tests {
  use super::{categorize_download_error, validate_download_status};
  use crate::datatypes::api::file_id::FileId;
  use crate::error::grok_error::GrokError;
  use crate::error::grok_specific_api_error::GrokSpecificApiError;
  use crate::recipes::request_client_secrets::{request_client_secrets, RequestClientSecretsArgs};
  use crate::requests::download_video_file::download_video_file::{download_video_file, DownloadVideoFileArgs};
  use crate::test_utils::get_test_cookies::get_typed_test_cookies;
  use errors::AnyhowResult;
  use wreq::StatusCode;

  #[test]
  fn download_status_accepts_success() {
    assert!(validate_download_status(StatusCode::OK).is_ok());
  }

  #[test]
  fn download_status_rejects_http_errors() {
    for status in [
      StatusCode::UNAUTHORIZED,
      StatusCode::FORBIDDEN,
      StatusCode::NOT_FOUND,
      StatusCode::TOO_MANY_REQUESTS,
      StatusCode::INTERNAL_SERVER_ERROR,
    ] {
      assert!(validate_download_status(status).is_err(), "status {status} should fail");
    }
  }

  #[test]
  fn download_status_uses_error_body_for_classification() {
    let error = categorize_download_error(StatusCode::FORBIDDEN, Some("anti-bot rejection"));

    assert!(matches!(
      error,
      GrokError::ApiSpecific(GrokSpecificApiError::AutomationBlocked)
    ));
  }

  #[tokio::test]
  #[ignore] // Client side tests only
  async fn test_download() -> AnyhowResult<()> {
    //setup_test_logging(LevelFilter::Trace);

    let cookies = get_typed_test_cookies()?;

    let file_id = FileId("d9b300c6-9562-4e24-a87a-3ede2a53f0bc".to_string()); // Ernest

    let secrets = request_client_secrets(RequestClientSecretsArgs {
      cookies: &cookies,
    }).await?;

    println!("Verification Token: {:?}", secrets.verification_token);
    println!("Sentry Trace: {:?}", secrets.sentry_trace);
    println!("Numbers: {:?}", secrets.numbers);
    println!("Svg Path: {:?}", secrets.svg_path_data);
    println!("Baggage: {:?}", secrets.baggage);

    // TDOO: This implementation is untested.
    //let download = download_video_file(DownloadVideoFileArgs {
    //  cookies: cookies.as_str(),
    //  user_id: &secrets.user_id,
    //  file_id: &file_id,
    //  request_timeout: None,
    //}).await?;

    //println!("Video byte length: {:?}", download.bytes.len());

    assert_eq!(1, 2);
    Ok(())
  }
}
