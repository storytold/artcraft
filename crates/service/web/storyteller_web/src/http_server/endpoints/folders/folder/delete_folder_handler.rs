use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::folders::folder::{DeleteFolderSuccessResponse, FolderPathInfo};
use mysql_queries::queries::folders::folder::soft_delete_folder::{
  soft_delete_folder, SoftDeleteFolderArgs,
};
use tokens::tokens::folders::FolderToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

/// Soft-delete a folder. Children retain their parent pointer and become
/// "orphaned" — surfaced by the list query's `is_orphaned` flag.
#[utoipa::path(
  delete,
  tag = "Folders",
  path = "/v1/folders/folder/{folder_token}",
  params(("folder_token" = FolderToken, description = "Folder token")),
  responses(
    (status = 200, body = DeleteFolderSuccessResponse),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn delete_folder_handler(
  http_request: HttpRequest,
  path: Path<FolderPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<DeleteFolderSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session_using_connection(
    &http_request, &server_state.session_checker, &mut conn,
  ).await.map_err(|_| CommonWebError::NotAuthorized)?;


  let rows_affected = soft_delete_folder(SoftDeleteFolderArgs {
    folder_token: &path.folder_token,
    owner_user_token: &user_session.user_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("soft_delete_folder failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  if rows_affected == 0 {
    return Err(CommonWebError::NotFound);
  }

  Ok(Json(DeleteFolderSuccessResponse { success: true }))
}
