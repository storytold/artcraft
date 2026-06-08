use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

use tokens::tokens::folders::FolderToken;

use crate::folders::common::FolderInfo;

// ── GET /v1/folders/subfolders/{folder_token} ──

#[derive(Deserialize, ToSchema)]
pub struct SubfolderPathInfo {
  pub folder_token: FolderToken,
}

#[derive(Deserialize, ToSchema, IntoParams)]
pub struct ListSubfoldersQueryParams {
  pub cursor: Option<String>,
  pub limit: Option<u32>,
}

#[derive(Serialize, ToSchema)]
pub struct ListSubfoldersSuccessResponse {
  pub success: bool,
  pub subfolders: Vec<FolderInfo>,
  pub maybe_cursor: Option<String>,
}

// ── PUT /v1/folders/subfolders/{folder_token}/bulk_add ──

#[derive(Deserialize, ToSchema)]
pub struct BulkAddSubfoldersRequest {
  /// The folders to reparent under the URL `folder_token`. Tokens that
  /// don't exist, aren't owned by the caller, are soft-deleted, or are
  /// the parent itself are silently skipped (idempotent).
  pub subfolder_tokens: Vec<FolderToken>,
}

#[derive(Serialize, ToSchema)]
pub struct BulkAddSubfoldersSuccessResponse {
  pub success: bool,
  /// Tokens that were actually accepted (existed + owned + not deleted +
  /// not the parent itself). Already-parented tokens are included here
  /// since the operation is idempotent.
  pub accepted_subfolder_tokens: Vec<FolderToken>,
}

// ── PUT /v1/folders/subfolders/{folder_token}/bulk_remove ──

#[derive(Deserialize, ToSchema)]
pub struct BulkRemoveSubfoldersRequest {
  /// Folders to unparent. Only rows currently parented to the URL
  /// `folder_token` are affected; others are silently skipped.
  pub subfolder_tokens: Vec<FolderToken>,
}

#[derive(Serialize, ToSchema)]
pub struct BulkRemoveSubfoldersSuccessResponse {
  pub success: bool,
  /// How many rows were actually unparented.
  pub removed_count: u64,
}
