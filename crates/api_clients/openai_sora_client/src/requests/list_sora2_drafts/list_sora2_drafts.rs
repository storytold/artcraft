use crate::constants::user_agent::CLIENT_USER_AGENT;
use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::error::sora_client_error::SoraClientError;
use crate::error::sora_error::SoraError;
use crate::error::sora_generic_api_error::SoraGenericApiError;
use crate::requests::common::task_id::TaskId;
use crate::requests::deprecated::job_status::sora_job_status::{Generation, StatusRequest, VideoGenStatusResponse};
use crate::requests::list_sora2_drafts::http_response::{DraftKind, HttpDraftsResponse};
use crate::utils_internal::classify_general_http_status_code_and_body::classify_general_http_status_code_and_body;
use log::{debug, error, info, warn};
use serde_derive::Deserialize;
use url::Url;
use wreq::header::{ACCEPT, ACCEPT_LANGUAGE, AUTHORIZATION, CONTENT_TYPE, COOKIE, ORIGIN, REFERER};
use wreq::Client;

const SORA_LIST_DRAFTS_URL: &str = "https://sora.chatgpt.com/backend/project_y/profile/drafts?limit=15";


/// NB: We omit fields we're not using to prevent breakage.
#[derive(Clone, Debug)]
pub struct ListSora2DraftsResponse {
  pub drafts: Vec<Draft>,
}

#[derive(Clone, Debug)]
pub enum Draft {
  Success(DraftSuccess),
  Failure(DraftFailure),
}

#[derive(Clone, Debug)]
pub struct DraftSuccess {
  pub id: String,
  pub task_id: TaskId,
  pub url: String,
  pub prompt: String,
}

#[derive(Clone, Debug)]
pub struct DraftFailure {
  pub task_id: TaskId,
  pub reason_message: String,
}

pub async fn list_sora2_drafts(credentials: &SoraCredentialSet) -> Result<ListSora2DraftsResponse, SoraError> {

  let client = Client::new();

  let authorization_header = credentials.jwt_bearer_token.as_ref()
      .ok_or(SoraClientError::NoBearerTokenForRequest)?
      .to_authorization_header_value();

  let cookie = credentials.cookies.to_string();

  // TODO: Make the sec-* headers match the user agent and platform
  // TODO: device id
  //-H 'oai-device-id: 7c216860-5b73-4e63-983f-142dbcae1809' \
  let mut http_request = client.get(SORA_LIST_DRAFTS_URL)
      //.header("OpenAI-Sentinel-Token", &sentinel);
      .header(ACCEPT, "*/*")
      .header(REFERER, "https://sora.chatgpt.com/drafts")
      .header(ACCEPT_LANGUAGE, "en-US,en;q=0.9")
      .header(wreq::header::USER_AGENT, CLIENT_USER_AGENT)
      .header(COOKIE, &cookie)
      .header(AUTHORIZATION, &authorization_header)
      .header("priority", "u=1, i")
      .header("sec-ch-ua", "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"")
      .header("sec-ch-ua-mobile", "?0")
      .header("sec-ch-ua-platform", "macOS")
      .header("sec-fetch-dest", "empty")
      .header("sec-fetch-mode", "cors")
      .header("sec-fetch-site", "same-origin");

  //if let Some(timeout) = args.request_timeout {
  //  http_request = http_request.timeout(timeout);
  //}

  let http_request = http_request.build()
      .map_err(|err| {
        error!("Error building Sora 2 list drafts HTTP request: {:?}", err);
        SoraClientError::WreqClientError(err)
      })?;

  let response = client.execute(http_request)
      .await
      .map_err(|err| {
        error!("Error during Sora 2 list drafts request: {:?}", err);
        SoraClientError::WreqClientError(err)
      })?;

  let status = response.status();

  let response_body = &response.text().await
      .map_err(|err| {
        error!("Error reading Sora 2 list drafts response body: {:?}", err);
        SoraClientError::WreqClientError(err)
      })?;

  if !status.is_success() {
    error!("Sora list drafts request returned an error (code {}) : {:?}", status.as_u16(), response_body);

    // TODO: Categorize failures.
    // error!("The sora task list request failed; status = {:?} ; response body = {}", status, response_body);
    // let error = classify_general_http_status_code_and_body(status, &response_body).await;
    // return Err(error);

    return Err(SoraGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body: response_body.to_string(),
    }.into());
  }

  let response : HttpDraftsResponse = serde_json::from_str(response_body)
      .map_err(|err| SoraGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.to_string()))?;

  Ok(ListSora2DraftsResponse {
    drafts: response.items
        .into_iter()
        .map(|draft| {
          let task_id = TaskId::from_string(draft.task_id);
          match draft.kind {
            DraftKind::SoraDraft => {
              match draft.url {
                Some(url) => {
                  // Success case
                  Draft::Success(DraftSuccess {
                    id: draft.id,
                    task_id,
                    url,
                    prompt: draft.prompt,
                  })
                }
                None => {
                  return Draft::Failure(DraftFailure {
                    task_id,
                    reason_message: "Generation failed. URL missing from the draft.".to_string(),
                  });
                }
              }
            }
            DraftKind::SoraContentViolation => {
              Draft::Failure(DraftFailure {
                task_id,
                reason_message: format!(
                  "Generation failed due to content violation: {}",
                  draft.reason_str
                    .unwrap_or_else(|| "no additional reason".to_string())),
              })
            }
            DraftKind::Unknown(value) => {
              Draft::Failure(DraftFailure {
                task_id,
                reason_message: format!(
                  "Generation failed with unknown failure code: {}. Possible message: {}",
                  value,
                  draft.reason_str
                      .unwrap_or_else(|| "no additional message".to_string())),
              })
            }
          }
        }).collect(),
  })
}

#[cfg(test)]
mod tests {
  use crate::requests::list_sora2_drafts::list_sora2_drafts::list_sora2_drafts;
  use crate::test_utils::get_test_credentials::get_test_credentials;
  use errors::AnyhowResult;

  #[ignore] // You can manually run "ignore" tests in the IDE, but they won't run in CI.
  #[tokio::test]
  pub async fn manual_test() -> AnyhowResult<()> {
    let creds = get_test_credentials()?;
    let result = list_sora2_drafts(&creds).await?;
    println!("result: {:#?}", result);
    assert_eq!(1, 2);
    Ok(())
  }
}
