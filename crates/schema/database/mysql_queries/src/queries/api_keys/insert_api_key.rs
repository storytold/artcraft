use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use artcraft_api_keys::ArtcraftApiKey;
use tokens::tokens::api_keys::ApiKeyToken;
use tokens::tokens::users::UserToken;

pub struct InsertApiKeyArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub owner_user_token: &'e UserToken,
  pub ip_address: &'e str,
  pub name: &'e str,
  pub maybe_description: Option<&'e str>,
  pub api_key: &'e ArtcraftApiKey,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

/// Insert a new API key. The `ApiKeyToken` is minted here (in the data-access
/// layer, not the handler) and returned to the caller. The provided IP address
/// is stamped on both the creation and update IP columns, and `created_at` is
/// set to `NOW()`.
pub async fn insert_api_key<'e, 'c: 'e, E>(
  args: InsertApiKeyArgs<'e, 'c, E>,
) -> Result<ApiKeyToken, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let token = ApiKeyToken::generate();

  sqlx::query!(
    r#"
INSERT INTO api_keys
SET
  token = ?,
  api_key = ?,
  name = ?,
  maybe_description = ?,
  owner_user_token = ?,
  ip_address_creation = ?,
  ip_address_update = ?,
  created_at = NOW()
    "#,
    token.as_str(),
    args.api_key.as_str_be_careful(), // NB: This is okay in this case.
    args.name,
    args.maybe_description,
    args.owner_user_token.as_str(),
    args.ip_address,
    args.ip_address,
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(token)
}
