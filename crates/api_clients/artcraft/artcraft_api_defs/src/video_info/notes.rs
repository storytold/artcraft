//! Request/response types for `POST /v1/video_info/notes`.
//!
//! A note is user-submitted context about an uploaded video (what model they
//! believe it is, where it came from, free-form comments). Always tied to an
//! [`UploadedVideoToken`]; pass a [`UploadVideoNoteToken`] to update an existing
//! note instead of creating a new one.

use serde_derive::{Deserialize, Serialize};
use utoipa::ToSchema;

use enums::by_table::uploaded_video_notes::uploaded_video_note_reported_model_type::UploadedVideoNoteReportedModelType;
use enums::by_table::uploaded_video_notes::uploaded_video_note_reported_website::UploadedVideoNoteReportedWebsite;
use tokens::tokens::uploaded_video_notes::UploadVideoNoteToken;
use tokens::tokens::uploaded_videos::UploadedVideoToken;

/// Request body for `POST /v1/video_info/notes`.
#[derive(Deserialize, ToSchema, Debug, Clone)]
pub struct VideoInfoNoteRequest {
  /// The uploaded video this note is about. Required.
  pub uploaded_video_token: UploadedVideoToken,

  /// If present, update this existing note instead of creating a new one.
  pub maybe_uploaded_video_note_token: Option<UploadVideoNoteToken>,

  /// Original filename of the submitted clip.
  pub maybe_filename: Option<String>,

  /// The model type the submitter claims this video is (dropdown / enum).
  pub maybe_reported_model_type: Option<UploadedVideoNoteReportedModelType>,

  /// Free-form custom model name (trimmed; empty becomes absent).
  pub maybe_reported_model_name: Option<String>,

  /// The website / platform the video came from (dropdown / enum).
  pub maybe_website: Option<UploadedVideoNoteReportedWebsite>,

  /// Free-form website (trimmed; empty becomes absent).
  pub maybe_other_website: Option<String>,

  /// Free-form comments (trimmed; empty becomes absent).
  pub maybe_comments: Option<String>,

  /// Optional contact email (trimmed; empty becomes absent).
  pub maybe_email_address: Option<String>,

  /// Whether the submitter consents to us sharing the report. Defaults to false.
  pub can_share_report: Option<bool>,

  /// Whether the submitter believes they were scammed. Defaults to false.
  pub was_scammed: Option<bool>,
}

/// Response body for `POST /v1/video_info/notes`.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct VideoInfoNoteResponse {
  pub success: bool,

  /// The created or updated note's token (e.g. `uvnote_…`).
  pub uploaded_video_note_token: UploadVideoNoteToken,
}
