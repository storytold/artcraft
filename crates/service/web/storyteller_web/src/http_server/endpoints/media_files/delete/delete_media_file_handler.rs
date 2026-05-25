use std::fmt;
use std::sync::Arc;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;
use crate::util::delete_role_disambiguation::{delete_role_disambiguation, DeleteRole};
use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest, HttpResponse};
use artcraft_api_defs::common::responses::simple_generic_json_success::SimpleGenericJsonSuccess;
use artcraft_api_defs::media_file::delete_media_file::{DeleteMediaFilePathInfo, DeleteMediaFileRequest};
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use log::warn;
use mysql_queries::queries::media_files::delete::delete_media_file::{delete_media_file_as_mod, delete_media_file_as_user, undelete_media_file_as_mod, undelete_media_file_as_user};
use mysql_queries::queries::media_files::get::get_media_file::get_media_file;
use tokens::tokens::media_files::MediaFileToken;
use utoipa::ToSchema;

// =============== Handler ===============

/// Delete a media file. (Files and records are soft deleted.)
#[utoipa::path(
    delete,
    tag = "Media Files",
    path = "/v1/media_files/file/{token}",
    responses(
        (status = 200, description = "Success Delete", body = SimpleGenericJsonSuccess),
        (status = 400, description = "Bad input", body = CommonWebError),
        (status = 401, description = "Not authorized", body = CommonWebError),
        (status = 500, description = "Server error", body = CommonWebError),
    ),
    params(
        ("request" = DeleteMediaFileRequest, description = "Payload for Request"),
        ("path" = DeleteMediaFilePathInfo, description = "Path for Request")
    )
)]
pub async fn delete_media_file_handler(
    http_request: HttpRequest,
    path: Path<DeleteMediaFilePathInfo>,
    request: Json<DeleteMediaFileRequest>,
    server_state: web::Data<Arc<ServerState>>
) -> Result<Json<SimpleGenericJsonSuccess>, CommonWebError> {
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

    let delete_role = delete_role_disambiguation(is_mod, is_creator, request.as_mod);

    let query_result = if request.set_delete {
        match delete_role {
            DeleteRole::ErrorDoNotDelete => {
                warn!("user is not allowed to delete media_files: {:?}", user_session.user_token);
                return Err(CommonWebError::NotAuthorized);
            }
            DeleteRole::AsUser => {
                delete_media_file_as_user(
                    &path.token,
                    &server_state.mysql_pool
                ).await
            }
            DeleteRole::AsMod => {
                delete_media_file_as_mod(
                    &path.token,
                    user_session.user_token.as_str(),
                    &server_state.mysql_pool
                ).await
            }
        }
    } else {
        match delete_role {
            DeleteRole::ErrorDoNotDelete => {
                warn!("user is not allowed to undelete voices: {:?}", user_session.user_token);
                return Err(CommonWebError::NotAuthorized);
            }
            DeleteRole::AsUser => {
                // NB: Technically only mods can see their own media_files
                undelete_media_file_as_user(
                    &path.token,
                    &server_state.mysql_pool
                ).await
            }
            DeleteRole::AsMod => {
                undelete_media_file_as_mod(
                    &path.token,
                    user_session.user_token.as_str(),
                    &server_state.mysql_pool
                ).await
            }
        }
    };

    match query_result {
        Ok(_) => {},
        Err(err) => {
            warn!("Update media_file mod approval status DB error: {:?}", err);
            return Err(CommonWebError::from_anyhow_error(err));
        }
    };

    Ok(Json(SimpleGenericJsonSuccess{
        success: true
    }))
}
