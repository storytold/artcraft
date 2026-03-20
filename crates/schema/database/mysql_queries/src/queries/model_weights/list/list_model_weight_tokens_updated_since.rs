use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use enums_db::by_table::model_weights::weights_types::WeightsType;
use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;

pub struct UpdatedModelWeight {
  pub token: ModelWeightToken,
  pub weights_type: WeightsType,
  pub updated_at: DateTime<Utc>,
}

/// Get records updated since a particular date.
/// NB: This doesn't batch yet at our scale, but in the future we'll likely need/want to batch,
/// and then we'll need another way to cursor in the event that batch_size < # records updated
/// within a given time quantum.
pub async fn list_model_weight_tokens_updated_since<'e, 'c, E>(
  mysql_executor: E,
  since_date: &DateTime<Utc>,
) -> AnyhowResult<Vec<UpdatedModelWeight>>
    where E: 'e + Executor<'c, Database=MySql>
{
  let query = sqlx::query_as!(
    UpdatedModelWeightRaw,
    r#"
      SELECT
        token as `token: tokens::tokens::model_weights::ModelWeightToken`,
        weights_type as `weights_type: enums_db::by_table::model_weights::weights_types::WeightsType`,
        updated_at
      FROM model_weights
      WHERE
      updated_at > ?
    "#,
    since_date
  );

  let results = query.fetch_all(mysql_executor).await?;

  let results = results.into_iter()
      .map(|record| UpdatedModelWeight {
        token: record.token,
        weights_type: record.weights_type,
        updated_at: record.updated_at,
      })
      .collect();

  Ok(results)
}

pub struct UpdatedModelWeightRaw {
  pub token: ModelWeightToken,
  pub weights_type: WeightsType,
  pub updated_at: DateTime<Utc>,
}
