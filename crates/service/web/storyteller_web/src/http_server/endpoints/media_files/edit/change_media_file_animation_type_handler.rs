use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use utoipa::ToSchema;

use enums_db::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums_db::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::media_files::edit::update_media_file_animation_type::update_media_file_animation_type;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;

use crate::http_server::common_requests::media_file_token_path_info::MediaFileTokenPathInfo;
use crate::http_server::common_responses::simple_response::SimpleResponse;
use crate::http_server::web_utils::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

#[derive(Deserialize, ToSchema)]
pub struct ChangeMediaFileAnimationTypeRequest {
    /// The new animation type for the media file.
    /// It can be cleared to null, but only for characters.
    pub maybe_animation_type: Option<MediaFileAnimationType>,
}

// =============== Error Response ===============

#[derive(Debug, Serialize, ToSchema)]
pub enum ChangeMediaFileAnimationTypeError {
    BadInput(String),
    NotFound,
    NotAuthorized,
    ServerError,
}

impl ResponseError for ChangeMediaFileAnimationTypeError {
    fn status_code(&self) -> StatusCode {
        match *self {
            ChangeMediaFileAnimationTypeError::BadInput(_) => StatusCode::BAD_REQUEST,
            ChangeMediaFileAnimationTypeError::NotFound => StatusCode::NOT_FOUND,
            ChangeMediaFileAnimationTypeError::NotAuthorized => StatusCode::UNAUTHORIZED,
            ChangeMediaFileAnimationTypeError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> HttpResponse {
        serialize_as_json_error(self)
    }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for ChangeMediaFileAnimationTypeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

// =============== Handler ===============

/// Change the animation type for a media file.
///
/// Only characters, expressions, and animations can have an animation type.
#[utoipa::path(
    post,
    tag = "Media Files",
    path = "/v1/media_files/animation_type/{token}",
    responses(
        (status = 200, description = "Success", body = SimpleResponse),
        (status = 400, description = "Bad input", body = ChangeMediaFileAnimationTypeError),
        (status = 401, description = "Not authorized", body = ChangeMediaFileAnimationTypeError),
        (status = 500, description = "Server error", body = ChangeMediaFileAnimationTypeError),
    ),
    params(
        ("request" = ChangeMediaFileAnimationTypeRequest, description = "Payload for Request"),
        ("path" = MediaFileTokenPathInfo, description = "Path for Request")
    )
)]
pub async fn change_media_file_animation_type_handler(
    http_request: HttpRequest,
    path: Path<MediaFileTokenPathInfo>,
    request: Json<ChangeMediaFileAnimationTypeRequest>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<Json<SimpleResponse>, ChangeMediaFileAnimationTypeError> {

    let user_session = require_user_session(&http_request, &server_state)
        .await
        .map_err(|e| {
            warn!("Not authorized: {:?}", e);
            ChangeMediaFileAnimationTypeError::NotAuthorized
        })?;

    let media_file_token = path.token.clone();
    let is_mod = user_session.is_mod();

    let media_file_lookup_result = get_media_file(
        &path.token,
        is_mod,
        &server_state.mysql_pool,
    ).await;

    let media_file = match media_file_lookup_result {
        Ok(Some(media_file)) => media_file,
        Ok(None) => {
            warn!("MediaFile not found: {:?}", media_file_token);
            return Err(ChangeMediaFileAnimationTypeError::NotFound);
        },
        Err(err) => {
            warn!("Error looking up media_file: {:?}", err);
            return Err(ChangeMediaFileAnimationTypeError::ServerError);
        }
    };

    match media_file.maybe_engine_category {
        // These types are allowed to have animation, others are not
        Some(MediaFileEngineCategory::Animation) => {}
        Some(MediaFileEngineCategory::Expression) => {}
        Some(MediaFileEngineCategory::Character) => {}
        // Everything else is disallowed
        _ => {
            return Err(ChangeMediaFileAnimationTypeError::BadInput(
                "this media file engine category does not support animation".to_string()));
        }
    }

    if request.maybe_animation_type.is_none()
        && media_file.maybe_engine_category != Some(MediaFileEngineCategory::Character)
    {
        return Err(ChangeMediaFileAnimationTypeError::BadInput(
            "animation type can only be cleared for character types".to_string()));
    }

    let is_creator = media_file.maybe_creator_user_token
        .is_some_and(|t| t.as_str() == user_session.user_token.as_str());

    if !is_creator && !is_mod {
        warn!("user is not allowed to edit this media_file: {:?}", user_session.user_token);
        return Err(ChangeMediaFileAnimationTypeError::NotAuthorized);
    }

    let query_result = update_media_file_animation_type(
        &media_file_token,
        request.maybe_animation_type,
        &server_state.mysql_pool
    ).await;

    match query_result {
        Ok(_) => {},
        Err(err) => {
            warn!("Update MediaFile DB error: {:?}", err);
            return Err(ChangeMediaFileAnimationTypeError::ServerError);
        }
    };

    Ok(Json(SimpleResponse {
        success: true,
    }))
}
