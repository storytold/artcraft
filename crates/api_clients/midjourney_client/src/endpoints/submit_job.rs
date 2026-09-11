use crate::error::midjourney_api_error::MidjourneyApiError;
use crate::error::midjourney_client_error::MidjourneyClientError;
use crate::error::midjourney_error::MidjourneyError;
use log::{error, warn};
use serde::{Deserialize, Serialize};

use crate::client::midjourney_hostname::MidjourneyHostname;
use cloudflare_errors::filter_cloudflare_errors::filter_cloudflare_errors;
use wreq::Client;
use wreq_util::Emulation;

pub struct SubmitJobRequest<'a> {
  pub prompt: &'a str,
  pub channel_id: &'a str,
  pub hostname: MidjourneyHostname,
  pub cookie_header: String,
}

#[derive(Debug, Clone)]
pub struct SubmitJobResponse {
  /// On success, the job ID is returned.
  pub maybe_job_id: Option<String>,
  
  /// On error, we have a list of error messages.
  pub maybe_errors: Option<Vec<SubmitJobError>>,
}

#[derive(Debug, Clone)]
pub struct SubmitJobError {
  pub error_type: Option<String>,
  pub message: Option<String>,
}

pub async fn submit_job(req: SubmitJobRequest<'_>) -> Result<SubmitJobResponse, MidjourneyError> {
  let client = Client::builder()
      .emulation(Emulation::Firefox139)
      .build()
      .map_err(|err| MidjourneyClientError::WreqError(err))?;

  let referer = format!("https://{}", req.hostname.as_str());

  // NB: Other recent clients use /api/app/submit-jobs, but this appears invalid.
  let url = format!("https://{}/api/submit-jobs", req.hostname.as_str());

  let cookie_header = req.cookie_header.trim();

  if cookie_header.len() < 20 {
    error!("Cookie header is too short (len: {}): {}", cookie_header.len(), cookie_header);
    return Err(MidjourneyClientError::CookieTooShort.into());
  }

  let mut http_request = client.post(url)
      .header("cookie", cookie_header)
      .header("Referer", &referer)
      .header("Referrer-Policy", "origin-when-cross-origin")
      .header("accept", "*/*")
      .header("accept-language", "en-US,en;q=0.8")
      .header("content-type", "application/json")
      .header("priority", "u=1, i")
      .header("sec-ch-ua-mobile", "?0")
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
    imagePrompts: u8,
    imageReferences: u8,
    characterReferences: u8,
    depthReferences: u8,
    lightboxOpen: String,
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
    channelId: req.channel_id.to_string(),
    metadata: Metadata {
      imagePrompts: 0,
      imageReferences: 0,
      characterReferences: 0,
      depthReferences: 0,
      lightboxOpen: "".to_string(),
    },
    t: "imagine".to_string(),
    prompt: req.prompt.to_string(),
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
      .map_err(|err| MidjourneyApiError::DeserializationError(err))?;

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
            error_type: Some(f.r#type.clone()), 
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
  use crate::client::midjourney_hostname::MidjourneyHostname;
  use crate::endpoints::submit_job::{submit_job, SubmitJobRequest};
  use errors::AnyhowResult;
  use filesys::read_to_trimmed_string::read_to_trimmed_string;

  // Get channel id via:
  // https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=[TOKEN]
  #[ignore]
  #[tokio::test]
  async fn test() -> AnyhowResult<()> {
    let cookie_header = read_to_trimmed_string("/Users/bt/secrets/midjourney/cookie.txt")?;
    let channel_id = read_to_trimmed_string("/Users/bt/secrets/midjourney/channel_id.txt")?;

    let result = submit_job(SubmitJobRequest {
      prompt: "a modern n64 console",
      channel_id: &channel_id,
      cookie_header,
      hostname: MidjourneyHostname::Standard,
    }).await?;

    println!("Response: {:?}", result);

    assert_eq!(1, 2);


    Ok(())
  }
}
