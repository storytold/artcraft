use log::{info, warn};
use pager::client::pager::Pager;
use pager::client::pager_builder::PagerBuilder;
use pager::worker::pager_worker::PagerWorker;
use rootly_client::creds::rootly_api_key::RootlyApiKey;

pub fn build_pager(server_environment: server_environment::ServerEnvironment) -> (Pager, PagerWorker) {
  let environment = if server_environment.is_deployed_in_production() {
    "production"
  } else {
    "development"
  };

  let maybe_api_key = easyenv::get_env_string_optional("ROOTLY_API_KEY");

  let builder = PagerBuilder::new()
      .application_name("storyteller-web".to_string())
      .environment(environment.to_string());

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

fn build_rootly_pager(mut builder: PagerBuilder, api_key: String) -> (Pager, PagerWorker) {
  let mut rootly_builder = builder
      .rootly(RootlyApiKey::new(api_key));

  if let Some(urgency_id) = easyenv::get_env_string_optional("ROOTLY_ALERT_URGENCY_ID") {
    rootly_builder = rootly_builder.alert_urgency_id(urgency_id);
  }

  let target_type = easyenv::get_env_string_optional("ROOTLY_NOTIFICATION_TARGET_TYPE");
  let target_id = easyenv::get_env_string_optional("ROOTLY_NOTIFICATION_TARGET_ID");

  if let (Some(t_type), Some(t_id)) = (target_type, target_id) {
    rootly_builder = rootly_builder.notification_target(t_type, t_id);
  }

  rootly_builder.build_with_worker()
}
