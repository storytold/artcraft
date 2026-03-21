use anyhow::anyhow;
use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use enums_db::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType;
use errors::AnyhowResult;
use tokens::tokens::user_bookmarks::UserBookmarkToken;
use tokens::tokens::users::UserToken;

pub struct UserBookmark {
  pub token: UserBookmarkToken,

  pub entity_type: UserBookmarkEntityType,
  pub entity_token: String,

  pub user_token: UserToken,
  pub username: String,
  pub user_display_name: String,
  pub user_gravatar_hash: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub maybe_deleted_at: Option<DateTime<Utc>>,
}

pub async fn get_user_bookmark<'e, 'c, E>(
    user_bookmark_token: &'e UserBookmarkToken,
    mysql_executor: E
)
    -> AnyhowResult<Option<UserBookmark>>
  where E: 'e + Executor<'c, Database = MySql>
{

  let maybe_results = sqlx::query_as!(
      RawUserBookmark,
        r#"
SELECT
    f.token as `token: tokens::tokens::user_bookmarks::UserBookmarkToken`,

    f.entity_type as `entity_type: enums_db::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType`,
    f.entity_token,

    f.user_token as `user_token: tokens::tokens::users::UserToken`,
    u.username,
    u.display_name as user_display_name,
    u.email_gravatar_hash as user_gravatar_hash,

    f.created_at,
    f.updated_at,
    f.deleted_at

FROM
    user_bookmarks AS f
JOIN users AS u
    ON f.user_token = u.token
WHERE
    f.token = ?
        "#,
      user_bookmark_token
    )
      .fetch_one(mysql_executor)
      .await;

  match maybe_results {
    Ok(user_bookmark) => Ok(Some(UserBookmark {
      token: user_bookmark.token,
      entity_type: user_bookmark.entity_type,
      entity_token: user_bookmark.entity_token,
      user_token: user_bookmark.user_token,
      username: user_bookmark.username,
      user_display_name: user_bookmark.user_display_name,
      user_gravatar_hash: user_bookmark.user_gravatar_hash,
      created_at: user_bookmark.created_at,
      updated_at: user_bookmark.updated_at,
      maybe_deleted_at: user_bookmark.deleted_at,
    })),
    Err(err) => match err {
      sqlx::Error::RowNotFound => Ok(None),
      _ => Err(anyhow!("Error querying for IP ban: {:?}", err)),
    }
  }
}

pub struct RawUserBookmark {
  pub token: UserBookmarkToken,

  pub entity_type: UserBookmarkEntityType,
  pub entity_token: String,

  pub user_token: UserToken,
  pub username: String,
  pub user_display_name: String,
  pub user_gravatar_hash: String,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub deleted_at: Option<DateTime<Utc>>,
}
