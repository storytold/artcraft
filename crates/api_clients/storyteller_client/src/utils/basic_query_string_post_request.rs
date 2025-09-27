use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::api_error::ApiError;
use crate::error::client_error::ClientError;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::constants::{APPLICATION_JSON, USER_AGENT};
use crate::utils::filter_bad_response::filter_bad_response;
use artcraft_api_defs::generate::image::generate_flux_1_schnell_text_to_image::{GenerateFlux1SchnellTextToImageRequest, GenerateFlux1SchnellTextToImageResponse, GENERATE_FLUX_1_SCHNELL_TEXT_TO_IMAGE_PATH};
use errors::AnyhowResult;
use log::{debug, info};
use reqwest::Client;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use url::Url;
use url_builder::URLBuilder;

pub async fn basic_query_string_post_request<Res: DeserializeOwned>(
  api_host: &ApiHost,
  route_path: &str,
  maybe_creds: Option<&StorytellerCredentialSet>,
  query_params: &HashMap<String, String>,
) -> Result<Res, StorytellerError> {

  // TODO: Please stop using this URL Builder library. It's not very safe or intuitive.
  let url = get_route(api_host, route_path, query_params);

  debug!("Requesting {:?}", &url);

  let client = Client::builder()
      .gzip(true)
      .build()
      .map_err(|err| StorytellerError::Client(ClientError::from(err)))?;

  let mut request_builder = client.post(url)
      .header("User-Agent", USER_AGENT)
      .header("Accept", APPLICATION_JSON);

  if let Some(creds) = maybe_creds {
    if let Some(header) = &creds.maybe_as_cookie_header() {
      request_builder = request_builder.header("Cookie", header);
    }
  }

  let response = request_builder
      .send()
      .await
      .map_err(|err| StorytellerError::Api(ApiError::from(err)))?;

  let response = filter_bad_response(response)
      .await
      .map_err(|err| StorytellerError::Api(ApiError::from(err)))?;

  let response_body = &response.text()
      .await
      .map_err(|err| StorytellerError::Api(ApiError::from(err)))?;

  debug!("Response body: {:?}", response_body);

  let response = serde_json::from_str(&response_body)
      .map_err(|err| StorytellerError::Api(ApiError::from(err)))?;

  Ok(response)
}

// TODO: Please stop using this URL Builder library. It's not very safe or intuitive.
fn get_route(api_host: &ApiHost, route_path: &str, query_params: &HashMap<String, String>) -> String {
  let mut builder = URLBuilder::new();

  builder.set_protocol(api_host.scheme())
      .set_host(&api_host.to_api_hostname());

  // NB: This stupid library auto-inserts a starting slash, so we need to remove it.
  // This is a bad code smell. I shouldn't be using this thing.
  match route_path.split_once("/") {
    None => {
      builder.add_route(route_path);
    }
    Some((_slash, rest)) => {
      builder.add_route(rest);
    }
  }

  // NB: This is not safe. It doesn't handle URL encoding, "?", "&", etc.
  for (key, value) in query_params {
    let value = filter_string(value);
    builder.add_param(key, &value);
  }

  // NB: This isn't very safe.
  builder.build()
}

// TODO: Please stop using this URL Builder library. It's not very safe or intuitive.
fn filter_string(string: &str) -> String {
  string.trim()
      .replace(" ", "")
      .replace("&", "")
      .replace("=", "")
      .replace("?", "")
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::collections::HashMap;

  #[test]
  fn test_get_route() {
    let api_host = ApiHost::Storyteller;
    let route_path = "/v1/test";
    let mut query_params = HashMap::new();
    query_params.insert("param1".to_string(), "value1".to_string());
    query_params.insert("param2".to_string(), "value2".to_string());

    let url = get_route(&api_host, route_path, &query_params);

    assert!(url.starts_with("https://api.storyteller.ai/v1/test?"));
    assert!(url.contains("param1=value1"));
    assert!(url.contains("param2=value2"));
  }

  #[test]
  fn test_get_localhost_route() {
    let api_host = ApiHost::Localhost { port: 12345 };
    let route_path = "/v1/test";
    let mut query_params = HashMap::new();
    query_params.insert("param1".to_string(), "value1".to_string());
    query_params.insert("param2".to_string(), "value2".to_string());

    let url = get_route(&api_host, route_path, &query_params);

    assert!(url.starts_with("http://localhost:12345/v1/test?"));
    assert!(url.contains("param1=value1"));
    assert!(url.contains("param2=value2"));
  }
}