use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::{Json, Path, Query};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::folders::subfolder::{
  ListSubfoldersQueryParams, ListSubfoldersSuccessResponse, SubfolderPathInfo,
};
use mysql_queries::queries::folders::folder::get_folder_for_owner::{
  get_folder_for_owner, GetFolderForOwnerArgs,
};
use mysql_queries::queries::folders::subfolder::list_subfolders::{
  list_subfolders, ListSubfoldersArgs,
};
use tokens::tokens::folders::FolderToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::folders::folder::folder_info_conversion::folder_row_to_info;
use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

const CURSOR_NAME: &str = "subfolders";
const DEFAULT_LIMIT: u32 = 100;
const MAX_LIMIT: u32 = 1000;

#[utoipa::path(
  get,
  tag = "Folders (Subfolder Management)",
  path = "/v1/folders/subfolders/{folder_token}",
  params(
    ("folder_token" = FolderToken, description = "Parent folder token"),
    ListSubfoldersQueryParams,
  ),
  responses(
    (status = 200, body = ListSubfoldersSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn list_subfolders_handler(
  http_request: HttpRequest,
  path: Path<SubfolderPathInfo>,
  query: Query<ListSubfoldersQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListSubfoldersSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session_using_connection(
    &http_request, &server_state.session_checker, &mut conn,
  ).await.map_err(|_| CommonWebError::NotAuthorized)?;


  // Confirm the parent exists + is owned by the caller before listing.
  let parent = get_folder_for_owner(GetFolderForOwnerArgs {
    folder_token: &path.folder_token,
    owner_user_token: &user_session.user_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Parent folder lookup failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;
  if parent.is_none() {
    return Err(CommonWebError::NotFound);
  }

  let limit = query.limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT);

  let maybe_cursor_id = match &query.cursor {
    None => None,
    Some(cursor_str) => {
      let decoded = server_state.opaque_cursors
        .decode_cursor_expecting_name(CURSOR_NAME, cursor_str)
        .map_err(|err| {
          warn!("Failed to decode cursor: {:?}", err);
          CommonWebError::BadInputWithSimpleMessage("Invalid cursor".to_string())
        })?;
      decoded.last_id
    }
  };

  let rows = list_subfolders(ListSubfoldersArgs {
    parent_folder_token: &path.folder_token,
    owner_user_token: &user_session.user_token,
    maybe_cursor_id,
    limit,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("list_subfolders failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let maybe_cursor = rows.last().map(|last| {
    server_state.opaque_cursors.encode_last_id_cursor(CURSOR_NAME, last.id)
  }).transpose().map_err(|err| {
    warn!("Failed to encode cursor: {:?}", err);
    CommonWebError::server_error_with_message("Failed to encode cursor")
  })?;

  let subfolders = rows.into_iter().map(folder_row_to_info).collect();

  Ok(Json(ListSubfoldersSuccessResponse {
    success: true,
    subfolders,
    maybe_cursor,
  }))
}
