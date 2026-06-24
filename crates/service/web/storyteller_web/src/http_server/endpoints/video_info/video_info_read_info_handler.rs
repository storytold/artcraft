//! `POST /v1/video_info/read_only` — inspect an uploaded video's embedded
//! AI-generation provenance and return what was detected.
//!
//! Stateless and read-only: the bytes are parsed in memory by the `video_info`
//! crate and nothing is persisted. The internal `video_info` types are mapped
//! into the public [`artcraft_api_defs`] wire types (see [`super::provenance`])
//! so the parsing library can evolve independently of the HTTP contract.

use std::io::Read;
use std::sync::Arc;

use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::MultipartForm;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::error;
use utoipa::ToSchema;

use artcraft_api_defs::video_info::read_only::VideoInfoReadOnlyResponse;
use video_info::VideoInfo;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::video_info::provenance::to_provenance;
use crate::http_server::web_utils::redis_rate_limiter::RateLimiterError;
use crate::state::server_state::ServerState;

/// Form-multipart request: a single video file under the `file` field.
#[derive(MultipartForm, ToSchema)]
#[multipart(duplicate_field = "deny")]
pub struct VideoInfoReadOnlyForm {
  /// The video file to inspect.
  #[multipart(limit = "256 MiB")]
  #[schema(value_type = Vec<u8>, format = Binary)]
  file: TempFile,
}

/// Detect the AI-generation provenance of an uploaded video.
#[utoipa::path(
  post,
  tag = "Video Info",
  path = "/v1/video_info/read_only",
  responses(
    (status = 200, description = "Detected provenance (or `unrecognized`)", body = VideoInfoReadOnlyResponse),
    (status = 400, description = "Bad input", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
  params(
    ("request" = VideoInfoReadOnlyForm, description = "Multipart form with a single `file` video upload."),
  )
)]
pub async fn video_info_read_info_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  MultipartForm(mut form): MultipartForm<VideoInfoReadOnlyForm>,
) -> Result<Json<VideoInfoReadOnlyResponse>, CommonWebError> {
  // IP-based rate limit (1 req / 5s by default, configurable). Fails open.
  match server_state.redis_rate_limiters.video_info_read_only.rate_limit_request(&http_request).await {
    Ok(()) => {}
    Err(RateLimiterError::RateLimitExceededError) => return Err(CommonWebError::TooManyRequests),
    Err(RateLimiterError::ClientError) => {} // fail open
  }

  let mut bytes = Vec::new();
  form.file.file.read_to_end(&mut bytes).map_err(|err| {
    error!("video_info: problem reading uploaded file: {:?}", err);
    CommonWebError::server_error_with_message("could not read uploaded file")
  })?;

  if bytes.is_empty() {
    return Err(CommonWebError::BadInputWithSimpleMessage("empty file".to_string()));
  }

  let maybe_encoder = video_info::encoder_tag(&bytes);
  let provenance = to_provenance(&VideoInfo::from_bytes(&bytes), maybe_encoder);

  Ok(Json(VideoInfoReadOnlyResponse {
    success: true,
    kind: provenance.kind,
    maybe_encoder: provenance.maybe_encoder,
    maybe_seedance: provenance.maybe_seedance,
    maybe_veo: provenance.maybe_veo,
    maybe_sora: provenance.maybe_sora,
    maybe_dreamina: provenance.maybe_dreamina,
    maybe_kling: provenance.maybe_kling,
  }))
}
