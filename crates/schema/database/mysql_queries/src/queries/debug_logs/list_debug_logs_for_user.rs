use std::marker::PhantomData;

use chrono::{DateTime, NaiveDateTime, Utc};
use sqlx::{Executor, MySql};

use enums::by_table::debug_logs::debug_log_level::DebugLogLevel;
use enums::by_table::debug_logs::debug_log_type::DebugLogType;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::users::UserToken;

const DEFAULT_LIMIT: u32 = 50;
const MAX_LIMIT: u32 = 200;

pub struct ListDebugLogsForUserArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub user_token: &'e UserToken,

  /// Cursor for pagination: only rows with `id` strictly below this are
  /// returned. Pass the `next_cursor` from a previous page.
  pub maybe_id_cursor: Option<u64>,

  pub limit: Option<u32>,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

pub struct ListDebugLogsForUserResult {
  pub debug_logs: Vec<UserDebugLogRow>,
  /// Cursor for the next page. `None` if there are no more results.
  pub next_cursor: Option<u64>,
}

#[derive(Debug)]
pub struct UserDebugLogRow {
  pub id: u64,
  pub event_token: DebugLogEventToken,
  pub debug_log_type: DebugLogType,
  pub maybe_log_level: Option<DebugLogLevel>,
  pub maybe_creator_user_token: Option<UserToken>,
  pub message: String,
  pub created_at: DateTime<Utc>,
}

#[derive(Debug)]
struct RawUserDebugLogRow {
  id: u64,
  event_token: DebugLogEventToken,
  debug_log_type: DebugLogType,
  maybe_log_level: Option<DebugLogLevel>,
  maybe_creator_user_token: Option<UserToken>,
  message: String,
  created_at: NaiveDateTime,
}

/// List debug logs for a user, most recent first, cursor-paginated by `id`.
pub async fn list_debug_logs_for_user<'e, 'c: 'e, E>(
  args: ListDebugLogsForUserArgs<'e, 'c, E>,
) -> Result<ListDebugLogsForUserResult, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let limit = args.limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT);
  // Fetch limit + 1 so we can detect whether there's a next page.
  let fetch_limit = (limit + 1) as i64;

  // Use u64::MAX when no cursor so all rows are included.
  let id_cursor = args.maybe_id_cursor.unwrap_or(u64::MAX);

  let rows = sqlx::query_as!(
    RawUserDebugLogRow,
    r#"
SELECT
  id as `id: u64`,
  event_token as `event_token: tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken`,
  debug_log_type as `debug_log_type: enums::by_table::debug_logs::debug_log_type::DebugLogType`,
  maybe_log_level as `maybe_log_level: enums::by_table::debug_logs::debug_log_level::DebugLogLevel`,
  maybe_creator_user_token as `maybe_creator_user_token: tokens::tokens::users::UserToken`,
  message,
  created_at
FROM debug_logs
WHERE maybe_creator_user_token = ?
  AND id < ?
ORDER BY id DESC
LIMIT ?
    "#,
    args.user_token.as_str(),
    id_cursor,
    fetch_limit,
  )
    .fetch_all(args.mysql_executor)
    .await?;

  let mut debug_logs: Vec<UserDebugLogRow> = rows.into_iter().map(|row| {
    UserDebugLogRow {
      id: row.id,
      event_token: row.event_token,
      debug_log_type: row.debug_log_type,
      maybe_log_level: row.maybe_log_level,
      maybe_creator_user_token: row.maybe_creator_user_token,
      message: row.message,
      created_at: row.created_at.and_utc(),
    }
  }).collect();

  let next_cursor = if debug_logs.len() > limit as usize {
    debug_logs.truncate(limit as usize);
    debug_logs.last().map(|row| row.id)
  } else {
    None
  };

  Ok(ListDebugLogsForUserResult {
    debug_logs,
    next_cursor,
  })
}
