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
use artcraft_api_defs::users::edit_email::{EditEmailRequest, EditEmailResponse};
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::user_session::require_user_session_extended_using_connection::require_user_session_extended_using_connection;
use crate::state::server_state::ServerState;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::users::user::update::update_email::{update_email, UpdateEmailArgs, UpdateEmailError};
use mysql_queries::utils::transactor::Transactor;
use users::email::email_to_gravatar_hash::email_to_gravatar_hash;
use users::email::validate_email_address_format::validate_email_address_format;

#[derive(Debug, ToSchema)]
pub enum EditEmailError {
  BadInput(String),
  NotAuthorized,
  ServerError,
}

impl ResponseError for EditEmailError {
  fn status_code(&self) -> StatusCode {
    match *self {
      EditEmailError::BadInput(_) => StatusCode::BAD_REQUEST,
      EditEmailError::NotAuthorized => StatusCode::UNAUTHORIZED,
      EditEmailError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      EditEmailError::BadInput(reason) => reason.to_string(),
      EditEmailError::NotAuthorized => "unauthorized".to_string(),
      EditEmailError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for EditEmailError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}


/// Edit email address of the current user.
#[utoipa::path(
  post,
  tag = "Users",
  path = "/v1/user/edit_email",
  responses(
    (status = 200, description = "Success", body = EditEmailResponse),
    (status = 400, description = "Bad input", body = EditEmailError),
    (status = 401, description = "Not authorized", body = EditEmailError),
    (status = 500, description = "Server error", body = EditEmailError),
  ),
  params(
    ("request" = EditEmailRequest, description = "Payload for Request"),
  )
)]
pub async fn edit_email_handler(
  http_request: HttpRequest,
  request: Json<EditEmailRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<EditEmailResponse>, EditEmailError>
{
  let email_address = request.email_address.trim().to_lowercase();

  if let Err(reason) = validate_email_address_format(&email_address) {
    return Err(EditEmailError::BadInput(format!("bad email: {}", &reason)));
  }

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        EditEmailError::ServerError
      })?;

  let user_session = require_user_session_extended_using_connection(
    &http_request,
    &server_state.session_checker,
    &mut mysql_connection)
      .await
      .map_err(|_err| {
        EditEmailError::NotAuthorized
      })?;

  if user_session.role.is_banned {
    return Err(EditEmailError::NotAuthorized);
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
      return Err(EditEmailError::BadInput("email address is already in use".to_string()));
    }
    Err(UpdateEmailError::DatabaseError { source }) => {
      warn!("Error updating email: {:?}", source);
      return Err(EditEmailError::ServerError);
    }
  }

  Ok(Json(EditEmailResponse { success: true }))
}
