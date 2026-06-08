use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::folders::subfolder::{
  BulkRemoveSubfoldersRequest, BulkRemoveSubfoldersSuccessResponse, SubfolderPathInfo,
};
use mysql_queries::queries::folders::subfolder::bulk_clear_parent_folder::{
  bulk_clear_parent_folder, BulkClearParentFolderArgs,
};
use tokens::tokens::folders::FolderToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

const MAX_BULK: usize = 500;

/// Bulk-unparent folders from the URL `folder_token`. Idempotent: rows
/// that aren't currently parented to this folder are silently skipped.
#[utoipa::path(
  put,
  tag = "Folders (Subfolder Management)",
  path = "/v1/folders/subfolders/{folder_token}/bulk_remove",
  params(("folder_token" = FolderToken, description = "Parent folder token")),
  request_body = BulkRemoveSubfoldersRequest,
  responses(
    (status = 200, body = BulkRemoveSubfoldersSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn bulk_remove_subfolders_handler(
  http_request: HttpRequest,
  path: Path<SubfolderPathInfo>,
  request: Json<BulkRemoveSubfoldersRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<BulkRemoveSubfoldersSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session_using_connection(
    &http_request, &server_state.session_checker, &mut conn,
  ).await.map_err(|_| CommonWebError::NotAuthorized)?;

  if request.subfolder_tokens.len() > MAX_BULK {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("too many subfolders in one request (max {})", MAX_BULK),
    ));
  }

  // No parent existence check — the UPDATE's WHERE clause already gates
  // on owner_user_token AND current parent, so this is naturally a no-op
  // for rows we shouldn't touch.
  let removed_count = bulk_clear_parent_folder(BulkClearParentFolderArgs {
    child_tokens: &request.subfolder_tokens,
    from_parent_token: &path.folder_token,
    owner_user_token: &user_session.user_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("bulk_clear_parent_folder failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  Ok(Json(BulkRemoveSubfoldersSuccessResponse {
    success: true,
    removed_count,
  }))
}
