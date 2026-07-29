use log::warn;
use sqlx::{Executor, MySql};

use artcraft_router::api::router_provider::RouterProvider;
use enums::by_table::debug_logs::debug_log_level::DebugLogLevel;
use enums::by_table::debug_logs::debug_log_type::DebugLogType;
use mysql_queries::queries::debug_logs::insert_debug_log::{insert_debug_log, InsertDebugLogArgs};
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::users::UserToken;

/// Request-scoped identity for debug log inserts, so deep pipeline code can
/// log without threading four separate arguments.
pub struct GenerationDebugLogContext<'a> {
  pub event_token: &'a DebugLogEventToken,
  pub user_token: &'a UserToken,
  pub ip_address: &'a str,
  pub request_url: &'a str,
}

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

/// The debug log type for an outbound request to the given provider, or
/// `None` for providers we don't capture.
pub fn provider_request_debug_log_type(provider: RouterProvider) -> Option<DebugLogType> {
  match provider {
    RouterProvider::Fal => Some(DebugLogType::FalRequest),
    RouterProvider::GrokApi => Some(DebugLogType::GrokApiRequest),
    RouterProvider::Seedance2Pro => Some(DebugLogType::KinoviRequest),
    // First-party: the HttpRequest log already captures the user request.
    RouterProvider::Artcraft => None,
    // No DebugLogType variant yet; add one if GmiCloud routing is revived.
    RouterProvider::GmiCloud => None,
    // No DebugLogType variant yet for World Labs outbound requests.
    RouterProvider::WorldLabs => None,
  }
}

/// Best-effort info-level debug log of an outbound provider generation
/// request. MUST be inserted during the pre-request DB phase — on the same
/// open connection as the session/billing/HTTP-request writes, BEFORE that
/// connection is released and the external provider call is made — so the
/// outbound payload is captured even when the upload/enqueue fails, without
/// ever touching the pool.
/// Never fails the request — insert errors are logged and swallowed.
pub async fn insert_provider_request_debug_log<'e, 'c: 'e, E>(
  context: &'e GenerationDebugLogContext<'e>,
  debug_log_type: DebugLogType,
  outbound_request_debug: &'e str,
  mysql_executor: E,
) where
  E: 'c + Executor<'c, Database = MySql>,
{
  if let Err(err) = insert_debug_log(InsertDebugLogArgs {
    apriori_debug_log_event_token: Some(context.event_token),
    maybe_creator_user_token: Some(context.user_token),
    debug_log_type,
    maybe_log_level: Some(DebugLogLevel::Info),
    maybe_ip_address: Some(context.ip_address),
    maybe_url: Some(context.request_url),
    message: outbound_request_debug,
    mysql_executor,
    phantom: Default::default(),
  }).await {
    warn!("Failed to insert {} debug log: {:?}", debug_log_type, err);
  }
}
