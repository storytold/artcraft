use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use derive_more::Display;
use log::{error, warn};

use mysql_queries::queries::users::user_roles::list_staff::list_staff;

use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

#[derive(Serialize)]
pub struct ListStaffResponse {
  pub success: bool,
  pub staff: Vec<StaffRecordForList>,
}

#[derive(Serialize)]
pub struct StaffRecordForList {
  pub user_token: String,
  pub username: String,
  pub display_name: String,
  pub user_role_slug: String,
  pub user_role_name: String,
}
pub async fn list_staff_handler(
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

  // TODO: This is not the correct permission.
  if !user_session.can_ban_users {
    warn!("user is not allowed to delete bans: {:?}", user_session.user_token);
    return Err(CommonWebError::NotAuthorized);
  }

  let results = list_staff(&server_state.mysql_pool)
      .await
      .map_err(|err| {
        error!("list staff db error: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?
      .into_iter()
      .map(|user| StaffRecordForList {
        user_token: user.user_token,
        username: user.username,
        display_name: user.display_name,
        user_role_slug: user.user_role_slug,
        user_role_name: user.user_role_name,
      })
      .collect();

  let response = ListStaffResponse {
    success: true,
    staff: results,
  };

  let body = serde_json::to_string(&response)
      .map_err(CommonWebError::from_error)?;

  Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body))
}
