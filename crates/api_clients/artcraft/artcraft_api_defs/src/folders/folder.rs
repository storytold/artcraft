use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::folders::common::FolderInfo;

// ── POST /v1/folders/create ──

#[derive(Deserialize, ToSchema)]
pub struct CreateFolderRequest {
  pub name: String,
  pub maybe_parent_folder_token: Option<FolderToken>,
  pub maybe_color_code: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct CreateFolderSuccessResponse {
  pub success: bool,
  pub folder: FolderInfo,
}

// ── GET /v1/folders/list_all ──

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListFoldersQueryParams {
  pub cursor: Option<String>,
  pub limit: Option<u32>,
}

#[derive(Serialize, ToSchema)]
pub struct ListFoldersSuccessResponse {
  pub success: bool,
  pub folders: Vec<FolderInfo>,
  pub maybe_cursor: Option<String>,
}

// ── GET /v1/folders/folder/{folder_token} ──

#[derive(Deserialize, ToSchema)]
pub struct FolderPathInfo {
  pub folder_token: FolderToken,
}

#[derive(Serialize, ToSchema)]
pub struct GetFolderSuccessResponse {
  pub success: bool,
  pub folder: FolderInfo,
}

// ── PUT /v1/folders/folder/{folder_token}/rename ──

#[derive(Deserialize, ToSchema)]
pub struct RenameFolderRequest {
  pub new_name: String,
}

#[derive(Serialize, ToSchema)]
pub struct RenameFolderSuccessResponse {
  pub success: bool,
}

// ── PUT /v1/folders/folder/{folder_token}/star ──

#[derive(Deserialize, ToSchema)]
pub struct SetFolderStarRequest {
  pub has_star: bool,
}

#[derive(Serialize, ToSchema)]
pub struct SetFolderStarSuccessResponse {
  pub success: bool,
}

// ── PUT /v1/folders/folder/{folder_token}/color_code ──

#[derive(Deserialize, ToSchema)]
pub struct SetFolderColorCodeRequest {
  /// `None` clears the color tag.
  pub maybe_color_code: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct SetFolderColorCodeSuccessResponse {
  pub success: bool,
}

// ── PUT /v1/folders/folder/{folder_token}/cover_image ──

#[derive(Deserialize, ToSchema)]
pub struct SetFolderCoverImageRequest {
  /// `None` clears the cover image. If set, the server resolves it to a
  /// usable cover-image media file token: image/video media files are
  /// used directly; other types fall back to the file's own
  /// `maybe_cover_image_media_file_token` (and fail if neither path
  /// applies).
  pub maybe_media_file_token: Option<MediaFileToken>,
}

#[derive(Serialize, ToSchema)]
pub struct SetFolderCoverImageSuccessResponse {
  pub success: bool,

  /// The media file token that ended up being stored as the cover image
  /// (may differ from the requested token if the server resolved through
  /// the file's own cover image). `None` when the cover was cleared.
  pub maybe_resolved_cover_media_file_token: Option<MediaFileToken>,
}

// ── DELETE /v1/folders/folder/{folder_token} ──

#[derive(Serialize, ToSchema)]
pub struct DeleteFolderSuccessResponse {
  pub success: bool,
}
