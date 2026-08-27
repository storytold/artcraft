use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::mcp_session_private::McpSessionPrivateToken;
use tokens::tokens::mcp_sessions::McpSessionToken;
use tokens::tokens::users::UserToken;

use crate::helpers::boolean_converters::{i8_to_bool, nullable_i8_to_bool_default_false};
use crate::queries::users::api_or_web_sessions::api_or_web_session_user_record::ApiOrWebSessionUserRecord;

pub struct GetApiOrWebSessionUserByMcpPrivateSessionTokenArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  /// The secret MCP session credential presented by the client.
  pub private_session_token: &'e McpSessionPrivateToken,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Look up the user behind an MCP session's private credential, selecting the same user fields
/// as the API-key and web-session lookups so all three auth paths share one record shape.
///
/// Returns `Ok(None)` when no row matches, when the session is terminated or expired, or when
/// the owning user is missing or deleted. The private credential is never echoed back — the
/// record carries only the session's non-private management `token`.
pub async fn get_api_or_web_session_user_by_mcp_private_session_token<'e, 'c: 'e, E>(
  args: GetApiOrWebSessionUserByMcpPrivateSessionTokenArgs<'e, 'c, E>,
) -> Result<Option<ApiOrWebSessionUserRecord>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
SELECT
  users.token as `user_token: UserToken`,
  users.username,
  users.display_name,
  users.email_address,
  users.user_role_slug,
  users.is_banned,
  user_roles.can_ban_users,
  users.maybe_feature_flags,
  mcp_sessions.token as `mcp_session_token: McpSessionToken`
FROM mcp_sessions
INNER JOIN users
  ON users.token = mcp_sessions.user_token
LEFT OUTER JOIN user_roles
  ON users.user_role_slug = user_roles.slug
WHERE mcp_sessions.private_session_token = ?
  AND mcp_sessions.maybe_deleted_at IS NULL
  AND mcp_sessions.expires_at > NOW()
  AND users.user_deleted_at IS NULL
  AND users.mod_deleted_at IS NULL
LIMIT 1
    "#,
    args.private_session_token.as_str(),
  )
    .fetch_optional(args.mysql_executor)
    .await?;

  Ok(result.map(|r| ApiOrWebSessionUserRecord {
    user_token: r.user_token,
    username: r.username,
    display_name: r.display_name,
    email_address: r.email_address,
    user_role_slug: r.user_role_slug,
    is_banned: i8_to_bool(r.is_banned),
    can_ban_users: nullable_i8_to_bool_default_false(r.can_ban_users),
    maybe_feature_flags: r.maybe_feature_flags,
    maybe_api_key_token: None,
    maybe_mcp_session_token: Some(r.mcp_session_token),
  }))
}
