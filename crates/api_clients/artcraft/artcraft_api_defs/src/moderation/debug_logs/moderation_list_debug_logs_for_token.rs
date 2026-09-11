use serde_derive::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};

use tokens::tokens::non_unique::debug_logs_event_token::DebugLogEventToken;

use crate::moderation::debug_logs::debug_log_entry::ModerationDebugLogEntry;

pub const MODERATION_LIST_DEBUG_LOGS_FOR_TOKEN_PATH: &str = "/v1/moderation/debug_logs/list/{token}";

// ── Path params ──

#[derive(Deserialize, ToSchema)]
pub struct ModerationListDebugLogsForTokenPathInfo {
  pub token: DebugLogEventToken,
}

// ── Query params ──

#[derive(Deserialize, IntoParams, ToSchema)]
pub struct ModerationListDebugLogsForTokenQueryParams {
  pub limit: Option<u32>,
}

// ── Response ──

#[derive(Serialize, ToSchema)]
pub struct ModerationListDebugLogsForTokenSuccessResponse {
  pub success: bool,
  pub debug_logs: Vec<ModerationDebugLogEntry>,
}
