use crate::creds::ark_api_key::ArkApiKey;
use crate::error::ark_error::ArkError;
use crate::error::classify_ark_http_error::classify_ark_http_error;
use log::debug;
use reqwest::{Client, Method};
use serde::Serialize;
use serde::de::DeserializeOwned;
use std::time::Duration;

/// Sends an authenticated JSON request and parses a JSON response, classifying error statuses.
pub(crate) async fn send_json<Req, Res>(
  api_key: &ArkApiKey,
  method: Method,
  url: &str,
  maybe_body: Option<&Req>,
  timeout: Duration,
) -> Result<Res, ArkError>
where
  Req: Serialize + ?Sized,
  Res: DeserializeOwned,
{
  let client = Client::builder()
      .timeout(timeout)
      .build()
      .map_err(ArkError::ClientBuild)?;

  let mut request = client.request(method.clone(), url).bearer_auth(&api_key.api_key);
  if let Some(body) = maybe_body {
    request = request.json(body);
  }

  debug!("ModelArk request: {} {}", method, url);

  let response = request.send().await.map_err(ArkError::Network)?;
  let status = response.status();
  let body = response.text().await.map_err(ArkError::Network)?;

  classify_ark_http_error(status, &body)?;

  serde_json::from_str(&body).map_err(|error| ArkError::ResponseParse { error, body })
}
