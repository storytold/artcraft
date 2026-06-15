use serde::Deserialize;
use serde_json::Value;

use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::utils::api_host::ApiHost;

use crate::creds::load_session;
use crate::errors::ToolError;

const PATH: &str = "/v1/omni_gen/models/image";

#[derive(Debug, Deserialize, rmcp::schemars::JsonSchema)]
pub struct Args {
  /// Provider filter. "artcraft" (default) lists only models reachable
  /// via the Artcraft account. "all" lists every known model across
  /// all providers — most won't be callable without per-provider creds.
  #[serde(default)]
  pub provider: Option<String>,
}

pub async fn run(args: Args) -> Result<Value, ToolError> {
  let (api_host, creds) = load_session()?;

  let path = match args
    .provider
    .as_deref()
    .map(str::trim)
    .filter(|s| !s.is_empty())
  {
    Some(p) => format!("{}?provider={}", PATH, p),
    None => PATH.to_string(),
  };

  // artcraft_client's basic_json_get_request is pub(crate) so we can't
  // reuse it from outside the crate — do a direct reqwest GET with the
  // same cookie-header convention.
  get_json(&api_host, &path, &creds).await
}

async fn get_json(
  api_host: &ApiHost,
  path: &str,
  creds: &StorytellerCredentialSet,
) -> Result<Value, ToolError> {
  let url = format!("{}{}", api_host.to_api_hostname_and_scheme(), path);

  let client = reqwest::Client::builder()
    .gzip(true)
    .build()
    .map_err(|e| ToolError::internal(format!("client build failed: {:?}", e)))?;

  let mut request = client.get(&url).header("Accept", "application/json");
  if let Some(cookie) = creds.maybe_as_cookie_header() {
    request = request.header("Cookie", cookie);
  }

  let response = request
    .send()
    .await
    .map_err(|e| ToolError::backend(format!("request to {} failed: {:?}", url, e)))?;

  let status = response.status();
  if status == reqwest::StatusCode::UNAUTHORIZED || status == reqwest::StatusCode::FORBIDDEN {
    return Err(ToolError::session_expired());
  }
  if !status.is_success() {
    return Err(ToolError::backend(format!(
      "HTTP {} from {}",
      status.as_u16(),
      url
    )));
  }

  let body = response
    .text()
    .await
    .map_err(|e| ToolError::backend(format!("reading response body failed: {:?}", e)))?;

  serde_json::from_str(&body)
    .map_err(|e| ToolError::backend(format!("response was not JSON: {:?}", e)))
}
