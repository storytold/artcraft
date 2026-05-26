use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::Path;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;

use mysql_queries::queries::users::user_profiles::get_user_profile_by_username::get_user_profile_by_username;
use mysql_queries::queries::users::user_roles::list_user_roles::list_user_roles;
use mysql_queries::queries::users::user_roles::set_user_role::set_user_role;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::state::server_state::ServerState;

/// For the URL PathInfo
#[derive(Deserialize)]
pub struct SetUserRolePathInfo {
  username: String,
}

#[derive(Deserialize)]
pub struct SetUserRoleRequest {
  user_role_slug: String,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
pub async fn set_user_role_handler(
  http_request: HttpRequest,
  path: Path<SetUserRolePathInfo>,
  request: web::Json<SetUserRoleRequest>,
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

  // TODO: This is not the correct permission
  if !user_session.can_ban_users {
    warn!("user is not allowed to change user roles: {:?}", user_session.user_token);
    return Err(CommonWebError::NotAuthorized);
  }

  // TODO: This is lazy and inefficient
  let user_roles = list_user_roles(&server_state.mysql_pool)
      .await
      .map_err(|err| {
        warn!("error listing roles: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?;

  let role_exists = user_roles.into_iter()
      .find(|user_role| user_role.slug == request.user_role_slug)
      .is_some();

  if !role_exists {
    return Err(CommonWebError::BadInputWithSimpleMessage("invalid user role".to_string()));
  }

  let user_lookup_result =
      get_user_profile_by_username(&path.username, &server_state.mysql_pool).await;

  let target_user = match user_lookup_result {
    Ok(Some(result)) => result,
    Ok(None) => return Err(CommonWebError::NotFound),
    Err(err) => {
      warn!("lookup error: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  let query_result = set_user_role(
    &target_user.user_token,
    &request.user_role_slug,
    &server_state.mysql_pool,
  ).await;

  match query_result {
    Ok(_) => {},
    Err(err) => {
      warn!("unable to update user role: {:?}", err);
      return Err(CommonWebError::from_anyhow_error(err));
    }
  };

  Ok(simple_json_success())
}
