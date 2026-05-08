use std::marker::PhantomData;

use log::warn;
use sqlx::{Executor, MySql, QueryBuilder};

use enums::by_table::debug_logs::debug_log_type::DebugLogType;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::users::UserToken;

pub struct BulkInsertDebugLogsArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  /// If provided, all rows will share this event token.
  /// If not provided, one will be generated.
  pub apriori_debug_log_event_token: Option<&'e DebugLogEventToken>,

  /// The user associated with these debug log events (if any).
  pub maybe_creator_user_token: Option<&'e UserToken>,

  /// The events to insert.
  pub events: Vec<DebugLogEvent>,

  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// A single debug log event to insert.
///
/// The `message` field should be a pre-serialized JSON string (or any text).
/// Callers should use `serde_json::to_string(...)` before constructing this.
pub struct DebugLogEvent {
  pub debug_log_type: DebugLogType,
  pub message: String,
}

/// Bulk-insert debug log rows. All rows share the same event token.
///
/// Returns the event token used. No-op (with a warning) if `events` is empty.
pub async fn bulk_insert_debug_logs<'e, 'c: 'e, E>(
  args: BulkInsertDebugLogsArgs<'e, 'c, E>,
) -> Result<DebugLogEventToken, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let event_token = match args.apriori_debug_log_event_token {
    Some(token) => token.clone(),
    None => DebugLogEventToken::generate(),
  };

  if args.events.is_empty() {
    warn!("bulk_insert_debug_logs called with no events; no-op.");
    return Ok(event_token);
  }

  let maybe_user_token_str = args.maybe_creator_user_token.map(|t| t.as_str().to_string());

  let mut query_builder = QueryBuilder::new(
    "INSERT INTO debug_logs (event_token, debug_log_type, maybe_creator_user_token, message) VALUES "
  );

  for (i, event) in args.events.iter().enumerate() {
    query_builder.push("(");
    query_builder.push_bind(event_token.as_str());
    query_builder.push(", ");
    query_builder.push_bind(event.debug_log_type.to_str());
    query_builder.push(", ");
    query_builder.push_bind(&maybe_user_token_str);
    query_builder.push(", ");
    query_builder.push_bind(&event.message);
    query_builder.push(")");

    if i < args.events.len() - 1 {
      query_builder.push(", ");
    }
  }

  query_builder.build()
    .execute(args.mysql_executor)
    .await?;

  Ok(event_token)
}
