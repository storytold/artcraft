use artcraft_client_identity::user_agents::ARTCRAFT_DESKTOP_USER_AGENT;
use reqwest::header::{HeaderMap, HeaderValue, ORIGIN};
use reqwest::{Client, ClientBuilder};

use crate::utils::api_host::ApiHost;

/// Every request to our API is built from this so the desktop client identifies itself
/// consistently (`User-Agent` and `Origin`). Only use it for Storyteller / ArtCraft APIs.
pub(crate) fn storyteller_client_builder(api_host: &ApiHost) -> ClientBuilder {
  let mut headers = HeaderMap::new();
  headers.insert(ORIGIN, HeaderValue::from_static(api_host.request_origin()));

  Client::builder()
    .user_agent(ARTCRAFT_DESKTOP_USER_AGENT)
    .default_headers(headers)
    .gzip(true)
}
