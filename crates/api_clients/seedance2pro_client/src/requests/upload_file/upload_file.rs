use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use crate::requests::kinovi_host::{KinoviHost, resolve_host};
use crate::utils::common_headers::FIREFOX_USER_AGENT;
use log::info;
use url::Url;
use wreq::Client;
use wreq_util::Emulation;

pub struct UploadFileArgs {
  /// The signed upload URL returned by `prepare_file_upload`.
  pub upload_url: String,

  /// The raw file bytes to upload.
  pub file_bytes: Vec<u8>,

  /// Override the default host (kinovi.ai).
  pub host_override: Option<KinoviHost>,
}

pub struct UploadFileResponse {
  /// The public-facing URL for the uploaded file.
  /// e.g. `https://static.seedance2-pro.com/materials/20260219/1771463564512-b14bfe90.png`
  pub public_url: String,
}

/// Extracts the path from the R2 upload URL and builds the static public URL.
/// e.g. `https://comm.….r2.cloudflarestorage.com/materials/20260219/…?X-Amz-…`
///   -> `https://static.kinovi.ai/materials/20260219/…`
fn build_public_url(upload_url: &str, host: &KinoviHost) -> Result<String, Seedance2ProError> {
  let parsed = Url::parse(upload_url)
    .map_err(|err| Seedance2ProClientError::UrlParseError(err))?;
  let path = parsed.path(); // e.g. "/materials/20260219/1771463564512-b14bfe90.png"
  Ok(format!("{}{}", host.cdn_base_url(), path))
}

pub async fn upload_file(args: UploadFileArgs) -> Result<UploadFileResponse, Seedance2ProError> {
  let host = resolve_host(args.host_override.as_ref());
  let base_url = host.api_base_url();

  info!("Uploading file to: {}", args.upload_url);

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .build()
    .map_err(|err| Seedance2ProClientError::WreqClientError(err))?;

  let referer = format!("{}/", base_url);

  let response = client.put(&args.upload_url)
    .header("User-Agent", FIREFOX_USER_AGENT)
    .header("Accept", "*/*")
    .header("Accept-Language", "en-US,en;q=0.9")
    .header("Accept-Encoding", "gzip, deflate, br, zstd")
    .header("Referer", &referer)
    .header("Origin", base_url)
    .header("Connection", "keep-alive")
    .header("Sec-Fetch-Dest", "empty")
    .header("Sec-Fetch-Mode", "cors")
    .header("Sec-Fetch-Site", "cross-site")
    .header("Priority", "u=4")
    .body(args.file_bytes)
    .send()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  let status = response.status();

  info!("Upload response status: {}", status);

  if !status.is_success() {
    let body = response.text()
      .await
      .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

    return Err(Seedance2ProGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body,
    }.into());
  }

  let public_url = build_public_url(&args.upload_url, host)?;

  info!("Public URL: {}", public_url);

  Ok(UploadFileResponse { public_url })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::seedance2pro_session::Seedance2ProSession;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use crate::requests::prepare_file_upload::prepare_file_upload::{
    prepare_file_upload, PrepareFileUploadArgs,
  };
  use errors::AnyhowResult;
  use log::LevelFilter;
  use std::fs;

  #[tokio::test]
  #[ignore] // manually test — requires real cookies and a test image
  async fn test_upload_image_file() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);

    // Step 1: Get a signed upload URL
    let cookies = get_test_cookies()?;
    let session = Seedance2ProSession::from_cookies_string(cookies);
    let prepare_args = PrepareFileUploadArgs {
      session: &session,
      extension: "jpg".to_string(),
      host_override: None,
    };
    let prepare_result = prepare_file_upload(prepare_args).await?;
    println!("Upload URL: {}", prepare_result.upload_url);

    // Step 2: Read a test image
    let file_bytes = fs::read("/Users/bt/dev/storyteller/artcraft/test_data/image/juno.jpg")?;
    println!("File size: {} bytes", file_bytes.len());

    // Step 3: Upload
    let upload_args = UploadFileArgs {
      upload_url: prepare_result.upload_url,
      file_bytes,
      host_override: None,
    };
    let result = upload_file(upload_args).await?;
    println!("Public URL: {}", result.public_url);

    assert!(result.public_url.starts_with("https://static.kinovi.ai/materials/"));
    assert_eq!(1, 2); // NB: Intentional failure to check the response.

    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies and a test image
  async fn test_upload_video_file_that_is_too_long() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);

    // Step 1: Get a signed upload URL
    let cookies = get_test_cookies()?;
    let session = Seedance2ProSession::from_cookies_string(cookies);
    let prepare_args = PrepareFileUploadArgs {
      session: &session,
      extension: "mp4".to_string(),
      host_override: None,
    };
    let prepare_result = prepare_file_upload(prepare_args).await?;
    println!("Upload URL: {}", prepare_result.upload_url);

    // Step 2: Read a test image
    let file_bytes = fs::read("/Users/bt/Videos/Artcraft/Artcraft Best/ArtCraft Seedance Knight.mp4")?;
    println!("File size: {} bytes", file_bytes.len());

    // Step 3: Upload
    let upload_args = UploadFileArgs {
      upload_url: prepare_result.upload_url,
      file_bytes,
      host_override: None,
    };
    let result = upload_file(upload_args).await?;
    println!("Public URL: {}", result.public_url);

    assert!(result.public_url.starts_with("https://static.kinovi.ai/materials/"));
    assert_eq!(1, 2); // NB: Intentional failure to check the response.

    Ok(())
  }
}
