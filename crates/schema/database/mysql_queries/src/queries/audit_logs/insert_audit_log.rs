//! Audit logs are for entities that can be *edited* where we might lose the IP / edit history.

use std::marker::PhantomData;

use anyhow::anyhow;
use sqlx::{Executor, MySql};

use composite_identifiers::by_table::audit_logs::audit_log_entity::AuditLogEntity;
use enums_db::by_table::audit_logs::audit_log_entity_action::AuditLogEntityAction;
use errors::AnyhowResult;
use tokens::tokens::anonymous_visitor_tracking::AnonymousVisitorTrackingToken;
use tokens::tokens::audit_logs::AuditLogToken;
use tokens::tokens::users::UserToken;

pub struct InsertAuditLogArgs<'a, 'c : 'a, E>
  where E: 'a + Executor<'c, Database = MySql>
{
  pub entity: &'a AuditLogEntity,
  pub entity_action: AuditLogEntityAction,

  pub maybe_actor_user_token: Option<&'a UserToken>,
  pub maybe_actor_anonymous_visitor_token: Option<&'a AnonymousVisitorTrackingToken>,
  pub actor_ip_address: &'a str,
  pub is_actor_moderator: bool,

  pub mysql_executor: E,

  // TODO: Not sure if this works to tell the compiler we need the lifetime annotation.
  //  See: https://doc.rust-lang.org/std/marker/struct.PhantomData.html#unused-lifetime-parameters
  pub phantom: PhantomData<&'c E>,
}

pub async fn insert_audit_log<'a, 'c, E>(
  args: InsertAuditLogArgs<'a, 'c, E>,
) -> AnyhowResult<AuditLogToken>
  where E: 'a + Executor<'c, Database = MySql>
{

  let audit_log_token = AuditLogToken::generate();
  let (entity_type, entity_token) = args.entity.get_composite_keys();

  let query_result = sqlx::query!(
        r#"
INSERT INTO audit_logs
SET
  token = ?,
  entity_type = ?,
  entity_token = ?,
  entity_action = ?,
  maybe_actor_user_token = ?,
  maybe_actor_anonymous_visitor_token = ?,
  is_actor_moderator = ?,
  actor_ip_address = ?
        "#,
      &audit_log_token,
      entity_type.to_str(),
      entity_token,
      args.entity_action.to_str(),
      args.maybe_actor_user_token.map(|t| t.as_str()),
      args.maybe_actor_anonymous_visitor_token.map(|t| t.as_str()),
      args.is_actor_moderator,
      args.actor_ip_address,
    )
      .execute(args.mysql_executor)
      .await;

  let _record_id = match query_result {
    Ok(res) => res.last_insert_id(),
    Err(err) => return Err(anyhow!("Mysql error: {:?}", err)),
  };

  Ok(audit_log_token)
}
