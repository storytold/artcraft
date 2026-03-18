use std::ops::Add;
use std::sync::Arc;
use std::time::Duration;

use chrono::{DateTime, Utc};
use log::{error, info};

use errors::AnyhowResult;
use mysql_queries::queries::database_time::get_database_time::get_database_time;
use mysql_queries::queries::model_weights::list::list_model_weight_tokens_updated_since::list_model_weight_tokens_updated_since;

use crate::job_state::JobState;
use crate::tasks::model_weights::util::copy_model_weight_records_to_documents::copy_model_weight_records_to_documents;

pub async fn update_recently_written_model_weights(job_state: Arc<JobState>) {
  let mut last_updated_time= DateTime::UNIX_EPOCH;

  // TODO(bt,2024-02-05): Write this cursor to Redis so job can resume without reindexing everything.
  loop {
    match get_database_time(&job_state.mysql_pool).await {
      Ok(db_time) => {
        last_updated_time = db_time.database_time;
        break;
      },
      Err(err) => {
        error!("Error getting database time: {:?}", err);
        tokio::time::sleep(Duration::from_millis(job_state.sleep_config.between_error_wait_millis)).await;
        continue;
      }
    }
  }

  loop {
    info!("Main loop; cursor @ {:?}", &last_updated_time);
    let result = with_database_main_loop(&mut last_updated_time, &job_state).await;

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

  loop {
    info!("Querying tokens updated since: {:?}", &updated_at_cursor);

    let maybe_records =
        list_model_weight_tokens_updated_since(&mut *mysql_connection, &updated_at_cursor).await?;

    if maybe_records.is_empty() {
      info!("No records updated since {:?}", &updated_at_cursor);
      tokio::time::sleep(Duration::from_millis(job_state.sleep_config.between_no_updates_wait_millis)).await;
      continue;
    }

    let maybe_tokens = maybe_records.into_iter()
        .map(|record| record.token)
        .collect::<Vec<_>>();

    info!("Found {} updated records", maybe_tokens.len());

    let maybe_last_cursor = copy_model_weight_records_to_documents(
      maybe_tokens,
      &mut *mysql_connection,
      &job_state.elasticsearch,
      &job_state.sleep_config,
    ).await?;

    if let Some(last_cursor) = maybe_last_cursor {
      // NB: If we trigger thousands of records to get updated at the same time, the cursor could get stuck.
      // This is a simple way to ensure we don't get stuck, but we could miss out on some updates.
      let delta = last_cursor.updated_at.signed_duration_since(*updated_at_cursor);

      if delta.num_seconds() == 0 {
        // Cursor didn't move, so we need to advance it.
        *updated_at_cursor = last_cursor.updated_at.add(Duration::from_secs(1));
      } else {
        *updated_at_cursor = last_cursor.updated_at;
      }
    }

    tokio::time::sleep(Duration::from_millis(job_state.sleep_config.between_query_wait_millis)).await;
  }
}
