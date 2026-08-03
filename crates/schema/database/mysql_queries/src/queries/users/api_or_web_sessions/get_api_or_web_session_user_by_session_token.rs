use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::users::UserToken;

use crate::helpers::boolean_converters::{i8_to_bool, nullable_i8_to_bool_default_false};
use crate::queries::users::api_or_web_sessions::api_or_web_session_user_record::ApiOrWebSessionUserRecord;

pub struct GetApiOrWebSessionUserBySessionTokenArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  /// The session token decoded from the session cookie.
  pub session_token: &'e str,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Look up the user behind a web session token, selecting the same user fields as
/// `get_api_or_web_session_user_by_api_key` so both auth paths share one record shape.
///
/// Returns `Ok(None)` when no row matches, when the session is deleted, or when the owning user
/// is missing or deleted.
pub async fn get_api_or_web_session_user_by_session_token<'e, 'c: 'e, E>(
  args: GetApiOrWebSessionUserBySessionTokenArgs<'e, 'c, E>,
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
  users.maybe_feature_flags
FROM user_sessions
INNER JOIN users
  ON users.token = user_sessions.user_token
LEFT OUTER JOIN user_roles
  ON users.user_role_slug = user_roles.slug
WHERE user_sessions.token = ?
  AND user_sessions.deleted_at IS NULL
  AND users.user_deleted_at IS NULL
  AND users.mod_deleted_at IS NULL
LIMIT 1
    "#,
    args.session_token,
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
  }))
}
