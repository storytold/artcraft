use std::time::Duration;

use artcraft_client_identity::user_agents::ARTCRAFT_DESKTOP_USER_AGENT;
use reqwest::header::{HeaderMap, HeaderValue, ORIGIN};
use reqwest::{Client, ClientBuilder};

use crate::utils::api_host::ApiHost;

const CONNECT_TIMEOUT: Duration = Duration::from_secs(10);
const API_TIMEOUT: Duration = Duration::from_secs(30);
const UPLOAD_TIMEOUT: Duration = Duration::from_secs(600);

/// Every request to our API is built from this so the desktop client identifies itself
/// consistently (`User-Agent` and `Origin`). Only use it for Storyteller / ArtCraft APIs.
pub(crate) fn storyteller_client_builder(api_host: &ApiHost) -> ClientBuilder {
  let mut headers = HeaderMap::new();
  headers.insert(ORIGIN, HeaderValue::from_static(api_host.request_origin()));

  Client::builder()
    .user_agent(ARTCRAFT_DESKTOP_USER_AGENT)
    .default_headers(headers)
    .connect_timeout(CONNECT_TIMEOUT)
    .timeout(API_TIMEOUT)
    .gzip(true)
}

/// Multipart media uploads can take longer than polling and small JSON calls.
pub(crate) fn storyteller_upload_client_builder(api_host: &ApiHost) -> ClientBuilder {
  storyteller_client_builder(api_host).timeout(UPLOAD_TIMEOUT)
}

#[cfg(test)]
mod timeout_fixture_tests {
  use super::*;
  use std::io::{Read, Write};
  use std::net::TcpListener;

  #[tokio::test]
  async fn stalled_headers_time_out_and_the_next_poll_succeeds() {
    check_stalled_response(false).await;
  }

  #[tokio::test]
  async fn stalled_body_times_out_and_the_next_poll_succeeds() {
    check_stalled_response(true).await;
  }

  async fn check_stalled_response(send_headers: bool) {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let address = listener.local_addr().unwrap();
    let server = std::thread::spawn(move || {
      let (mut stalled, _) = listener.accept().unwrap();
      let mut buffer = [0; 4096];
      stalled.read(&mut buffer).unwrap();
      if send_headers {
        stalled.write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 20\r\nConnection: close\r\n\r\n{").unwrap();
      }
      let (mut healthy, _) = listener.accept().unwrap();
      healthy.read(&mut buffer).unwrap();
      healthy.write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\n{}").unwrap();
    });
    let client = storyteller_client_builder(&ApiHost::Localhost { port: address.port() as u32 }).no_proxy().build().unwrap();
    let url = format!("http://{address}/jobs");
    let result = tokio::time::timeout(API_TIMEOUT + Duration::from_secs(5), async {
      client.get(&url).send().await?.text().await
    }).await.expect("the configured deadline must end the stalled request");
    assert!(result.unwrap_err().is_timeout());
    assert_eq!(client.get(&url).send().await.unwrap().text().await.unwrap(), "{}");
    server.join().unwrap();
  }
}
