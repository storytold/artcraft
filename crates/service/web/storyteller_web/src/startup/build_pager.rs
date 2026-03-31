use log::{info, warn};
use pager::client::pager::Pager;
use pager::client::pager_builder::PagerBuilder;
use pager::worker::pager_worker::PagerWorker;
use rootly_client::creds::rootly_api_key::RootlyApiKey;

use crate::state::flags::paging_flags::PagingFlags;

/// `storyteller-web` rootly service ID
const ROOTLY_SERVICE_ID: &str = "9ebebb09-0c56-4c8a-8f57-d5f0f85f3f16";

const ROOTLY_URGENCY_ID_HIGH: &str = "62fde143-1258-4639-9ee6-1400ebf7308d";
const ROOTLY_URGENCY_ID_MEDIUM: &str = "7366ba5e-f6ea-4a4e-a1b4-ae43d512e1e2";
const ROOTLY_URGENCY_ID_LOW: &str = "4db3d3ed-f4ed-4818-82f5-7746da404bd2";

pub fn build_pager(
  server_environment: server_environment::ServerEnvironment,
  hostname: &str,
) -> (Pager, PagerWorker, PagingFlags) {
  let paging_flags = PagingFlags::from_env();

  info!("Paging flags: {:?}", paging_flags);

  let environment = if server_environment.is_deployed_in_production() {
    "production"
  } else {
    "development"
  };

  let builder = PagerBuilder::new()
      .application_name("storyteller-web".to_string())
      .environment(environment.to_string())
      .hostname(hostname.to_string())
      .service_id(ROOTLY_SERVICE_ID.to_string());
  
  // If paging is globally disabled, use a NoOp pager regardless of API key.
  if !paging_flags.is_paging_enabled {
    warn!("ENABLE_PAGING is false. Pager will be NoOp.");
    let (pager, worker) = builder.build_with_worker();
    return (pager, worker, paging_flags);
  }

  let maybe_api_key = easyenv::get_env_string_optional("ROOTLY_API_KEY");

  let (pager, worker) = match maybe_api_key {
    Some(api_key) => {
      info!("Rootly API key found. Configuring pager with Rootly backend.");
      build_rootly_pager(builder, api_key)
    }
    None => {
      warn!("ROOTLY_API_KEY not set. Pager will not send real pages.");
      builder.build_with_worker()
    }
  };

  (pager, worker, paging_flags)
}

fn build_rootly_pager(builder: PagerBuilder, api_key: String) -> (Pager, PagerWorker) {
  let mut rootly_builder = builder
      .rootly(RootlyApiKey::new(api_key))
      .urgency_id_high(ROOTLY_URGENCY_ID_HIGH.to_string())
      .urgency_id_medium(ROOTLY_URGENCY_ID_MEDIUM.to_string())
      .urgency_id_low(ROOTLY_URGENCY_ID_LOW.to_string());

  let target_type = easyenv::get_env_string_optional("ROOTLY_NOTIFICATION_TARGET_TYPE");
  let target_id = easyenv::get_env_string_optional("ROOTLY_NOTIFICATION_TARGET_ID");

  if let (Some(t_type), Some(t_id)) = (target_type, target_id) {
    rootly_builder = rootly_builder.notification_target(t_type, t_id);
  }

  rootly_builder.build_with_worker()
}
