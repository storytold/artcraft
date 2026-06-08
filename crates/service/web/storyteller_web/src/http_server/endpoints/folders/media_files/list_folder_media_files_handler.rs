use std::sync::Arc;

use actix_web::web::{Json, Path, Query};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::folders::media_files::{
  FolderMediaFilesPathInfo, ListFolderMediaFilesQueryParams, ListFolderMediaFilesSuccessResponse,
};
use mysql_queries::queries::folders::folder::get_folder_for_owner::get_folder_for_owner;
use mysql_queries::queries::folders::media_files::list_folder_media_files::{
  list_folder_media_files, ListFolderMediaFilesArgs,
};
use tokens::tokens::folders::FolderToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::folders::folder::folder_info_conversion::folder_media_file_row_to_info;
use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

const CURSOR_NAME: &str = "folder_mf";
const DEFAULT_LIMIT: u32 = 100;
const MAX_LIMIT: u32 = 1000;

#[utoipa::path(
  get,
  tag = "Folders",
  path = "/v1/folders/media_files/{folder_token}",
  params(
    ("folder_token" = String, description = "Folder token"),
    ListFolderMediaFilesQueryParams,
  ),
  responses(
    (status = 200, body = ListFolderMediaFilesSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn list_folder_media_files_handler(
  http_request: HttpRequest,
  path: Path<FolderMediaFilesPathInfo>,
  query: Query<ListFolderMediaFilesQueryParams>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ListFolderMediaFilesSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session_using_connection(
    &http_request, &server_state.session_checker, &mut conn,
  ).await.map_err(|_| CommonWebError::NotAuthorized)?;

  let folder_token = FolderToken::new_from_str(path.folder_token.trim());

  // Confirm the folder exists + is owned.
  let folder = get_folder_for_owner(&folder_token, &user_session.user_token, &server_state.mysql_pool)
    .await
    .map_err(|err| {
      warn!("Folder lookup failed: {:?}", err);
      CommonWebError::from_error(err)
    })?;
  if folder.is_none() {
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

  let rows = list_folder_media_files(ListFolderMediaFilesArgs {
    folder_token: &folder_token,
    maybe_cursor_id,
    limit,
    pool: &server_state.mysql_pool,
  }).await.map_err(|err| {
    warn!("list_folder_media_files failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let maybe_cursor = rows.last().map(|last| {
    server_state.opaque_cursors.encode_last_id_cursor(CURSOR_NAME, last.membership_id)
  }).transpose().map_err(|err| {
    warn!("Failed to encode cursor: {:?}", err);
    CommonWebError::server_error_with_message("Failed to encode cursor")
  })?;

  let media_files = rows.into_iter().map(folder_media_file_row_to_info).collect();

  Ok(Json(ListFolderMediaFilesSuccessResponse {
    success: true,
    media_files,
    maybe_cursor,
  }))
}
