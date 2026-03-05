use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;

use artcraft_api_defs::moderation::user::user_lookup::{
  ModeratorUserLookupRequest,
  ModeratorUserLookupSuccessResponse,
  ModeratorUserLookupUserDetails,
};
use mysql_queries::queries::users::user::get::lookup_user_for_moderation::{
  lookup_user_for_moderation_by_email,
  lookup_user_for_moderation_by_token,
  lookup_user_for_moderation_by_username,
};
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{require_moderator, UseDatabase};
use crate::state::server_state::ServerState;

const LEGACY_USER_TOKEN_PREFIX: &str = "U:";

/// Moderator User Lookup
#[utoipa::path(
  post,
  tag = "Moderation",
  path = "/v1/moderation/user_lookup",
  request_body = ModeratorUserLookupRequest,
  responses(
    (status = 200, description = "Success", body = ModeratorUserLookupSuccessResponse),
    (status = 401, description = "Unauthorized"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderator_user_lookup_handler(
  http_request: HttpRequest,
  request: Json<ModeratorUserLookupRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModeratorUserLookupSuccessResponse>, CommonWebError> {

  let _user_session = require_moderator(&http_request, &server_state, UseDatabase::Implicit)
    .await
    .map_err(|_| CommonWebError::NotAuthorized)?;

  let search = request.search.trim();

  if search.is_empty() {
    return Ok(Json(ModeratorUserLookupSuccessResponse {
      success: true,
      maybe_user: None,
    }));
  }

  let maybe_result = if search.starts_with(UserToken::token_prefix()) || search.starts_with(LEGACY_USER_TOKEN_PREFIX) {
    lookup_user_for_moderation_by_token(search, &server_state.mysql_pool).await
  } else if search.contains('@') {
    lookup_user_for_moderation_by_email(search, &server_state.mysql_pool).await
  } else {
    lookup_user_for_moderation_by_username(search, &server_state.mysql_pool).await
  };

  let maybe_user = maybe_result
    .map_err(|err| {
      warn!("moderator_user_lookup error: {:?}", err);
      CommonWebError::ServerError
    })?;

  let maybe_user_details = maybe_user.map(|user| ModeratorUserLookupUserDetails {
    token: user.user_token.to_string(),
    username: user.username,
    display_name: user.display_name,
    username_is_generated: user.username_is_generated,
    is_temporary: user.is_temporary,
    username_is_not_customized: user.username_is_not_customized,
    email_address: user.email_address,
    email_confirmed: user.email_confirmed,
    email_is_synthetic: user.email_is_synthetic,
    is_without_password: user.is_without_password,
    ip_address_creation: user.ip_address_creation,
    ip_address_last_login: user.ip_address_last_login,
    maybe_avatar_media_file_token: user.maybe_avatar_media_file_token,
    email_gravatar_hash: user.email_gravatar_hash,
  });

  Ok(Json(ModeratorUserLookupSuccessResponse {
    success: true,
    maybe_user: maybe_user_details,
  }))
}
