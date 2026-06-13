use std::collections::BTreeSet;
use std::fmt;
use std::iter::FromIterator;
use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::error::ResponseError;
use actix_web::http::StatusCode;
use actix_web::web::{Data, Json, Path};
use actix_web::{HttpRequest, HttpResponse};
use log::warn;
use redis::{Client, Commands};
use sqlx::Acquire;
use utoipa::ToSchema;

use enums::by_table::staff_audit_logs::staff_audit_action::StaffAuditAction;
use enums::by_table::staff_audit_logs::staff_audit_entity_type::StaffAuditEntityType;
use enums::by_table::users::user_feature_flag::UserFeatureFlag;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::staff_audit_logs::insert_staff_audit_log::{insert_staff_audit_log, InsertStaffAuditLogArgs};
use mysql_queries::queries::users::user::get::get_user_token_by_username::get_user_token_by_username;
use mysql_queries::queries::users::user::update::set_user_feature_flags::{set_user_feature_flags, SetUserFeatureFlagArgs};
use mysql_queries::queries::users::user_profiles::get_user_profile_by_token::get_user_profile_by_token;
use tokens::tokens::users::UserToken;

use crate::http_server::session::lookup::user_session_feature_flags::UserSessionFeatureFlags;
use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::response_error_helpers::to_simple_json_error;
use crate::http_server::web_utils::response_success_helpers::simple_json_success;
use crate::http_server::web_utils::user_session::require_moderator::require_moderator;
use crate::state::server_state::ServerState;
use artcraft_api_defs::common::responses::simple_generic_json_success::SimpleGenericJsonSuccess;

/// For the URL PathInfo
#[derive(Deserialize, ToSchema)]
pub struct EditUserFeatureFlagPathInfo {
  username_or_token: String,
}

#[derive(Deserialize, ToSchema)]
pub struct EditUserFeatureFlagsRequest {
  action: EditUserFeatureFlagsOption,
}

#[derive(Deserialize, ToSchema)]
pub enum EditUserFeatureFlagsOption {
  /// Add the following flags to the user, keeping any existing flags.
  AddFlags {
    flags: Vec<UserFeatureFlag>
  },
  /// Remove the following flags from the user, keeping any other existing flags not listed below.
  RemoveFlags {
    flags: Vec<UserFeatureFlag>
  },
  /// Keep only the following flags on the user, but only if they're already present.
  KeepFlags {
    flags: Vec<UserFeatureFlag>
  },
  /// Set the exact set of flags below, discarding any existing state.
  SetExactFlags {
    flags: Vec<UserFeatureFlag>
  },
  /// Clear all flags from the user.
  ClearAllFlags,
}
// NB: Not using derive_more::Display since Clion doesn't understand it.
#[utoipa::path(
  post,
  tag = "Moderation",
  path = "/v1/moderation/user_feature_flags/user/{username_or_token}",
  responses(
    (status = 200, description = "Success", body = SimpleGenericJsonSuccess),
    (status = 401, description = "Unauthorized", body = CommonWebError),
    (status = 404, description = "Not found", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
  params(
    ("path" = EditUserFeatureFlagPathInfo, description = "Path for Request"),
    ("request" = EditUserFeatureFlagsRequest, description = "Payload for Request"),
  )
)]
pub async fn moderator_edit_user_feature_flags_handler(
  http_request: HttpRequest,
  path: Path<EditUserFeatureFlagPathInfo>,
  request: Json<EditUserFeatureFlagsRequest>,
  server_state: Data<Arc<ServerState>>,
  redis_pool: Data<r2d2::Pool<Client>>,
) -> Result<HttpResponse, CommonWebError> {

  let user_session = require_moderator(&http_request, &server_state, &server_state.mysql_pool).await.map_err(|err| {
    warn!("Moderator check failed: {:?}", err);
    CommonWebError::NotAuthorized
  })?;

  let username_or_token = path.username_or_token.trim();

  let user_token = if username_or_token.starts_with(UserToken::token_prefix()) || username_or_token.starts_with("U:") {
    UserToken::new_from_str(username_or_token)
  } else {
    get_user_token_by_username(username_or_token, &server_state.mysql_pool)
      .await
      .map_err(|e| {
        warn!("Could not get user token by username: {:?}", e);
        CommonWebError::from_anyhow_error(e)
      })?
      .ok_or(CommonWebError::server_error_with_message("uncaught server error"))?
  };

  let user_profile = get_user_profile_by_token(&user_token, &server_state.mysql_pool)
    .await
    .map_err(|e| {
      warn!("Could not get user profile by token: {:?}", e);
      CommonWebError::from_anyhow_error(e)
    })?
    .ok_or(CommonWebError::server_error_with_message("uncaught server error"))?;

  let mut user_feature_flags =
    UserSessionFeatureFlags::new(user_profile.maybe_feature_flags.as_deref());

  match &request.action {
    EditUserFeatureFlagsOption::AddFlags { flags } => {
      user_feature_flags.add_flags(flags.iter().cloned());
    }
    EditUserFeatureFlagsOption::RemoveFlags { flags } => {
      let flags = BTreeSet::from_iter(flags.iter().cloned());
      user_feature_flags.remove_flags(&flags);
    }
    EditUserFeatureFlagsOption::KeepFlags { flags } => {
      let flags = BTreeSet::from_iter(flags.iter().cloned());
      user_feature_flags.keep_flags(&flags);
    }
    EditUserFeatureFlagsOption::SetExactFlags { flags } => {
      user_feature_flags.set_flags(flags.iter().cloned());
    }
    EditUserFeatureFlagsOption::ClearAllFlags => {
      user_feature_flags.clear_flags();
    }
  }

  let ip_address = get_request_ip(&http_request);

  // Update the user's feature flags.
  set_user_feature_flags(SetUserFeatureFlagArgs {
    subject_user_token: &user_profile.user_token,
    maybe_feature_flags: user_feature_flags.maybe_serialize_string().as_deref(),
    maybe_mod_user_token: Some(&user_session.user_token),
    ip_address: &ip_address,
    mysql_pool: &server_state.mysql_pool,
  }).await
    .map_err(|e| {
      warn!("Could not set flags: {:?}", e);
      CommonWebError::from_anyhow_error(e)
    })?;

  // Insert staff audit log.
  let mut mysql_connection = server_state.mysql_pool.acquire()
    .await
    .map_err(|e| {
      warn!("Could not acquire MySQL connection for audit log: {:?}", e);
      CommonWebError::from_error(e)
    })?;

  let mut transaction = mysql_connection.begin()
    .await
    .map_err(|e| {
      warn!("Could not start transaction for audit log: {:?}", e);
      CommonWebError::from_error(e)
    })?;

  let _audit_token = insert_staff_audit_log(InsertStaffAuditLogArgs {
    audit_action: StaffAuditAction::EditUserFeatureFlags,
    maybe_entity_type: Some(StaffAuditEntityType::User),
    maybe_entity_token: Some(user_profile.user_token.as_str()),
    staff_user_token: &user_session.user_token,
    actor_ip_address: &ip_address,
    mysql_executor: &mut *transaction,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Failed to insert staff audit log: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  transaction.commit()
    .await
    .map_err(|e| {
      warn!("Could not commit audit log transaction: {:?}", e);
      CommonWebError::from_error(e)
    })?;

  // Invalidate Redis cache for the user profile.
  if let Ok(mut redis) = redis_pool.get() {
    let cache_key = format!("cache:userProfile:{}", user_profile.username);
    let _r: Result<Option<String>, _> = redis.del(&cache_key);
  }

  Ok(simple_json_success())
}
