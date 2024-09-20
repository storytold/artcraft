use std::time::Duration;

use log::debug;
use log::error;
use log::warn;
use mysql_queries::queries::health_check::health_check_query::health_check_db;
use sqlx::MySqlPool;

use crate::threads::db_health_checker_thread::db_health_check_status::HealthCheckStatus;

pub async fn db_health_checker_thread(
  health_check_status: HealthCheckStatus,
  mysql_pool: MySqlPool,
  check_duration: Duration,
) {
  loop {
    debug!("Checking DB health...");

    match health_check_db(&mysql_pool).await {
      Ok(result) => {
        match health_check_status.record_ping_success(result.present_time) {
          Err(e) => error!("Problem updating application health checks!"),
          Ok(_) => {},
        }
      }
      Err(e) => {
        error!("Problem health checking database: {:?}", e);
        match health_check_status.record_ping_failure() {
          Err(e) => error!("Problem updating application health checks!"),
          Ok(_) => {},
        }
      }
    }

    tokio::time::sleep(check_duration).await;
  }

  warn!("Should never happen: Health Checker Exits");
}
