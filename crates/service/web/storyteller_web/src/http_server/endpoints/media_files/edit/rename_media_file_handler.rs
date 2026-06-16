use std::sync::Arc;

use actix_web::web::Path;
use actix_web::{web, HttpRequest};
use log::warn;
use utoipa::ToSchema;

use crate::http_server::common_requests::media_file_token_path_info::MediaFileTokenPathInfo;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use artcraft_api_defs::common::responses::simple_generic_json_success::SimpleGenericJsonSuccess;
use crate::state::server_state::ServerState;
use mysql_queries::queries::media_files::edit::rename_media_file::rename_media_file;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;

#[derive(Deserialize, ToSchema)]
pub struct RenameMediaFileRequest {
  /// New name for the media file.
  /// If absent or empty string, the name will be cleared
  name: Option<String>,
}

// =============== Error Response ===============
// NB: Not using derive_more::Display since Clion doesn't understand it.
// =============== Handler ===============

/// Change (or remove) the "title" of a media file.
#[utoipa::path(
  post,
  tag = "Media Files",
  path = "/v1/media_files/rename/{token}",
  responses(
    (status = 200, description = "Success", body = SimpleGenericJsonSuccess),
    (status = 400, description = "Bad input", body = CommonWebError),
    (status = 401, description = "Not authorized", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
  params(
    ("request" = RenameMediaFileRequest, description = "Payload for Request"),
    ("path" = MediaFileTokenPathInfo, description = "Path for Request")
  )
)]
pub async fn rename_media_file_handler(
  http_request: HttpRequest,
  path: Path<MediaFileTokenPathInfo>,
  request: web::Json<RenameMediaFileRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<web::Json<SimpleGenericJsonSuccess>, CommonWebError>{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(CommonWebError::NotAuthorized);
    }
  };

  let is_mod = user_session.can_ban_users;

  let media_file_lookup_result = get_media_file(
    &path.token,
    is_mod,
    &server_state.mysql_pool,
  ).await;

  let media_file = match media_file_lookup_result {
    Ok(Some(media_file)) => media_file,
    Ok(None) => {
      warn!("MediaFile not found: {:?}", path.token);
      return Err(CommonWebError::NotFound);
    },
    Err(err) => {
      warn!("Error looking up media_file: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  let is_creator = media_file.maybe_creator_user_token
      .is_some_and(|t| t.as_str() == user_session.user_token.as_str());

  if !is_creator && !is_mod {
    warn!("user is not allowed to delete this media_file: {:?}", user_session.user_token);
    return Err(CommonWebError::NotAuthorized);
  }

  rename_media_file(
    &path.token,
    request.name.as_deref(),
    &server_state.mysql_pool
  ).await.map_err(|err| {
    warn!("Error renaming media_file: {:?}", err);
    CommonWebError::from_anyhow_error(err)
  })?;

  Ok(web::Json(SimpleGenericJsonSuccess { success: true }))
}
