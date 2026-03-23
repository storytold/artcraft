use anyhow::anyhow;
use chrono::{DateTime, Utc};
use log::error;
use sqlx::MySql;
use sqlx::pool::PoolConnection;

use enums_db::by_table::user_ratings::rating_value::UserRatingValue;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;

use crate::composite_keys::by_table::user_ratings::user_rating_entity::UserRatingEntity;

pub struct UserRating {
  pub rating_value: UserRatingValue,
  pub created_at: DateTime<Utc>,
  pub updated_at: DateTime<Utc>,
}

pub struct Args<'a> {
  pub user_token : &'a UserToken,
  pub user_rating_entity: &'a UserRatingEntity,
  pub mysql_connection: &'a mut PoolConnection<MySql>,
}

/// Look up the user rating
pub async fn get_user_rating(args: Args<'_>) -> AnyhowResult<Option<UserRating>>
{
  let entity_type = args.user_rating_entity.get_entity_type();
  let entity_token = args.user_rating_entity.get_entity_token_str();

  let maybe_result = sqlx::query_as!(
      InternalUserRatingRecord,
        r#"
SELECT
    rating_value as `rating_value: enums_db::by_table::user_ratings::rating_value::UserRatingValue`,
    created_at,
    updated_at

FROM user_ratings

WHERE user_token = ?
AND entity_type = ?
AND entity_token = ?
LIMIT 1
        "#,
      args.user_token.as_str(),
      entity_type,
      entity_token,
    )
      .fetch_one(&mut **args.mysql_connection)
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
}
