use std::fmt;
use std::sync::Arc;

use actix_web::web::Path;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::common::responses::simple_generic_json_success::SimpleGenericJsonSuccess;
use mysql_queries::queries::voice_designer::datasets::delete_dataset::{delete_dataset_as_mod, delete_dataset_as_user, undelete_dataset_as_mod, undelete_dataset_as_user};
use mysql_queries::queries::voice_designer::datasets::get_dataset::get_dataset_by_token;
use tokens::tokens::zs_voice_datasets::ZsVoiceDatasetToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use crate::util::delete_role_disambiguation::{delete_role_disambiguation, DeleteRole};

#[derive(Deserialize)]
pub struct DeleteDatasetRequest {
    set_delete: bool,
    /// NB: this is only to disambiguate when a user is both a mod and an author.
    as_mod: Option<bool>,
}

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct DeleteDatasetPathInfo {
    dataset_token: String,
}

// =============== Error Response ===============
// NB: Not using derive_more::Display since Clion doesn't understand it.
// =============== Handler ===============

pub async fn delete_dataset_handler(
    http_request: HttpRequest,
    path: Path<DeleteDatasetPathInfo>,
    request: web::Json<DeleteDatasetRequest>,
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

    let dataset_token = path.dataset_token.clone();
    let is_mod = user_session.can_ban_users;

    let dataset_lookup_result = get_dataset_by_token(
        &ZsVoiceDatasetToken::new(dataset_token.clone()),
        is_mod,
        &server_state.mysql_pool,
    ).await;

    let dataset = match dataset_lookup_result {
        Ok(Some(dataset)) => dataset,
        Ok(None) => {
            warn!("Dataset not found: {:?}", dataset_token);
            return Err(CommonWebError::NotFound);
        },
        Err(err) => {
            warn!("Error looking up dataset: {:?}", err);
            return Err(CommonWebError::from_anyhow_error(err));
        }
    };

    let is_creator = dataset.maybe_creator_user_token.as_deref()
        .map(|creator_user_token| creator_user_token == user_session.user_token.as_str())
        .unwrap_or(false);

    if !is_creator && !is_mod {
        warn!("user is not allowed to delete this dataset: {:?}", user_session.user_token);
        return Err(CommonWebError::NotAuthorized);
    }

    let delete_role = delete_role_disambiguation(is_mod, is_creator, request.as_mod);

    let query_result = if request.set_delete {
        match delete_role {
            DeleteRole::ErrorDoNotDelete => {
                warn!("user is not allowed to delete datasets: {:?}", user_session.user_token);
                return Err(CommonWebError::NotAuthorized);
            }
            DeleteRole::AsUser => {
                delete_dataset_as_user(
                    &path.dataset_token,
                    &server_state.mysql_pool
                ).await
            }
            DeleteRole::AsMod => {
                delete_dataset_as_mod(
                    &path.dataset_token,
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
                // NB: Technically only mods can see their own datasets
                undelete_dataset_as_user(
                    &path.dataset_token,
                    &server_state.mysql_pool
                ).await
            }
            DeleteRole::AsMod => {
                undelete_dataset_as_mod(
                    &path.dataset_token,
                    user_session.user_token.as_str(),
                    &server_state.mysql_pool
                ).await
            }
        }
    };

    match query_result {
        Ok(_) => {},
        Err(err) => {
            warn!("Update dataset mod approval status DB error: {:?}", err);
            return Err(CommonWebError::from_anyhow_error(err));
        }
    };

    Ok(web::Json(SimpleGenericJsonSuccess { success: true }))

  }