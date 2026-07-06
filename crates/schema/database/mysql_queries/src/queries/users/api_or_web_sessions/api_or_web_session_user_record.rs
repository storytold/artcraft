use tokens::tokens::api_keys::ApiKeyToken;
use tokens::tokens::users::UserToken;

/// A user authenticated by either an API key or a web session cookie.
///
/// The two lookup queries (`get_api_or_web_session_user_by_api_key` and
/// `get_api_or_web_session_user_by_session_token`) select congruent user fields so both can
/// produce this one uniform record.
pub struct ApiOrWebSessionUserRecord {
  pub user_token: UserToken,
  pub username: String,
  pub display_name: String,
  pub email_address: String,

  pub user_role_slug: String,
  pub is_banned: bool,
  pub can_ban_users: bool,

  /// Only set when the lookup was by API key.
  pub maybe_api_key_token: Option<ApiKeyToken>,
}
