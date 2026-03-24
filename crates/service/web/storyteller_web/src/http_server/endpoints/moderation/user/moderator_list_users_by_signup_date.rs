use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::user::list_users_by_signup_date::{
  ModeratorListUsersBySignupDateEntry,
  ModeratorListUsersBySignupDateRequest,
  ModeratorListUsersBySignupDateResponse,
};
use mysql_queries::queries::users::user::list::list_users_by_signup_date_for_moderation::{
  list_users_by_signup_date_for_moderation,
  ListUsersBySignupDateArgs,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{require_moderator, UseDatabase};
use crate::state::server_state::ServerState;

/// List users by signup date (descending), for moderators.
#[utoipa::path(
  post,
  tag = "Moderation",
  path = "/v1/moderation/users/list_all_by_signup_date",
  request_body = ModeratorListUsersBySignupDateRequest,
  responses(
    (status = 200, description = "Success", body = ModeratorListUsersBySignupDateResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderator_list_users_by_signup_date_handler(
  http_request: HttpRequest,
  request: Json<ModeratorListUsersBySignupDateRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModeratorListUsersBySignupDateResponse>, CommonWebError> {

  let _user_session = require_moderator(&http_request, &server_state, UseDatabase::GrabNewConnection)
    .await
    .map_err(|_| CommonWebError::NotAuthorized)?;

  let result = list_users_by_signup_date_for_moderation(
    ListUsersBySignupDateArgs {
      maybe_id_cursor: request.id_cursor,
      limit: 100,
    },
    &server_state.mysql_pool,
  ).await
    .map_err(|err| {
      warn!("moderator_list_users_by_signup_date error: {:?}", err);
      CommonWebError::ServerError
    })?;

  let users = result.users.into_iter().map(|u| ModeratorListUsersBySignupDateEntry {
    id: u.id,
    token: u.token,
    username: u.username,
    display_name: u.display_name,
    username_is_not_customized: u.username_is_not_customized,
    email_address: u.email_address,
    email_confirmed: u.email_confirmed,
    is_without_password: u.is_without_password,
    ip_address_creation: u.ip_address_creation,
    maybe_source: u.maybe_source,
    maybe_signup_method: u.maybe_signup_method,
    created_at: u.created_at,
    maybe_referral_url: u.maybe_referral_url,
    is_temporary: u.is_temporary,
  }).collect();

  Ok(Json(ModeratorListUsersBySignupDateResponse {
    success: true,
    users,
    next_cursor: result.next_cursor,
  }))
}
