use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest};
use log::{info, warn};

use artcraft_api_defs::common::responses::simple_generic_json_success::SimpleGenericJsonSuccess;
use mysql_queries::queries::ip_bans::upsert_ip_ban::{upsert_ip_ban, UpsertIpBanArgs};
use user_input_common::validate_user_provided_ip_address::validate_user_provided_ip_address;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

#[derive(Deserialize)]
pub struct AddIpBanRequest {
  ip_address: String,
  mod_notes: String,
  maybe_target_user_token: Option<String>,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
pub async fn add_ip_ban_handler(
  http_request: HttpRequest,
  request: web::Json<AddIpBanRequest>,
  server_state: web::Data<Arc<ServerState>>
) -> Result<web::Json<SimpleGenericJsonSuccess>, CommonWebError> {

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

  if !user_session.can_ban_users {
    warn!("user is not allowed to add bans: {:?}", user_session.user_token);
    return Err(CommonWebError::NotAuthorized);
  }

  let ip_address = request.ip_address.trim();

  if let Err(e) = validate_user_provided_ip_address(&ip_address) {
    warn!("Bad ip address: {}", e);
    return Err(CommonWebError::BadInputWithSimpleMessage(e.to_string()));
  }

  info!("Creating ban...");

  upsert_ip_ban(UpsertIpBanArgs {
    ip_address,
    maybe_target_user_token: request.maybe_target_user_token.as_deref(),
    mod_user_token: user_session.user_token.as_str(),
    mod_notes: &request.mod_notes,
    mysql_pool: &server_state.mysql_pool,
  }).await
      .map_err(|err| {
        warn!("Add IP ban DB error: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?;

  Ok(web::Json(SimpleGenericJsonSuccess { success: true }))
}
