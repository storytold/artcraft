use anyhow::anyhow;
use sqlx::{MySql, Transaction};

use composite_identifiers::by_table::audit_logs::audit_log_entity::AuditLogEntity;
use enums_db::by_table::audit_logs::audit_log_entity_action::AuditLogEntityAction;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;

use crate::queries::audit_logs::insert_audit_log_transactional::{insert_audit_log_transactional, InsertAuditLogTransactionalArgs};

pub struct SetUserFeatureFlagTransactionalArgs<'a, 'b> {
  // The action's target user token.
  pub subject_user_token: &'a UserToken,

  // Comma separated string of feature flags.
  pub maybe_feature_flags: Option<&'a str>,

  // Actor IP address.
  pub ip_address: &'a str,

  // If a moderator is changing the flags, the moderator user token
  pub maybe_mod_user_token: Option<&'a UserToken>,

  pub transaction: &'a mut Transaction<'b, MySql>,
}

pub async fn set_user_feature_flags_transactional(args: SetUserFeatureFlagTransactionalArgs<'_, '_>) -> AnyhowResult<()> {
  let query_result = sqlx::query!(
        r#"
UPDATE users
SET
    maybe_feature_flags = ?,
    version = version + 1

WHERE users.token = ?
LIMIT 1
        "#,
      args.maybe_feature_flags,
      args.subject_user_token,
    )
      .execute(&mut **args.transaction)
      .await;

  if let Err(err) = query_result {
    return Err(anyhow!("error with query: {:?}", err));
  }

  // NB: fail open
  let _r = insert_audit_log_transactional(InsertAuditLogTransactionalArgs {
    entity: &AuditLogEntity::User(args.subject_user_token.clone()),
    entity_action: AuditLogEntityAction::EditFeatures,
    maybe_actor_user_token: args.maybe_mod_user_token,
    maybe_actor_anonymous_visitor_token: None,
    actor_ip_address: &args.ip_address,
    is_actor_moderator: true,
    transaction: args.transaction,
  }).await;

  Ok(())
}
