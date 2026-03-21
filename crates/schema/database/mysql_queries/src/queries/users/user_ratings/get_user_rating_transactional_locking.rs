use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::error;
use sqlx::{Executor, MySql};

use enums_db::by_table::user_ratings::rating_value::UserRatingValue;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;

use crate::composite_keys::by_table::user_ratings::user_rating_entity::UserRatingEntity;

pub struct UserRating {
  pub rating_value: UserRatingValue,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

/// Look up the user rating
pub async fn get_user_rating_transactional_locking<'e, 'c, E>(
  user_token : &'e UserToken,
  user_rating_entity: &'e UserRatingEntity,
  mysql_executor: E,
) -> AnyhowResult<Option<UserRating>>
  where E: 'e + Executor<'c, Database = MySql>
{
  let entity_type = user_rating_entity.get_entity_type();
  let entity_token = user_rating_entity.get_entity_token_str();

  // NB: LEFT OUTER JOIN does not require entity_stats to be present, but will lock it under
  // SELECT...FOR UPDATE if the row exists.
  let maybe_result = sqlx::query_as!(
      InternalUserRatingRecord,
        r#"
SELECT
    r.rating_value as `rating_value: enums_db::by_table::user_ratings::rating_value::UserRatingValue`,
    r.created_at,
    r.updated_at,

    es.ratings_positive_count as unused_ratings_positive_count

FROM user_ratings AS r

LEFT OUTER JOIN entity_stats AS es
    ON r.entity_type = es.entity_type
    AND r.entity_token = es.entity_token

WHERE r.user_token = ?
  AND r.entity_type = ?
  AND r.entity_token = ?

LIMIT 1

FOR UPDATE
        "#,
      user_token.as_str(),
      entity_type,
      entity_token,
    )
      .fetch_one(mysql_executor)
      .await;

  match maybe_result {
    Ok(record) => Ok(Some(UserRating {
      rating_value: record.rating_value,
      created_at: record.created_at,
      updated_at: record.updated_at,
    })),
    Err(err) => match err {
      sqlx::Error::RowNotFound => Ok(None),
      _ => {
        error!("error querying job record: {:?}", err);
        Err(anyhow!("error querying job record: {:?}", err))
      }
    }
  }
}

struct InternalUserRatingRecord {
  rating_value: UserRatingValue,
  created_at: DateTime<Utc>,
  updated_at: DateTime<Utc>,

  // NB: Not used, just for dual transactional locking.
  pub unused_ratings_positive_count: Option<u32>,
}
