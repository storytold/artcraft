use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

use tokens::tokens::users::UserToken;

use crate::moderation::debug_logs::debug_log_entry::ModerationDebugLogEntry;

pub const MODERATION_LIST_DEBUG_LOGS_FOR_USER_PATH: &str = "/v1/moderation/debug_logs/user_list/{user_token}";

// ── Path params ──

#[derive(Deserialize, ToSchema)]
pub struct ModerationListDebugLogsForUserPathInfo {
  pub user_token: UserToken,
}

// ── Query params ──

#[derive(Deserialize, IntoParams, ToSchema)]
pub struct ModerationListDebugLogsForUserQueryParams {
  /// Cursor for pagination. Pass the `next_cursor` from a previous response.
  pub cursor: Option<u64>,

  /// Max rows per page (default 50, max 200).
  pub limit: Option<u32>,
}

// ── Response ──

#[derive(Serialize, ToSchema)]
pub struct ModerationListDebugLogsForUserSuccessResponse {
  pub success: bool,
  /// Most recent first.
  pub debug_logs: Vec<ModerationDebugLogEntry>,
  /// Cursor for the next page. `None` if there are no more results.
  pub next_cursor: Option<u64>,
}
