use std::marker::PhantomData;

use chrono::{DateTime, NaiveDateTime, Utc};
use sqlx::{Executor, MySql};

use enums::by_table::debug_logs::debug_log_level::DebugLogLevel;
use enums::by_table::debug_logs::debug_log_type::DebugLogType;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::users::UserToken;

const DEFAULT_LIMIT: u32 = 50;

pub struct ListDebugLogsForTokenArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub event_token: &'e DebugLogEventToken,
  pub limit: Option<u32>,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

#[derive(Debug)]
pub struct DebugLogRow {
  pub id: u64,
  pub event_token: DebugLogEventToken,
  pub debug_log_type: DebugLogType,
  pub maybe_log_level: Option<DebugLogLevel>,
  pub maybe_creator_user_token: Option<UserToken>,
  pub maybe_ip_address: Option<String>,
  pub maybe_url: Option<String>,
  pub message: String,
  pub created_at: DateTime<Utc>,

  // Joined user fields (present when the creator user exists).
  pub maybe_user_display_name: Option<String>,
  pub maybe_user_username: Option<String>,
  pub maybe_user_gravatar_hash: Option<String>,
}

#[derive(Debug)]
struct RawDebugLogRow {
  id: u64,
  event_token: DebugLogEventToken,
  debug_log_type: DebugLogType,
  maybe_log_level: Option<DebugLogLevel>,
  maybe_creator_user_token: Option<UserToken>,
  maybe_ip_address: Option<String>,
  maybe_url: Option<String>,
  message: String,
  created_at: NaiveDateTime,
  maybe_user_display_name: Option<String>,
  maybe_user_username: Option<String>,
  maybe_user_gravatar_hash: Option<String>,
}

pub async fn list_debug_logs_for_token<'e, 'c: 'e, E>(
  args: ListDebugLogsForTokenArgs<'e, 'c, E>,
) -> Result<Vec<DebugLogRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let limit = args.limit.unwrap_or(DEFAULT_LIMIT).min(200) as i64;

  let rows = sqlx::query_as!(
    RawDebugLogRow,
    r#"
SELECT
  d.id as `id: u64`,
  d.event_token as `event_token: tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken`,
  d.debug_log_type as `debug_log_type: enums::by_table::debug_logs::debug_log_type::DebugLogType`,
  d.maybe_log_level as `maybe_log_level: enums::by_table::debug_logs::debug_log_level::DebugLogLevel`,
  d.maybe_creator_user_token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
  d.maybe_ip_address,
  d.maybe_url,
  d.message,
  d.created_at,
  u.display_name as `maybe_user_display_name?`,
  u.username as `maybe_user_username?`,
  u.email_gravatar_hash as `maybe_user_gravatar_hash?`
FROM debug_logs d
LEFT OUTER JOIN users u
  ON u.token = d.maybe_creator_user_token
WHERE d.event_token = ?
ORDER BY d.id ASC
LIMIT ?
    "#,
    args.event_token.as_str(),
    limit,
  )
    .fetch_all(args.mysql_executor)
    .await?;

  let results = rows.into_iter().map(|row| {
    DebugLogRow {
      id: row.id,
      event_token: row.event_token,
      debug_log_type: row.debug_log_type,
      maybe_log_level: row.maybe_log_level,
      maybe_creator_user_token: row.maybe_creator_user_token,
      maybe_ip_address: row.maybe_ip_address,
      maybe_url: row.maybe_url,
      message: row.message,
      created_at: row.created_at.and_utc(),
      maybe_user_display_name: row.maybe_user_display_name,
      maybe_user_username: row.maybe_user_username,
      maybe_user_gravatar_hash: row.maybe_user_gravatar_hash,
    }
  }).collect();

  Ok(results)
}
