use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use enums::by_table::debug_logs::debug_log_level::DebugLogLevel;
use enums::by_table::debug_logs::debug_log_type::DebugLogType;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::users::UserToken;

pub struct InsertDebugLogArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  /// If provided, the row will use this event token.
  /// If not provided, one will be generated.
  pub apriori_debug_log_event_token: Option<&'e DebugLogEventToken>,

  /// The user associated with this debug log event (if any).
  pub maybe_creator_user_token: Option<&'e UserToken>,

  /// The type of debug log event.
  pub debug_log_type: DebugLogType,

  /// The severity level of the log event (if any).
  pub maybe_log_level: Option<DebugLogLevel>,

  /// The log message body (pre-serialized JSON or any text).
  pub message: &'e str,

  /// The client IP address of the request (if any). Truncated on insert.
  pub maybe_ip_address: Option<&'e str>,

  /// The request URL (if any). Truncated to 255 characters on insert.
  pub maybe_url: Option<&'e str>,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Insert a single debug log row.
///
/// Returns the event token used.
pub async fn insert_debug_log<'e, 'c: 'e, E>(
  args: InsertDebugLogArgs<'e, 'c, E>,
) -> Result<DebugLogEventToken, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let event_token = match args.apriori_debug_log_event_token {
    Some(token) => token.clone(),
    None => DebugLogEventToken::generate(),
  };

  sqlx::query!(
    r#"
INSERT INTO debug_logs
SET
  event_token = ?,
  debug_log_type = ?,
  maybe_log_level = ?,
  maybe_creator_user_token = ?,
  maybe_ip_address = ?,
  maybe_url = ?,
  message = ?
    "#,
    event_token.as_str(),
    args.debug_log_type.to_str(),
    args.maybe_log_level.map(|l| l.to_str()),
    args.maybe_creator_user_token.map(|t| t.as_str()),
    args.maybe_ip_address.map(|ip| truncate_chars(ip, MAX_IP_ADDRESS_CHARS)),
    args.maybe_url.map(|url| truncate_chars(url, MAX_URL_CHARS)),
    args.message,
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(event_token)
}

/// Maximum stored length for `maybe_ip_address` (VARCHAR(40)).
const MAX_IP_ADDRESS_CHARS: usize = 40;

/// Maximum stored length for `maybe_url` (VARCHAR(255)).
const MAX_URL_CHARS: usize = 255;

/// Truncate to at most `max_chars` characters (UTF-8 safe).
fn truncate_chars(value: &str, max_chars: usize) -> &str {
  match value.char_indices().nth(max_chars) {
    Some((idx, _)) => &value[..idx],
    None => value,
  }
}
