use std::marker::PhantomData;

use sqlx::{Executor, MySql};

use tokens::tokens::users::UserToken;

pub struct SetUserBanStatusArgs<'a, 'c: 'a, E>
  where E: 'a + Executor<'c, Database = MySql>
{
  pub subject_user_token: &'a UserToken,
  pub is_banned: bool,
  pub mod_user_token: &'a UserToken,
  pub maybe_mod_comments: Option<&'a str>,
  pub mysql_executor: E,
  pub phantom: PhantomData<&'c E>,
}

pub async fn set_user_ban_status<'a, 'c, E>(
  args: SetUserBanStatusArgs<'a, 'c, E>,
) -> Result<(), sqlx::Error>
  where E: 'a + Executor<'c, Database = MySql>
{
  sqlx::query!(
    r#"
UPDATE users
SET
    is_banned = ?,
    maybe_mod_comments = ?,
    maybe_mod_user_token  = ?,
    version = version + 1

WHERE users.token = ?
LIMIT 1
    "#,
    args.is_banned,
    args.maybe_mod_comments,
    args.mod_user_token,
    args.subject_user_token,
  )
    .execute(args.mysql_executor)
    .await?;

  Ok(())
}
