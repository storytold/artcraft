use std::sync::Arc;
use std::time::Duration;

use chrono::{DateTime, Utc};
use log::{error, info};

use errors::AnyhowResult;
use mysql_queries::queries::model_weights::batch_get::batch_get_model_weights_for_elastic_search_backfill::batch_get_model_weights_for_elastic_search_backfill;
use mysql_queries::queries::model_weights::list::list_model_weight_tokens_updated_since::list_model_weight_tokens_updated_since;

use crate::job_state::JobState;
use crate::tasks::model_weights::util::create_model_weight_document_from_record::create_model_weight_document_from_record;

pub async fn update_all_model_weights(job_state: Arc<JobState>) {
  // TODO(bt,2024-02-05): Write this cursor to Redis so job can resume without reindexing everything.
  let mut cursor = DateTime::UNIX_EPOCH;

  loop {
    info!("Main loop; cursor @ {:?}", &cursor);

    let result = with_database_main_loop(&mut cursor, &job_state).await;

    if let Err(err) = result {
      error!("Error in main loop: {:?}", err);
      tokio::time::sleep(Duration::from_millis(job_state.sleep_config.between_error_wait_millis)).await;
    }

    // NB: Function should never return in success case, but we'll sleep just in case.
  }
}

pub async fn with_database_main_loop(updated_at_cursor: &mut DateTime<Utc>, job_state: &JobState) -> AnyhowResult<()> {
  info!("Acquiring MySQL connection...");

  let mut mysql_connection = job_state.mysql_pool.acquire().await?;

  let mut last_successful_update_at = *updated_at_cursor;

  loop {
    info!("Querying tokens updated since: {:?}", &updated_at_cursor);

    let mut maybe_tokens =
        list_model_weight_tokens_updated_since(&mut *mysql_connection, &updated_at_cursor).await?;

    if maybe_tokens.is_empty() {
      info!("No records updated since {:?}", &updated_at_cursor);
      tokio::time::sleep(Duration::from_millis(job_state.sleep_config.between_no_updates_wait_millis)).await;
      continue;
    }

    info!("Found {} updated records", maybe_tokens.len());

    let mut last_observed_updated_at = *updated_at_cursor;

    while !maybe_tokens.is_empty() {
      // NB: This list might be very large if we query from (1) the epoch, or (2) there was a large series of updates
      let last = 50.min(maybe_tokens.len());
      let drained_tokens = maybe_tokens.drain(0..last)
          .into_iter()
          .map(|record| record.token)
          .collect::<Vec<_>>();

      let records
          = batch_get_model_weights_for_elastic_search_backfill(&mut *mysql_connection, &drained_tokens).await?;

      for record in records {
        let updated_at = record.updated_at.clone();

        create_model_weight_document_from_record(&job_state.elasticsearch, record).await?;

        // NB: We don't want to advance the cursor to the current second just yet, because we might be processing
        // several records with the exact same "updated_at" timestamp. We do know that due to ordering, we can update
        // the timestamp cursor to the second before this timestamp, however.
        //
        // If we change the cursoring or batch sizes, we'll need to reconsider all of this logic.
        if let Some(cursor_at_least) = updated_at.checked_sub_signed(chrono::Duration::seconds(1)) {
          // NB: We don't want the cursor to slide backwards (it shouldn't, but the max will save us).
          last_successful_update_at = cursor_at_least.max(last_successful_update_at);
        }

        *updated_at_cursor = last_successful_update_at.max(*updated_at_cursor);

        last_observed_updated_at = updated_at;

        tokio::time::sleep(Duration::from_millis(job_state.sleep_config.between_es_writes_wait_millis)).await;
      }

      tokio::time::sleep(Duration::from_millis(job_state.sleep_config.between_job_batch_wait_millis)).await;
    }

    // NB: The last cursor math put us a second behind the current clock. Here we'll advance to the last record.
    // NB: This technically could miss records if we're updating within the same second batch we read from, but that
    // seems both unlikely and not worth solving at our present scale.
    *updated_at_cursor = last_observed_updated_at.max(*updated_at_cursor);

    info!("Up to date at cursor = {:?}", &updated_at_cursor);

    tokio::time::sleep(Duration::from_millis(job_state.sleep_config.between_query_wait_millis)).await;
  }
}
