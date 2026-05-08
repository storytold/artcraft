use log::info;

use crate::creds::beeble_api_key::BeebleApiKey;
use crate::error::beeble_client_error::BeebleClientError;
use crate::error::beeble_error::BeebleError;
use crate::error::beeble_generic_api_error::BeebleGenericApiError;
use crate::error::beeble_specific_api_error::BeebleSpecificApiError;
use crate::requests::start_generation::request_types::GenerationJobResponseBody;
use crate::requests::start_generation::start_generation::{map_job_response, StartGenerationSuccess};

const BEEBLE_API_BASE_URL: &str = "https://api.beeble.ai/v1";

// ── Public args ──

pub struct GetJobStatusArgs {
  pub api_key: BeebleApiKey,
  /// The job ID (swx_...) to poll.
  pub job_id: String,
}

// ── Implementation ──

/// Poll the status of a SwitchX generation job.
///
/// Returns the same response shape as start_generation.
/// Poll until `status` is "completed" or "failed".
pub async fn get_job_status(args: GetJobStatusArgs) -> Result<StartGenerationSuccess, BeebleError> {
  let url = format!("{}/switchx/generations/{}", BEEBLE_API_BASE_URL, args.job_id);

  info!("Polling Beeble job status: job_id={}", args.job_id);

  let client = reqwest::Client::builder()
    .build()
    .map_err(|err| BeebleClientError::ReqwestClientError(err))?;

  let response = client.get(&url)
    .header("x-api-key", &args.api_key.api_key)
    .send()
    .await
    .map_err(|err| BeebleGenericApiError::ReqwestError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| BeebleGenericApiError::ReqwestError(err))?;

  info!("Beeble get job status response: status={}", status);

  match status.as_u16() {
    401 => return Err(BeebleSpecificApiError::Unauthorized.into()),
    429 => return Err(BeebleSpecificApiError::RateLimited.into()),
    _ if !status.is_success() => {
      return Err(BeebleGenericApiError::UncategorizedBadResponseWithStatusAndBody {
        status_code: status,
        body: response_body,
      }.into());
    }
    _ => {}
  }

  let parsed: GenerationJobResponseBody = serde_json::from_str(&response_body)
    .map_err(|err| BeebleGenericApiError::SerdeResponseParseError(err, response_body.clone()))?;

  Ok(map_job_response(parsed))
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::test_utils::get_test_api_key::get_test_api_key;

  const TEST_JOB_ID: &str = "swx_uZAcwMjRZpDesqfp3pKkF";

  #[tokio::test]
  #[ignore] // manually test — requires real API key
  async fn test_poll_known_job() -> errors::AnyhowResult<()> {
    let api_key = get_test_api_key()?;
    let result = get_job_status(GetJobStatusArgs {
      api_key,
      job_id: TEST_JOB_ID.to_string(),
    }).await?;

    println!("Job ID: {}", result.id);
    println!("Status: {}", result.status);
    println!("Progress: {:?}", result.progress);
    println!("Generation type: {:?}", result.generation_type);
    println!("Alpha mode: {:?}", result.alpha_mode);
    println!("Error: {:?}", result.error);
    println!("Created at: {:?}", result.created_at);
    if let Some(output) = &result.output {
      println!("Render URL: {:?}", output.render);
      println!("Source URL: {:?}", output.source);
      println!("Alpha URL: {:?}", output.alpha);
    }

    assert_eq!(result.id, TEST_JOB_ID);
    Ok(())
  }
}
