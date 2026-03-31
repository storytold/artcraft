use log::{info, warn};
use pager::client::pager::Pager;
use pager::client::pager_builder::PagerBuilder;
use pager::worker::pager_worker::PagerWorker;
use rootly_client::creds::rootly_api_key::RootlyApiKey;
use rootly_config::services::ROOTLY_SERVICE_ID_VIDEO_THUMBNAIL_JOB;
use rootly_config::urgencies::{ROOTLY_URGENCY_ID_HIGH, ROOTLY_URGENCY_ID_MEDIUM, ROOTLY_URGENCY_ID_LOW};

pub fn build_pager(
  server_environment: server_environment::ServerEnvironment,
  hostname: &str,
) -> (Pager, PagerWorker) {
  let is_paging_enabled = shared_env_var_config::paging::env_enable_paging_default_false();

  info!("Paging enabled: {}", is_paging_enabled);

  let environment = if server_environment.is_deployed_in_production() {
    "production"
  } else {
    "development"
  };

  let builder = PagerBuilder::new()
      .application_name("video-thumbnail-job".to_string())
      .environment(environment.to_string())
      .hostname(hostname.to_string())
      .service_id(ROOTLY_SERVICE_ID_VIDEO_THUMBNAIL_JOB.to_string());

  // If paging is globally disabled, use a NoOp pager regardless of API key.
  if !is_paging_enabled {
    warn!("ENABLE_PAGING is false. Pager will be NoOp.");
    return builder.build_with_worker();
  }

  let maybe_api_key = shared_env_var_config::paging::env_optional_rootly_api_key();

  match maybe_api_key {
    Some(api_key) => {
      info!("Rootly API key found. Configuring pager with Rootly backend.");
      build_rootly_pager(builder, api_key)
    }
    None => {
      warn!("ROOTLY_API_KEY not set. Pager will not send real pages.");
      builder.build_with_worker()
    }
  }
}

fn build_rootly_pager(builder: PagerBuilder, api_key: String) -> (Pager, PagerWorker) {
  let mut rootly_builder = builder
      .rootly(RootlyApiKey::new(api_key))
      .urgency_id_high(ROOTLY_URGENCY_ID_HIGH.to_string())
      .urgency_id_medium(ROOTLY_URGENCY_ID_MEDIUM.to_string())
      .urgency_id_low(ROOTLY_URGENCY_ID_LOW.to_string());

  let target_type = shared_env_var_config::paging::env_optional_rootly_notification_target_type();
  let target_id = shared_env_var_config::paging::env_optional_rootly_notification_target_id();

  if let (Some(t_type), Some(t_id)) = (target_type, target_id) {
    rootly_builder = rootly_builder.notification_target(t_type, t_id);
  }

  rootly_builder.build_with_worker()
}
