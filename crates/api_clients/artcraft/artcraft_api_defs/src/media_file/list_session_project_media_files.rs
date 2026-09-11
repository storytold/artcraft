use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

use enums::by_table::media_files::media_file_class::MediaFileClass;
use enums::by_table::media_files::media_file_project_type::MediaFileProjectType;
use enums::by_table::media_files::media_file_type::MediaFileType;
use enums::common::visibility::Visibility;
use tokens::tokens::media_files::MediaFileToken;

use crate::common::responses::media_file_cover_image_details::MediaFileCoverImageDetails;
use crate::common::responses::media_links::MediaLinks;
use crate::common::responses::pagination_cursors::PaginationCursors;
use crate::common::responses::user_details_light::UserDetailsLight;

pub const LIST_SESSION_PROJECT_MEDIA_FILES_URL_PATH: &str = "/v1/media_files/project/list";

/// Query string parameters for listing the session user's project files.
#[derive(Deserialize, IntoParams)]
pub struct ListSessionProjectMediaFilesQueryParams {
  pub sort_ascending: Option<bool>,
  pub page_size: Option<usize>,
  pub cursor: Option<String>,
  pub cursor_is_reversed: Option<bool>,

  /// Optional filter on the specific project document type.
  ///
  /// Usage:
  ///   - `?filter_project_type=scene_3d`
  ///   - `?filter_project_type=mood_board`
  ///   - `?filter_project_type=workflow`
  ///   - `?filter_project_type=video_timeline`
  pub filter_project_type: Option<MediaFileProjectType>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct ListSessionProjectMediaFilesSuccessResponse {
  pub success: bool,
  pub results: Vec<ProjectMediaFileInfo>,
  pub pagination: PaginationCursors,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct ProjectMediaFileInfo {
  /// Primary key identifier
  pub token: MediaFileToken,

  /// The coarse-grained class of media file.
  /// Always `project` for this endpoint.
  pub media_class: MediaFileClass,

  /// The specific kind of project document: 3D scene, mood board, etc.
  pub project_type: MediaFileProjectType,

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

  /// The name or title of the media file (optional)
  pub maybe_title: Option<String>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}
