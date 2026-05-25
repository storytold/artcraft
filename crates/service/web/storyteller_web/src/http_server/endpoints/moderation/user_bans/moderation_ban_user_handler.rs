use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use log::{info, warn};
use utoipa::ToSchema;

use enums::by_table::staff_audit_logs::staff_audit_action::StaffAuditAction;
use enums::by_table::staff_audit_logs::staff_audit_entity_type::StaffAuditEntityType;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::staff_audit_logs::insert_staff_audit_log::{
  insert_staff_audit_log, InsertStaffAuditLogArgs,
};
use mysql_queries::queries::users::user::update::set_user_ban_status::{
  set_user_ban_status, SetUserBanStatusArgs,
};
use mysql_queries::queries::users::user_profiles::get_user_profile_by_username::get_user_profile_by_username;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{
  require_moderator, UseDatabase,
};
use crate::state::server_state::ServerState;

// --- Request ---

#[derive(Deserialize, ToSchema)]
pub struct ModerationBanUserRequest {
  pub username: String,
  pub mod_notes: String,
  pub is_banned: bool,
}

// --- Response ---

#[derive(Serialize, ToSchema)]
pub struct ModerationBanUserSuccessResponse {
  pub success: bool,
}

// --- Handler ---

/// Ban or unban a user. Moderators only.
#[utoipa::path(
  post,
  tag = "Moderation",
  path = "/moderation/user_bans/manage_ban",
  request_body = ModerationBanUserRequest,
  responses(
    (status = 200, description = "User ban status updated", body = ModerationBanUserSuccessResponse),
    (status = 401, description = "Unauthorized"),
    (status = 404, description = "User not found"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderation_ban_user_handler(
  http_request: HttpRequest,
  request: Json<ModerationBanUserRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModerationBanUserSuccessResponse>, CommonWebError> {

  // 1. Require moderator with ban permissions.
  let user_session = require_moderator(
    &http_request,
    &server_state,
    UseDatabase::GrabNewConnection,
  ).await.map_err(|err| {
    warn!("Moderator check failed: {:?}", err);
    CommonWebError::NotAuthorized
  })?;

  if !user_session.can_ban_users {
    warn!("User {} is not allowed to ban users", user_session.user_token.as_str());
    return Err(CommonWebError::NotAuthorized);
  }

  // 2. Look up the target user by username.
  let username_lower = request.username.to_lowercase();

  let user_profile = get_user_profile_by_username(
    &username_lower,
    &server_state.mysql_pool,
  ).await.map_err(|err| {
    warn!("User lookup error: {:?}", err);
    CommonWebError::from_anyhow_error(err)
  })?.ok_or_else(|| {
    warn!("User not found for ban: {}", username_lower);
    CommonWebError::NotFound
  })?;

  let ip_address = get_request_ip(&http_request);

  let audit_action = if request.is_banned {
    StaffAuditAction::BanUser
  } else {
    StaffAuditAction::UnbanUser
  };

  info!(
    "Moderator {} {} user {} ({})",
    user_session.user_token.as_str(),
    audit_action.to_str(),
    user_profile.user_token.as_str(),
    username_lower,
  );

  // 3. Begin transaction: ban + audit log.
  let mut transaction = server_state.mysql_pool.begin().await
      .map_err(|err| {
        warn!("Failed to begin transaction: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  // 4. Set ban status.
  set_user_ban_status(SetUserBanStatusArgs {
    subject_user_token: &user_profile.user_token,
    is_banned: request.is_banned,
    mod_user_token: &user_session.user_token,
    maybe_mod_comments: Some(&request.mod_notes),
    mysql_executor: &mut *transaction,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Failed to set user ban status: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  // 5. Insert staff audit log.
  let _audit_token = insert_staff_audit_log(InsertStaffAuditLogArgs {
    audit_action,
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

  // 6. Commit transaction.
  transaction.commit().await.map_err(|err| {
    warn!("Failed to commit transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  info!(
    "User {} ban status set to {} by moderator {}",
    user_profile.user_token.as_str(),
    request.is_banned,
    user_session.user_token.as_str(),
  );

  Ok(Json(ModerationBanUserSuccessResponse {
    success: true,
  }))
}
