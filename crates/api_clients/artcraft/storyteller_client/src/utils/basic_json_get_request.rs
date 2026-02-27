use crate::credentials::storyteller_credential_set::StorytellerCredentialSet;
use crate::error::api_error::ApiError;
use crate::error::client_error::ClientError;
use crate::error::storyteller_error::StorytellerError;
use crate::utils::api_host::ApiHost;
use crate::utils::constants::{APPLICATION_JSON, USER_AGENT};
use crate::utils::filter_bad_response::filter_bad_response;
use log::{debug, info};
use reqwest::Client;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};

pub async fn basic_json_get_request<Res: DeserializeOwned>(
  api_host: &ApiHost,
  route_path: &str,
  maybe_creds: Option<&StorytellerCredentialSet>,
) -> Result<Res, StorytellerError> {

  let url = get_route(api_host, route_path);

  debug!("Requesting {:?}", &url);

  let client = Client::builder()
      .gzip(true)
      .build()
      .map_err(|err| StorytellerError::Client(ClientError::from(err)))?;

  let mut request_builder = client.get(url)
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

  let hostname = response.headers().get("x-backend-hostname")
      .and_then(|v| v.to_str().ok())
      .map(|s| s.to_owned());

  let build_sha = response.headers().get("x-build-sha")
      .and_then(|v| v.to_str().ok())
      .map(|s| s.to_owned());

  debug!("[server] x-backend-hostname: {:?}, x-build-sha: {:?}", hostname, build_sha);

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

fn get_route(api_host: &ApiHost, route_path: &str) -> String {
  let api_hostname = api_host.to_api_hostname_and_scheme();
  format!("{}{}", api_hostname, route_path)
}
