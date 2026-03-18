use elasticsearch::Elasticsearch;
use sqlx::MySqlPool;

pub struct JobState {
  pub mysql_pool: MySqlPool,
  pub elasticsearch: Elasticsearch,

  pub sleep_config: SleepConfigs,
}

/// Use sleep to not overload the database.
pub struct SleepConfigs {
  // How long to wait between individual ES writes.
  pub between_es_writes_wait_millis: u64,

  // How long to wait between individual job batches.
  pub between_job_batch_wait_millis: u64,

  // How long to wait between individual queries.
  pub between_query_wait_millis: u64,

  // How long to wait between errors.
  pub between_error_wait_millis: u64,

  // How long to wait between periods of NO-OPs / no updates.
  pub between_no_updates_wait_millis: u64,
}
