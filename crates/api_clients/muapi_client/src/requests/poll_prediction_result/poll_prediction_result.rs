use crate::api_types::request_id::RequestId;
use crate::creds::muapi_session::MuapiSession;
use crate::error::muapi_client_error::MuapiClientError;
use crate::error::muapi_error::MuapiError;
use crate::error::muapi_generic_api_error::MuapiGenericApiError;
use crate::requests::poll_prediction_result::request_types::*;
use log::info;
use wreq::Client;

const PREDICTIONS_BASE_URL: &str = "https://api.muapi.ai/api/v1/predictions";

// --- Public types ---

/// The lifecycle status of a prediction.
#[derive(Debug, Clone, PartialEq)]
pub enum PredictionStatus {
  /// The task is queued and has not started yet.
  Pending,
  /// The task is actively being processed.
  Processing,
  /// The task finished successfully. `outputs` will be populated.
  Completed,
  /// The task failed. `error` will contain the reason.
  Failed,
  /// An unrecognised status string was returned by the server.
  Unknown(String),
}

impl PredictionStatus {
  fn from_str(s: &str) -> Self {
    match s {
      "pending" => Self::Pending,
      "processing" => Self::Processing,
      "completed" => Self::Completed,
      "failed" => Self::Failed,
      other => Self::Unknown(other.to_string()),
    }
  }

  pub fn is_terminal(&self) -> bool {
    matches!(self, Self::Completed | Self::Failed)
  }
}

// --- Args & response ---

pub struct PollPredictionResultArgs<'a> {
  pub session: &'a MuapiSession,

  /// The request_id returned from a submission endpoint.
  pub request_id: &'a RequestId,
}

pub struct PollPredictionResultApiResponse {
  /// The current status of the prediction.
  pub status: PredictionStatus,

  /// Output URLs. Populated when `status` is `Completed`.
  pub output_urls: Option<Vec<String>>,

  /// Error message. Populated when `status` is `Failed`.
  pub error: Option<String>,
}

// --- Implementation ---

pub async fn poll_prediction_result(
  args: PollPredictionResultArgs<'_>,
) -> Result<PollPredictionResultApiResponse, MuapiError> {
  let url = format!("{}/{}/result", PREDICTIONS_BASE_URL, args.request_id.as_str());

  info!("Polling Muapi prediction result: {}", url);

  let api_key = args.session.api_key.as_str();

  let client = Client::builder()
    .build()
    .map_err(|err| MuapiClientError::WreqClientError(err))?;

  let response = client.get(&url)
    .header("Content-Type", "application/json")
    .header("x-api-key", api_key)
    .send()
    .await
    .map_err(|err| MuapiGenericApiError::WreqError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| MuapiGenericApiError::WreqError(err))?;

  info!("Muapi poll response status: {}, body: {}", status, response_body);

  if !status.is_success() {
    return Err(MuapiGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body: response_body,
    }.into());
  }

  let parsed: PollPredictionResultResponse = serde_json::from_str(&response_body)
    .map_err(|err| MuapiGenericApiError::SerdeResponseParseErrorWithBody(err, response_body))?;

  let output_urls = parsed.outputs.and_then(|urls| if urls.is_empty() { None } else { Some(urls) });

  Ok(PollPredictionResultApiResponse {
    status: PredictionStatus::from_str(&parsed.status),
    output_urls,
    error: parsed.error,
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::get_test_api_key::get_test_api_key;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  #[tokio::test]
  #[ignore] // manually test — requires real API key and a valid request_id
  async fn test_poll_prediction_result() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = get_test_api_key()?;
    let request_id = RequestId::from_str("5fd7f575-4b9e-4c0a-b7f7-0eb036027b81"); // Corgi shiba I2V
    let request_id = RequestId::from_str("8a4b578b-4514-443f-b444-4fb3bc5c2cbb"); // Cat TTV
    let request_id = RequestId::from_str("82d622b1-8911-4cac-8362-e18efaa743ed"); // Corgi I2V
    let request_id = RequestId::from_str("671c2dee-2ca9-47d7-a12e-d16610b1b365"); // Corgi TTV #1
    let request_id = RequestId::from_str("8c5303f6-b602-433c-bae8-2d3ef915b7bb"); // Corgi TTV #2

    let result = poll_prediction_result(PollPredictionResultArgs {
      session: &session,
      request_id: &request_id,
    }).await?;
    println!("Status: {:?}", result.status);
    println!("Output URLs: {:?}", result.output_urls);
    println!("Error: {:?}", result.error);
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }
}
