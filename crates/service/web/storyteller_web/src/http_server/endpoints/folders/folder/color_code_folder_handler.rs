use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::folders::folder::{
  FolderPathInfo, SetFolderColorCodeRequest, SetFolderColorCodeSuccessResponse,
};
use mysql_queries::queries::folders::folder::get_folder_for_owner::{
  get_folder_for_owner, GetFolderForOwnerArgs,
};
use mysql_queries::queries::folders::folder::update_folder_color_code::{
  update_folder_color_code, UpdateFolderColorCodeArgs,
};
use tokens::tokens::folders::FolderToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

const MAX_COLOR_CODE_LEN: usize = 16;

#[utoipa::path(
  put,
  tag = "Folders",
  path = "/v1/folders/folder/{folder_token}/color_code",
  params(("folder_token" = FolderToken, description = "Folder token")),
  request_body = SetFolderColorCodeRequest,
  responses(
    (status = 200, body = SetFolderColorCodeSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn color_code_folder_handler(
  http_request: HttpRequest,
  path: Path<FolderPathInfo>,
  request: Json<SetFolderColorCodeRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<SetFolderColorCodeSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session_using_connection(
    &http_request, &server_state.session_checker, &mut conn,
  ).await.map_err(|_| CommonWebError::NotAuthorized)?;

  // Normalize: trim, treat empty after trim as `None`. This lets clients
  // clear by passing `""` or by omitting the field entirely.
  let trimmed: Option<String> = request.maybe_color_code.as_ref().and_then(|s| {
    let t = s.trim();
    if t.is_empty() { None } else { Some(t.to_string()) }
  });

  if let Some(code) = trimmed.as_deref() {
    if code.len() > MAX_COLOR_CODE_LEN {
      return Err(CommonWebError::BadInputWithSimpleMessage(
        format!("color_code too long (max {} chars)", MAX_COLOR_CODE_LEN),
      ));
    }
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

  update_folder_color_code(UpdateFolderColorCodeArgs {
    folder_token: &path.folder_token,
    owner_user_token: &user_session.user_token,
    maybe_color_code: trimmed.as_deref(),
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("update_folder_color_code failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  Ok(Json(SetFolderColorCodeSuccessResponse { success: true }))
}
