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

// ── POST /v1/folders/media_files/{folder_token}/bulk_move ──

/// Atomically move the listed media files from `source_folder` to the
/// URL `folder_token` (destination). Idempotent on both sides: tokens
/// that aren't currently in the source are silently skipped, and tokens
/// that are already in the destination stay there.
#[derive(Deserialize, ToSchema)]
pub struct BulkMoveFolderMediaFilesRequest {
  pub source_folder: FolderToken,
  pub media_file_tokens: Vec<MediaFileToken>,
}

#[derive(Serialize, ToSchema)]
pub struct BulkMoveFolderMediaFilesSuccessResponse {
  pub success: bool,

  /// Number of membership rows actually deleted from the source folder.
  pub removed_from_source_count: u64,

  /// Number of membership rows actually inserted into the destination
  /// folder. May be lower than the input length because (a) tokens that
  /// were already present in the destination don't insert, and (b)
  /// tokens whose media file doesn't exist / is soft-deleted are filtered
  /// out before the insert.
  pub added_to_destination_count: u64,

  /// The media file tokens that ended up resident in the destination
  /// folder after the move — i.e. the subset of the input that actually
  /// referred to live media files. Includes both newly-inserted rows and
  /// rows that were already there.
  pub accepted_media_file_tokens: Vec<MediaFileToken>,
}
