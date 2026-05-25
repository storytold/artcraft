use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::warn;
use utoipa::ToSchema;

use enums::by_table::users::user_feature_flag::UserFeatureFlag;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{
  require_moderator, UseDatabase,
};
use crate::state::server_state::ServerState;

// ── Response ──

#[derive(Serialize, ToSchema)]
pub struct ModeratorListUserFeatureFlagsResponse {
  pub success: bool,
  pub feature_flags: Vec<FeatureFlagDescriptor>,
}

#[derive(Serialize, ToSchema)]
pub struct FeatureFlagDescriptor {
  /// Key the flag is identified by
  pub key: String,

  /// Full name of the flag
  pub full_name: String,

  /// Description of the flag
  pub description: String,
}

// ── Handler ──

/// List all available user feature flags.
#[utoipa::path(
  get,
  tag = "Moderation",
  path = "/v1/moderation/user_feature_flags/list",
  responses(
    (status = 200, description = "Success", body = ModeratorListUserFeatureFlagsResponse),
    (status = 401, description = "Unauthorized"),
  ),
)]
pub async fn moderator_list_all_available_user_feature_flags_handler(
  http_request: HttpRequest,
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

  let feature_flags: Vec<FeatureFlagDescriptor> = UserFeatureFlag::all_variants()
    .into_iter()
    .map(|flag| FeatureFlagDescriptor {
      key: flag.to_str().to_string(),
      full_name: flag.name().to_string(),
      description: flag.description().to_string(),
    })
    .collect();

  Ok(Json(ModeratorListUserFeatureFlagsResponse {
    success: true,
    feature_flags,
  }))
}
