//! Shared types for the by-class session media file list endpoints
//! (`/v1/media_files/mesh/list`, `/v1/media_files/splat/list`).

use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::prompts::PromptToken;

use crate::common::responses::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::common::responses::media_links::MediaLinks;
use crate::common::responses::user_details_light::UserDetailsLight;

/// Query string parameters for the by-class session media file lists.
/// Pagination only — the media class is fixed by the endpoint.
#[derive(Deserialize, IntoParams)]
pub struct ListSessionMediaFilesByTypeQueryParams {
  pub sort_ascending: Option<bool>,
  pub page_size: Option<usize>,
  pub cursor: Option<String>,
  pub cursor_is_reversed: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct SessionMediaFileInfo {
  /// Primary key identifier
  pub token: MediaFileToken,

  /// The coarse-grained class of media file.
  /// Fixed per endpoint (`mesh` or `splat`).
  pub media_class: MediaFileClass,

  /// Type of media will dictate which fields are populated and what
  /// the frontend should display (eg. video player vs audio player).
  /// This is closer in meaning to a "mime type".
  pub media_type: MediaFileType,

  /// Rich CDN links to the media, including thumbnails, previews, and more.
  pub media_links: MediaLinks,

  /// Information about the cover image. Many media files do not require a cover image,
  /// e.g. image files, video files with thumbnails, audio files, etc.
  /// 3D files require them.
  pub cover_image: MediaFileCoverImageDetails,

  /// User info
  pub maybe_creator_user: Option<UserDetailsLight>,

  pub creator_set_visibility: Visibility,

  /// The generation's prompt record, when there is one. Clients resolve it
  /// to display the original prompt and model.
  pub maybe_prompt_token: Option<PromptToken>,

  /// The name or title of the media file (optional)
  pub maybe_title: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
