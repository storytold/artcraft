//! Build a RouterClient for the given provider from server state.

use artcraft_router::api::router_provider::RouterProvider;
use artcraft_router::client::router_client::RouterClient;
use artcraft_router::client::router_fal_client::RouterFalClient;
use artcraft_router::client::router_gmicloud_client::RouterGmiCloudClient;
use artcraft_router::client::router_grok_api_client::RouterGrokApiClient;
use artcraft_router::client::router_kinovi_web_client::RouterKinoviWebClient;
use kinovi_web_client::creds::kinovi_web_session::KinoviWebSession;

use crate::http_server::common_responses::common_web_error::CommonWebError;
use crate::http_server::endpoints::omni_api::shared_utils::kinovi_account::KinoviAccount;
use crate::state::server_state::ServerState;

pub fn build_router_client(
  provider: RouterProvider,
  server_state: &ServerState,
  kinovi_account: KinoviAccount,
) -> Result<RouterClient, CommonWebError> {
  match provider {
    RouterProvider::KinoviWeb => {
      kinovi_provider(server_state, kinovi_account)
    }
    RouterProvider::Fal => {
      let fal_client = RouterFalClient::new_with_webhook(
        server_state.inference_providers.fal.api_key.clone(),
        server_state.inference_providers.fal.webhook_url.clone(),
      );
      Ok(RouterClient::Fal(fal_client))
    }
    RouterProvider::GmiCloud => {
      Ok(RouterClient::GmiCloud(RouterGmiCloudClient::new(
        server_state.inference_providers.gmicloud.api_key.clone(),
      )))
    }
    RouterProvider::GrokApi => {
      Ok(RouterClient::GrokApi(RouterGrokApiClient::new(
        server_state.inference_providers.grok_api.api_key.clone(),
      )))
    }
    other => {
      Err(CommonWebError::server_error_with_message(
        &format!("Unsupported provider for video generation: {:?}", other),
      ))
    }
  }
}

fn kinovi_provider(server_state: &ServerState, kinovi_account: KinoviAccount) -> Result<RouterClient, CommonWebError> {
  let kinovi_web = &server_state.inference_providers.kinovi_web;
  
  let cookies = match kinovi_account {
    KinoviAccount::Volcengine => kinovi_web.cookies_volcengine.clone(),
    KinoviAccount::BytePlus => kinovi_web.cookies_byteplus.clone(),
    KinoviAccount::BytePlusUltra => kinovi_web.cookies_byteplus_ultra.clone(),
  };

  let session = KinoviWebSession::from_cookies_string(cookies);
  
  Ok(RouterClient::KinoviWeb(RouterKinoviWebClient::new(session)))
}
