use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::{Executor, FromRow, MySql, Row};

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

pub async fn list_debug_logs_for_token<'e, 'c: 'e, E>(
  args: ListDebugLogsForTokenArgs<'e, 'c, E>,
) -> Result<Vec<DebugLogRow>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let limit = args.limit.unwrap_or(DEFAULT_LIMIT).min(200) as i64;

  let rows = sqlx::query(
    "SELECT id, event_token, debug_log_type, maybe_creator_user_token, message, created_at \
     FROM debug_logs \
     WHERE event_token = ? \
     ORDER BY id ASC \
     LIMIT ?"
  )
    .bind(args.event_token.as_str())
    .bind(limit)
    .fetch_all(args.mysql_executor)
    .await?;

  let results = rows.iter().map(|row| {
    let id: u64 = row.get("id");
    let event_token_str: String = row.get("event_token");
    let debug_log_type_str: String = row.get("debug_log_type");
    let maybe_creator_user_token_str: Option<String> = row.get("maybe_creator_user_token");
    let message: String = row.get("message");
    let created_at: DateTime<Utc> = row.get("created_at");

    DebugLogRow {
      id,
      event_token: DebugLogEventToken::new_from_str(&event_token_str),
      debug_log_type: DebugLogType::from_str(&debug_log_type_str).unwrap_or(DebugLogType::HttpRequest),
      maybe_creator_user_token: maybe_creator_user_token_str.map(|s| UserToken::new_from_str(&s)),
      message,
      created_at,
    }
  }).collect();

  Ok(results)
}
