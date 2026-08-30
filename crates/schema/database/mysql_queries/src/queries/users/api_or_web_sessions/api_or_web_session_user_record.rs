use tokens::tokens::api_keys::ApiKeyToken;
use tokens::tokens::mcp_sessions::McpSessionToken;
use tokens::tokens::users::UserToken;

/// A user authenticated by an API key, a web session cookie, or an MCP session credential.
///
/// The lookup queries (`get_api_or_web_session_user_by_api_key`,
/// `get_api_or_web_session_user_by_session_token`, and
/// `get_api_or_web_session_user_by_mcp_private_session_token`) select congruent user fields so
/// all of them can produce this one uniform record.
pub struct ApiOrWebSessionUserRecord {
  pub user_token: UserToken,
  pub username: String,
  pub display_name: String,
  pub email_address: String,

  pub user_role_slug: String,
  pub is_banned: bool,
  pub can_ban_users: bool,

  /// Optional comma-separated list of parseable `UserFeatureFlag` enum features.
  pub maybe_feature_flags: Option<String>,

  /// Only set when the lookup was by API key.
  pub maybe_api_key_token: Option<ApiKeyToken>,

  /// Only set when the lookup was by MCP session credential. This is the session's non-private
  /// management `token`, never the `private_session_token`.
  pub maybe_mcp_session_token: Option<McpSessionToken>,
}
