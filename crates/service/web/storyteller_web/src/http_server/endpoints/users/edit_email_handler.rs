// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;
use artcraft_api_defs::users::edit_email::{EditEmailRequest, EditEmailResponse};
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_user_session_extended::require_user_session_extended;
use crate::state::server_state::ServerState;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::users::user::update::update_email::{update_email, UpdateEmailArgs, UpdateEmailError};
use mysql_queries::utils::transactor::Transactor;
use users::email::email_to_gravatar_hash::email_to_gravatar_hash;
use users::email::validate_email_address_format::validate_email_address_format;
// NB: Not using derive_more::Display since Clion doesn't understand it.
/// Edit email address of the current user.
#[utoipa::path(
  post,
  tag = "Users",
  path = "/v1/user/edit_email",
  responses(
    (status = 200, description = "Success", body = EditEmailResponse),
    (status = 400, description = "Bad input", body = CommonWebError),
    (status = 401, description = "Not authorized", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
  params(
    ("request" = EditEmailRequest, description = "Payload for Request"),
  )
)]
pub async fn edit_email_handler(
  http_request: HttpRequest,
  request: Json<EditEmailRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<EditEmailResponse>, CommonWebError>
{
  let email_address = request.email_address.trim().to_lowercase();

  if let Err(reason) = validate_email_address_format(&email_address) {
    return Err(CommonWebError::BadInputWithSimpleMessage(format!("bad email: {}", &reason)));
  }

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  let user_session = require_user_session_extended(
    &http_request,
    &server_state.session_checker,
    &mut *mysql_connection).await?;

  if user_session.role.is_banned {
    return Err(CommonWebError::NotAuthorized);
  }

  let ip_address = get_request_ip(&http_request);
  let gravatar_hash = email_to_gravatar_hash(&email_address);

  let result = update_email(UpdateEmailArgs {
    token: &user_session.user_token_typed,
    email_address: &email_address,
    email_gravatar_hash: &gravatar_hash,
    ip_address: &ip_address,
    transactor: Transactor::for_connection(&mut mysql_connection),
  }).await;

  match result {
    Ok(()) => {},
    Err(UpdateEmailError::EmailIsTaken) => {
      return Err(CommonWebError::BadInputWithSimpleMessage("email address is already in use".to_string()));
    }
    Err(UpdateEmailError::DatabaseError { source }) => {
      warn!("Error updating email: {:?}", source);
      return Err(CommonWebError::server_error_with_message("uncaught server error"));
    }
  }

  Ok(Json(EditEmailResponse { success: true }))
}
