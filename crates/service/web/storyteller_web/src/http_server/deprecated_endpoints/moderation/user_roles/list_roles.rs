use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;

use mysql_queries::queries::users::user_roles::list_user_roles::{list_user_roles, UserRoleForList};

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

#[derive(Serialize)]
pub struct ListUserRolesResponse {
  pub success: bool,
  pub user_roles: Vec<UserRoleForList>,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
pub async fn list_user_roles_handler(
  http_request: HttpRequest,
  server_state: web::Data<Arc<ServerState>>
) -> Result<HttpResponse, CommonWebError> {

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

  // TODO: Add new permission for this.
  if !user_session.can_ban_users {
    warn!("user is not allowed to view user roles: {:?}", user_session.user_token);
    return Err(CommonWebError::NotAuthorized);
  }

  let maybe_user_roles =
      list_user_roles(&server_state.mysql_pool).await;

  let user_roles = match maybe_user_roles {
    Ok(results) => results,
    Err(e) => {
      warn!("Error querying user roles: {:?}", e);
      return Err(CommonWebError::from_anyhow_error(e));
    }
  };

  let response = ListUserRolesResponse {
    success: true,
    user_roles,
  };

  let body = serde_json::to_string(&response)
      .map_err(|e| CommonWebError::from_error(e))?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
