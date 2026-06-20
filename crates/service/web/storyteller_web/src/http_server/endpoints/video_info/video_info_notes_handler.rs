//! `POST /v1/video_info/notes` — attach (or update) a user-submitted note about
//! an uploaded video.
//!
//! Always tied to an `UploadedVideoToken`. If the request carries an
//! `UploadVideoNoteToken`, the existing note is updated; otherwise a new note is
//! created. The IP address is stamped on the create or update column accordingly.

use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};

use artcraft_api_defs::video_info::notes::{VideoInfoNoteRequest, VideoInfoNoteResponse};
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::uploaded_video_notes::insert_uploaded_video_note::{
  insert_uploaded_video_note, InsertUploadedVideoNoteArgs,
};
use mysql_queries::queries::uploaded_video_notes::update_uploaded_video_note::{
  update_uploaded_video_note, UpdateUploadedVideoNoteArgs,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::redis_rate_limiter::RateLimiterError;
use crate::state::server_state::ServerState;

/// Create or update a note about an uploaded video.
#[utoipa::path(
  post,
  tag = "Video Info",
  path = "/v1/video_info/notes",
  request_body = VideoInfoNoteRequest,
  responses(
    (status = 200, description = "Note created or updated", body = VideoInfoNoteResponse),
    (status = 400, description = "Bad input", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  )
)]
pub async fn video_info_notes_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>,
  Json(request): Json<VideoInfoNoteRequest>,
) -> Result<Json<VideoInfoNoteResponse>, CommonWebError> {
  // IP-based rate limit (shared with the other video-info endpoints). Fails open.
  match server_state.redis_rate_limiters.video_info_read_only.rate_limit_request(&http_request).await {
    Ok(()) => {}
    Err(RateLimiterError::RateLimitExceededError) => return Err(CommonWebError::TooManyRequests),
    Err(RateLimiterError::ClientError) => {} // fail open
  }

  let ip_address = get_request_ip(&http_request);

  // Free-form text fields are trimmed; empty becomes absent.
  let maybe_filename = request.maybe_filename.as_deref();
  let maybe_reported_model_name = normalize_optional(&request.maybe_reported_model_name);
  let maybe_other_website = normalize_optional(&request.maybe_other_website);
  let maybe_comments = normalize_optional(&request.maybe_comments);
  let maybe_email_address = normalize_optional(&request.maybe_email_address);
  let can_share_report = request.can_share_report.unwrap_or(false);
  let was_scammed = request.was_scammed.unwrap_or(false);

  let mut mysql_connection = server_state.mysql_pool.acquire().await?;

  let uploaded_video_note_token = match &request.maybe_uploaded_video_note_token {
    // Update an existing note.
    Some(note_token) => {
      update_uploaded_video_note(UpdateUploadedVideoNoteArgs {
        token: note_token,
        maybe_filename,
        maybe_reported_model_type: request.maybe_reported_model_type,
        maybe_reported_model_name: maybe_reported_model_name.as_deref(),
        maybe_website: request.maybe_website,
        maybe_other_website: maybe_other_website.as_deref(),
        maybe_comments: maybe_comments.as_deref(),
        maybe_email_address: maybe_email_address.as_deref(),
        can_share_report,
        was_scammed,
        maybe_comment_update_ip_address: Some(ip_address.as_str()),
        mysql_executor: &mut *mysql_connection,
        phantom: PhantomData,
      })
      .await?;
      note_token.clone()
    }
    // Create a new note.
    None => {
      insert_uploaded_video_note(InsertUploadedVideoNoteArgs {
        uploaded_video_token: &request.uploaded_video_token,
        maybe_filename,
        maybe_reported_model_type: request.maybe_reported_model_type,
        maybe_reported_model_name: maybe_reported_model_name.as_deref(),
        maybe_website: request.maybe_website,
        maybe_other_website: maybe_other_website.as_deref(),
        maybe_comments: maybe_comments.as_deref(),
        maybe_email_address: maybe_email_address.as_deref(),
        can_share_report,
        was_scammed,
        comment_create_ip_address: &ip_address,
        mysql_executor: &mut *mysql_connection,
        phantom: PhantomData,
      })
      .await?
    }
  };

  Ok(Json(VideoInfoNoteResponse {
    success: true,
    uploaded_video_note_token,
  }))
}

/// Trim a free-form text field; a missing or whitespace-only value becomes `None`.
fn normalize_optional(value: &Option<String>) -> Option<String> {
  value
    .as_deref()
    .map(str::trim)
    .filter(|trimmed| !trimmed.is_empty())
    .map(str::to_string)
}
