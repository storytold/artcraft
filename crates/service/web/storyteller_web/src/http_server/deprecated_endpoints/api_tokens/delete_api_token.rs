use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::{error, warn};

use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::api_tokens::delete_api_token::delete_api_token;
use mysql_queries::queries::api_tokens::list_available_api_tokens_for_user::list_available_api_tokens_for_user;

use crate::state::server_state::ServerState;
use crate::http_server::common_responses::common_web_error::CommonWebError;

// =============== Request ===============

// NB: `api_token` is only in PathInfo because we're deleting it.

#[derive(Deserialize)]
pub struct DeleteApiTokenPathInfo {
  api_token: String,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct DeleteApiTokenResponse {
  pub success: bool,
}

// =============== Error Response ===============
// NB: Not using derive_more::Display since Clion doesn't understand it.
// =============== Handler ===============

pub async fn delete_api_token_handler(
  http_request: HttpRequest,
  path: Path<DeleteApiTokenPathInfo>,
  server_state: web::Data<Arc<ServerState>>) -> Result<HttpResponse, CommonWebError>
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

  if user_session.is_banned {
    warn!("banned users cannot edit API tokens");
    return Err(CommonWebError::NotAuthorized);
  }

  let tokens = list_available_api_tokens_for_user(
    user_session.user_token.as_str(),
    &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Error querying tokens: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?;

  let valid_token = tokens.iter()
      .find(|t| t.api_token.eq(&path.api_token))
      .is_some();

  if !valid_token {
    warn!("Invalid API Token");
    return Err(CommonWebError::NotFound);
  }

  let creator_ip_address = get_request_ip(&http_request);

  let _r = delete_api_token(
    user_session.user_token.as_str(),
    &path.api_token,
    &creator_ip_address,
    &server_state.mysql_pool)
      .await
      .map_err(|e| {
        error!("Error with query: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      });

  let response = DeleteApiTokenResponse {
    success: true,
  };

  let body = serde_json::to_string(&response)
      .map_err(CommonWebError::from_error)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
