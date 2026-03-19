use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use utoipa::ToSchema;

use crate::http_server::common_requests::media_file_token_path_info::MediaFileTokenPathInfo;
use artcraft_api_defs::common::responses::simple_generic_json_success::SimpleGenericJsonSuccess;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::media_files::edit::rename_media_file::rename_media_file;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;

#[derive(Deserialize, ToSchema)]
pub struct RenameMediaFileRequest {
  /// New name for the media file.
  /// If absent or empty string, the name will be cleared
  name: Option<String>,
}

// =============== Error Response ===============

#[derive(Debug, Serialize, ToSchema)]
pub enum RenameMediaFileError {
  BadInput(String),
  NotFound,
  NotAuthorized,
  ServerError,
}

impl ResponseError for RenameMediaFileError {
  fn status_code(&self) -> StatusCode {
    match *self {
      RenameMediaFileError::BadInput(_) => StatusCode::BAD_REQUEST,
      RenameMediaFileError::NotFound => StatusCode::NOT_FOUND,
      RenameMediaFileError::NotAuthorized => StatusCode::UNAUTHORIZED,
      RenameMediaFileError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for RenameMediaFileError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

/// Change (or remove) the "title" of a media file.
#[utoipa::path(
  post,
  tag = "Media Files",
  path = "/v1/media_files/rename/{token}",
  responses(
    (status = 200, description = "Success", body = SimpleGenericJsonSuccess),
    (status = 400, description = "Bad input", body = RenameMediaFileError),
    (status = 401, description = "Not authorized", body = RenameMediaFileError),
    (status = 500, description = "Server error", body = RenameMediaFileError),
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
) -> Result<HttpResponse, RenameMediaFileError>{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        RenameMediaFileError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(RenameMediaFileError::NotAuthorized);
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
      return Err(RenameMediaFileError::NotFound);
    },
    Err(err) => {
      warn!("Error looking up media_file: {:?}", err);
      return Err(RenameMediaFileError::ServerError);
    }
  };

  let is_creator = media_file.maybe_creator_user_token
      .is_some_and(|t| t.as_str() == user_session.user_token.as_str());

  if !is_creator && !is_mod {
    warn!("user is not allowed to delete this media_file: {:?}", user_session.user_token);
    return Err(RenameMediaFileError::NotAuthorized);
  }

  rename_media_file(
    &path.token,
    request.name.as_deref(),
    &server_state.mysql_pool
  ).await.map_err(|err| {
    warn!("Error renaming media_file: {:?}", err);
    RenameMediaFileError::ServerError
  })?;

  Ok(simple_json_success())
}
