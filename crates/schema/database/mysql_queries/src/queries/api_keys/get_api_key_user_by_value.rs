use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use artcraft_api_keys::ArtcraftApiKey;
use tokens::tokens::api_keys::ApiKeyToken;
use tokens::tokens::users::UserToken;

use crate::helpers::boolean_converters::i8_to_bool;

pub struct GetApiKeyUserByValueArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  /// The actual API key secret presented by the client.
  pub api_key: &'e ArtcraftApiKey,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// A live API key joined to its owning user. This is the minimal identity needed to authenticate
/// an API-key request — far smaller than a cookie `SessionUserRecord`.
pub struct ApiKeyUserRecord {
  pub api_key_token: ApiKeyToken,
  pub user_token: UserToken,
  pub is_banned: bool,
}

/// Look up the user behind an API key secret, for authenticating an incoming request.
///
/// Returns `Ok(None)` when no row matches, when the matching API key is soft-deleted
/// (`maybe_deleted_at IS NOT NULL`), or when the owning user row does not exist (the `INNER JOIN`
/// requires both records to be present). The full secret is never echoed back.
pub async fn get_api_key_user_by_value<'e, 'c: 'e, E>(
  args: GetApiKeyUserByValueArgs<'e, 'c, E>,
) -> Result<Option<ApiKeyUserRecord>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let result = sqlx::query!(
    r#"
SELECT
  api_keys.token as `api_key_token: ApiKeyToken`,
  users.token as `user_token: UserToken`,
  users.is_banned
FROM api_keys
INNER JOIN users
  ON users.token = api_keys.owner_user_token
WHERE api_keys.api_key = ?
  AND api_keys.maybe_deleted_at IS NULL
LIMIT 1
    "#,
    args.api_key.as_str_be_careful(),
  )
    .fetch_optional(args.mysql_executor)
    .await?;

  Ok(result.map(|r| ApiKeyUserRecord {
    api_key_token: r.api_key_token,
    user_token: r.user_token,
    is_banned: i8_to_bool(r.is_banned),
  }))
}
