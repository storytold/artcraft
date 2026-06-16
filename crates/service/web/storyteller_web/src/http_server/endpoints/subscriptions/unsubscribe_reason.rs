use std::sync::Arc;

use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest};
use log::{error, info};

use http_server_common::request::get_request_ip::get_request_ip;
use http_server_common::response::serialize_as_json_error::serialize_as_json_error;
use mysql_queries::queries::unsubscribe_reason::insert_unsubscribe_reason::UnsubscribeReasonInsertBuilder;

use crate::state::server_state::ServerState;
use crate::http_server::common_responses::common_web_error::CommonWebError;

// =============== Request ===============

#[derive(Deserialize)]
pub struct SetUnsubscribeReasonRequest {
  /// The type of the entity being rated.
  pub reason: String,
}

// =============== Success Response ===============

#[derive(Serialize)]
pub struct SetUnsubscribeReasonResponse {
  pub success: bool,
}

// =============== Error Response ===============
// =============== Handler ===============

pub async fn set_unsubscribe_reason_handler(
  http_request: HttpRequest,
  request: web::Json<SetUnsubscribeReasonRequest>,
  server_state: web::Data<Arc<ServerState>>) -> Result<web::Json<SetUnsubscribeReasonResponse>, CommonWebError>
{
  let mut mysql_connection = server_state.mysql_pool.acquire()
      .await
      .map_err(|e| {
        error!("Could not acquire DB pool: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let maybe_user_session = server_state
      .session_checker
      .maybe_get_user_session_from_connection(&http_request, &mut mysql_connection)
      .await
      .map_err(|e| {
        error!("Session checker error: {:?}", e);
        CommonWebError::from_error(e)
      })?;

  let user_session = match maybe_user_session {
    Some(session) => session,
    None => {
      info!("not logged in");
      return Err(CommonWebError::NotAuthorized);
    }
  };

  let ip_address = get_request_ip(&http_request);

  UnsubscribeReasonInsertBuilder::new()
    .set_user_token(user_session.user_token.as_str())
    .set_ip_address(&ip_address)
    .set_unsubscribe_reason(&request.reason)
    .insert(&mut mysql_connection)
    .await
    .map_err(CommonWebError::from_anyhow_error)?;


  let response = SetUnsubscribeReasonResponse {
    success: true,
  };

  Ok(web::Json(response))
}
