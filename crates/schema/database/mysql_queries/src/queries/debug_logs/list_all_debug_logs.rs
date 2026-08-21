use std::marker::PhantomData;

use chrono::{DateTime, Utc};
use sqlx::mysql::MySqlRow;
use sqlx::{Executor, MySql, QueryBuilder, Row};

use enums::by_table::debug_logs::debug_log_level::DebugLogLevel;
use enums::by_table::debug_logs::debug_log_type::DebugLogType;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::users::UserToken;

const DEFAULT_LIMIT: u32 = 50;
const MAX_LIMIT: u32 = 200;

pub struct ListAllDebugLogsArgs<'c, E>
where
  E: Executor<'c, Database = MySql>,
{
  /// If provided, only rows with one of these log levels are returned.
  /// (Rows with a NULL log level are excluded when filtering.)
  pub maybe_log_levels: Option<Vec<DebugLogLevel>>,

  /// Cursor for pagination: only rows with `id` strictly below this are
  /// returned. Pass the `next_cursor` from a previous page.
  pub maybe_id_cursor: Option<u64>,

  pub limit: Option<u32>,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

pub struct ListAllDebugLogsResult {
  pub debug_logs: Vec<AllDebugLogRow>,
  /// Cursor for the next page. `None` if there are no more results.
  pub next_cursor: Option<u64>,
}

/// A debug log row left-outer-joined against the creator user (if any).
#[derive(Debug)]
pub struct AllDebugLogRow {
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

/// List all debug logs, most recent first, cursor-paginated by `id`,
/// optionally scoped to a set of log levels.
///
/// NB: Uses `QueryBuilder` (not the compile-time macros) because of the
/// dynamic `WHERE maybe_log_level IN (...)` clause.
pub async fn list_all_debug_logs<'c, E>(
  args: ListAllDebugLogsArgs<'c, E>,
) -> Result<ListAllDebugLogsResult, sqlx::Error>
where
  E: Executor<'c, Database = MySql>,
{
  let limit = args.limit.unwrap_or(DEFAULT_LIMIT).min(MAX_LIMIT);
  // Fetch limit + 1 so we can detect whether there's a next page.
  let fetch_limit = (limit + 1) as i64;

  let id_cursor = args.maybe_id_cursor.unwrap_or(u64::MAX);

  let mut query_builder: QueryBuilder<MySql> = QueryBuilder::new(
    r#"
SELECT
  d.id,
  d.event_token,
  d.debug_log_type,
  d.maybe_log_level,
  d.maybe_creator_user_token,
  d.maybe_ip_address,
  d.maybe_url,
  d.message,
  d.created_at,
  u.display_name as maybe_user_display_name,
  u.username as maybe_user_username,
  u.email_gravatar_hash as maybe_user_gravatar_hash
FROM debug_logs d
LEFT OUTER JOIN users u
  ON u.token = d.maybe_creator_user_token
WHERE d.id < "#,
  );
  query_builder.push_bind(id_cursor);

  if let Some(levels) = args.maybe_log_levels.as_ref().filter(|l| !l.is_empty()) {
    query_builder.push(" AND d.maybe_log_level IN (");
    let mut separated = query_builder.separated(", ");
    for level in levels {
      separated.push_bind(level.to_str());
    }
    separated.push_unseparated(")");
  }

  query_builder.push(" ORDER BY d.id DESC LIMIT ");
  query_builder.push_bind(fetch_limit);

  let raw_rows: Vec<MySqlRow> = query_builder
    .build()
    .fetch_all(args.mysql_executor)
    .await?;

  let mut debug_logs = raw_rows
    .into_iter()
    .map(row_from_mysql_row)
    .collect::<Result<Vec<AllDebugLogRow>, sqlx::Error>>()?;

  let next_cursor = if debug_logs.len() > limit as usize {
    debug_logs.truncate(limit as usize);
    debug_logs.last().map(|row| row.id)
  } else {
    None
  };

  Ok(ListAllDebugLogsResult {
    debug_logs,
    next_cursor,
  })
}

fn row_from_mysql_row(row: MySqlRow) -> Result<AllDebugLogRow, sqlx::Error> {
  let created_at: DateTime<Utc> = row.try_get("created_at")?;

  Ok(AllDebugLogRow {
    id: row.try_get("id")?,
    event_token: row.try_get("event_token")?,
    debug_log_type: row.try_get("debug_log_type")?,
    maybe_log_level: row.try_get("maybe_log_level")?,
    maybe_creator_user_token: row.try_get("maybe_creator_user_token")?,
    maybe_ip_address: row.try_get("maybe_ip_address")?,
    maybe_url: row.try_get("maybe_url")?,
    message: row.try_get("message")?,
    created_at,
    maybe_user_display_name: row.try_get("maybe_user_display_name")?,
    maybe_user_username: row.try_get("maybe_user_username")?,
    maybe_user_gravatar_hash: row.try_get("maybe_user_gravatar_hash")?,
  })
}
