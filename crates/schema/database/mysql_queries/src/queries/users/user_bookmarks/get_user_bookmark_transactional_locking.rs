use anyhow::anyhow;
use chrono::{DateTime, Utc};
use sqlx::{Error, Executor, MySql};

use enums_db::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType;
use errors::AnyhowResult;
use tokens::tokens::user_bookmarks::UserBookmarkToken;
use tokens::tokens::users::UserToken;

use crate::queries::users::user_bookmarks::user_bookmark_entity_token::UserBookmarkEntityToken;

pub struct UserBookmark {
  pub token: UserBookmarkToken,

  pub entity_type: UserBookmarkEntityType,
  pub entity_token: String,

  pub user_token: UserToken,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub maybe_deleted_at: Option<DateTime<Utc>>,
}

pub enum BookmarkIdentifier<'a> {
  BookmarkToken(&'a UserBookmarkToken),
  EntityTypeAndToken(&'a UserBookmarkEntityToken),
}

/// Use SELECT FOR UPDATE to lock the rows for the duration of the transaction.
/// We're locking two tables at once: https://stackoverflow.com/a/38545378
pub async fn get_user_bookmark_transactional_locking<'e, 'c, E>(
    bookmark_identifier: BookmarkIdentifier<'e>,
    mysql_executor: E
) -> AnyhowResult<Option<UserBookmark>>
  where E: 'e + Executor<'c, Database = MySql>
{
  let maybe_results = match bookmark_identifier {
    BookmarkIdentifier::EntityTypeAndToken(bookmark_entity_token) => {
      query_by_entity(mysql_executor, bookmark_entity_token).await
    }
    BookmarkIdentifier::BookmarkToken(bookmark_token) => {
      query_by_bookmark_token(mysql_executor, bookmark_token).await
    }
  };

  match maybe_results {
    Ok(user_bookmark) => Ok(Some(UserBookmark {
      token: user_bookmark.token,
      entity_type: user_bookmark.entity_type,
      entity_token: user_bookmark.entity_token,
      user_token: user_bookmark.user_token,
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

async fn query_by_entity<'e, 'c, E>(mysql_executor: E, bookmark_entity_token: &UserBookmarkEntityToken)
  -> Result<RawUserBookmark, Error> where E: 'e + Executor<'c, Database=MySql>
{
  let (entity_type, entity_token) = bookmark_entity_token.get_composite_keys();

  // NB: LEFT OUTER JOIN does not require entity_stats to be present, but will lock it under
  // SELECT...FOR UPDATE if the row exists.
  sqlx::query_as!(
        RawUserBookmark,
          r#"
  SELECT
      b.token as `token: tokens::tokens::user_bookmarks::UserBookmarkToken`,

      b.entity_type as `entity_type: enums_db::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType`,
      b.entity_token,

      b.user_token as `user_token: tokens::tokens::users::UserToken`,

      es.bookmark_count as unused_bookmark_count,

      b.created_at,
      b.updated_at,
      b.deleted_at

  FROM
      user_bookmarks AS b

  LEFT OUTER JOIN entity_stats AS es
      ON b.entity_type = es.entity_type
      AND b.entity_token = es.entity_token
  WHERE
      b.entity_type = ?
      AND b.entity_token = ?
  FOR UPDATE
          "#,
        entity_type.to_str(),
        entity_token
      )
      .fetch_one(mysql_executor)
      .await
}

async fn query_by_bookmark_token<'e, 'c, E>(mysql_executor: E, bookmark_token: &UserBookmarkToken)
  -> Result<RawUserBookmark, Error> where E: 'e + Executor<'c, Database=MySql>
{
  // NB(1): LEFT OUTER JOIN does not require entity_stats to be present, but will lock it under
  // SELECT...FOR UPDATE if the row exists.
  // NB(2): We're joining the record against itself to lock on (entity_type,entity_token)
  sqlx::query_as!(
        RawUserBookmark,
          r#"
  SELECT
      b2.token as `token: tokens::tokens::user_bookmarks::UserBookmarkToken`,

      b2.entity_type as `entity_type: enums_db::by_table::user_bookmarks::user_bookmark_entity_type::UserBookmarkEntityType`,
      b2.entity_token,

      b2.user_token as `user_token: tokens::tokens::users::UserToken`,

      es.bookmark_count as unused_bookmark_count,

      b2.created_at,
      b2.updated_at,
      b2.deleted_at

  FROM
      user_bookmarks AS b1

  JOIN user_bookmarks as b2
      ON b1.entity_type = b2.entity_type
      AND b1.entity_token = b2.entity_token

  LEFT OUTER JOIN entity_stats AS es
      ON b1.entity_type = es.entity_type
      AND b1.entity_token = es.entity_token

  WHERE
      b1.token = ?

  FOR UPDATE
          "#,
        bookmark_token
      )
      .fetch_one(mysql_executor)
      .await
}

pub struct RawUserBookmark {
  pub token: UserBookmarkToken,

  pub entity_type: UserBookmarkEntityType,
  pub entity_token: String,

  pub user_token: UserToken,

  // NB: Not used, just for dual transactional locking.
  pub unused_bookmark_count: Option<u32>,

  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
  pub deleted_at: Option<DateTime<Utc>>,
}
