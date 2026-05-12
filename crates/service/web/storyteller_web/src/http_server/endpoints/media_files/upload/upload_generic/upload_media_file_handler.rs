use std::collections::HashSet;
use std::sync::Arc;

use actix_multipart::Multipart;
use actix_web::{web, HttpRequest, HttpResponse};
use once_cell::sync::Lazy;
use utoipa::ToSchema;

use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::endpoints::media_files::upload::upload_error::MediaFileUploadError;
use crate::http_server::endpoints::media_files::upload::upload_generic::process_upload_media_file::process_upload_media_file;
use crate::state::server_state::ServerState;

#[derive(Serialize, ToSchema)]
pub struct UploadMediaSuccessResponse {
  pub success: bool,
  pub media_file_token: MediaFileToken,
}

static ALLOWED_MIME_TYPES : Lazy<HashSet<&'static str>> = Lazy::new(|| {
  HashSet::from([
    // Audio
    "audio/aac",
    "audio/m4a",
    "audio/mpeg",
    "audio/ogg",
    "audio/opus",
    "audio/x-flac",
    "audio/x-wav",
    // Mixed
    "audio/mp4", // iPhone seems to upload these as audio
    // Video
    "video/mp4",
    "video/webm",
    //"video/quicktime",
    // Image
    "image/gif",
    "image/jpeg",
    "image/png",
    "image/webp",
  ])
});

/// DEPRECATED: Use one of the various specialized upload endpoints instead.
/// TODO: Does not support `maybe_generation_provider`. Use the specialized upload endpoints instead.
#[deprecated]
#[utoipa::path(
  post,
  tag = "Media Files [Deprecated]",
  path = "/v1/media_files/upload",
  responses(
    (status = 200, description = "Success Update", body = UploadMediaSuccessResponse),
    (status = 400, description = "Bad input", body = MediaFileUploadError),
    (status = 401, description = "Not authorized", body = MediaFileUploadError),
    (status = 429, description = "Too many requests", body = MediaFileUploadError),
    (status = 500, description = "Server error", body = MediaFileUploadError),
  ),
  params(
    ("request" = (), description = "Ask Brandon. This is form-multipart."),
  )
)]
pub async fn upload_media_file_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  mut multipart_payload: Multipart,
) -> Result<HttpResponse, MediaFileUploadError> {

  let response = process_upload_media_file(
    &http_request,
    &server_state,
    multipart_payload,
    &ALLOWED_MIME_TYPES).await?;

  let media_file_token = response.to_media_token();

  let response = UploadMediaSuccessResponse {
    success: true,
    media_file_token,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| MediaFileUploadError::ServerError)?;

  return Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body));
}
