// NB: Incrementally getting rid of build warnings...
#![forbid(unused_imports)]
#![forbid(unused_mut)]
#![forbid(unused_variables)]

use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;
use artcraft_api_defs::users::edit_username::{EditUsernameRequest, EditUsernameResponse};
use crate::http_server::validations::is_reserved_username::is_reserved_username;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::validations::validate_username::validate_username;
use crate::http_server::web_utils::user_session::require_user_session_extended::require_user_session_extended;
use crate::state::server_state::ServerState;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::users::user::update::update_username::{update_username, UpdateUsernameArgs, UpdateUsernameError};
use mysql_queries::utils::transactor::Transactor;
use user_input_common::check_for_slurs::contains_slurs;
// NB: Not using derive_more::Display since Clion doesn't understand it.
/// Edit username of the current user.
#[utoipa::path(
  post,
  tag = "Users",
  path = "/v1/user/edit_username",
  responses(
    (status = 200, description = "Success", body = EditUsernameResponse),
    (status = 400, description = "Bad input", body = CommonWebError),
    (status = 401, description = "Not authorized", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
  params(
    ("request" = EditUsernameRequest, description = "Payload for Request"),
  )
)]
pub async fn edit_username_handler(
  http_request: HttpRequest,
  request: Json<EditUsernameRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<EditUsernameResponse>, CommonWebError>
{
  let username = request.display_name.trim().to_lowercase();
  let display_name = request.display_name.trim().to_string();

  if let Err(reason) = validate_username(&display_name) {
    return Err(CommonWebError::BadInputWithSimpleMessage(format!("bad username: {}", &reason)));
  }

  if contains_slurs(&username) {
    return Err(CommonWebError::BadInputWithSimpleMessage("username contains slurs".to_string()));
  }

  if is_reserved_username(&username) {
    return Err(CommonWebError::BadInputWithSimpleMessage("username is reserved".to_string()));
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
      return Err(CommonWebError::BadInputWithSimpleMessage("username is taken".to_string()));
    }
    Err(UpdateUsernameError::DatabaseError { source }) => {
      warn!("Error updating username: {:?}", source);
      return Err(CommonWebError::server_error_with_message("uncaught server error"));
    }
  }

  Ok(Json(EditUsernameResponse { success: true }))
}
