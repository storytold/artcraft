use crate::client::browser_user_agents::FIREFOX_143_MAC_USER_AGENT;
use crate::error::grok_client_error::GrokClientError;
use crate::error::grok_error::GrokError;
use crate::error::grok_generic_api_error::GrokGenericApiError;
use cloudflare_mitigation::headers::firefox_websocket_http_1_1_headers::get_firefox_websocket_http_1_1_headers;
use std::ops::{Deref, DerefMut};
use std::time::Duration;
use tokio::io::AsyncReadExt;
use wreq::header::{ACCEPT, ACCEPT_LANGUAGE, CACHE_CONTROL, COOKIE, ORIGIN, PRAGMA, SEC_WEBSOCKET_EXTENSIONS, USER_AGENT};
use wreq::ws::WebSocket;
use wreq::Client;
use wreq_util::Emulation;

const WEBSOCKET_URL: &str = "wss://grok.com/ws/imagine/listen";

pub struct CreateListenWebsocketArgs<'a> {
  pub cookies: &'a str,
}

pub async fn create_listen_websocket(args: CreateListenWebsocketArgs<'_>) -> Result<WebSocket, GrokError> {
  let mut client_builder = Client::builder()
      .emulation(Emulation::Firefox143)
      .connection_verbose(true)
      .connect_timeout(Duration::from_secs(30));

  let client = client_builder
      .build()
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  // NB: We need to be careful with this because HTTP/1.1 WebSocket handshake is sensitive to header casing and order.
  // Cloudflare doesn't like lower case header names, and we're sending headers in the right order just to be safe.
  let builder = client.websocket(WEBSOCKET_URL)
      .default_headers(false)
      .orig_headers(get_firefox_websocket_http_1_1_headers())
      .header(COOKIE, args.cookies)
      .header(ORIGIN,"https://grok.com")
      .header(USER_AGENT, FIREFOX_143_MAC_USER_AGENT)
      .header(SEC_WEBSOCKET_EXTENSIONS, "permessage-deflate")
      .header(ACCEPT, "*/*")
      .header(ACCEPT_LANGUAGE, "en-US,en;q=0.5")
      .header("Sec-Fetch-Dest", "empty")
      .header("Sec-Fetch-Mode", "websocket")
      .header("Sec-Fetch-Site", "same-origin")
      .header(PRAGMA, "no-cache")
      .header(CACHE_CONTROL, "no-cache");

  let mut response = builder.send()
      .await
      .map_err(|err| GrokClientError::WreqClientError(err))?;

  let status = response.status();

  match status.as_u16() {
    101 => {
      // Successful WebSocket upgrade ... fallthrough.
    }
    401 => {
      // 401 is a likely authentication error with Grok itself.
      // Unfortunately we can't read the response body text because wreq wants to consume the Response to get it, but the
      // WebsocketResponse type wraps and doesn't let us move it. It's wreq's fault.
      return Err(GrokError::ApiGeneric(GrokGenericApiError::LikelyWebsocketAuthentication401));
    }
    403 => {
      // 403 is likely a cloudflare error
      // Unfortunately we can't read the response body text because wreq wants to consume the Response to get it, but the
      // WebsocketResponse type wraps and doesn't let us move it. It's wreq's fault.
      return Err(GrokError::ApiGeneric(GrokGenericApiError::LikelyWebsocketCloudflare403));
    }
    _ => {
      return Err(GrokError::ApiGeneric(GrokGenericApiError::UnexpectedWebsocketUpgradeStatusCode(status)));
    },
  }

  let websocket = response.into_websocket()
      .await
      .map_err(|err| GrokGenericApiError::WreqWebsocketUpgradeError(err))?;

  Ok(websocket)
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  #[tokio::test]
  #[ignore] // manually test
  async fn create() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    //let cookies = SESSION_COOKIES_WITHOUT_CF_CLEARANCE;
    let cookies = get_test_cookies()?;
    let args = CreateListenWebsocketArgs {
      cookies: &cookies,
    };
    let result = create_listen_websocket(args).await;
    if let Err(err) = result {
      println!("Error: {:?}", err);
    }
    log::logger().flush();
    assert_eq!(1, 2);
    Ok(())
  }
}
