use std::collections::HashSet;
use std::thread;
use std::time::Duration;

use log::warn;
use log::{debug, error, info};
use sqlx::MySqlPool;

use actix_helpers::middleware::banned_ip_filter::ip_ban_list::ip_ban_list::IpBanList;
use actix_helpers::middleware::banned_ip_filter::ip_ban_list::ip_set::IpSet;
use mysql_queries::queries::ip_bans::list_ip_bans::list_ip_bans;

const DYNAMIC_BAN_LIST_NAME : &str = "DYNAMIC_POLLING_IP_BAN_LIST";

pub async fn poll_ip_bans(
  ip_ban_list: IpBanList,
  mysql_pool: MySqlPool,
) {
  loop {
    debug!("Job fetching IP Address Bans...");

    let bans = match list_ip_bans(&mysql_pool).await {
      Ok(bans) => bans,
      Err(e) => {
        error!("Error polling IP bans: {:?}", e);
        tokio::time::sleep(Duration::from_millis(30_000)).await;
        continue;
      }
    };

    let ip_addresses = bans.iter()
        .map(|record| record.ip_address.clone())
        .collect::<HashSet<String>>();

    let database_count = ip_addresses.len();

    info!("Job found {} database IP address bans.", database_count);

    let ip_set = IpSet::from_set(ip_addresses);

    match ip_ban_list.add_set(DYNAMIC_BAN_LIST_NAME.to_string(), ip_set)  {
      Ok(_) => {
        let total_count = ip_ban_list.total_ip_address_count().unwrap_or(0);
        info!("Internal IP ban list updated! Total bans: {} ({} from database)",
          total_count, database_count);
      },
      Err(e) => {
        warn!("Error replacing IP ban list: {:?}", e);
      },
    }

    tokio::time::sleep(Duration::from_millis(20_000)).await;
  }
}
