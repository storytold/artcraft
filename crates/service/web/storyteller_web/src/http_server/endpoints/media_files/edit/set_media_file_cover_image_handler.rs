use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{info, warn};
use utoipa::ToSchema;

use enums::by_table::media_files::media_file_type::MediaFileType;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::media_files::edit::set_media_file_cover_image::{set_media_file_cover_image, UpdateArgs};
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use tokens::tokens::media_files::MediaFileToken;

use crate::http_server::common_requests::media_file_token_path_info::MediaFileTokenPathInfo;
use artcraft_api_defs::common::responses::simple_generic_json_success::SimpleGenericJsonSuccess;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;

#[derive(Deserialize, ToSchema)]
pub struct SetMediaFileCoverImageRequest {
  /// Optional media token for the image to set as the cover image
  /// If absent or empty string, the cover image will be cleared.
  cover_image_media_file_token: Option<MediaFileToken>,
}

// =============== Error Response ===============

#[derive(Debug, Serialize, ToSchema)]
pub enum SetMediaFileCoverImageError {
  BadInput(String),
  NotFound,
  NotAuthorized,
  ServerError,
}

impl ResponseError for SetMediaFileCoverImageError {
  fn status_code(&self) -> StatusCode {
    match *self {
      SetMediaFileCoverImageError::BadInput(_) => StatusCode::BAD_REQUEST,
      SetMediaFileCoverImageError::NotFound => StatusCode::NOT_FOUND,
      SetMediaFileCoverImageError::NotAuthorized => StatusCode::UNAUTHORIZED,
      SetMediaFileCoverImageError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for SetMediaFileCoverImageError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

/// Set or remove the "cover image" (which are used as thumbnails) on a file.
///
/// The cover image is another media file of media_class = image. It can be anything in the database,
/// you'll just need its media file token.
#[utoipa::path(
  post,
  tag = "Media Files",
  path = "/v1/media_files/cover_image/{token}",
  responses(
    (status = 200, description = "Success Delete", body = SimpleGenericJsonSuccess),
    (status = 400, description = "Bad input", body = SetMediaFileCoverImageError),
    (status = 401, description = "Not authorized", body = SetMediaFileCoverImageError),
    (status = 500, description = "Server error", body = SetMediaFileCoverImageError),
  ),
  params(
    ("request" = SetMediaFileCoverImageRequest, description = "Payload for Request"),
    ("path" = MediaFileTokenPathInfo, description = "Path for Request")
  )
)]
pub async fn set_media_file_cover_image_handler(
  http_request: HttpRequest,
  path: Path<MediaFileTokenPathInfo>,
  request: web::Json<SetMediaFileCoverImageRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, SetMediaFileCoverImageError>{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        SetMediaFileCoverImageError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(SetMediaFileCoverImageError::NotAuthorized);
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
      return Err(SetMediaFileCoverImageError::NotFound);
    },
    Err(err) => {
      warn!("Error looking up media_file: {:?}", err);
      return Err(SetMediaFileCoverImageError::ServerError);
    }
  };

  let is_creator = media_file.maybe_creator_user_token
      .is_some_and(|t| t.as_str() == user_session.user_token.as_str());

  if !is_creator && !is_mod {
    warn!("user is not allowed to delete this media_file: {:?}", user_session.user_token);
    return Err(SetMediaFileCoverImageError::NotAuthorized);
  }

  let mut maybe_set_media_file_token = None;

  let delete_cover_image = request.cover_image_media_file_token
      .as_ref()
      .map(|token| token.as_str().trim().is_empty())
      .unwrap_or(true);

  info!("Delete media file cover image? : {delete_cover_image}");

  if !delete_cover_image {
    if let Some(media_file_token) = &request.cover_image_media_file_token {
      let media_file_lookup_result = get_media_file(
        &media_file_token,
        false,
        &server_state.mysql_pool,
      ).await;

      let media_file = match media_file_lookup_result {
        Ok(Some(media_file)) => media_file,
        Ok(None) => {
          warn!("Media file not found: {:?}", media_file_token);
          return Err(SetMediaFileCoverImageError::NotFound);
        },
        Err(err) => {
          warn!("Error looking up model_weights : {:?}", err);
          return Err(SetMediaFileCoverImageError::ServerError);
        }
      };

      //let can_use_image = media_file.creator_set_visibility == Visibility::Public
      //    && media_file.media_type == MediaFileType::Image;

      let can_use_image = media_file.media_type == MediaFileType::Image;

      if  !can_use_image {
        return Err(SetMediaFileCoverImageError::BadInput("Invalid media file token.".to_string()));
      }

      maybe_set_media_file_token = Some(media_file.token);
    }
  }

  let query_result = set_media_file_cover_image(UpdateArgs {
    media_file_token: &path.token,
    maybe_cover_image_media_file_token: maybe_set_media_file_token.as_ref(),
    mysql_pool: &server_state.mysql_pool,
  }).await;

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Update MediaFile DB error: {:?}", err);
      return Err(SetMediaFileCoverImageError::ServerError);
    }
  };

  Ok(simple_json_success())
}
