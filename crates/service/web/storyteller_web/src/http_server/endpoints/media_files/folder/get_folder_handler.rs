use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::folders::folder::{FolderPathInfo, GetFolderSuccessResponse};
use mysql_queries::queries::folders::folder::get_folder_for_owner::get_folder_for_owner;
use tokens::tokens::folders::FolderToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::media_files::folder::folder_info_conversion::folder_row_to_info;
use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

/// Fetch a single folder owned by the logged-in user.
#[utoipa::path(
  get,
  tag = "Folders",
  path = "/v1/folders/folder/{folder_token}",
  params(("folder_token" = String, description = "Folder token")),
  responses(
    (status = 200, body = GetFolderSuccessResponse),
    (status = 401, body = CommonWebError),
    (status = 404, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn get_folder_handler(
  http_request: HttpRequest,
  path: Path<FolderPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<GetFolderSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session_using_connection(
    &http_request, &server_state.session_checker, &mut conn,
  ).await.map_err(|_| CommonWebError::NotAuthorized)?;

  let folder_token = FolderToken::new_from_str(path.folder_token.trim());

  let row = get_folder_for_owner(&folder_token, &user_session.user_token, &server_state.mysql_pool)
    .await
    .map_err(|err| {
      warn!("get_folder_for_owner failed: {:?}", err);
      CommonWebError::from_error(err)
    })?
    .ok_or(CommonWebError::NotFound)?;

  Ok(Json(GetFolderSuccessResponse {
    success: true,
    folder: folder_row_to_info(row),
  }))
}
