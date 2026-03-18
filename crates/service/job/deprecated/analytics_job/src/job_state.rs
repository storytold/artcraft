use sqlx::MySqlPool;

#[derive(Clone)]
pub struct JobState {
  pub mysql_pool: MySqlPool,

  pub sleep_config: SleepConfigs,
}

/// Use sleep to not overload the database.
#[derive(Clone)]
pub struct SleepConfigs {
  // How long to wait between individual "jobs".
  pub between_job_wait_millis: u64,

  // How long to wait between individual job batches.
  pub between_job_batch_wait_millis: u64,

  // How long to wait between individual queries.
  pub between_query_wait_millis: u64,

  // How long to wait between errors.
  pub between_error_wait_millis: u64,
}
