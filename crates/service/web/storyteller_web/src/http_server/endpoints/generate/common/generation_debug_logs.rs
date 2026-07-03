use log::warn;
use sqlx::{Executor, MySql};

use enums::by_table::debug_logs::debug_log_level::DebugLogLevel;
use enums::by_table::debug_logs::debug_log_type::DebugLogType;
use mysql_queries::queries::debug_logs::insert_debug_log::{insert_debug_log, InsertDebugLogArgs};
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::users::UserToken;

/// Best-effort info-level debug log of an inbound generation HTTP request.
/// Never fails the request — insert errors are logged and swallowed.
pub async fn insert_generation_request_debug_log<'e, 'c: 'e, E>(
  debug_log_event_token: &'e DebugLogEventToken,
  user_token: &'e UserToken,
  ip_address: &'e str,
  request_url: &'e str,
  request_json: &'e str,
  mysql_executor: E,
) where
  E: 'c + Executor<'c, Database = MySql>,
{
  if let Err(err) = insert_debug_log(InsertDebugLogArgs {
    apriori_debug_log_event_token: Some(debug_log_event_token),
    maybe_creator_user_token: Some(user_token),
    debug_log_type: DebugLogType::HttpRequest,
    maybe_log_level: Some(DebugLogLevel::Info),
    maybe_ip_address: Some(ip_address),
    maybe_url: Some(request_url),
    message: request_json,
    mysql_executor,
    phantom: Default::default(),
  }).await {
    warn!("Failed to insert HTTP request debug log: {:?}", err);
  }
}

/// Best-effort error-level debug log of a generation backend failure.
/// Never fails the request — insert errors are logged and swallowed.
pub async fn insert_generation_failure_debug_log<'e, 'c: 'e, E>(
  debug_log_event_token: &'e DebugLogEventToken,
  user_token: &'e UserToken,
  ip_address: &'e str,
  request_url: &'e str,
  error_message: &'e str,
  mysql_executor: E,
) where
  E: 'c + Executor<'c, Database = MySql>,
{
  if let Err(err) = insert_debug_log(InsertDebugLogArgs {
    apriori_debug_log_event_token: Some(debug_log_event_token),
    maybe_creator_user_token: Some(user_token),
    debug_log_type: DebugLogType::BackendFailure,
    maybe_log_level: Some(DebugLogLevel::Error),
    maybe_ip_address: Some(ip_address),
    maybe_url: Some(request_url),
    message: error_message,
    mysql_executor,
    phantom: Default::default(),
  }).await {
    warn!("Failed to insert generation failure debug log: {:?}", err);
  }
}
