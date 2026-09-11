use crate::constants::user_agent::CLIENT_USER_AGENT;
use crate::creds::sora_credential_set::SoraCredentialSet;
use crate::error::sora_client_error::SoraClientError;
use crate::error::sora_error::SoraError;
use crate::error::sora_generic_api_error::SoraGenericApiError;
use log::error;
use wreq::Client;

// https://sora.com/backend/notif?limit=100&before=task_01jqwwrkvgeqp8jsf5mqk1jceh

pub async fn unimplemented_sora_job_status(
  task_id: &str,
  credentials: &SoraCredentialSet,
) -> Result<(), SoraError> {
  let url = format!("https://sora.com/backend/notif?limit=100&before={}", task_id);

  let cookie = credentials.cookies.to_string();

  let authorization_header = credentials.jwt_bearer_token.as_ref()
      .ok_or(SoraClientError::NoBearerTokenForRequest)?
      .to_authorization_header_value();

  let client = Client::new();

  let request = client
      .get(url)
      .header("Authorization", &authorization_header)
      .header("User-Agent", CLIENT_USER_AGENT)
      .header("Cookie", &cookie);

  let response = request.send()
      .await
      .map_err(|err| {
        error!("sora fetch job status error: {}", err);
        SoraGenericApiError::WreqError(err)
      })?;

  let json_response = &response.text().await
      .map_err(|err| {
        error!("sora read job status error: {}", err);
        SoraGenericApiError::WreqError(err)
      })?;

  unimplemented!("job status is not parsed")
}

#[cfg(test)]
mod tests {
  use crate::creds::sora_credential_builder::SoraCredentialBuilder;
  use crate::requests::deprecated::job_status::unimplemented_sora_job_status::unimplemented_sora_job_status;
  use errors::AnyhowResult;
  use std::fs::read_to_string;
  use test_utils::test_file_path::test_file_path;

  #[ignore]
  #[tokio::test]
  pub async fn manual_test() -> AnyhowResult<()> {
    let sentinel = read_to_string(test_file_path("test_data/temp/sentinel.txt")?)?;
    let sentinel = sentinel.trim().to_string();

    let cookie = read_to_string(test_file_path("test_data/temp/cookie.txt")?)?;
    let cookie = cookie.trim().to_string();

    let bearer = read_to_string(test_file_path("test_data/temp/bearer.txt")?)?;
    let bearer = bearer.trim().to_string();

    let creds = SoraCredentialBuilder::new()
        .with_cookies(&cookie)
        .with_jwt_bearer_token(&bearer)
        .with_sora_sentinel(&sentinel)
        .build()?;

    let task_id = "task_01jqwwrkvgeqp8jsf5mqk1jceh";

    let result = unimplemented_sora_job_status(task_id, &creds).await?;

    Ok(())
  }
}
