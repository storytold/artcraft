use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use utoipa::ToSchema;

use enums_db::by_table::media_files::media_file_type::MediaFileType;
use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::response_success_helpers::simple_json_success;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use mysql_queries::queries::model_weights::edit::set_model_weight_cover_image::{set_model_weight_cover_image, UpdateArgs};
use mysql_queries::queries::model_weights::get::get_weight::get_weight_by_token;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::state::server_state::ServerState;

#[derive(Deserialize, ToSchema)]
pub struct SetModelWeightCoverImageRequest {
  pub cover_image_media_file_token: Option<MediaFileToken>,
}

#[derive(Serialize, ToSchema)]
pub struct SetModelWeightCoverImageResponse {
  pub success: bool,
}

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct SetModelWeightCoverImagePathInfo {
  token: ModelWeightToken,
}

// =============== Error Response ===============

#[derive(Debug, Serialize, ToSchema)]
pub enum SetModelWeightCoverImageError {
  BadInput(String),
  NotFound,
  NotAuthorized,
  ServerError,
}

impl ResponseError for SetModelWeightCoverImageError {
  fn status_code(&self) -> StatusCode {
    match *self {
      SetModelWeightCoverImageError::BadInput(_) => StatusCode::BAD_REQUEST,
      SetModelWeightCoverImageError::NotFound => StatusCode::NOT_FOUND,
      SetModelWeightCoverImageError::NotAuthorized => StatusCode::UNAUTHORIZED,
      SetModelWeightCoverImageError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for SetModelWeightCoverImageError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

// =============== Handler ===============

#[utoipa::path(
  post,
  tag = "Model Weights",
  path = "/v1/weights/weight/{weight_token}/cover_image",
  responses(
    (status = 200, description = "Success Update", body = SetModelWeightCoverImageResponse),
    (status = 400, description = "Bad input", body = SetModelWeightCoverImageError),
    (status = 401, description = "Not authorized", body = SetModelWeightCoverImageError),
    (status = 500, description = "Server error", body = SetModelWeightCoverImageError),
  ),
  params(
    ("request" = SetModelWeightCoverImageRequest, description = "Payload for Request"),
    ("path" = SetModelWeightCoverImagePathInfo, description = "Path for Request")
  )
)]
pub async fn set_model_weight_cover_image_handler(
  http_request: HttpRequest,
  path: Path<SetModelWeightCoverImagePathInfo>,
  request: web::Json<SetModelWeightCoverImageRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, SetModelWeightCoverImageError>
{
  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session(&http_request, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Session checker error: {:?}", e);
        SetModelWeightCoverImageError::ServerError
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      warn!("not logged in");
      return Err(SetModelWeightCoverImageError::NotAuthorized);
    }
  };

  let media_file_token = path.token.clone();

  let is_mod = user_session.can_ban_users;

  let model_weight_lookup_result = get_weight_by_token(
    &path.token,
    is_mod,
    &server_state.mysql_pool,
  ).await;

  let model_weight = match model_weight_lookup_result {
    Ok(Some(model_weight)) => model_weight,
    Ok(None) => {
      warn!("Model weight not found: {:?}", &path.token);
      return Err(SetModelWeightCoverImageError::NotFound);
    },
    Err(err) => {
      warn!("Error looking up model_weights : {:?}", err);
      return Err(SetModelWeightCoverImageError::ServerError);
    }
  };

  let is_creator = model_weight.creator_user_token.as_str() == user_session.user_token.as_str();

  if !is_creator && !is_mod {
    warn!("user is not allowed to edit this media_file: {:?}", user_session.user_token);
    return Err(SetModelWeightCoverImageError::NotAuthorized);
  }

  let mut maybe_set_media_file_token = None;

  let delete_cover_image = request.cover_image_media_file_token
      .as_ref()
      .map(|token| token.as_str().trim().is_empty())
      .unwrap_or(true);

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
          return Err(SetModelWeightCoverImageError::NotFound);
        },
        Err(err) => {
          warn!("Error looking up model_weights : {:?}", err);
          return Err(SetModelWeightCoverImageError::ServerError);
        }
      };

      //let can_use_image = media_file.creator_set_visibility == Visibility::Public
      //    && media_file.media_type == MediaFileType::Image;

      let can_use_image = media_file.media_type == MediaFileType::Image;

      if  !can_use_image {
        return Err(SetModelWeightCoverImageError::BadInput("Invalid media file token.".to_string()));
      }

      maybe_set_media_file_token = Some(media_file.token);
    }
  }

  // TODO(bt,2023-12-21): DB needs a column, or we need an ip audit log
  let _ip_address = get_request_ip(&http_request);

  let query_result = set_model_weight_cover_image(UpdateArgs {
    model_weight_token: &path.token,
    maybe_cover_image_media_file_token: maybe_set_media_file_token.as_ref(),
    mysql_pool: &server_state.mysql_pool,
  }).await;

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("Update MediaFile DB error: {:?}", err);
      return Err(SetModelWeightCoverImageError::ServerError);
    }
  };

  Ok(simple_json_success())
}
