use std::time::Duration;

use log::{error, info};
use sqlx::MySql;
use sqlx::pool::PoolConnection;

use errors::AnyhowResult;
use mysql_queries::queries::model_weight_usage_counts::sum_model_weight_usage_count_for_model::sum_model_weight_usage_count_for_models;
use mysql_queries::queries::model_weights::edit::update_model_weight_cached_usage_count::{Args, update_model_weight_cached_usage_count};
use mysql_queries::queries::model_weights::list::list_all_model_weight_tokens_for_cached_usage_backfill::list_all_model_weight_tokens_for_cached_usage_backfill;

use crate::job_state::JobState;

pub async fn update_model_weights_cached_usage_field(job_state: JobState) -> AnyhowResult<()> {
  loop {
    info!("update model weights cached usage field");

    match connect_and_calculate_loop(&job_state).await {
      Ok(_) => {
        tokio::time::sleep(Duration::from_millis(job_state.sleep_config.between_job_batch_wait_millis)).await;
      }
      Err(e) => {
        error!("error: {:?}", e);
        tokio::time::sleep(Duration::from_millis(job_state.sleep_config.between_error_wait_millis)).await;
      }
    }
  }
}

async fn connect_and_calculate_loop(job_state: &JobState) -> AnyhowResult<()> {
  // NB: Don't re-establish this connection unless something goes wrong.
  let mut connection = job_state.mysql_pool.acquire().await?;
  loop {
    calculate_with_connection(&mut connection, job_state).await?;
  }
}

async fn calculate_with_connection(
  connection: &mut PoolConnection<MySql>,
  job_state: &JobState
) -> AnyhowResult<()> {

  let backfill_tokens = list_all_model_weight_tokens_for_cached_usage_backfill(&mut **connection)
      .await?;

  info!("Records found: {}", backfill_tokens.len());

  let mut skipped_sparse_updates : u32 = 0;
  let mut skipped_noop_updates : u32 = 0;
  let mut update_count : u32 = 0;

  for backfill_token in backfill_tokens {
    let usage_count = sum_model_weight_usage_count_for_models(
      &backfill_token.token,
      &mut **connection,
    ).await?;

    let usage_count = usage_count
        .map(|usage| usage.total_usage_count);

    let usage_count = match usage_count {
      None | Some(0) => {
        skipped_sparse_updates += 1;
        continue;
      }
      Some(count) => count,
    };

    if usage_count == backfill_token.cached_usage_count {
      skipped_noop_updates += 1;
      continue;
    }

    info!("Total all-time uses for model {} : {}", backfill_token.token, usage_count);

    update_model_weight_cached_usage_count(Args {
      model_weight_token: &backfill_token.token,
      usage_count,
      mysql_executor: &mut **connection,
      phantom: Default::default(),
    }).await?;

    update_count += 1;
  }

  info!("Skipped sparse updates: {}", skipped_sparse_updates);
  info!("Skipped no-op updates: {}", skipped_noop_updates);
  info!("Updated records: {}", update_count);

  tokio::time::sleep(Duration::from_millis(job_state.sleep_config.between_job_batch_wait_millis)).await;

  Ok(())
}
