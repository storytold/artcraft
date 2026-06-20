//! `POST /v1/video_info/upload` — like `read_only`, but persists the result.
//!
//! Algorithm: read bytes → SHA-1 (Crockford) → run `video_info` provenance
//! detection → probe MP4 dimensions via ffprobe → upsert an `uploaded_videos`
//! row keyed by the SHA-1 checksum → return the same provenance the read-only
//! endpoint returns, plus the persisted `UploadedVideoToken`.

use std::io::{Read, Write};
use std::marker::PhantomData;
use std::sync::Arc;

use actix_multipart::form::tempfile::TempFile;
use actix_multipart::form::MultipartForm;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{error, warn};
use utoipa::ToSchema;

use artcraft_api_defs::video_info::upload::VideoInfoUploadResponse;
use bucket_client::UploadFileBytesArgs;
use ffmpeg_utils::ffprobe::ffprobe_get_dimensions::ffprobe_get_dimensions;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::uploaded_videos::get_uploaded_video_by_sha1_checksum::{
  get_uploaded_video_by_sha1_checksum, GetUploadedVideoBySha1ChecksumArgs,
};
use mysql_queries::queries::uploaded_videos::insert_uploaded_video::{
  insert_uploaded_video, InsertUploadedVideoArgs,
};
use mysql_queries::queries::uploaded_videos::update_uploaded_video::{
  update_uploaded_video, UpdateUploadedVideoArgs,
};
use sha1_hash::sha1_hash_bytes_as_crockford;
use video_info::VideoInfo;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::video_info::provenance::{
  detect_model_family, detect_model_type, model_family_for_type, to_provenance,
};
use crate::http_server::web_utils::redis_rate_limiter::RateLimiterError;
use crate::state::server_state::ServerState;

/// Form-multipart request: a single video file under the `file` field.
#[derive(MultipartForm, ToSchema)]
#[multipart(duplicate_field = "deny")]
pub struct VideoInfoUploadForm {
  /// The video file to inspect and store.
  #[multipart(limit = "256 MiB")]
  #[schema(value_type = Vec<u8>, format = Binary)]
  file: TempFile,
}

/// Detect a video's AI-generation provenance and persist the result.
#[utoipa::path(
  post,
  tag = "Video Info",
  path = "/v1/video_info/upload",
  responses(
    (status = 200, description = "Detected provenance + persisted token", body = VideoInfoUploadResponse),
    (status = 400, description = "Bad input", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
  params(
    ("request" = VideoInfoUploadForm, description = "Multipart form with a single `file` video upload."),
  )
)]
pub async fn video_info_upload_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  MultipartForm(mut form): MultipartForm<VideoInfoUploadForm>,
) -> Result<Json<VideoInfoUploadResponse>, CommonWebError> {
  // IP-based rate limit (shared with the read-only endpoint). Fails open.
  match server_state.redis_rate_limiters.video_info_read_only.rate_limit_request(&http_request).await {
    Ok(()) => {}
    Err(RateLimiterError::RateLimitExceededError) => return Err(CommonWebError::TooManyRequests),
    Err(RateLimiterError::ClientError) => {} // fail open
  }

  let mut bytes = Vec::new();
  form.file.file.read_to_end(&mut bytes).map_err(|err| {
    error!("video_info upload: problem reading uploaded file: {:?}", err);
    CommonWebError::server_error_with_message("could not read uploaded file")
  })?;

  if bytes.is_empty() {
    return Err(CommonWebError::BadInputWithSimpleMessage("empty file".to_string()));
  }

  // ── In-memory analysis (no DB connection held during any of this) ──

  let filesize_bytes = bytes.len().min(u32::MAX as usize) as u32;
  let ip_address = get_request_ip(&http_request);

  let sha1_checksum =
    sha1_hash_bytes_as_crockford(&bytes).map_err(CommonWebError::from_error)?;

  let parse_result = VideoInfo::from_bytes(&bytes);
  let maybe_encoder = video_info::encoder_tag(&bytes);

  // The full debug dump of the parse result becomes the stored report.
  let maybe_report = parse_result.as_ref().ok().map(|info| format!("{info:#?}"));

  let maybe_detected_model_type = detect_model_type(&parse_result);
  let maybe_detected_model_family = maybe_detected_model_type
    .map(model_family_for_type)
    .or_else(|| detect_model_family(&parse_result));

  let provenance = to_provenance(&parse_result, maybe_encoder);

  // Archive the original bytes to the Seedance video bucket, if configured.
  // Done before moving `bytes` into the ffprobe task, and before acquiring a DB
  // connection. Fail-soft: a storage error must not fail provenance detection.
  if let Some(bucket) = server_state.seedance_video_bucket.as_ref() {
    let object_name = seedance_video_object_name(&sha1_checksum);
    if let Err(err) = bucket
      .upload_file_bytes(UploadFileBytesArgs {
        object_name: object_name.as_str(),
        bytes: &bytes,
        content_type: Some("video/mp4"),
      })
      .await
    {
      warn!("seedance video bucket upload failed for {}: {:?}", object_name, err);
    }
  }

  // ffprobe is a blocking subprocess — run it off the async executor, and BEFORE
  // acquiring a DB connection (never hold a pooled connection across this).
  //
  // Fail open: ffprobe being missing, slow, panicking, or erroring must never
  // fail the upload — we just store the record without dimensions.
  let maybe_dimensions = match web::block(move || probe_dimensions(&bytes)).await {
    Ok(dimensions) => dimensions,
    Err(err) => {
      warn!("video_info upload: ffprobe task failed; storing without dimensions: {:?}", err);
      None
    }
  };
  let maybe_width = maybe_dimensions.map(|(width, _)| width);
  let maybe_height = maybe_dimensions.map(|(_, height)| height);
  let maybe_resolution = maybe_dimensions.map(|(width, height)| format!("{width}x{height}"));

  // ── Persist (upsert by SHA-1) ──

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  let maybe_existing = get_uploaded_video_by_sha1_checksum(GetUploadedVideoBySha1ChecksumArgs {
    sha1_checksum: &sha1_checksum,
    mysql_executor: &mut *mysql_connection,
    phantom: PhantomData,
  })
  .await?;

  let uploaded_video_token = match maybe_existing {
    Some(existing) => {
      update_uploaded_video(UpdateUploadedVideoArgs {
        token: &existing.token,
        maybe_width,
        maybe_height,
        maybe_resolution: maybe_resolution.as_deref(),
        maybe_detected_model_family,
        maybe_detected_model_type,
        maybe_report: maybe_report.as_deref(),
        maybe_updated_ip_address: Some(ip_address.as_str()),
        mysql_executor: &mut *mysql_connection,
        phantom: PhantomData,
      })
      .await?;
      existing.token
    }
    None => {
      insert_uploaded_video(InsertUploadedVideoArgs {
        sha1_checksum: &sha1_checksum,
        filesize_bytes,
        maybe_width,
        maybe_height,
        maybe_resolution: maybe_resolution.as_deref(),
        maybe_detected_model_family,
        maybe_detected_model_type,
        maybe_report: maybe_report.as_deref(),
        upload_ip_address: &ip_address,
        mysql_executor: &mut *mysql_connection,
        phantom: PhantomData,
      })
      .await?
    }
  };

  Ok(Json(VideoInfoUploadResponse {
    success: true,
    uploaded_video_token,
    kind: provenance.kind,
    maybe_encoder: provenance.maybe_encoder,
    maybe_seedance: provenance.maybe_seedance,
    maybe_veo: provenance.maybe_veo,
    maybe_sora: provenance.maybe_sora,
    maybe_dreamina: provenance.maybe_dreamina,
    maybe_kling: provenance.maybe_kling,
  }))
}

/// Object key for archiving an uploaded video, sharded into four directory
/// levels by the first four characters of the checksum:
/// `uploads/{c0}/{c1}/{c2}/{c3}/{checksum}.mp4`
/// (e.g. checksum `f0a2cda0…` → `uploads/f/0/a/2/f0a2cda0….mp4`).
fn seedance_video_object_name(sha1_checksum: &str) -> String {
  let shard: String = sha1_checksum
    .chars()
    .take(4)
    .map(|character| format!("{character}/"))
    .collect();
  format!("uploads/{shard}{sha1_checksum}.mp4")
}

/// Write the bytes to a temp file and ffprobe its video dimensions. Fail-soft:
/// returns `None` on any failure (not a probeable video, ffprobe missing, I/O
/// error) so the caller can proceed without dimensions. Never panics.
fn probe_dimensions(bytes: &[u8]) -> Option<(u32, u32)> {
  let mut temp_file = match tempfile::NamedTempFile::new() {
    Ok(temp_file) => temp_file,
    Err(err) => {
      warn!("video_info upload: could not create temp file for ffprobe: {:?}", err);
      return None;
    }
  };

  if let Err(err) = temp_file.write_all(bytes) {
    warn!("video_info upload: could not write temp file for ffprobe: {:?}", err);
    return None;
  }
  let _ = temp_file.flush();

  match ffprobe_get_dimensions(temp_file.path()) {
    Ok(Some(dimensions)) => Some((dimensions.width as u32, dimensions.height as u32)),
    // Not a probeable video (no video stream / no duration) — not an error.
    Ok(None) => None,
    Err(err) => {
      warn!("video_info upload: ffprobe failed; storing without dimensions: {:?}", err);
      None
    }
  }
}

#[cfg(test)]
mod tests {
  use super::seedance_video_object_name;

  #[test]
  fn shards_object_name_by_first_four_checksum_chars() {
    assert_eq!(
      seedance_video_object_name("f0a2cda0deadbeef"),
      "uploads/f/0/a/2/f0a2cda0deadbeef.mp4"
    );
  }
}
