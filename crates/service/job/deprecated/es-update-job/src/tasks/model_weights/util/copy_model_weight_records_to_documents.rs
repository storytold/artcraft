use std::time::Duration;

use chrono::{DateTime, Utc};
use elasticsearch::Elasticsearch;
use sqlx::MySqlConnection;

use errors::AnyhowResult;
use mysql_queries::queries::model_weights::batch_get::batch_get_model_weights_for_elastic_search_backfill::batch_get_model_weights_for_elastic_search_backfill;
use tokens::tokens::model_weights::ModelWeightToken;

use crate::job_state::SleepConfigs;
use crate::tasks::model_weights::util::create_model_weight_document_from_record::create_model_weight_document_from_record;

pub struct Cursor {
  pub token: ModelWeightToken,
  pub updated_at: DateTime<Utc>,

}
pub async fn copy_model_weight_records_to_documents(
  mut tokens: Vec<ModelWeightToken>,
  mysql_connection: &mut MySqlConnection,
  elasticsearch: &Elasticsearch,
  sleep_config: &SleepConfigs,
) -> AnyhowResult<Option<Cursor>> {
  let mut last_updated_record = None;

  while !tokens.is_empty() {
    // NB: This list might be very large if we query from (1) the epoch, or (2) there was a large series of updates
    let last = 50.min(tokens.len());
    let drained_tokens = tokens.drain(0..last)
        .into_iter()
        .collect::<Vec<_>>();

    let records =
        batch_get_model_weights_for_elastic_search_backfill(
          &mut *mysql_connection,
          &drained_tokens
        ).await?;

    for record in records {
      let new_cursor = Cursor {
        token: record.token.clone(),
        updated_at: record.updated_at.clone(),
      };

      create_model_weight_document_from_record(elasticsearch, record).await?;

      let last_timestamp = last_updated_record.as_ref()
          .map(|cursor: &Cursor| cursor.updated_at)
          .unwrap_or_else(|| DateTime::UNIX_EPOCH);

      if new_cursor.updated_at > last_timestamp {
        last_updated_record = Some(new_cursor);
      }

      tokio::time::sleep(Duration::from_millis(sleep_config.between_es_writes_wait_millis)).await;
    }

    tokio::time::sleep(Duration::from_millis(sleep_config.between_job_batch_wait_millis)).await;
  }

  Ok(last_updated_record)
}
