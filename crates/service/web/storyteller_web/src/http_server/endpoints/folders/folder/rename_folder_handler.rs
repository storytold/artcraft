use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::folders::folder::{
  FolderPathInfo, RenameFolderRequest, RenameFolderSuccessResponse,
};
use mysql_queries::queries::folders::folder::get_folder_for_owner::{
  get_folder_for_owner, GetFolderForOwnerArgs,
};
use mysql_queries::queries::folders::folder::update_folder_name::{
  update_folder_name, UpdateFolderNameArgs,
};
use tokens::tokens::folders::FolderToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

const MAX_NAME_LEN: usize = 255;

#[utoipa::path(
  put,
  tag = "Folders",
  path = "/v1/folders/folder/{folder_token}/rename",
  params(("folder_token" = FolderToken, description = "Folder token")),
  request_body = RenameFolderRequest,
  responses(
    (status = 200, body = RenameFolderSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn rename_folder_handler(
  http_request: HttpRequest,
  path: Path<FolderPathInfo>,
  request: Json<RenameFolderRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<RenameFolderSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session_using_connection(
    &http_request, &server_state.session_checker, &mut conn,
  ).await.map_err(|_| CommonWebError::NotAuthorized)?;

  let new_name = request.new_name.trim().to_string();

  if new_name.is_empty() {
    return Err(CommonWebError::BadInputWithSimpleMessage("name is empty".to_string()));
  }

  if new_name.len() > MAX_NAME_LEN {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("name too long (max {} chars)", MAX_NAME_LEN),
    ));
  }

  // Confirm the folder exists + is owned before issuing the update.
  // A 404 here is the authoritative "not found" signal — the update
  // itself is idempotent and we don't gate on rows_affected.
  get_folder_for_owner(GetFolderForOwnerArgs {
    folder_token: &path.folder_token,
    owner_user_token: &user_session.user_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Folder lookup failed: {:?}", err);
    CommonWebError::from_error(err)
  })?
  .ok_or(CommonWebError::NotFound)?;

  update_folder_name(UpdateFolderNameArgs {
    folder_token: &path.folder_token,
    owner_user_token: &user_session.user_token,
    new_name: &new_name,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("update_folder_name failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  Ok(Json(RenameFolderSuccessResponse { success: true }))
}
