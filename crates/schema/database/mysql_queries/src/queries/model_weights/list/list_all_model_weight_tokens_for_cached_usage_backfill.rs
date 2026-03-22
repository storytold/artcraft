use chrono::{DateTime, Utc};
use sqlx::{Executor, MySql};

use errors::AnyhowResult;
use tokens::tokens::model_weights::ModelWeightToken;

pub struct ModelWeightInfo {
  pub token: ModelWeightToken,
  pub cached_usage_count: u64,
}

/// Get records updated since a particular date.
/// NB: This doesn't batch yet at our scale, but in the future we'll likely need/want to batch,
/// and then we'll need another way to cursor in the event that batch_size < # records updated
/// within a given time quantum.
pub async fn list_all_model_weight_tokens_for_cached_usage_backfill<'e, 'c, E>(
  mysql_executor: E,
) -> AnyhowResult<Vec<ModelWeightInfo>>
    where E: 'e + Executor<'c, Database=MySql>
{
  let query = sqlx::query_as!(
    RawRecord,
    r#"
      SELECT
        token as `token: tokens::tokens::model_weights::ModelWeightToken`,
        cached_usage_count
      FROM model_weights
    "#,
  );

  let results = query.fetch_all(mysql_executor).await?;

  let results = results.into_iter()
      .map(|record| ModelWeightInfo {
        token: record.token,
        cached_usage_count: record.cached_usage_count,
      })
      .collect();

  Ok(results)
}

struct RawRecord {
  token: ModelWeightToken,
  cached_usage_count: u64,
}
