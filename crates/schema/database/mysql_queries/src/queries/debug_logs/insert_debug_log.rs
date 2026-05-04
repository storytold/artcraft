use std::marker::PhantomData;

use sqlx::{Executor, MySql};

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

  /// The log message body (pre-serialized JSON or any text).
  pub message: &'e str,

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
  maybe_creator_user_token = ?,
  message = ?
    "#,
    event_token.as_str(),
    args.debug_log_type.to_str(),
    args.maybe_creator_user_token.map(|t| t.as_str()),
    args.message,
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(event_token)
}
