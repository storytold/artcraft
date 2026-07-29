use sqlx::{Executor, MySql};

use errors::AnyhowResult;
use tokens::tokens::media_files::MediaFileToken;

pub async fn delete_media_file_as_user<'e, 'c: 'e, E>(
    media_file_token: &MediaFileToken,
    mysql_executor: E,
) -> AnyhowResult<()>
where
    E: 'e + Executor<'c, Database = MySql>,
{
    let _r = sqlx::query!(
        r#"
UPDATE media_files
SET
  user_deleted_at = CURRENT_TIMESTAMP
WHERE
  token = ?
LIMIT 1
        "#,
      media_file_token,
    )
        .execute(mysql_executor)
        .await?;
    Ok(())
}

pub async fn delete_media_file_as_mod<'e, 'c: 'e, E>(
    media_file_token: &MediaFileToken,
    mod_user_token: &str,
    mysql_executor: E,
) -> AnyhowResult<()>
where
    E: 'e + Executor<'c, Database = MySql>,
{
    let _r = sqlx::query!(
        r#"
UPDATE media_files
SET
  mod_deleted_at = CURRENT_TIMESTAMP,

  maybe_mod_user_token = ?
WHERE
  token = ?
LIMIT 1
        "#,
      mod_user_token,
      media_file_token,
    )
        .execute(mysql_executor)
        .await?;
    Ok(())
}

pub async fn undelete_media_file_as_user<'e, 'c: 'e, E>(
    media_file_token: &MediaFileToken,
    mysql_executor: E,
) -> AnyhowResult<()>
where
    E: 'e + Executor<'c, Database = MySql>,
{
    let _r = sqlx::query!(
        r#"
UPDATE media_files
SET
  user_deleted_at = NULL
WHERE
  token = ?
LIMIT 1
        "#,
      media_file_token,
    )
        .execute(mysql_executor)
        .await?;
    Ok(())
}

pub async fn undelete_media_file_as_mod<'e, 'c: 'e, E>(
    media_file_token: &MediaFileToken,
    mod_user_token: &str,
    mysql_executor: E,
) -> AnyhowResult<()>
where
    E: 'e + Executor<'c, Database = MySql>,
{
    let _r = sqlx::query!(
        r#"
UPDATE media_files
SET
  mod_deleted_at = NULL,
  maybe_mod_user_token = ?
WHERE
  token = ?
LIMIT 1
        "#,
      mod_user_token,
      media_file_token,
    )
        .execute(mysql_executor)
        .await?;
    Ok(())
}
