//! Build a RouterClient for the given provider from server state.

use artcraft_router::api::provider::Provider;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::client::router_fal_client::RouterFalClient;
use artcraft_router::client::router_gmicloud_client::RouterGmiCloudClient;
use artcraft_router::client::router_grok_api_client::RouterGrokApiClient;
use artcraft_router::client::router_seedance2pro_client::RouterSeedance2ProClient;
use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::state::server_state::ServerState;

pub fn build_router_client(
  provider: Provider,
  server_state: &ServerState,
  use_alternate_kinovi: bool,
) -> Result<RouterClient, CommonWebError> {
  match provider {
    Provider::Seedance2Pro => {
      kinovi_provider(server_state, use_alternate_kinovi)
    }
    Provider::Fal => {
      let fal_client = RouterFalClient::new_with_webhook(
        server_state.fal.api_key.clone(),
        server_state.fal.webhook_url.clone(),
      );
      Ok(RouterClient::Fal(fal_client))
    }
    Provider::GmiCloud => {
      Ok(RouterClient::GmiCloud(RouterGmiCloudClient::new(
        server_state.gmicloud.api_key.clone(),
      )))
    }
    Provider::GrokApi => {
      Ok(RouterClient::GrokApi(RouterGrokApiClient::new(
        server_state.grok_api.api_key.clone(),
      )))
    }
    other => {
      Err(CommonWebError::server_error_with_message(
        &format!("Unsupported provider for video generation: {:?}", other),
      ))
    }
  }
}

fn kinovi_provider(server_state: &ServerState, use_alternate_kinovi: bool) -> Result<RouterClient, CommonWebError> {
  let session = if use_alternate_kinovi {
    // Alternate Kinovi
    Seedance2ProSession::from_cookies_string(
      server_state.seedance2pro.cookies_byteplus.clone()
    )
  } else {
    // Standard Kinovi
    Seedance2ProSession::from_cookies_string(
      server_state.seedance2pro.cookies.clone()
    )
  };
  
  Ok(RouterClient::Seedance2Pro(RouterSeedance2ProClient::new(session)))
}
