use std::time::Duration;

use log::debug;
use log::error;
use log::warn;
use mysql_queries::queries::health_check::health_check_query::health_check_db;
use pager::client::pager::Pager;
use pager::notification::notification_details_builder::NotificationDetailsBuilder;
use pager::notification::notification_urgency::NotificationUrgency;
use sqlx::MySqlPool;

use crate::threads::db_health_checker_thread::db_health_check_status::HealthCheckStatus;

pub async fn db_health_checker_thread(
  health_check_status: HealthCheckStatus,
  mysql_pool: MySqlPool,
  check_duration: Duration,
  pager: Pager,
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
      Err(database_error) => {
        error!("Problem health checking database: {:?}", database_error);

        match health_check_status.record_ping_failure() {
          Err(e) => error!("Problem updating application health checks!"),
          Ok(_) => {},
        }

        let notification = NotificationDetailsBuilder::from_boxed_error(database_error.into())
            .set_title("DB health check thread failed check".to_string())
            .set_urgency(Some(NotificationUrgency::High))
            .build();

        if let Err(page_err) = pager.enqueue_page(notification) {
          error!("Failed to enqueue DB health check alert: {:?}", page_err);
        }
      }
    }

    tokio::time::sleep(check_duration).await;
  }

  warn!("Should never happen: Health Checker Exits");
}
