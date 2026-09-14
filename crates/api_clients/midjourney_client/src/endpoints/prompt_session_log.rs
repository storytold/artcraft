use crate::client::midjourney_hostname::MidjourneyHostname;
use crate::error::midjourney_api_error::MidjourneyApiError;
use crate::error::midjourney_client_error::MidjourneyClientError;
use crate::error::midjourney_error::MidjourneyError;
use browser_emulation::browser_profile::BrowserProfile;
use cloudflare_errors::filter_cloudflare_errors::filter_cloudflare_errors;
use log::error;
use serde::{Deserialize, Serialize};

/// The semantic parameters of a prompt-session-log entry.
///
/// This endpoint is telemetry the web client fires alongside each imagine
/// submission (see the `08`/`11` captures); it is NOT the job-enqueue call
/// (that is `submit_job`). We mirror it so our traffic matches the browser's.
pub struct PromptSessionLogRequest<'a> {
  /// A client-generated session id (UUID) grouping prompts in one sitting.
  pub session_id: &'a str,

  /// Monotonic index of this prompt within the session, starting at 0.
  pub sequence_index: u32,

  /// Epoch milliseconds when the prompt was captured.
  pub captured_at_ms: u64,

  /// The prompt text WITHOUT the trailing `--` parameters.
  pub raw_text: &'a str,

  /// The model version string, e.g. `"8.2"`.
  pub version: &'a str,
}

/// A prompt-session-log request plus its transport concerns.
pub struct PromptSessionLogArgs<'a> {
  pub request: PromptSessionLogRequest<'a>,
  pub cookie_header: &'a str,
  /// Defaults to the standard hostname if absent.
  pub hostname: Option<&'a MidjourneyHostname>,
  /// Defaults to [`BrowserProfile::default`] if absent.
  pub browser: Option<BrowserProfile>,
}

#[derive(Debug, Clone)]
pub struct PromptSessionLogResponse {
  /// The `status` field from the response body (e.g. `"success"`).
  pub status: Option<String>,
}

pub async fn prompt_session_log(args: PromptSessionLogArgs<'_>) -> Result<PromptSessionLogResponse, MidjourneyError> {
  let cookie_header = args.cookie_header.trim();
  if cookie_header.len() < 20 {
    error!("Cookie header is too short (len: {})", cookie_header.len());
    return Err(MidjourneyClientError::CookieTooShort.into());
  }

  let default_hostname = MidjourneyHostname::Standard;
  let hostname = args.hostname.unwrap_or(&default_hostname);

  let client = args.browser.clone().unwrap_or_default().build_client().map_err(MidjourneyClientError::WreqError)?;

  let referer = format!("https://{}/imagine", hostname.as_str());
  let url = format!("https://{}/api/prompt-session-log", hostname.as_str());

  #[derive(Serialize)]
  struct RawRequest<'a> {
    session_id: &'a str,
    sequence_index: u32,
    captured_at_ms: u64,
    source: &'a str,
    raw_text: &'a str,
    route: &'a str,
    in_conversation_mode: bool,
    version: &'a str,
    video_mode: bool,
    image_prompt_count: u32,
    style_ref_count: u32,
    character_ref_count: u32,
    depth_ref_count: u32,
    starting_frame_count: u32,
    ending_frame_count: u32,
    openai_item_id: Option<String>,
  }

  let body = RawRequest { session_id: args.request.session_id, sequence_index: args.request.sequence_index, captured_at_ms: args.request.captured_at_ms, source: "imagine_text", raw_text: args.request.raw_text, route: "/imagine", in_conversation_mode: false, version: args.request.version, video_mode: false, image_prompt_count: 0, style_ref_count: 0, character_ref_count: 0, depth_ref_count: 0, starting_frame_count: 0, ending_frame_count: 0, openai_item_id: None };

  let http_request = client.post(url).header("cookie", cookie_header).header("Referer", &referer).header("Referrer-Policy", "origin-when-cross-origin").header("accept", "*/*").header("accept-language", "en-US,en;q=0.8").header("content-type", "application/json").header("priority", "u=1, i").header("sec-fetch-dest", "empty").header("sec-fetch-mode", "cors").header("sec-fetch-site", "same-origin").header("x-csrf-protection", "1").json(&body).build().map_err(MidjourneyClientError::WreqError)?;

  let response = client.execute(http_request).await.map_err(|e| MidjourneyApiError::NetworkError(e.to_string()))?;

  let status = response.status();
  let response_body = response.text().await.map_err(|e| MidjourneyApiError::NetworkError(e.to_string()))?;

  if !status.is_success() {
    if let Err(err) = filter_cloudflare_errors(status.as_u16(), &response_body) {
      return Err(MidjourneyApiError::CloudflareError(err).into());
    }
    return Err(MidjourneyApiError::UnknownHttpFailure { status_code: status.as_u16(), body: response_body }.into());
  }

  // {"status":"success"}
  #[derive(Deserialize)]
  struct RawResponse {
    status: Option<String>,
  }

  let response = serde_json::from_str::<RawResponse>(&response_body).map_err(|err| MidjourneyApiError::deserialization(err, response_body.as_str()))?;

  Ok(PromptSessionLogResponse { status: response.status })
}
