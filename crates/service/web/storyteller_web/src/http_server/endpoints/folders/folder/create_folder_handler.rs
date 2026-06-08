use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::folders::common::FolderInfo;
use artcraft_api_defs::folders::folder::{CreateFolderRequest, CreateFolderSuccessResponse};
use mysql_queries::queries::folders::folder::get_folder_for_owner::{
  get_folder_for_owner, GetFolderForOwnerArgs,
};
use mysql_queries::queries::folders::folder::insert_folder::{insert_folder, InsertFolderArgs};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::folders::folder::folder_info_conversion::folder_row_to_info;
use crate::http_server::web_utils::user_session::require_user_session_using_connection::require_user_session_using_connection;
use crate::state::server_state::ServerState;

const MAX_NAME_LEN: usize = 255;

/// Create a new folder owned by the logged-in user.
#[utoipa::path(
  post,
  tag = "Folders",
  path = "/v1/folders/create",
  request_body = CreateFolderRequest,
  responses(
    (status = 200, body = CreateFolderSuccessResponse),
    (status = 400, body = CommonWebError),
    (status = 401, body = CommonWebError),
    (status = 500, body = CommonWebError),
  ),
)]
pub async fn create_folder_handler(
  http_request: HttpRequest,
  request: Json<CreateFolderRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<CreateFolderSuccessResponse>, CommonWebError> {
  let mut conn = server_state.mysql_pool.acquire().await.map_err(|err| {
    warn!("MySQL pool error: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  let user_session = require_user_session_using_connection(
    &http_request, &server_state.session_checker, &mut conn,
  ).await.map_err(|_| CommonWebError::NotAuthorized)?;

  let name = request.name.trim().to_string();

  if name.is_empty() {
    return Err(CommonWebError::BadInputWithSimpleMessage("name is empty".to_string()));
  }

  if name.len() > MAX_NAME_LEN {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      format!("name too long (max {} chars)", MAX_NAME_LEN),
    ));
  }

  // If a parent was supplied, require it to exist + be owned by the caller.
  if let Some(parent_token) = &request.maybe_parent_folder_token {
    let parent = get_folder_for_owner(GetFolderForOwnerArgs {
      folder_token: parent_token,
      owner_user_token: &user_session.user_token,
      mysql_executor: &mut *conn,
      phantom: PhantomData,
    }).await.map_err(|err| {
      warn!("Parent folder lookup failed: {:?}", err);
      CommonWebError::from_error(err)
    })?;

    if parent.is_none() {
      return Err(CommonWebError::BadInputWithSimpleMessage(
        "parent folder does not exist".to_string(),
      ));
    }
  }

  let token = insert_folder(InsertFolderArgs {
    name: &name,
    owner_user_token: &user_session.user_token,
    maybe_parent_folder_token: request.maybe_parent_folder_token.as_ref(),
    maybe_color_code: request.maybe_color_code.as_deref(),
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("insert_folder failed: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  // Re-fetch so we return the canonical FolderInfo including is_orphaned.
  let row = get_folder_for_owner(GetFolderForOwnerArgs {
    folder_token: &token,
    owner_user_token: &user_session.user_token,
    mysql_executor: &mut *conn,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Post-insert folder fetch failed: {:?}", err);
    CommonWebError::from_error(err)
  })?
  .ok_or_else(|| CommonWebError::server_error_with_message("folder vanished after insert"))?;

  let folder: FolderInfo = folder_row_to_info(row);

  Ok(Json(CreateFolderSuccessResponse {
    success: true,
    folder,
  }))
}
