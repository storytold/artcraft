use std::fmt;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::{web, HttpRequest, HttpResponse};
use log::warn;
use utoipa::ToSchema;

use mysql_queries::queries::users::user_profiles::lookup_user_for_moderation::{
  lookup_user_for_moderation_by_email,
  lookup_user_for_moderation_by_token,
  lookup_user_for_moderation_by_username,
  LookupUserForModerationResult,
};
use tokens::tokens::users::UserToken;

use crate::http_server::web_utils::serialize_as_json_error::serialize_as_json_error;
use crate::http_server::web_utils::user_session::require_moderator::{require_moderator, RequireModeratorError, UseDatabase};
use crate::state::server_state::ServerState;

const LEGACY_USER_TOKEN_PREFIX: &str = "U:";

#[derive(Deserialize, ToSchema)]
pub struct ModeratorUserLookupRequest {
  pub search: String,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorUserLookupSuccessResponse {
  pub success: bool,
  pub maybe_user: Option<ModeratorUserLookupUserDetails>,
}

#[derive(Serialize, ToSchema)]
pub struct ModeratorUserLookupUserDetails {
  pub token: String,
  pub username: String,
  pub display_name: String,
  pub username_is_generated: bool,
  pub is_temporary: bool,
  pub username_is_not_customized: bool,
  pub email_address: String,
  pub email_confirmed: bool,
  pub email_is_synthetic: bool,
  pub is_without_password: bool,
  pub ip_address_creation: String,
  pub ip_address_last_login: String,
  pub maybe_avatar_media_file_token: Option<String>,
  pub email_gravatar_hash: String,
}

impl From<LookupUserForModerationResult> for ModeratorUserLookupUserDetails {
  fn from(result: LookupUserForModerationResult) -> Self {
    Self {
      token: result.user_token.to_string(),
      username: result.username,
      display_name: result.display_name,
      username_is_generated: result.username_is_generated,
      is_temporary: result.is_temporary,
      username_is_not_customized: result.username_is_not_customized,
      email_address: result.email_address,
      email_confirmed: result.email_confirmed,
      email_is_synthetic: result.email_is_synthetic,
      is_without_password: result.is_without_password,
      ip_address_creation: result.ip_address_creation,
      ip_address_last_login: result.ip_address_last_login,
      maybe_avatar_media_file_token: result.maybe_avatar_media_file_token,
      email_gravatar_hash: result.email_gravatar_hash,
    }
  }
}

#[derive(Debug, Serialize, ToSchema)]
pub enum ModeratorUserLookupError {
  ServerError,
  Unauthorized,
}

impl ResponseError for ModeratorUserLookupError {
  fn status_code(&self) -> StatusCode {
    match *self {
      ModeratorUserLookupError::ServerError => StatusCode::INTERNAL_SERVER_ERROR,
      ModeratorUserLookupError::Unauthorized => StatusCode::UNAUTHORIZED,
    }
  }

  fn error_response(&self) -> HttpResponse {
    serialize_as_json_error(self)
  }
}

impl fmt::Display for ModeratorUserLookupError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{:?}", self)
  }
}

#[utoipa::path(
  post,
  tag = "Moderation",
  path = "/v1/moderation/user_lookup",
  request_body = ModeratorUserLookupRequest,
  responses(
    (status = 200, description = "Success", body = ModeratorUserLookupSuccessResponse),
    (status = 401, description = "Unauthorized", body = ModeratorUserLookupError),
    (status = 500, description = "Server error", body = ModeratorUserLookupError),
  ),
)]
pub async fn moderator_user_lookup_handler(
  http_request: HttpRequest,
  request: web::Json<ModeratorUserLookupRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<HttpResponse, ModeratorUserLookupError> {

  let _user_session = require_moderator(&http_request, &server_state, UseDatabase::Implicit)
    .await
    .map_err(|err| match err {
      RequireModeratorError::ServerError => ModeratorUserLookupError::ServerError,
      RequireModeratorError::NotAuthorized => ModeratorUserLookupError::Unauthorized,
    })?;

  let search = request.search.trim();

  if search.is_empty() {
    let response = ModeratorUserLookupSuccessResponse {
      success: true,
      maybe_user: None,
    };
    let body = serde_json::to_string(&response)
      .map_err(|_| ModeratorUserLookupError::ServerError)?;
    return Ok(HttpResponse::Ok()
      .content_type("application/json")
      .body(body));
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
      ModeratorUserLookupError::ServerError
    })?
    .map(ModeratorUserLookupUserDetails::from);

  let response = ModeratorUserLookupSuccessResponse {
    success: true,
    maybe_user,
  };

  let body = serde_json::to_string(&response)
    .map_err(|_| ModeratorUserLookupError::ServerError)?;

  Ok(HttpResponse::Ok()
    .content_type("application/json")
    .body(body))
}
