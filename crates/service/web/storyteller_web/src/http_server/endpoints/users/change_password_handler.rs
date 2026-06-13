// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;
use artcraft_api_defs::users::change_password::{ChangePasswordRequest, ChangePasswordResponse};
use crate::http_server::validations::validate_passwords::validate_passwords;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_user_session_extended::require_user_session_extended;
use crate::state::server_state::ServerState;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::users::user::update::update_password::{update_password, UpdatePasswordArgs};
use mysql_queries::utils::transactor::Transactor;
use password::bcrypt_hash_password::bcrypt_hash_password;
// NB: Not using derive_more::Display since Clion doesn't understand it.
/// Change password for the current user.
#[utoipa::path(
  post,
  tag = "Users",
  path = "/v1/user/change_password",
  responses(
    (status = 200, description = "Success", body = ChangePasswordResponse),
    (status = 400, description = "Bad input", body = CommonWebError),
    (status = 401, description = "Not authorized", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
  params(
    ("request" = ChangePasswordRequest, description = "Payload for Request"),
  )
)]
pub async fn change_password_handler(
  http_request: HttpRequest,
  request: Json<ChangePasswordRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ChangePasswordResponse>, CommonWebError>
{
  let password = request.password.trim();
  let password_confirmation = request.password_confirmation.trim();

  if let Err(reason) = validate_passwords(password, password_confirmation) {
    return Err(CommonWebError::BadInputWithSimpleMessage(reason));
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

  let password_hash = match bcrypt_hash_password(password.to_string()) {
    Ok(hash) => hash,
    Err(err) => {
      warn!("Bcrypt error: {:?}", err);
      return Err(CommonWebError::from_error(err));
    }
  };

  let ip_address = get_request_ip(&http_request);

  let result = update_password(UpdatePasswordArgs {
    user_token: &user_session.user_token_typed,
    password_hash: &password_hash,
    ip_address: &ip_address,
    transactor: Transactor::for_connection(&mut mysql_connection),
  }).await;

  match result {
    Ok(()) => {},
    Err(err) => {
      warn!("Error updating password: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  }

  Ok(Json(ChangePasswordResponse { success: true }))
}
