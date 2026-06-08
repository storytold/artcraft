use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

use tokens::tokens::folders::FolderToken;
use tokens::tokens::media_files::MediaFileToken;

use crate::folders::common::FolderMediaFileInfo;

// ── GET /v1/folders/media_files/{folder_token} ──

#[derive(Deserialize, ToSchema)]
pub struct FolderMediaFilesPathInfo {
  pub folder_token: FolderToken,
}

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListFolderMediaFilesQueryParams {
  pub cursor: Option<String>,
  pub limit: Option<u32>,
}

#[derive(Serialize, ToSchema)]
pub struct ListFolderMediaFilesSuccessResponse {
  pub success: bool,
  pub media_files: Vec<FolderMediaFileInfo>,
  pub maybe_cursor: Option<String>,
}

// ── PUT /v1/folders/media_files/{folder_token}/bulk_add ──

#[derive(Deserialize, ToSchema)]
pub struct BulkAddFolderMediaFilesRequest {
  /// Media files to add to the folder. Tokens that don't exist or are
  /// soft-deleted are silently skipped. Already-added rows are no-ops
  /// (idempotent via INSERT IGNORE on the composite primary key).
  pub media_file_tokens: Vec<MediaFileToken>,
}

#[derive(Serialize, ToSchema)]
pub struct BulkAddFolderMediaFilesSuccessResponse {
  pub success: bool,
  /// Tokens that pre-existed (existed + not deleted). Already-added rows
  /// are included since the operation is idempotent.
  pub accepted_media_file_tokens: Vec<MediaFileToken>,
}

// ── PUT /v1/folders/media_files/{folder_token}/bulk_remove ──

#[derive(Deserialize, ToSchema)]
pub struct BulkRemoveFolderMediaFilesRequest {
  pub media_file_tokens: Vec<MediaFileToken>,
}

#[derive(Serialize, ToSchema)]
pub struct BulkRemoveFolderMediaFilesSuccessResponse {
  pub success: bool,
  /// How many membership rows were actually hard-deleted.
  pub removed_count: u64,
}
