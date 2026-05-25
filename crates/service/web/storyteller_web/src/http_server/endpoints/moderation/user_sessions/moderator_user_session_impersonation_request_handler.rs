use std::marker::PhantomData;
use std::sync::Arc;

use actix_web::web::Json;
use actix_web::{web, HttpRequest};
use chrono::{Duration, Utc};
use log::{info, warn};
use utoipa::ToSchema;

use crockford::crockford_entropy_lower;
use enums::by_table::staff_audit_logs::staff_audit_action::StaffAuditAction;
use enums::by_table::staff_audit_logs::staff_audit_entity_type::StaffAuditEntityType;
use http_server_common::request::get_request_ip::get_request_ip;
use mysql_queries::queries::staff_audit_logs::insert_staff_audit_log::{
  insert_staff_audit_log, InsertStaffAuditLogArgs,
};
use mysql_queries::queries::user_impersonation_requests::insert_user_impersonation_request::{
  insert_user_impersonation_request, InsertUserImpersonationRequestArgs,
};
use mysql_queries::queries::users::user::get::lookup_user_for_moderation::{
  lookup_user_for_moderation_by_email,
  lookup_user_for_moderation_by_token,
  lookup_user_for_moderation_by_username,
  LookupUserForModerationResult,
};

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{
  require_moderator, UseDatabase,
};
use crate::state::server_state::ServerState;

// --- Request ---

#[derive(Deserialize, ToSchema)]
pub struct ModerationImpersonateRequest {
  pub username: Option<String>,
  pub user_token: Option<String>,
  pub email_address: Option<String>,
  pub username_email_or_token: Option<String>,
}

// --- Response ---

#[derive(Serialize, ToSchema)]
pub struct ModerationImpersonateSuccessResponse {
  pub success: bool,
  pub password_token: String,
}

// --- Handler ---

/// Create a user impersonation request. Moderators only.
#[utoipa::path(
  post,
  tag = "Moderation",
  path = "/v1/moderation/user_sessions/impersonate",
  request_body = ModerationImpersonateRequest,
  responses(
    (status = 200, description = "Impersonation request created", body = ModerationImpersonateSuccessResponse),
    (status = 400, description = "Bad request"),
    (status = 401, description = "Unauthorized"),
    (status = 404, description = "User not found"),
    (status = 500, description = "Server error"),
  ),
)]
pub async fn moderator_user_session_impersonation_request_handler(
  http_request: HttpRequest,
  request: Json<ModerationImpersonateRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModerationImpersonateSuccessResponse>, CommonWebError> {

  // 1. Require moderator session.
  let user_session = require_moderator(
    &http_request,
    &server_state,
    UseDatabase::GrabNewConnection,
  ).await.map_err(|err| {
    warn!("Moderator check failed: {:?}", err);
    CommonWebError::NotAuthorized
  })?;

  if user_session.is_banned {
    warn!("Banned moderator tried to impersonate: {}", user_session.user_token.as_str());
    return Err(CommonWebError::NotAuthorized);
  }

  // 2. Determine lookup strategy from the request.
  let lookup = resolve_lookup_strategy(&request)?;

  info!(
    "Moderator {} requesting impersonation: {:?}",
    user_session.user_token.as_str(),
    lookup,
  );

  // 3. Look up the target user.
  let target_user = perform_user_lookup(&lookup, &server_state).await?;

  // 4. Validate target user state.
  if target_user.is_banned {
    warn!(
      "Moderator {} tried to impersonate banned user {}",
      user_session.user_token.as_str(),
      target_user.user_token.as_str(),
    );
    return Err(CommonWebError::BadInputWithSimpleMessage(
      "Target user is banned".to_string(),
    ));
  }

  // 5. Generate the secret password token.
  let password_token = crockford_entropy_lower(16);

  // 6. IP address for auditing.
  let ip_address = get_request_ip(&http_request);

  // 7. Begin transaction.
  let mut transaction = server_state.mysql_pool.begin().await
      .map_err(|err| {
        warn!("Failed to begin transaction: {:?}", err);
        CommonWebError::from_error(err)
      })?;

  // 8. Insert staff audit log.
  let _audit_token = insert_staff_audit_log(InsertStaffAuditLogArgs {
    audit_action: StaffAuditAction::ImpersonateUserRequest,
    maybe_entity_type: Some(StaffAuditEntityType::User),
    maybe_entity_token: Some(target_user.user_token.as_str()),
    staff_user_token: &user_session.user_token,
    actor_ip_address: &ip_address,
    mysql_executor: &mut *transaction,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Failed to insert staff audit log: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  // 9. Insert impersonation request (expires in 20 minutes).
  let expires_at = Utc::now() + Duration::minutes(20);

  let _impersonation_token = insert_user_impersonation_request(
    InsertUserImpersonationRequestArgs {
      impersonated_user_token: &target_user.user_token,
      impersonator_user_token: &user_session.user_token,
      user_impersonation_token: &password_token,
      ip_address_creation: &ip_address,
      expires_at,
      mysql_executor: &mut *transaction,
      phantom: PhantomData,
    },
  ).await.map_err(|err| {
    warn!("Failed to insert impersonation request: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  // 10. Commit transaction.
  transaction.commit().await.map_err(|err| {
    warn!("Failed to commit transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  info!(
    "Impersonation request created: moderator={} target_user={} target_username={}",
    user_session.user_token.as_str(),
    target_user.user_token.as_str(),
    target_user.username,
  );

  // 11. Respond with the password token.
  Ok(Json(ModerationImpersonateSuccessResponse {
    success: true,
    password_token,
  }))
}

// --- Helpers ---

/// Which field to look up the user by, after normalization.
#[derive(Debug)]
enum UserLookup {
  Username(String),
  Email(String),
  Token(String),
}

/// Resolve which lookup field was provided. Exactly one must be set.
fn resolve_lookup_strategy(
  request: &ModerationImpersonateRequest,
) -> Result<UserLookup, CommonWebError> {
  let mut fields_set = 0u8;

  if request.username.is_some() { fields_set += 1; }
  if request.user_token.is_some() { fields_set += 1; }
  if request.email_address.is_some() { fields_set += 1; }
  if request.username_email_or_token.is_some() { fields_set += 1; }

  if fields_set == 0 {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      "Provide one of: username, user_token, email_address, or username_email_or_token".to_string(),
    ));
  }

  if fields_set > 1 {
    return Err(CommonWebError::BadInputWithSimpleMessage(
      "Only one lookup field should be provided".to_string(),
    ));
  }

  if let Some(ref username) = request.username {
    return Ok(UserLookup::Username(username.trim().to_lowercase()));
  }

  if let Some(ref token) = request.user_token {
    return Ok(UserLookup::Token(token.trim().to_string()));
  }

  if let Some(ref email) = request.email_address {
    return Ok(UserLookup::Email(email.trim().to_lowercase()));
  }

  if let Some(ref value) = request.username_email_or_token {
    return Ok(classify_ambiguous_lookup(value));
  }

  Err(CommonWebError::BadInputWithSimpleMessage(
    "No lookup field provided".to_string(),
  ))
}

/// Classify an ambiguous lookup value as username, email, or token.
fn classify_ambiguous_lookup(value: &str) -> UserLookup {
  let trimmed = value.trim();

  if trimmed.contains('@') {
    return UserLookup::Email(trimmed.to_lowercase());
  }

  if trimmed.starts_with("user_") || trimmed.starts_with("U:") {
    return UserLookup::Token(trimmed.to_string());
  }

  UserLookup::Username(trimmed.to_lowercase())
}

async fn perform_user_lookup(
  lookup: &UserLookup,
  server_state: &ServerState,
) -> Result<LookupUserForModerationResult, CommonWebError> {
  let maybe_user = match lookup {
    UserLookup::Username(username) => {
      lookup_user_for_moderation_by_username(username, &server_state.mysql_pool).await
    }
    UserLookup::Email(email) => {
      lookup_user_for_moderation_by_email(email, &server_state.mysql_pool).await
    }
    UserLookup::Token(token) => {
      lookup_user_for_moderation_by_token(token, &server_state.mysql_pool).await
    }
  };

  match maybe_user {
    Ok(Some(user)) => Ok(user),
    Ok(None) => {
      warn!("User not found for impersonation lookup: {:?}", lookup);
      Err(CommonWebError::NotFound)
    }
    Err(err) => {
      warn!("User lookup error: {:?}", err);
      Err(CommonWebError::from_anyhow_error(err))
    }
  }
}
