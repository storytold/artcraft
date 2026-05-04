use std::marker::PhantomData;

use chrono::{DateTime, NaiveDateTime, Utc};
use sqlx::{Executor, MySql};

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
  pub maybe_creator_user_token: Option<UserToken>,
  pub message: String,
  pub created_at: DateTime<Utc>,
}

#[derive(Debug)]
struct RawDebugLogRow {
  id: u64,
  event_token: DebugLogEventToken,
  debug_log_type: DebugLogType,
  maybe_creator_user_token: Option<UserToken>,
  message: String,
  created_at: NaiveDateTime,
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
  id as `id: u64`,
  event_token as `event_token: tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken`,
  debug_log_type as `debug_log_type: enums::by_table::debug_logs::debug_log_type::DebugLogType`,
  maybe_creator_user_token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
  message,
  created_at
FROM debug_logs
WHERE event_token = ?
ORDER BY id ASC
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
      maybe_creator_user_token: row.maybe_creator_user_token,
      message: row.message,
      created_at: row.created_at.and_utc(),
    }
  }).collect();

  Ok(results)
}
