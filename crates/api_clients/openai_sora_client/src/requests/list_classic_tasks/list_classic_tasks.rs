use crate::constants::user_agent::CLIENT_USER_AGENT;
use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::error::sora_client_error::SoraClientError;
use crate::error::sora_error::SoraError;
use crate::error::sora_generic_api_error::SoraGenericApiError;
use crate::requests::common::task_id::TaskId;
use crate::requests::deprecated::job_status::sora_job_status::{Generation, StatusRequest, VideoGenStatusResponse};
use crate::utils_internal::classify_general_http_status_code_and_body::classify_general_http_status_code_and_body;
use log::{debug, error, warn};
use serde_derive::Deserialize;
use url::Url;
use wreq::Client;

const SORA_LIST_CLASSIC_TASKS_URL: &str = "https://sora.chatgpt.com/backend/v2/list_tasks?limit=20";


/// NB: We omit fields we're not using to prevent breakage.
#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct ListTasksResponse {
  pub task_responses: Vec<PartialTaskResponse>,
  pub last_id: Option<String>,
  pub has_more: bool,
}

/// NB: We omit fields we're not using to prevent breakage.
#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct PartialTaskResponse {
  pub id: TaskId,
  pub status: TaskStatus,

  /// Text prompt used to generate the media.
  pub prompt: Option<String>,

  pub generations: Vec<PartialGeneration>,

  //pub user: String,
  //pub created_at: String,
  //pub status: String, // eg. "succeeded"
  //pub progress_pct: Option<f64>,
  //pub progress_pos_in_queue: Option<i32>,
  //pub encodings: Vec<Encoding> // NB: These are webp images.
  // ... lots of other fields ...
}


#[derive(Deserialize, Clone, Debug, Eq, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
  Queued,
  Running,
  Succeeded,
  Failed,
  #[serde(untagged)]
  Unknown(String),
}

/// NB: We omit fields we're not using to prevent breakage.
#[derive(Deserialize, Clone, Debug)]
#[serde(rename_all = "snake_case")]
pub struct PartialGeneration {
  // A unique ID for the generation, eg. "gen_01abc..."
  pub id: String,
  pub url: String,

  //pub id: String,
  //pub task_id: TaskId,
  //pub created_at: String,
  //pub deleted_at: Option<String>,
  //pub url: String,
  //pub seed: Option<i64>,
  //pub can_download: Option<bool>,
  // ... lots of other fields ...
}

pub async fn list_classic_tasks(credentials: &SoraCredentialSet) -> Result<ListTasksResponse, SoraError> {

  let bearer_header = match credentials.jwt_bearer_token.as_ref()  {
    Some(bearer) => bearer.to_authorization_header_value(),
    None => {
      warn!("No JWT bearer token in client - cannot fetch image gen status!");
      return Err(SoraClientError::NoBearerTokenForRequest.into());
    },
  };

  let client = Client::new();

  let mut url = Url::parse(SORA_LIST_CLASSIC_TASKS_URL)
      .map_err(|err| {
        SoraClientError::UrlParseError(err)
      })?;


  // TODO: Future pagination.
  // Add query parameters
  //if let Some(limit) = status_request.limit {
  //  url.query_pairs_mut().append_pair("limit", &limit.to_string());
  //}
  //if let Some(before) = &status_request.before {
  //  url.query_pairs_mut().append_pair("before", &before);
  //}

  let http_request = client.get(url.as_str())
      .header("User-Agent", CLIENT_USER_AGENT)
      .header("Cookie", credentials.cookies.as_str())
      .header("Authorization", bearer_header)
      .header("Content-Type", "application/json");

  let http_request = http_request.build()
      .map_err(|err| {
        SoraClientError::WreqClientError(err)
      })?;

  let response = client.execute(http_request)
      .await
      .map_err(|err| {
        error!("Client failed to fetch sora task list: {:?}", err);
        SoraGenericApiError::WreqError(err)
      })?;

  let status = response.status();

  let response_body = &response.text()
      .await
      .map_err(|err| {
        error!("Client failed to read sora task list: {:?}", err);
        SoraGenericApiError::WreqError(err)
      })?;

  debug!("response_body: {}", response_body);

  if !status.is_success() {
    error!("The sora task list request failed; status = {:?} ; response body = {}", status, response_body);
    let error = classify_general_http_status_code_and_body(status, &response_body);
    return Err(error);
  }

  let response = serde_json::from_str::<ListTasksResponse>(response_body)
      .map_err(|err| {
        error!("Failed to parse status response: {:?}", err);
        SoraGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string())
      })?;

  Ok(response)
}

#[cfg(test)]
mod tests {
  use crate::requests::list_classic_tasks::list_classic_tasks::list_classic_tasks;
  use crate::test_utils::get_test_credentials::get_test_credentials;
  use errors::AnyhowResult;

  #[ignore] // You can manually run "ignore" tests in the IDE, but they won't run in CI.
  #[tokio::test]
  pub async fn manual_test() -> AnyhowResult<()> {
    let creds = get_test_credentials()?;
    let result = list_classic_tasks(&creds).await?;
    println!("result: {:#?}", result);
    assert_eq!(1, 2);
    Ok(())
  }
}
