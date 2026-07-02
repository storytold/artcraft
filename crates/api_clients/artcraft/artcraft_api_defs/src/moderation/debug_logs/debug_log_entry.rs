use chrono::{DateTime, Utc};
use serde_derive::Serialize;
use utoipa::ToSchema;

use enums::by_table::debug_logs::debug_log_level::DebugLogLevel;
use enums::by_table::debug_logs::debug_log_type::DebugLogType;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::users::UserToken;

/// A single debug log row.
/// Shared by the token-scoped and user-scoped moderation list endpoints.
#[derive(Serialize, ToSchema)]
pub struct ModerationDebugLogEntry {
  pub id: u64,
  pub event_token: DebugLogEventToken,
  pub debug_log_type: DebugLogType,
  pub maybe_log_level: Option<DebugLogLevel>,
  pub maybe_creator_user_token: Option<UserToken>,
  pub message: String,
  pub created_at: DateTime<Utc>,
}
