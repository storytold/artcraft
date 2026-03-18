use errors::AnyhowResult;
use log::{error, info};
use mysql_queries::queries::generic_inference::job::reap_stale_fakeyou_jobs::reap_stale_fakeyou_jobs;
use sqlx::MySqlPool;
use std::time::Duration;

const WAIT_BETWEEN_REAPING_SECONDS: u64 = 60 * 2; // 2 minutes

pub async fn reap_jobs_thread(
  mysql_pool: MySqlPool,
) -> ! {
  info!("Database job reaping thread starting...");

  loop {
    tokio::time::sleep(Duration::from_secs(WAIT_BETWEEN_REAPING_SECONDS)).await;

    info!("Reaping jobs from database...");

    let result = do_reap_jobs(&mysql_pool).await;

    if let Err(err) = result {
      error!("Error reaping jobs: {:?}", err);
      tokio::time::sleep(Duration::from_secs(300)).await;
    }
  }
}

pub async fn do_reap_jobs(
  mysql_pool: &MySqlPool,
) -> AnyhowResult<()> {
  reap_stale_fakeyou_jobs(mysql_pool).await?;
  Ok(())
}