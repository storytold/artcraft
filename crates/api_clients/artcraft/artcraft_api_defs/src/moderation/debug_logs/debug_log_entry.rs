use chrono::{DateTime, Utc};
use serde_derive::Serialize;
use utoipa::ToSchema;

use enums::by_table::debug_logs::debug_log_level::DebugLogLevel;
use enums::by_table::debug_logs::debug_log_type::DebugLogType;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::users::UserToken;

/// A single debug log row.
/// Shared by the moderation debug-log list endpoints.
#[derive(Serialize, ToSchema)]
pub struct ModerationDebugLogEntry {
  pub id: u64,
  pub event_token: DebugLogEventToken,
  pub debug_log_type: DebugLogType,
  pub maybe_log_level: Option<DebugLogLevel>,
  pub maybe_creator_user_token: Option<UserToken>,
  /// The client IP address of the request (if recorded).
  pub maybe_ip_address: Option<String>,
  /// The request URL (if recorded; truncated to 255 chars).
  pub maybe_url: Option<String>,
  pub message: String,
  pub created_at: DateTime<Utc>,
  /// The creator user, joined in when the row has a user token.
  pub maybe_user: Option<ModerationDebugLogUser>,
}

/// The creator user of a debug log row.
#[derive(Serialize, ToSchema)]
pub struct ModerationDebugLogUser {
  pub user_token: UserToken,
  pub display_name: String,
  pub username: String,
  pub gravatar_hash: String,
}
