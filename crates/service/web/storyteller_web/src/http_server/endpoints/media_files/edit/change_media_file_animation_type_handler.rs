use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use utoipa::ToSchema;

use enums::by_table::media_files::media_file_animation_type::MediaFileAnimationType;
use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::media_files::edit::update_media_file_animation_type::update_media_file_animation_type;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;

use crate::http_server::common_requests::media_file_token_path_info::MediaFileTokenPathInfo;
use crate::http_server::common_responses::common_web_error::CommonWebError;
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
// NB: Not using derive_more::Display since Clion doesn't understand it.
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
        (status = 400, description = "Bad input", body = CommonWebError),
        (status = 401, description = "Not authorized", body = CommonWebError),
        (status = 500, description = "Server error", body = CommonWebError),
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
) -> Result<Json<SimpleResponse>, CommonWebError> {

    let user_session = require_user_session(&http_request, &server_state.session_checker, &server_state.mysql_pool)
        .await?;

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
            return Err(CommonWebError::NotFound);
        },
        Err(err) => {
            warn!("Error looking up media_file: {:?}", err);
            return Err(CommonWebError::from_anyhow_error(err));
        }
    };

    match media_file.maybe_engine_category {
        // These types are allowed to have animation, others are not
        Some(MediaFileEngineCategory::Animation) => {}
        Some(MediaFileEngineCategory::Expression) => {}
        Some(MediaFileEngineCategory::Character) => {}
        // Everything else is disallowed
        _ => {
            return Err(CommonWebError::BadInputWithSimpleMessage(
                "this media file engine category does not support animation".to_string()));
        }
    }

    if request.maybe_animation_type.is_none()
        && media_file.maybe_engine_category != Some(MediaFileEngineCategory::Character)
    {
        return Err(CommonWebError::BadInputWithSimpleMessage(
            "animation type can only be cleared for character types".to_string()));
    }

    let is_creator = media_file.maybe_creator_user_token
        .is_some_and(|t| t.as_str() == user_session.user_token.as_str());

    if !is_creator && !is_mod {
        warn!("user is not allowed to edit this media_file: {:?}", user_session.user_token);
        return Err(CommonWebError::NotAuthorized);
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
            return Err(CommonWebError::from_anyhow_error(err));
        }
    };

    Ok(Json(SimpleResponse {
        success: true,
    }))
}
