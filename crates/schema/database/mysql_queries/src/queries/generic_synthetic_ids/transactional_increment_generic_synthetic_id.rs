use anyhow::anyhow;
use log::warn;
use sqlx::{MySql, Transaction};

use enums_db::by_table::generic_synthetic_ids::id_category::IdCategory;
use errors::AnyhowResult;
use tokens::tokens::users::UserToken;

pub async fn transactional_increment_generic_synthetic_id(
  user_token: &UserToken,
  id_category: IdCategory,
  transaction: &mut Transaction<'_, MySql>,
) -> AnyhowResult<u64> {
  let id_category_str = id_category.to_str();

  {
    let query_result = sqlx::query!(
        r#"
INSERT INTO generic_synthetic_ids
SET
  user_token = ?,
  id_category = ?,
  next_id = 1
ON DUPLICATE KEY UPDATE
  user_token = ?,
  id_category = ?,
  next_id = next_id + 1
        "#,
      user_token,
      id_category_str,
      user_token,
      id_category_str
    )
        .execute(&mut **transaction) // TODO/FIXME WTF THIS IS SO GROSS
        .await;

    match query_result {
      Ok(_) => {},
      Err(err) => {
        //transaction.rollback().await?;
        warn!("Transaction failure: {:?}", err);
      }
    }
  }

  let query_result = sqlx::query_as!(
    SyntheticIdRecord,
        r#"
SELECT
  next_id
FROM
  generic_synthetic_ids
WHERE
  user_token = ?
AND
  id_category = ?
LIMIT 1
        "#,
      user_token,
      id_category_str,
    )
      .fetch_one(&mut **transaction)
      .await;

  let record : SyntheticIdRecord = match query_result {
    Ok(record) => record,
    Err(err) => {
      warn!("Transaction failure: {:?}", err);
      //transaction.rollback().await?;
      return Err(anyhow!("Generic synthetic id transaction failure: {:?}", err));
    }
  };

  let next_id = record.next_id as u64;
  Ok(next_id)
}

struct SyntheticIdRecord {
  pub next_id: i64,
}
