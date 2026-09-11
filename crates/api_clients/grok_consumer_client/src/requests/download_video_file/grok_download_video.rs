use crate::client::browser_user_agents::FIREFOX_143_MAC_USER_AGENT;
use crate::datatypes::api::file_id::FileId;
use crate::datatypes::api::user_id::UserId;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::utils::user_and_file_id_to_video_url::user_and_file_id_to_video_url;
use futures::{StreamExt, TryStreamExt};
use log::{error, info, warn};
use std::io::Write;
use std::path::Path;
use std::time::Duration;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, CACHE_CONTROL, CONNECTION, CONTENT_TYPE, COOKIE, ORIGIN, REFERER, TE, UPGRADE_INSECURE_REQUESTS, USER_AGENT};
use wreq::{Client, Request, Response};
use wreq_util::Emulation;

pub struct GrokDownloadVideo<'a> {
  pub cookies: &'a str,
  pub user_id: &'a UserId,
  pub file_id: &'a FileId,
  pub request_timeout: Option<Duration>,
}

pub struct DownloadedVideoBytes {
  pub bytes: Vec<u8>,
}

impl <'a> GrokDownloadVideo<'a> {

  pub async fn download_to_path<P: AsRef<Path>>(&self, path: P) -> Result<(), GrokError> {
    let response = self.send_request().await?;

    let mut stream = response.bytes_stream();

    let mut file = File::create(&path)
        .await
        .map_err(|err| GrokClientError::CannotOpenLocalFileForWriting(err))?;

    //let _r = stream.for_each_concurrent(None, |chunk_result| async {
    //  match chunk_result {
    //    Ok(chunk) => {
    //      file;
    //      //if let Err(e) = file.write_all(&chunk).await {
    //      //  //error!("Error writing to file: {}", e);
    //      //}
    //    }
    //    Err(e) => {
    //      //error!("Error in stream: {}", e);
    //    }
    //  }
    //}).await;

    while let Some(chunk) = stream.try_next()
        .await
        .map_err(|err| GrokGenericApiError::WreqError(err))?
    {
      file.write_all(&chunk)
          .await
          .map_err(|err| GrokClientError::CannotOpenLocalFileForWriting(err))?
    }

    file.flush().await.unwrap();

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

    // TODO: Classify errors
    if !status.is_success() {
      warn!("Not successful liking media (status: {:?})", status);
      //  error!("Upload file request returned an error (code {}) : {:?}", status.as_u16(), response_body);
      //  return Err(classify_general_http_status_code_and_body(status, response_body));
    }

    Ok(response)
  }
}

#[cfg(test)]
mod tests {
  use crate::datatypes::api::file_id::FileId;
  use crate::recipes::request_client_secrets::{request_client_secrets, RequestClientSecretsArgs};
  use crate::requests::download_video_file::download_video_file::{download_video_file, DownloadVideoFileArgs};
  use crate::test_utils::get_test_cookies::get_typed_test_cookies;
  use errors::AnyhowResult;

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