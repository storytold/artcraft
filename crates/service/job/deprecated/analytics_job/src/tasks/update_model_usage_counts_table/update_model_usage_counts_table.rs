use std::time::Duration;

use chrono::{Days, NaiveDate, Utc};
use log::{error, info};
use sqlx::MySql;
use sqlx::pool::PoolConnection;

use datetimes::generate_dates_inclusive::generate_dates_inclusive;
use errors::AnyhowResult;
use mysql_queries::queries::model_weight_usage_counts::upsert_model_weight_usage_count_for_date::{Args, upsert_model_weight_usage_count_for_date};
use mysql_queries::queries::model_weights::count::count_all_model_usages_on_date::count_all_model_usages_on_date;

use crate::job_state::JobState;

pub async fn update_model_usage_counts_table(job_state: JobState) -> AnyhowResult<()> {
  loop {
    info!("update model usage counts table");

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
  let dates = get_dates();

  for date in dates {
    info!("Finding usages for date: {:?}", date);

    let usages = count_all_model_usages_on_date(&mut **connection, date).await?;

    info!("Records found: {}", usages.counts.len());

    let mut skipped_sparse_updates : u32 = 0;
    let mut skipped_noop_updates : u32 = 0;
    let mut update_count : u32 = 0;

    for usage in usages.counts {
      if usage.latest_usage_count == 0 {
        skipped_sparse_updates += 1;
        continue;
      }
      if usage.latest_usage_count == usage.maybe_previously_cached_model_use_count.unwrap_or(0) {
        skipped_noop_updates += 1;
        continue;
      }

      info!("Date: {} Token: {} Uses: {}", date, usage.token.as_str(), usage.latest_usage_count);

      upsert_model_weight_usage_count_for_date(Args {
        model_token: &usage.token,
        date,
        usage_count: usage.latest_usage_count,
        insert_on_zero: false,
        mysql_executor: &mut **connection,
        phantom: Default::default(),
      }).await?;

      update_count += 1;
    }

    info!("Skipped sparse updates: {}", skipped_sparse_updates);
    info!("Skipped no-op updates: {}", skipped_noop_updates);
    info!("Updated records: {}", update_count);

    tokio::time::sleep(Duration::from_millis(job_state.sleep_config.between_job_batch_wait_millis)).await;
  }

  Ok(())
}

fn get_dates() -> Vec<NaiveDate> {
  let today = Utc::now().date_naive();

  let start_date = today
      .checked_sub_days(Days::new(2))
      .unwrap_or(today);

  let end_date = today
      .checked_add_days(Days::new(2))
      .unwrap_or(today);

  generate_dates_inclusive(start_date, end_date)
}
