use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use artcraft_api_keys::ArtcraftApiKey;
use tokens::tokens::api_keys::ApiKeyToken;
use tokens::tokens::users::UserToken;

use crate::helpers::boolean_converters::{i8_to_bool, nullable_i8_to_bool_default_false};
use crate::queries::users::api_or_web_sessions::api_or_web_session_user_record::ApiOrWebSessionUserRecord;

pub struct GetApiOrWebSessionUserByApiKeyArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  /// The actual API key secret presented by the client.
  pub api_key: &'e ArtcraftApiKey,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Look up the user behind an API key secret, selecting the same user fields as
/// `get_api_or_web_session_user_by_session_token` so both auth paths share one record shape.
///
/// Returns `Ok(None)` when no row matches, when the matching API key is soft-deleted, or when the
/// owning user is missing or deleted. The full secret is never echoed back.
pub async fn get_api_or_web_session_user_by_api_key<'e, 'c: 'e, E>(
  args: GetApiOrWebSessionUserByApiKeyArgs<'e, 'c, E>,
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
  api_keys.token as `api_key_token: ApiKeyToken`
FROM api_keys
INNER JOIN users
  ON users.token = api_keys.owner_user_token
LEFT OUTER JOIN user_roles
  ON users.user_role_slug = user_roles.slug
WHERE api_keys.api_key = ?
  AND api_keys.maybe_deleted_at IS NULL
  AND users.user_deleted_at IS NULL
  AND users.mod_deleted_at IS NULL
LIMIT 1
    "#,
    args.api_key.as_str_be_careful(),
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
    maybe_api_key_token: Some(r.api_key_token),
  }))
}
