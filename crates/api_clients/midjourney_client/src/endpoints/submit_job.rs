use crate::error::midjourney_api_error::MidjourneyApiError;
use crate::error::midjourney_client_error::MidjourneyClientError;
use crate::error::midjourney_error::MidjourneyError;
use log::{error, warn};
use serde::{Deserialize, Serialize};

use crate::client::midjourney_hostname::MidjourneyHostname;
use browser_emulation::browser_profile::BrowserProfile;
use cloudflare_errors::filter_cloudflare_errors::filter_cloudflare_errors;

/// The semantic parameters of a submit-jobs request.
pub struct SubmitJobRequest<'a> {
  pub prompt: &'a str,
  pub channel_id: &'a str,
}

/// A submit-jobs request plus its transport concerns.
pub struct SubmitJobArgs<'a> {
  pub request: SubmitJobRequest<'a>,
  pub cookie_header: &'a str,
  /// Defaults to the standard hostname if absent.
  pub hostname: Option<&'a MidjourneyHostname>,
  /// Defaults to [`BrowserProfile::default`] if absent.
  pub browser: Option<BrowserProfile>,
}

#[derive(Debug, Clone)]
pub struct SubmitJobResponse {
  /// On success, the job ID is returned.
  pub maybe_job_id: Option<String>,

  /// On error, we have a list of error messages.
  pub maybe_errors: Option<Vec<SubmitJobError>>,
}

impl SubmitJobResponse {
  /// The classified errors returned by the submit, if any.
  pub fn errors(&self) -> &[SubmitJobError] {
    self.maybe_errors.as_deref().unwrap_or(&[])
  }

  /// Whether the submit was rejected because the account has no active paid
  /// Midjourney subscription (free trials disabled). First-class so callers
  /// can branch on it (e.g. prompt the user to subscribe).
  pub fn is_subscription_required(&self) -> bool {
    self.errors()
        .iter()
        .any(|error| error.error_type == MidjourneySubmitErrorType::SubscriptionRequired)
  }
}

#[derive(Debug, Clone)]
pub struct SubmitJobError {
  pub error_type: MidjourneySubmitErrorType,
  pub message: Option<String>,
}

/// A classified Midjourney submit-jobs failure `type`. Unknown values are
/// preserved via [`MidjourneySubmitErrorType::Other`] so matching stays
/// exhaustive-safe.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MidjourneySubmitErrorType {
  /// `subscription_required`: the account needs an active paid Midjourney plan.
  SubscriptionRequired,

  /// Any other failure type Midjourney returned (carries the raw string).
  Other(String),
}

impl MidjourneySubmitErrorType {
  pub fn from_api_str(value: &str) -> Self {
    match value {
      "subscription_required" => Self::SubscriptionRequired,
      other => Self::Other(other.to_string()),
    }
  }
}

pub async fn submit_job(args: SubmitJobArgs<'_>) -> Result<SubmitJobResponse, MidjourneyError> {
  let default_hostname = MidjourneyHostname::Standard;
  let hostname = args.hostname.unwrap_or(&default_hostname);

  let client = args.browser.clone().unwrap_or_default()
      .build_client()
      .map_err(MidjourneyClientError::WreqError)?;

  let referer = format!("https://{}", hostname.as_str());

  // NB: Other recent clients use /api/app/submit-jobs, but this appears invalid.
  let url = format!("https://{}/api/submit-jobs", hostname.as_str());

  let cookie_header = args.cookie_header.trim();

  if cookie_header.len() < 20 {
    error!("Cookie header is too short (len: {})", cookie_header.len());
    return Err(MidjourneyClientError::CookieTooShort.into());
  }

  // NB: Browser-identity headers (user-agent, sec-ch-ua*, accept-encoding) are
  // set coherently by the emulation on the client; here we set only the
  // request-context headers.
  let http_request = client.post(url)
      .header("cookie", cookie_header)
      .header("Referer", &referer)
      .header("Referrer-Policy", "origin-when-cross-origin")
      .header("accept", "*/*")
      .header("accept-language", "en-US,en;q=0.8")
      .header("content-type", "application/json")
      .header("priority", "u=1, i")
      .header("sec-fetch-dest", "empty")
      .header("sec-fetch-mode", "cors")
      .header("sec-fetch-site", "same-origin")
      .header("x-csrf-protection", "1");

  #[derive(Serialize)]
  struct F {
    mode: String,
    private: bool,
  }

  #[derive(Serialize)]
  #[allow(non_snake_case)]
  struct Metadata {
    // NB: Field order and null-vs-empty match the browser request exactly.
    isMobile: Option<bool>,
    imagePrompts: u8,
    imageReferences: u8,
    characterReferences: u8,
    depthReferences: u8,
    lightboxOpen: Option<bool>,
  }

  #[derive(Serialize)]
  #[allow(non_snake_case)]
  struct RawRequest {
    f: F,
    channelId: String,
    metadata: Metadata,
    t: String,
    prompt: String,
  }

  let body = RawRequest {
    f: F {
      mode: "fast".to_string(),
      private: false,
    },
    channelId: args.request.channel_id.to_string(),
    metadata: Metadata {
      isMobile: None,
      imagePrompts: 0,
      imageReferences: 0,
      characterReferences: 0,
      depthReferences: 0,
      lightboxOpen: None,
    },
    t: "imagine".to_string(),
    prompt: args.request.prompt.to_string(),
  };

  let http_request  = http_request
      .json(&body)
      .build()
      .map_err(|err| MidjourneyClientError::WreqError(err))?;

  let response = client.execute(http_request)
      .await
      .map_err(|e| MidjourneyApiError::NetworkError(e.to_string()))?;

  let status = response.status();

  // if status == 301 {
  //   for (name, value) in response.headers().iter() {
  //     println!("- {}: {}", name.as_str(), value.to_str().unwrap());
  //   }
  // }

  let response_body = &response.text().await
      .map_err(|e| MidjourneyApiError::NetworkError(e.to_string()))?;

  log::info!(
    "Midjourney submit-jobs response: status={}, body_len={}, looks_like_challenge={}",
    status.as_u16(),
    response_body.len(),
    response_body.contains("challenge-platform") || response_body.contains("Just a moment"),
  );

  if !status.is_success() {
    if let Err(err) = filter_cloudflare_errors(status.as_u16(), &response_body) {
      return Err(MidjourneyApiError::CloudflareError(err).into());
    }
  }

  /*
  {"success":[
    {
      "job_id":"UUID-like-string",
      "prompt":"prompt",
      "is_queued":false,
      "event_type":"diffusion",
      "flags":{
        "mode":"fast","visibility":"public"
      },
      "meta":{
        "height":1024,"width":1024,"batch_size":4,"parent_id":null,"parent_grid":null
      },
      "optimisticJobIndex":0,
      "personalization_codes":null
    }],
    "failure":[]}
   */

  #[derive(Deserialize)]
  struct SuccessPayload {
    job_id: String,
  }

  #[derive(Deserialize)]
  struct FailurePayload {
    r#type: String,
    message: String,
  }

  #[derive(Deserialize)]
  #[allow(non_snake_case)]
  struct RawResponse {
    success: Vec<SuccessPayload>,
    failure: Option<Vec<FailurePayload>>,
  }

  let response = serde_json::from_str::<RawResponse>(response_body)
      .map_err(|err| MidjourneyApiError::deserialization(err, response_body.as_str()))?;

  let maybe_job_id = response.success
      .get(0)
      .map(|s| s.job_id.clone());
  
  if maybe_job_id.is_none() {
    warn!("No job id found in body: {:?}", response_body);
  }

  let mut maybe_errors = None;
  
  if let Some(failures) = response.failure.as_ref() {
    if !failures.is_empty() {
      maybe_errors = Some(failures.iter()
          .map(|f| SubmitJobError {
            error_type: MidjourneySubmitErrorType::from_api_str(&f.r#type),
            message: Some(f.message.clone()),
          }).collect());
    }
  }

  Ok(SubmitJobResponse {
    maybe_job_id,
    maybe_errors,
  })
}

#[cfg(test)]
mod tests {
  use crate::endpoints::submit_job::{
    submit_job, MidjourneySubmitErrorType, SubmitJobArgs, SubmitJobError, SubmitJobRequest,
    SubmitJobResponse,
  };
  use errors::AnyhowResult;
  use filesys::read_to_trimmed_string::read_to_trimmed_string;

  #[test]
  fn classifies_subscription_required() {
    assert_eq!(
      MidjourneySubmitErrorType::from_api_str("subscription_required"),
      MidjourneySubmitErrorType::SubscriptionRequired,
    );
    assert_eq!(
      MidjourneySubmitErrorType::from_api_str("softban"),
      MidjourneySubmitErrorType::Other("softban".to_string()),
    );
  }

  #[test]
  fn response_flags_subscription_required() {
    let response = SubmitJobResponse {
      maybe_job_id: None,
      maybe_errors: Some(vec![SubmitJobError {
        error_type: MidjourneySubmitErrorType::SubscriptionRequired,
        message: Some("Please subscribe".to_string()),
      }]),
    };
    assert!(response.is_subscription_required());

    let ok = SubmitJobResponse { maybe_job_id: Some("job".to_string()), maybe_errors: None };
    assert!(!ok.is_subscription_required());
  }

  // Get channel id via:
  // https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=[TOKEN]
  #[ignore]
  #[tokio::test]
  async fn test() -> AnyhowResult<()> {
    let cookie_header = read_to_trimmed_string("/Users/bt/secrets/midjourney/cookie.txt")?;
    let channel_id = read_to_trimmed_string("/Users/bt/secrets/midjourney/channel_id.txt")?;

    let result = submit_job(SubmitJobArgs {
      request: SubmitJobRequest {
        prompt: "a modern n64 console",
        channel_id: &channel_id,
      },
      cookie_header: &cookie_header,
      hostname: None,
      browser: None,
    }).await?;

    println!("Response: {:?}", result);

    assert_eq!(1, 2);


    Ok(())
  }
}
