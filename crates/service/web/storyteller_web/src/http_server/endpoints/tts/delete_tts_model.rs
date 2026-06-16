use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::common::responses::simple_generic_json_success::SimpleGenericJsonSuccess;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::tts::tts_models::delete_tts_model_various_scopes::delete_tts_model_as_mod;
use mysql_queries::queries::tts::tts_models::delete_tts_model_various_scopes::delete_tts_model_as_user;
use mysql_queries::queries::tts::tts_models::delete_tts_model_various_scopes::undelete_tts_model_as_mod;
use mysql_queries::queries::tts::tts_models::delete_tts_model_various_scopes::undelete_tts_model_as_user;
use mysql_queries::queries::tts::tts_models::get_tts_model::get_tts_model_by_token;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;
use crate::util::delete_role_disambiguation::delete_role_disambiguation;
use crate::util::delete_role_disambiguation::DeleteRole;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct DeleteTtsModelPathInfo {
  token: String,
}

#[derive(Deserialize)]
pub struct DeleteTtsModelRequest {
  set_delete: bool,
  /// NB: this is only to disambiguate when a user is both a mod and an author.
  as_mod: Option<bool>,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
pub async fn delete_tts_model_handler(
  http_request: HttpRequest,
  path: Path<DeleteTtsModelPathInfo>,
  request: web::Json<DeleteTtsModelRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<web::Json<SimpleGenericJsonSuccess>, CommonWebError> {
  // NB: Disable if we've migrated to model_weights
  if server_state.flags.switch_tts_to_model_weights {
    warn!("Migration to model_weights for tts. Cannot delete old model.");
    return Err(CommonWebError::server_error_with_message("uncaught server error"));
  }

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

  // NB: First permission check.
  // Only mods should see deleted models (both user_* and mod_* deleted).
  let is_mod = user_session.can_delete_other_users_tts_models;

  let model_query_result = get_tts_model_by_token(
    &path.token,
    is_mod,
    &server_state.mysql_pool,
  ).await;

  let tts_model = match model_query_result {
    Err(e) => {
      warn!("query error: {:?}", e);
      return Err(CommonWebError::from_anyhow_error(e));
    }
    Ok(None) => return Err(CommonWebError::NotFound),
    Ok(Some(model)) => model,
  };

  // NB: Second set of permission checks
  let is_author = &tts_model.creator_user_token == user_session.user_token.as_str();

  if !is_author && !is_mod {
    warn!("user is not allowed to delete models: {:?}", user_session.user_token);
    return Err(CommonWebError::NotAuthorized);
  }

  if !is_mod {
    if tts_model.is_locked_from_user_modification || tts_model.is_locked_from_use {
      warn!("user is not allowed to delete models (locked): {:?}", user_session.user_token);
      return Err(CommonWebError::NotAuthorized);
    }
  }

  let ip_address = get_request_ip(&http_request);

  let delete_role = delete_role_disambiguation(is_mod, is_author, request.as_mod);

  let query_result = if request.set_delete {
    match delete_role {
      DeleteRole::ErrorDoNotDelete => {
        warn!("user is not allowed to delete model: {:?}", user_session.user_token);
        return Err(CommonWebError::NotAuthorized);
      }
      DeleteRole::AsUser => {
        delete_tts_model_as_user(
          &path.token,
          &ip_address,
          &server_state.mysql_pool,
        ).await
      }
      DeleteRole::AsMod => {
        delete_tts_model_as_mod(
          &path.token,
          user_session.user_token.as_str(),
          &server_state.mysql_pool
        ).await
      }
    }
  } else {
    match delete_role {
      DeleteRole::ErrorDoNotDelete => {
        warn!("user is not allowed to undelete model: {:?}", user_session.user_token);
        return Err(CommonWebError::NotAuthorized);
      }
      DeleteRole::AsUser => {
        // NB: Technically only mods can see their own inference_results here
        undelete_tts_model_as_user(
          &path.token,
          &ip_address,
          &server_state.mysql_pool
        ).await
      }
      DeleteRole::AsMod => {
        undelete_tts_model_as_mod(
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
      warn!("Delete tts model DB error: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  Ok(web::Json(SimpleGenericJsonSuccess { success: true }))
}
