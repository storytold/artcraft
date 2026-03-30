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
use artcraft_api_defs::users::edit_username::{EditUsernameRequest, EditUsernameResponse};
use crate::http_server::validations::is_reserved_username::is_reserved_username;
use crate::http_server::validations::validate_username::validate_username;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::user_session::require_user_session_extended_using_connection::require_user_session_extended_using_connection;
use crate::state::server_state::ServerState;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::users::user::update::update_username::{update_username, UpdateUsernameArgs, UpdateUsernameError};
use mysql_queries::utils::transactor::Transactor;
use user_input_common::check_for_slurs::contains_slurs;


#[derive(Debug, ToSchema)]
pub enum EditUsernameError {
  BadInput(String),
  NotAuthorized,
  ServerError,
}

impl ResponseError for EditUsernameError {
  fn status_code(&self) -> StatusCode {
    match *self {
      EditUsernameError::BadInput(_) => StatusCode::BAD_REQUEST,
      EditUsernameError::NotAuthorized => StatusCode::UNAUTHORIZED,
      EditUsernameError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
    }
  }

  fn error_response(&self) -> HttpResponse {
    let error_reason = match self {
      EditUsernameError::BadInput(reason) => reason.to_string(),
      EditUsernameError::NotAuthorized => "unauthorized".to_string(),
      EditUsernameError::ServerError => "server error".to_string(),
    };

    to_simple_json_error(&error_reason, self.status_code())
  }
}

// NB: Not using derive_more::Display since Clion doesn't understand it.
impl fmt::Display for EditUsernameError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

/// Edit username of the current user.
#[utoipa::path(
  post,
  tag = "Users",
  path = "/v1/user/edit_username",
  responses(
    (status = 200, description = "Success", body = EditUsernameResponse),
    (status = 400, description = "Bad input", body = EditUsernameError),
    (status = 401, description = "Not authorized", body = EditUsernameError),
    (status = 500, description = "Server error", body = EditUsernameError),
  ),
  params(
    ("request" = EditUsernameRequest, description = "Payload for Request"),
  )
)]
pub async fn edit_username_handler(
  http_request: HttpRequest,
  request: Json<EditUsernameRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<EditUsernameResponse>, EditUsernameError>
{
  let username = request.display_name.trim().to_lowercase();
  let display_name = request.display_name.trim().to_string();

  if let Err(reason) = validate_username(&display_name) {
    return Err(EditUsernameError::BadInput(format!("bad username: {}", &reason)));
  }

  if contains_slurs(&username) {
    return Err(EditUsernameError::BadInput("username contains slurs".to_string()));
  }

  if is_reserved_username(&username) {
    return Err(EditUsernameError::BadInput("username is reserved".to_string()));
  }

  let mut mysql_connection = server_state.mysql_pool
      .acquire()
      .await
      .map_err(|err| {
        warn!("MySql pool error: {:?}", err);
        EditUsernameError::ServerError
      })?;

  let user_session = require_user_session_extended_using_connection(
    &http_request,
    &server_state.session_checker,
    &mut mysql_connection)
      .await
      .map_err(|_err| {
        EditUsernameError::NotAuthorized
      })?;

  if user_session.role.is_banned {
    return Err(EditUsernameError::NotAuthorized);
  }

  let ip_address = get_request_ip(&http_request);

  let result = update_username(UpdateUsernameArgs {
    token: &user_session.user_token_typed,
    username: &username,
    display_name: &display_name,
    username_is_not_customized: false,
    ip_address: &ip_address,
    transactor: Transactor::for_connection(&mut mysql_connection),
  }).await;

  match result {
    Ok(()) => {},
    Err(UpdateUsernameError::UsernameIsTaken) => {
      return Err(EditUsernameError::BadInput("username is taken".to_string()));
    }
    Err(UpdateUsernameError::DatabaseError { source }) => {
      warn!("Error updating username: {:?}", source);
      return Err(EditUsernameError::ServerError);
    }
  }

  Ok(Json(EditUsernameResponse { success: true }))
}
