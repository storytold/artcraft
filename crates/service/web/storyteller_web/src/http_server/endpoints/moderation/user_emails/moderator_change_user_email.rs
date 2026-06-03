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
use mysql_queries::queries::users::user::get::lookup_user_for_moderation::lookup_user_for_moderation_by_token;
use mysql_queries::queries::users::user::update::update_email::{
  update_email, UpdateEmailArgs, UpdateEmailError,
};
use mysql_queries::queries::users::user_email_changes::insert_user_email_change::{
  insert_user_email_change, InsertUserEmailChangeArgs,
};
use mysql_queries::utils::transactor::Transactor;
use users::email::email_to_gravatar_hash::email_to_gravatar_hash;
use users::email::validate_email_address_format::validate_email_address_format;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::web_utils::user_session::require_moderator::{
  require_moderator, UseDatabase,
};
use crate::state::server_state::ServerState;

// --- Request ---

#[derive(Deserialize, ToSchema)]
pub struct ModeratorChangeUserEmailRequest {
  /// The user whose email should be changed.
  pub user_token: String,

  /// The new email address. Will be trimmed and lowercased before use.
  pub new_email: String,
}

// --- Response ---

#[derive(Serialize, ToSchema)]
pub struct ModeratorChangeUserEmailSuccessResponse {
  pub success: bool,
}

// --- Handler ---

/// Change a user's email address as a moderator. Records the change in
/// `user_email_changes` and writes a `staff_audit_logs` row.
#[utoipa::path(
  post,
  tag = "Moderation",
  path = "/v1/moderation/user_emails/change",
  request_body = ModeratorChangeUserEmailRequest,
  responses(
    (status = 200, description = "Email changed", body = ModeratorChangeUserEmailSuccessResponse),
    (status = 400, description = "Bad email format or duplicate email", body = CommonWebError),
    (status = 401, description = "Unauthorized", body = CommonWebError),
    (status = 404, description = "Target user not found", body = CommonWebError),
    (status = 500, description = "Server error", body = CommonWebError),
  ),
)]
pub async fn moderator_change_user_email_handler(
  http_request: HttpRequest,
  request: Json<ModeratorChangeUserEmailRequest>,
  server_state: web::Data<Arc<ServerState>>,
) -> Result<Json<ModeratorChangeUserEmailSuccessResponse>, CommonWebError> {

  // 1. Require moderator.
  let user_session = require_moderator(
    &http_request,
    &server_state,
    UseDatabase::GrabNewConnection,
  ).await.map_err(|err| {
    warn!("Moderator check failed: {:?}", err);
    CommonWebError::NotAuthorized
  })?;

  // 2. Normalize + validate the new email.
  let new_email = request.new_email.trim().to_lowercase();
  if let Err(reason) = validate_email_address_format(&new_email) {
    return Err(CommonWebError::BadInputWithSimpleMessage(format!("bad email: {}", reason)));
  }

  // 3. Look up the target user. Not-found → 404; everything else → 500.
  let target_user_token_input = request.user_token.trim();
  let target = lookup_user_for_moderation_by_token(target_user_token_input, &server_state.mysql_pool)
    .await
    .map_err(|err| {
      warn!("Target user lookup failed: {:?}", err);
      CommonWebError::from_anyhow_error(err)
    })?
    .ok_or_else(|| {
      warn!("Target user not found: {:?}", target_user_token_input);
      CommonWebError::NotFound
    })?;

  let target_user_token = target.user_token;
  let old_email = target.email_address;
  let new_gravatar_hash = email_to_gravatar_hash(&new_email);
  let actor_ip = get_request_ip(&http_request);

  info!(
    "Moderator {} changing email for user {}.",
    user_session.user_token.as_str(), target_user_token.as_str(),
  );

  // 4. Open transaction: update email, audit row, audit log.
  let mut transaction = server_state.mysql_pool.begin().await
    .map_err(|err| {
      warn!("Failed to begin transaction: {:?}", err);
      CommonWebError::from_error(err)
    })?;

  // 4a. Update the user's email address. Duplicate-email errors surface as 400.
  match update_email(UpdateEmailArgs {
    token: &target_user_token,
    email_address: &new_email,
    email_gravatar_hash: &new_gravatar_hash,
    ip_address: &actor_ip,
    transactor: Transactor::for_transaction(&mut transaction),
  }).await {
    Ok(()) => {}
    Err(UpdateEmailError::EmailIsTaken) => {
      return Err(CommonWebError::BadInputWithSimpleMessage(
        "email address is already in use".to_string(),
      ));
    }
    Err(UpdateEmailError::DatabaseError { source }) => {
      warn!("Error updating user email: {:?}", source);
      return Err(CommonWebError::from_error(source));
    }
  }

  // 4b. Record the change in user_email_changes.
  insert_user_email_change(InsertUserEmailChangeArgs {
    user_token: &target_user_token,
    old_email: &old_email,
    new_email: &new_email,
    ip_address: &actor_ip,
    maybe_changed_by_user_token: Some(&user_session.user_token),
    mysql_executor: &mut *transaction,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Failed to insert user_email_changes row: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  // 4c. Insert staff audit log.
  let _audit_token = insert_staff_audit_log(InsertStaffAuditLogArgs {
    audit_action: StaffAuditAction::ChangeUserEmail,
    maybe_entity_type: Some(StaffAuditEntityType::User),
    maybe_entity_token: Some(target_user_token.as_str()),
    staff_user_token: &user_session.user_token,
    actor_ip_address: &actor_ip,
    mysql_executor: &mut *transaction,
    phantom: PhantomData,
  }).await.map_err(|err| {
    warn!("Failed to insert staff audit log: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  // 5. Commit.
  transaction.commit().await.map_err(|err| {
    warn!("Failed to commit transaction: {:?}", err);
    CommonWebError::from_error(err)
  })?;

  info!(
    "Email changed for user {} by moderator {}.",
    target_user_token.as_str(), user_session.user_token.as_str(),
  );

  Ok(Json(ModeratorChangeUserEmailSuccessResponse { success: true }))
}
