use std::marker::PhantomData;

use sqlx::{Executor, MySql};
use tokens::tokens::users::UserToken;

pub struct GetUserTokenByUsernameArgs<'e, 'c, E>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  pub username: &'e str,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

pub async fn get_user_token_by_username_with_executor<'e, 'c: 'e, E>(
  args: GetUserTokenByUsernameArgs<'e, 'c, E>,
) -> Result<Option<UserToken>, sqlx::Error>
where
  E: 'e + Executor<'c, Database = MySql>,
{
  let username = args.username.to_lowercase();

  let result = sqlx::query_as!(
    UsernameRecord,
    r#"
SELECT
  token as `token: tokens::tokens::users::UserToken`
FROM users
  WHERE username = ?
LIMIT 1
    "#,
    username
  )
    .fetch_one(args.mysql_executor)
    .await;

  match result {
    Ok(record) => Ok(Some(record.token)),
    Err(sqlx::Error::RowNotFound) => Ok(None),
    Err(err) => Err(err),
  }
}

struct UsernameRecord {
  token: UserToken,
}
