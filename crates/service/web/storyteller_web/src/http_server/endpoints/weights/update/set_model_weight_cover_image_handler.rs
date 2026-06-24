use std::sync::Arc;

use actix_web::web::Path;
use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;
use utoipa::ToSchema;

use enums::by_table::media_files::media_file_type::MediaFileType;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use mysql_queries::queries::model_weights::edit::set_model_weight_cover_image::{set_model_weight_cover_image, UpdateArgs};
use mysql_queries::queries::model_weights::get::get_weight::get_weight_by_token;
use tokens::tokens::media_files::MediaFileToken;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::state::server_state::ServerState;
use crate::http_server::common_responses::common_web_error::CommonWebError;

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
// NB: Not using derive_more::Display since Clion doesn't understand it.
// =============== Handler ===============

#[utoipa::path(
  post,
  tag = "Model Weights",
  path = "/v1/weights/weight/{weight_token}/cover_image",
  responses(
    (status = 200, description = "Success Update", body = SetModelWeightCoverImageResponse),
    (status = 400, description = "Bad input", body = CommonWebError),
    (status = 401, description = "Not authorized", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
  params(
    ("request" = SetModelWeightCoverImageRequest, description = "Payload for Request"),
    ("path" = SetModelWeightCoverImagePathInfo, description = "Path for Request")
  )
)]
pub async fn set_model_weight_cover_image_handler(
  http_request: HttpRequest,
  path: Path<SetModelWeightCoverImagePathInfo>,
  request: Json<SetModelWeightCoverImageRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<Json<SetModelWeightCoverImageResponse>, CommonWebError>
{
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
      return Err(CommonWebError::NotFound);
    },
    Err(err) => {
      warn!("Error looking up model_weights : {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  let is_creator = model_weight.creator_user_token.as_str() == user_session.user_token.as_str();

  if !is_creator && !is_mod {
    warn!("user is not allowed to edit this media_file: {:?}", user_session.user_token);
    return Err(CommonWebError::NotAuthorized);
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
          return Err(CommonWebError::NotFound);
        },
        Err(err) => {
          warn!("Error looking up model_weights : {:?}", err);
          return Err(CommonWebError::from_anyhow_error(err));
        }
      };

      //let can_use_image = media_file.creator_set_visibility == Visibility::Public
      //    && media_file.media_type == MediaFileType::Image;

      let can_use_image = media_file.media_type == MediaFileType::Image;

      if  !can_use_image {
        return Err(CommonWebError::BadInputWithSimpleMessage("Invalid media file token.".to_string()));
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
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  Ok(Json(SetModelWeightCoverImageResponse { success: true }))
}
