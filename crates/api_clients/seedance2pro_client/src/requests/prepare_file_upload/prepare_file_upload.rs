use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use crate::requests::prepare_file_upload::request_types::*;
use crate::utils::common_headers::FIREFOX_USER_AGENT;
use chrono::Utc;
use log::info;
use rand::Rng;
use wreq::Client;
use wreq_util::Emulation;

const SIGNED_UPLOAD_URL: &str = "https://seedance2-pro.com/api/trpc/uploads.signedUploadUrl?batch=1";

/// Generates a material path based on the current time.
/// Format: `materials/YYYYMMDD/<unix_millis>-<random_hex>.<extension>`
fn generate_material_path(extension: &str) -> String {
  let now = Utc::now();
  let date_part = now.format("%Y%m%d").to_string();
  let timestamp_millis = now.timestamp_millis();
  let random_hex: u32 = rand::rng().random();
  let hex_part = format!("{:08x}", random_hex);
  format!("materials/{}/{}-{}.{}", date_part, timestamp_millis, hex_part, extension)
}

pub struct PrepareFileUploadArgs<'a> {
  pub session: &'a Seedance2ProSession,

  /// File extension without the dot, e.g. "png", "mp4", "mp3".
  pub extension: String,
}

pub struct PrepareFileUploadResponse {
  /// The signed URL to upload the file to (Cloudflare R2 / S3-compatible).
  pub upload_url: String,

  /// The material path that was generated for this upload.
  pub material_path: String,
}

pub async fn prepare_file_upload(args: PrepareFileUploadArgs<'_>) -> Result<PrepareFileUploadResponse, Seedance2ProError> {
  let material_path = generate_material_path(&args.extension);

  info!("Preparing file upload with path: {}", material_path);

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .build()
    .map_err(|err| Seedance2ProClientError::WreqClientError(err))?;

  let request_body = BatchRequest {
    zero: BatchRequestInner {
      json: BatchRequestJson {
        path: material_path.clone(),
      },
    },
  };

  let cookie = args.session.cookies.as_str();

  let response = client.post(SIGNED_UPLOAD_URL)
    .header("User-Agent", FIREFOX_USER_AGENT)
    .header("Accept", "*/*")
    .header("Accept-Language", "en-US,en;q=0.9")
    .header("Accept-Encoding", "gzip, deflate, br, zstd")
    .header("Referer", "https://seedance2-pro.com/")
    .header("Content-Type", "application/json")
    .header("x-trpc-source", "client")
    .header("Origin", "https://seedance2-pro.com")
    .header("Connection", "keep-alive")
    .header("Cookie", cookie)
    .header("Sec-Fetch-Dest", "empty")
    .header("Sec-Fetch-Mode", "cors")
    .header("Sec-Fetch-Site", "same-origin")
    .header("Priority", "u=4")
    .header("TE", "trailers")
    .json(&request_body)
    .send()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  info!("Response status: {}, body: {}", status, response_body);

  if !status.is_success() {
    return Err(Seedance2ProGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body: response_body,
    }.into());
  }

  let batch_response: Vec<BatchResponseItem> = serde_json::from_str(&response_body)
    .map_err(|err| Seedance2ProGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  let upload_url = batch_response
    .into_iter()
    .next()
    .ok_or_else(|| Seedance2ProGenericApiError::UncategorizedBadResponse(
      "Empty batch response array".to_string()
    ))?
    .result
    .data
    .json;

  Ok(PrepareFileUploadResponse {
    upload_url,
    material_path,
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::seedance2pro_session::Seedance2ProSession;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  #[tokio::test]
  #[ignore] // manually test — requires real cookies
  async fn test_prepare_file_upload_png() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let cookies = get_test_cookies()?;
    let session = Seedance2ProSession::from_cookies_string(cookies);
    let args = PrepareFileUploadArgs {
      session: &session,
      extension: "png".to_string(),
    };
    let result = prepare_file_upload(args).await?;
    println!("Upload URL: {}", result.upload_url);
    println!("Material path: {}", result.material_path);
    assert!(!result.upload_url.is_empty());
    assert!(result.upload_url.contains("cloudflarestorage.com"));
    assert!(result.material_path.starts_with("materials/"));
    assert!(result.material_path.ends_with(".png"));

    assert_eq!(1, 2); // NB: Intentional failure to check the response.
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies
  async fn test_prepare_file_upload_mp4() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let cookies = get_test_cookies()?;
    let session = Seedance2ProSession::from_cookies_string(cookies);
    let args = PrepareFileUploadArgs {
      session: &session,
      extension: "mp4".to_string(),
    };
    let result = prepare_file_upload(args).await?;
    println!("Upload URL: {}", result.upload_url);
    println!("Material path: {}", result.material_path);
    assert!(!result.upload_url.is_empty());
    assert!(result.material_path.ends_with(".mp4"));

    assert_eq!(1, 2); // NB: Intentional failure to check the response.
    Ok(())
  }
}
