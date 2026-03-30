// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Json;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use utoipa::ToSchema;
use artcraft_api_defs::users::change_password::{ChangePasswordRequest, ChangePasswordResponse};
use crate::http_server::validations::validate_passwords::validate_passwords;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::user_session::require_user_session_extended_using_connection::require_user_session_extended_using_connection;
use crate::state::server_state::ServerState;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::users::user::update::update_password::{update_password, UpdatePasswordArgs};
use mysql_queries::utils::transactor::Transactor;
use password::bcrypt_hash_password::bcrypt_hash_password;

#[derive(Debug, ToSchema)]
pub enum ChangePasswordError {
  BadInput(String),
  NotAuthorized,
  ServerError,
}

impl ResponseError for ChangePasswordError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ChangePasswordError::BadInput(_) => StatusCode::BAD_REQUEST,
      ChangePasswordError::NotAuthorized => StatusCode::UNAUTHORIZED,
      ChangePasswordError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      ChangePasswordError::BadInput(reason) => reason.to_string(),
      ChangePasswordError::NotAuthorized => "unauthorized".to_string(),
      ChangePasswordError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for ChangePasswordError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}


/// Change password for the current user.
#[utoipa::path(
  post,
  tag = "Users",
  path = "/v1/user/change_password",
  responses(
    (status = 200, description = "Success", body = ChangePasswordResponse),
    (status = 400, description = "Bad input", body = ChangePasswordError),
    (status = 401, description = "Not authorized", body = ChangePasswordError),
    (status = 500, description = "Server error", body = ChangePasswordError),
  ),
  params(
    ("request" = ChangePasswordRequest, description = "Payload for Request"),
  )
)]
pub async fn change_password_handler(
  http_request: HttpRequest,
  request: Json<ChangePasswordRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ChangePasswordResponse>, ChangePasswordError>
{
  let password = request.password.trim();
  let password_confirmation = request.password_confirmation.trim();

  if let Err(reason) = validate_passwords(password, password_confirmation) {
    return Err(ChangePasswordError::BadInput(reason));
  }

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        ChangePasswordError::ServerError
      })?;

  let user_session = require_user_session_extended_using_connection(
    &http_request,
    &server_state.session_checker,
    &mut mysql_connection)
      .await
      .map_err(|_err| {
        ChangePasswordError::NotAuthorized
      })?;

  if user_session.role.is_banned {
    return Err(ChangePasswordError::NotAuthorized);
  }

  let password_hash = match bcrypt_hash_password(password.to_string()) {
    Ok(hash) => hash,
    Err(err) => {
      warn!("Bcrypt error: {:?}", err);
      return Err(ChangePasswordError::ServerError);
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
      return Err(ChangePasswordError::ServerError);
    }
  }

  Ok(Json(ChangePasswordResponse { success: true }))
}
