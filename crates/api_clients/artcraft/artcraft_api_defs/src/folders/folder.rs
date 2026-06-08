use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

use tokens::tokens::folders::FolderToken;

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

// ── DELETE /v1/folders/folder/{folder_token} ──

#[derive(Serialize, ToSchema)]
pub struct DeleteFolderSuccessResponse {
  pub success: bool,
}
