use std::sync::Arc;

use actix_web::web::{Json, Path};
use actix_web::{web, HttpRequest};
use log::warn;
use utoipa::ToSchema;

use enums::by_table::users::user_feature_flag::UserFeatureFlag;
use mysql_queries::queries::users::user::get::get_user_token_by_username::get_user_token_by_username;
use mysql_queries::queries::users::user_profiles::get_user_profile_by_token::get_user_profile_by_token;
use tokens::tokens::users::UserToken;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::session::lookup::user_session_feature_flags::UserSessionFeatureFlags;
use crate::http_server::web_utils::user_session::require_moderator::{
  require_moderator, UseDatabase,
};
use crate::state::server_state::ServerState;

// ── Request ──

#[derive(Deserialize, ToSchema)]
pub struct ListUserFeatureFlagsPathInfo {
  username_or_token: String,
}

// ── Response ──

#[derive(Serialize, ToSchema)]
pub struct ModeratorListUserFeatureFlagsResponse {
  pub success: bool,
  pub user_token: String,
  pub username: String,
  pub display_name: String,
  pub feature_flags: Vec<String>,
}

// ── Handler ──

/// List the feature flags enabled for a specific user.
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/user_feature_flags/user/{username_or_token}",
  responses(
    (status = 200, description = "Success", body = ModeratorListUserFeatureFlagsResponse),
    (status = 401, description = "Unauthorized"),
    (status = 400, description = "Bad input"),
  ),
  params(
    ("username_or_token" = String, Path, description = "Username or user token"),
  )
)]
pub async fn moderator_list_user_feature_flags_handler(
  http_request: HttpRequest,
  path: Path<ListUserFeatureFlagsPathInfo>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModeratorListUserFeatureFlagsResponse>, CommonWebError> {
  let _user_session = require_moderator(
    &http_request,
    &server_state,
    UseDatabase::GrabNewConnection,
  ).await.map_err(|err| {
    warn!("Moderator check failed: {:?}", err);
    CommonWebError::NotAuthorized
  })?;

  let username_or_token = path.username_or_token.trim();

  let user_token = if username_or_token.starts_with(UserToken::token_prefix()) || username_or_token.starts_with("U:") {
    UserToken::new_from_str(username_or_token)
  } else {
    get_user_token_by_username(username_or_token, &server_state.mysql_pool)
      .await
      .map_err(|err| {
        warn!("Could not get user token by username: {:?}", err);
        CommonWebError::from_anyhow_error(err)
      })?
      .ok_or_else(|| {
        CommonWebError::NotFound
      })?
  };

  let user_profile = get_user_profile_by_token(&user_token, &server_state.mysql_pool)
    .await
    .map_err(|err| {
      warn!("Could not get user profile by token: {:?}", err);
      CommonWebError::from_anyhow_error(err)
    })?
    .ok_or_else(|| {
      CommonWebError::NotFound
    })?;

  let user_feature_flags =
    UserSessionFeatureFlags::new(user_profile.maybe_feature_flags.as_deref());

  let flags: Vec<String> = user_feature_flags.clone_flags()
    .iter()
    .map(|flag| flag.to_str().to_string())
    .collect();

  Ok(Json(ModeratorListUserFeatureFlagsResponse {
    success: true,
    user_token: user_profile.user_token.as_str().to_string(),
    username: user_profile.username,
    display_name: user_profile.display_name,
    feature_flags: flags,
  }))
}
