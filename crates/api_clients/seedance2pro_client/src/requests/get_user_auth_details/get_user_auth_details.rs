use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use crate::requests::get_user_auth_details::request_types::*;
use crate::requests::kinovi_host::{KinoviHost, resolve_host};
use crate::utils::common_headers::FIREFOX_USER_AGENT;
use log::info;
use wreq::Client;
use wreq_util::Emulation;

// --- Args & response ---

pub struct GetUserAuthDetailsArgs<'a> {
  pub session: &'a Seedance2ProSession,

  /// Override the default host (kinovi.ai).
  pub host_override: Option<KinoviHost>,
}

#[derive(Debug)]
pub struct GetUserAuthDetailsResponse {
  pub email: String,
  pub credits: u64,
  pub available_credits: u64,
}

// --- Implementation ---

/// The tRPC `input` query param for `auth.user` — a static null payload.
const AUTH_USER_INPUT: &str =
  r#"{"0":{"json":null,"meta":{"values":["undefined"],"v":1}}}"#;

pub async fn get_user_auth_details(
  args: GetUserAuthDetailsArgs<'_>,
) -> Result<GetUserAuthDetailsResponse, Seedance2ProError> {
  let host = resolve_host(args.host_override.as_ref());
  let base_url = host.api_base_url();
  let url = format!("{}/api/trpc/auth.user", base_url);

  info!("Fetching user auth details...");

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .build()
    .map_err(|err| Seedance2ProClientError::WreqClientError(err))?;

  let cookie = args.session.cookies.as_str();
  let referer = format!("{}/pricing", base_url);

  let request = client.get(&url)
    .query(&[("batch", "1"), ("input", AUTH_USER_INPUT)])
    .header("User-Agent", FIREFOX_USER_AGENT)
    .header("Accept", "*/*")
    .header("Accept-Language", "en-US,en;q=0.9")
    .header("Accept-Encoding", "gzip, deflate, br, zstd")
    .header("Referer", &referer)
    .header("content-type", "application/json")
    .header("x-trpc-source", "client")
    .header("Connection", "keep-alive")
    .header("Cookie", cookie)
    .header("Sec-Fetch-Dest", "empty")
    .header("Sec-Fetch-Mode", "cors")
    .header("Sec-Fetch-Site", "same-origin")
    .header("Priority", "u=4")
    .header("TE", "trailers")
    .build()
    .map_err(|err| Seedance2ProClientError::WreqClientError(err))?;

  let response = client.execute(request)
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  info!("Get user auth details response status: {}", status);

  if !status.is_success() {
    return Err(Seedance2ProGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body: response_body,
    }.into());
  }

  let batch_response: Vec<BatchResponseItem> = serde_json::from_str(&response_body)
    .map_err(|err| Seedance2ProGenericApiError::SerdeResponseParseErrorWithBody(
      err,
      response_body.clone(),
    ))?;

  let json = batch_response
    .into_iter()
    .next()
    .ok_or_else(|| Seedance2ProGenericApiError::UnexpectedResponseShape {
      explanation: "Empty batch response array".to_string(),
      raw_body: response_body.clone(),
    })?
    .result
    .data
    .json;

  info!("User: {}, credits: {}, available: {}", json.email, json.credits, json.available_credits);

  Ok(GetUserAuthDetailsResponse {
    email: json.email,
    credits: json.credits,
    available_credits: json.available_credits,
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::seedance2pro_session::Seedance2ProSession;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  fn test_session() -> AnyhowResult<Seedance2ProSession> {
    let cookies = get_test_cookies()?;
    Ok(Seedance2ProSession::from_cookies_string(cookies))
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies
  async fn test_get_user_auth_details() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;
    let result = get_user_auth_details(GetUserAuthDetailsArgs {
      session: &session,
      host_override: None,
    }).await?;
    println!("Email: {}", result.email);
    println!("Credits: {}", result.credits);
    println!("Available credits: {}", result.available_credits);
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }
}
