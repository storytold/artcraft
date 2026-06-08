use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::folders::media_files::{
  BulkRemoveFolderMediaFilesRequest, BulkRemoveFolderMediaFilesSuccessResponse,
  FolderMediaFilesPathInfo,
};
use mysql_queries::queries::folders::folder::get_folder_for_owner::get_folder_for_owner;
use mysql_queries::queries::folders::media_files::bulk_delete_folder_media_files::bulk_delete_folder_media_files;
use tokens::tokens::folders::FolderToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

const MAX_BULK: usize = 500;

/// Bulk-remove media files from a folder. Hard-deletes the membership
/// rows; idempotent (rows that don't exist are silently skipped).
#[utoipa::path(
  put,
  tag = "Folders",
  path = "/v1/folders/media_files/{folder_token}/bulk_remove",
  params(("folder_token" = String, description = "Folder token")),
  request_body = BulkRemoveFolderMediaFilesRequest,
  responses(
    (status = 200, body = BulkRemoveFolderMediaFilesSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn bulk_remove_folder_media_files_handler(
  http_request: HttpRequest,
  path: Path<FolderMediaFilesPathInfo>,
  request: Json<BulkRemoveFolderMediaFilesRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<BulkRemoveFolderMediaFilesSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session_using_connection(
    &http_request, &server_state.session_checker, &mut conn,
  ).await.map_err(|_| CommonWebError::NotAuthorized)?;

  if request.media_file_tokens.len() > MAX_BULK {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("too many media files in one request (max {})", MAX_BULK),
    ));
  }

  let folder_token = FolderToken::new_from_str(path.folder_token.trim());

  // Confirm the folder exists + is owned. We don't strictly need this for
  // correctness (the DELETE's folder_token guard suffices), but it keeps
  // the 404 vs 200 semantics consistent with the rest of the API.
  let folder = get_folder_for_owner(&folder_token, &user_session.user_token, &server_state.mysql_pool)
    .await
    .map_err(|err| {
      warn!("Folder lookup failed: {:?}", err);
      CommonWebError::from_error(err)
    })?;
  if folder.is_none() {
    return Err(CommonWebError::NotFound);
  }

  let removed_count = bulk_delete_folder_media_files(
    &folder_token,
    &request.media_file_tokens,
    &server_state.mysql_pool,
  ).await.map_err(|err| {
    warn!("bulk_delete_folder_media_files failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  Ok(Json(BulkRemoveFolderMediaFilesSuccessResponse {
    success: true,
    removed_count,
  }))
}
