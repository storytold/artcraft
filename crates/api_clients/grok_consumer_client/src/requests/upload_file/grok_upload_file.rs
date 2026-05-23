use crate::client::browser_user_agents::FIREFOX_143_MAC_USER_AGENT;
use crate::datatypes::api::file_id::FileId;
use crate::datatypes::file_upload_spec::FileUploadSpec;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use crate::requests::upload_file::request::UploadFileRequest;
use crate::requests::upload_file::response::GrokApiUploadFileResponse;
use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use log::{error, info};
use serde::Deserialize;
use std::path::Path;
use std::time::Duration;
use tokio::fs::File;
use tokio::io::AsyncReadExt;
use wreq::header::{ACCEPT, ACCEPT_ENCODING, ACCEPT_LANGUAGE, CACHE_CONTROL, CONTENT_TYPE, COOKIE, ORIGIN, PRAGMA, REFERER, USER_AGENT};
use wreq::Client;
use wreq_util::Emulation;

const UPLOAD_FILE_URL : &str = "https://grok.com/rest/app-chat/upload-file";

/// Try to prevent buffer reallocations.
/// There's a better way to implement this.
const INITIAL_BUFFER_SIZE : usize = 1024*1024;

/// Request builder
pub struct GrokUploadFile<P: AsRef<Path>> {
  pub file: FileUploadSpec<P>,
  pub cookie: String,
  pub request_timeout: Option<Duration>,
}


/// Response type
#[derive(Clone, Debug)]
pub struct GrokUploadFileResponse {
  pub file_id: Option<FileId>,
  pub file_uri: Option<String>,
}

impl <P> GrokUploadFile<P> where P: AsRef<Path> {

  pub async fn upload(&self) -> Result<GrokUploadFileResponse, GrokError> {
    match &self.file {
      FileUploadSpec::Path(path) => {
        self.upload_from_file(path.as_ref()).await
      }
      FileUploadSpec::Bytes { bytes, filename, mimetype } => {
        unimplemented!("todo: implement bytes upload")
      }
    }
  }

  async fn upload_from_file(&self, file_path: &Path) -> Result<GrokUploadFileResponse, GrokError> {
    let mut file = File::open(file_path)
        .await
        .map_err(|err| {
          error!("Failed to open file for upload: {}", err);
          GrokClientError::CannotOpenLocalFileForUpload(err)
        })?;

    let mut buffer = Vec::with_capacity(INITIAL_BUFFER_SIZE);

    file.read_to_end(&mut buffer)
        .await
        .map_err(|err| {
          error!("Failed to read file for upload: {}", err);
          GrokClientError::CannotReadLocalFileForUpload(err)
        })?;

    let filename = file_path
        .file_name()
        .ok_or_else(|| GrokClientError::FileForUploadHasInvalidPath)?
        .to_string_lossy()
        .to_string();

    let maybe_ext = file_path
        .extension()
        .and_then(|e| e.to_str());

    // TODO: Share library code.
    // TODO: Read file magic bytes first, then fall back to this.
    let mime_type = match maybe_ext {
      Some("jpg") | Some("jpeg") => "image/jpeg",
      Some("png") => "image/png",
      // Some("webp") => "image/webp",
      // Some("gif") => "image/gif",
      // Some("mp4") => "video/mp4",
      // Some("mov") => "video/quicktime",
      // Some("webm") => "video/webm",
      _ => "application/octet-stream",
    };

    // The encoded images have '/' and '+'.
    // The files have base64 padding!
    let base64_file = BASE64_STANDARD.encode(buffer);

    self.do_upload(base64_file, &filename, &mime_type ).await
  }

  async fn do_upload(&self, base64_file: String, file_name: &str, mime_type: &str) -> Result<GrokUploadFileResponse, GrokError> {

    let client = Client::builder()
        .emulation(Emulation::Firefox143)
        .build()
        .map_err(|err| GrokClientError::WreqClientError(err))?;

    info!("Configuring client...");

    // TODO: Headers were from Chromium, not Firefox. Partial implementation.
    let mut request_builder = client.post(UPLOAD_FILE_URL)
        .header(ACCEPT, "*/*")
        .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
        // TODO: Missing header "baggage"
        .header(CACHE_CONTROL, "no-cache")
        .header(CONTENT_TYPE, "application/json")
        .header(COOKIE, self.cookie.to_string())
        .header(ORIGIN, "https://grok.com")
        .header(PRAGMA, "no-cache")
        .header("priority", "u=1, i")
        .header(REFERER, "https://grok.com/imagine/favorites")
        //.header("sec-ch-ua", "") // TODO
        //.header("sec-ch-ua-mobile", "") // TODO
        //.header("sec-ch-ua-platform", "") // TODO
        .header("sec-fetch-dest", "empty")
        .header("sec-fetch-mode", "cors")
        .header("sec-fetch-site", "same-origin")
        // TODO: Missing header "sentry-trace"
        // TODO: Missing header "traceparent"
        // TODO: Missing header "traceparent"
        // TODO: Missing header "x-statsig-id"
        // TODO: Missing header "x-xai-request-id"
        .header(USER_AGENT, FIREFOX_143_MAC_USER_AGENT);

    //info!("Sending...");
    //let response = builder.send()
    //    .await
    //    .map_err(|err| GrokClientError::WreqClientError(err))?;

    if let Some(timeout) = self.request_timeout {
      request_builder = request_builder.timeout(timeout);
    }

    let request_body = UploadFileRequest {
      fileName: file_name.to_string(),
      fileMimeType: mime_type.to_string(),
      content: base64_file,
      fileSource: "IMAGINE_SELF_UPLOAD_FILE_SOURCE".to_string(),
    };

    let http_request = request_builder.json(&request_body)
        .build()
        .map_err(|err| {
          error!("Error building image upload request: {:?}", err);
          GrokClientError::WreqClientError(err)
        })?;

    let response = client.execute(http_request)
        .await
        .map_err(|err| {
          error!("Error during image upload: {:?}", err);
          GrokGenericApiError::WreqError(err)
        })?;

    let status = response.status();

    let response_body = &response.text()
        .await
        .map_err(|err| {
          error!("Error reading Grok image upload response body: {:?}", err);
          GrokGenericApiError::WreqError(err)
        })?;

    // TODO: Handle bad statuses
    if !status.is_success() {
      error!("Upload file request returned an error (code {}) : {:?}", status.as_u16(), response_body);
      //return Err(classify_general_http_status_code_and_body(status, response_body));
    }

    let response : GrokApiUploadFileResponse = serde_json::from_str(response_body)
        .map_err(|err| GrokGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

    let file_id = response.file_metadata_id
        .map(|id| FileId(id));

    Ok(GrokUploadFileResponse {
      file_id,
      file_uri: response.file_uri,
    })
  }
}


#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use errors::AnyhowResult;

  #[tokio::test]
  #[ignore]
  async fn upload_file() -> AnyhowResult<()> {
    //setup_test_logging(LevelFilter::Trace);

    let cookies = get_test_cookies()?;

    let request = GrokUploadFile {
      file: FileUploadSpec::Path("/Users/bt/dev/storyteller/storyteller-rust/test_data/image/mochi.jpg"),
      cookie: cookies.to_string(),
      request_timeout: None,
    };

    let result = request.upload().await?;

    println!("Result: {:?}", result);
    assert_eq!(1, 2);
    Ok(())
  }
}
