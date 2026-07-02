use chrono::{DateTime, Utc};
use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

use enums::by_table::debug_logs::debug_log_level::DebugLogLevel;
use enums::by_table::debug_logs::debug_log_type::DebugLogType;
use enums::error::enum_error::EnumError;
use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;
use tokens::tokens::users::UserToken;

use crate::moderation::debug_logs::debug_log_entry::ModerationDebugLogUser;

pub const MODERATION_LIST_ALL_DEBUG_LOGS_PATH: &str = "/v1/moderation/debug_logs/list_all";

// ── Query params ──

#[derive(Deserialize, IntoParams, ToSchema)]
pub struct ModerationListAllDebugLogsQueryParams {
  /// Optional comma-separated list of severity levels to include,
  /// eg. `severities=error,warn`. Omit to include all rows.
  pub severities: Option<String>,

  /// Cursor for pagination. Pass the `next_cursor` from a previous response.
  pub cursor: Option<u64>,

  /// Max rows per page (default 50, max 200).
  pub limit: Option<u32>,
}

impl ModerationListAllDebugLogsQueryParams {
  /// Parse the comma-separated `severities` parameter.
  /// Returns `None` when the parameter is absent or empty.
  pub fn parsed_severities(&self) -> Result<Option<Vec<DebugLogLevel>>, EnumError> {
    let raw = match self.severities.as_deref() {
      Some(value) if !value.trim().is_empty() => value,
      _ => return Ok(None),
    };

    let levels = raw
      .split(',')
      .map(str::trim)
      .filter(|part| !part.is_empty())
      .map(DebugLogLevel::from_str)
      .collect::<Result<Vec<DebugLogLevel>, EnumError>>()?;

    Ok(if levels.is_empty() { None } else { Some(levels) })
  }
}

// ── Response ──

#[derive(Serialize, ToSchema)]
pub struct ModerationListAllDebugLogsSuccessResponse {
  pub success: bool,
  /// Most recent first.
  pub debug_logs: Vec<ModerationListAllDebugLogsEntry>,
  /// Cursor for the next page. `None` if there are no more results.
  pub next_cursor: Option<u64>,
}

/// A debug log row with the creator user joined in (when one exists).
#[derive(Serialize, ToSchema)]
pub struct ModerationListAllDebugLogsEntry {
  pub id: u64,
  pub event_token: DebugLogEventToken,
  pub debug_log_type: DebugLogType,
  pub maybe_log_level: Option<DebugLogLevel>,
  pub maybe_creator_user_token: Option<UserToken>,
  pub message: String,
  pub created_at: DateTime<Utc>,
  pub maybe_user: Option<ModerationDebugLogUser>,
}
