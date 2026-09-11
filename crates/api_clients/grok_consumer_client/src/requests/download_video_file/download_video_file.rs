use crate::client::browser_user_agents::FIREFOX_143_MAC_USER_AGENT;
use crate::datatypes::api::file_id::FileId;
use crate::datatypes::api::user_id::UserId;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::utils::user_and_file_id_to_video_url::user_and_file_id_to_video_url;
use log::{error, info, warn};
use std::time::Duration;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, CACHE_CONTROL, CONNECTION, CONTENT_TYPE, COOKIE, ORIGIN, REFERER, TE, UPGRADE_INSECURE_REQUESTS, USER_AGENT};
use wreq::Client;
use wreq_util::Emulation;

pub struct DownloadVideoFileArgs<'a> {
  pub cookies: &'a str,
  pub user_id: &'a UserId,
  pub file_id: &'a FileId,
  pub request_timeout: Option<Duration>,
}

pub struct VideoFile {
  pub bytes: Vec<u8>,
}

pub async fn download_video_file(args: DownloadVideoFileArgs<'_>) -> Result<VideoFile, GrokError> {

  let client = Client::builder()
      .emulation(Emulation::Firefox143)
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  let video_url = user_and_file_id_to_video_url(&args.user_id, &args.file_id, false);

  info!("Video file URL: {}", video_url);

  let mut request_builder = client.get(&video_url)
      .header(USER_AGENT, FIREFOX_143_MAC_USER_AGENT)
      .header(ACCEPT, "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
      .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
      .header(ACCEPT_ENCODING, "gzip, deflate, br, zstd")
      .header(REFERER, "https://grok.com/")
      .header("Sec-GPC", "1")
      .header(CONNECTION, "keep-alive")
      .header(COOKIE, args.cookies)
      .header(UPGRADE_INSECURE_REQUESTS, "1")
      .header("sec-fetch-dest", "document")
      .header("sec-fetch-mode", "navigate")
      .header("sec-fetch-site", "same-site")
      .header("sec-fetch-user", "?1")
      .header("priority", "u=0, i");


  if let Some(timeout) = args.request_timeout {
    request_builder = request_builder.timeout(timeout);
  }

  let response = request_builder.send()
      .await
      .map_err(|err| GrokGenericApiError::WreqError(err))?;

  let status = response.status();

  info!("Download video status: {:?}", status);

  let download_bytes = &response.bytes()
      .await
      .map_err(|err| {
        error!("Error reading Grok create media response body: {:?}", err);
        GrokGenericApiError::WreqError(err)
      })?;

  // TODO: Classify errors
  if !status.is_success() {
    warn!("Not successful liking media (status: {:?})", status);
    //  error!("Upload file request returned an error (code {}) : {:?}", status.as_u16(), response_body);
    //  return Err(classify_general_http_status_code_and_body(status, response_body));
  }

  Ok(VideoFile {
    bytes: download_bytes.to_vec(),
  })
}

#[cfg(test)]
mod tests {
  use std::fs::File;
  use std::io::Write;
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

    let download = download_video_file(DownloadVideoFileArgs {
      cookies: cookies.as_str(),
      user_id: &secrets.user_id,
      file_id: &file_id,
      request_timeout: None,
    }).await?;

    println!("Video byte length: {:?}", download.bytes.len());

    let mut file = File::create("download_video_file.test.mp4")?;
    file.write_all(&download.bytes)?;

    assert_eq!(1, 2);
    Ok(())
  }
}