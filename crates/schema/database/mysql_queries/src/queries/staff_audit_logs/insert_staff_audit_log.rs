use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use enums::by_table::staff_audit_logs::staff_audit_action::StaffAuditAction;
use enums::by_table::staff_audit_logs::staff_audit_entity_type::StaffAuditEntityType;
use tokens::tokens::staff_audit_logs::StaffAuditLogToken;
use tokens::tokens::users::UserToken;

pub struct InsertStaffAuditLogArgs<'a, 'c: 'a, E>
  where E: 'a + Executor<'c, Database = MySql>
{
  pub audit_action: StaffAuditAction,

  pub maybe_entity_type: Option<StaffAuditEntityType>,
  pub maybe_entity_token: Option<&'a str>,

  pub staff_user_token: &'a UserToken,
  pub actor_ip_address: &'a str,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

pub async fn insert_staff_audit_log<'a, 'c, E>(
  args: InsertStaffAuditLogArgs<'a, 'c, E>,
) -> Result<StaffAuditLogToken, sqlx::Error>
  where E: 'a + Executor<'c, Database = MySql>
{
  let token = StaffAuditLogToken::generate();

  sqlx::query!(
    r#"
INSERT INTO staff_audit_logs
SET
  token = ?,
  audit_action = ?,
  maybe_entity_type = ?,
  maybe_entity_token = ?,
  staff_user_token = ?,
  staff_ip_address = ?
    "#,
    token.as_str(),
    args.audit_action.to_str(),
    args.maybe_entity_type.map(|ty| ty.to_str()),
    args.maybe_entity_token,
    args.staff_user_token.as_str(),
    args.actor_ip_address,
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(token)
}
