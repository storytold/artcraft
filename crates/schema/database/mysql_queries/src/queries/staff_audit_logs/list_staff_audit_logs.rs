use chrono::{DateTime, Utc};
use sqlx::MySqlPool;

use tokens::tokens::staff_audit_logs::StaffAuditLogToken;
use tokens::tokens::users::UserToken;

pub struct StaffAuditLogListItem {
  pub id: u64,
  pub token: StaffAuditLogToken,
  pub audit_action: String,
  pub maybe_entity_type: Option<String>,
  pub maybe_entity_token: Option<String>,
  pub maybe_target_username: Option<String>,
  pub maybe_target_display_name: Option<String>,
  pub staff_user_token: Option<UserToken>,
  pub staff_username: Option<String>,
  pub staff_display_name: Option<String>,
  pub staff_ip_address: String,
  pub created_at: DateTime<Utc>,
}

pub struct ListStaffAuditLogsArgs<'a> {
  pub maybe_cursor_id: Option<u64>,
  pub limit: u32,
  pub mysql_pool: &'a MySqlPool,
}

pub async fn list_staff_audit_logs(
  args: ListStaffAuditLogsArgs<'_>,
) -> Result<Vec<StaffAuditLogListItem>, sqlx::Error> {

  let limit = args.limit as i64;

  let items = match args.maybe_cursor_id {
    Some(cursor_id) => {
      sqlx::query_as!(
        StaffAuditLogListItem,
        r#"
SELECT
  sal.id,
  sal.token as `token: StaffAuditLogToken`,
  sal.audit_action,
  sal.maybe_entity_type,
  sal.maybe_entity_token,
  target_user.username as maybe_target_username,
  target_user.display_name as maybe_target_display_name,
  sal.staff_user_token as `staff_user_token: UserToken`,
  staff_user.username as staff_username,
  staff_user.display_name as staff_display_name,
  sal.staff_ip_address,
  sal.created_at
FROM staff_audit_logs sal
LEFT JOIN users target_user ON target_user.token = sal.maybe_entity_token
LEFT JOIN users staff_user ON staff_user.token = sal.staff_user_token
WHERE sal.id < ?
ORDER BY sal.id DESC
LIMIT ?
        "#,
        cursor_id as u64,
        limit,
      )
        .fetch_all(args.mysql_pool)
        .await?
    }
    None => {
      sqlx::query_as!(
        StaffAuditLogListItem,
        r#"
SELECT
  sal.id,
  sal.token as `token: StaffAuditLogToken`,
  sal.audit_action,
  sal.maybe_entity_type,
  sal.maybe_entity_token,
  target_user.username as maybe_target_username,
  target_user.display_name as maybe_target_display_name,
  sal.staff_user_token as `staff_user_token: UserToken`,
  staff_user.username as staff_username,
  staff_user.display_name as staff_display_name,
  sal.staff_ip_address,
  sal.created_at
FROM staff_audit_logs sal
LEFT JOIN users target_user ON target_user.token = sal.maybe_entity_token
LEFT JOIN users staff_user ON staff_user.token = sal.staff_user_token
ORDER BY sal.id DESC
LIMIT ?
        "#,
        limit,
      )
        .fetch_all(args.mysql_pool)
        .await?
    }
  };

  Ok(items)
}
