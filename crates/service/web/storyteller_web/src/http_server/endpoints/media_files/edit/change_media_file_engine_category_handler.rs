use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use utoipa::ToSchema;

use enums::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::media_files::edit::update_media_file_engine_category::update_media_file_engine_category;
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;

use crate::http_server::common_requests::media_file_token_path_info::MediaFileTokenPathInfo;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::common_responses::simple_response::SimpleResponse;
use crate::http_server::web_utils::user_session::require_user_session::require_user_session;
use crate::state::server_state::ServerState;

#[derive(Deserialize, ToSchema)]
pub struct ChangeMediaFileEngineCategoryRequest {
    pub engine_category: MediaFileEngineCategory,
}

// =============== Error Response ===============
// NB: Not using derive_more::Display since Clion doesn't understand it.
// =============== Handler ===============

/// Change the engine category of a media file.
///
/// Only certain transitions are allowed.
#[utoipa::path(
    post,
    tag = "Media Files",
    path = "/v1/media_files/engine_category/{token}",
    responses(
        (status = 200, description = "Success", body = SimpleResponse),
        (status = 400, description = "Bad input", body = CommonWebError),
        (status = 401, description = "Not authorized", body = CommonWebError),
        (status = 500, description = "Server error", body = CommonWebError),
    ),
    params(
        ("request" = ChangeMediaFileEngineCategoryRequest, description = "Payload for Request"),
        ("path" = MediaFileTokenPathInfo, description = "Path for Request")
    )
)]
pub async fn change_media_file_engine_category_handler(
    http_request: HttpRequest,
    path: Path<MediaFileTokenPathInfo>,
    request: Json<ChangeMediaFileEngineCategoryRequest>,
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
        None => return Err(CommonWebError::BadInputWithSimpleMessage(
            "No engine category on existing object".to_string())),

        Some(existing_category) => {
            if !is_valid_transition(existing_category) {
                return Err(CommonWebError::BadInputWithSimpleMessage(
                    format!("Invalid engine category on existing object: {:?}", existing_category)));
            }
        }
    }

    if !is_valid_transition(request.engine_category) {
        return Err(CommonWebError::BadInputWithSimpleMessage(
            format!("Invalid engine category: {:?}", request.engine_category)));
    }

    let is_creator = media_file.maybe_creator_user_token
        .is_some_and(|t| t.as_str() == user_session.user_token.as_str());

    if !is_creator && !is_mod {
        warn!("user is not allowed to edit this media_file: {:?}", user_session.user_token);
        return Err(CommonWebError::NotAuthorized);
    }

    let query_result = update_media_file_engine_category(
        &media_file_token,
        request.engine_category,
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

fn is_valid_transition(engine_category: MediaFileEngineCategory) -> bool {
    match engine_category {
        // We allow engine transitions between these types since they are simple.
        MediaFileEngineCategory::Object
        | MediaFileEngineCategory::Creature
        | MediaFileEngineCategory::Location
        | MediaFileEngineCategory::SetDressing
        | MediaFileEngineCategory::Skybox => true,

        // We do not allow engine transitions between these types,
        // because they are more complicated and require other metadata.
        MediaFileEngineCategory::Scene
        | MediaFileEngineCategory::Character
        | MediaFileEngineCategory::Animation
        | MediaFileEngineCategory::Expression
        | MediaFileEngineCategory::ImagePlane
        | MediaFileEngineCategory::VideoPlane => false,
    }
}
