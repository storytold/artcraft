use std::collections::HashSet;

use anyhow::anyhow;
use log::error;
use sqlx::{MySql, QueryBuilder};
use sqlx::pool::PoolConnection;

use enums_db::by_table::user_ratings::entity_type::UserRatingEntityType;
use enums_db::by_table::user_ratings::rating_value::UserRatingValue;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;

pub struct BatchUserRating {
  pub entity_token: String,
  pub entity_type: UserRatingEntityType,
  pub rating_value: UserRatingValue,
}

pub async fn batch_get_user_ratings(
  user_token: &UserToken,
  tokens: &HashSet<String>,
  mysql_connection: &mut PoolConnection<MySql>,
) -> AnyhowResult<Vec<BatchUserRating>>
{
  if tokens.len() == 0 {
    return Ok(Vec::new());
  }

  let mut query_builder: QueryBuilder<MySql> = QueryBuilder::new(
    r#"
SELECT
    entity_type,
    entity_token,
    rating_value

FROM user_ratings

WHERE user_token =
  "#);

  query_builder.push_bind(user_token.as_str());

  query_builder.push(" AND entity_token IN ( ");

  // NB: Syntax will be wrong if list has zero length
  let mut separated = query_builder.separated(", ");

  for token in tokens.iter() {
    separated.push_bind(token);
  }

  separated.push_unseparated(") ");

  let query = query_builder.build_query_as::<RawRating>();

  let maybe_results = query.fetch_all(&mut **mysql_connection).await;

  match maybe_results {
    Ok(records) => Ok(records
        .into_iter()
        .map(|record| BatchUserRating {
          // NB: Fail open; W2lTemplates are dead, so this is a good sentinel value
          entity_type: UserRatingEntityType::from_str(&record.entity_type)
              .unwrap_or(UserRatingEntityType::W2lTemplate),
          entity_token: record.entity_token,
          // NB: Fail open; "neutral" is a good default on failure.
          rating_value: UserRatingValue::from_str(&record.rating_value)
              .unwrap_or(UserRatingValue::Neutral),
        }).collect::<Vec<_>>()),
    Err(err) => match err {
      sqlx::Error::RowNotFound => Ok(Vec::new()),
      _ => {
        error!("error querying : {:?}", err);
        Err(anyhow!("error querying : {:?}", err))
      }
    }
  }
}

#[derive(sqlx::FromRow)]
struct RawRating {
  entity_token: String,
  entity_type: String,
  rating_value: String,
}
