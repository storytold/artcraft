use crate::api_types::request_id::RequestId;
use crate::creds::muapi_session::MuapiSession;
use crate::error::muapi_client_error::MuapiClientError;
use crate::error::muapi_error::MuapiError;
use crate::error::muapi_generic_api_error::MuapiGenericApiError;
use crate::requests::seedance_2p0_text_to_video::request_types::*;
use log::info;
use wreq::Client;

const SEEDANCE_2P0_T2V_URL: &str = "https://api.muapi.ai/api/v1/seedance-v2.0-t2v";

// --- Public enums ---

/// Video aspect ratio.
#[derive(Debug, Clone, Copy)]
pub enum AspectRatio {
  /// 16:9 landscape
  Landscape16x9,
  /// 9:16 portrait
  Portrait9x16,
  /// 4:3 standard
  Standard4x3,
  /// 3:4 portrait
  Portrait3x4,
}

impl AspectRatio {
  fn as_str(&self) -> &'static str {
    match self {
      Self::Landscape16x9 => "16:9",
      Self::Portrait9x16 => "9:16",
      Self::Standard4x3 => "4:3",
      Self::Portrait3x4 => "3:4",
    }
  }
}

/// Video duration.
#[derive(Debug, Clone, Copy)]
pub enum Duration {
  /// 5 seconds
  FiveSeconds,
  /// 10 seconds
  TenSeconds,
  /// 15 seconds
  FifteenSeconds,
}

impl Duration {
  fn as_u8(&self) -> u8 {
    match self {
      Self::FiveSeconds => 5,
      Self::TenSeconds => 10,
      Self::FifteenSeconds => 15,
    }
  }
}

/// Video quality tier.
#[derive(Debug, Clone, Copy)]
pub enum Quality {
  Basic,
  High,
}

impl Quality {
  fn as_str(&self) -> &'static str {
    match self {
      Self::Basic => "basic",
      Self::High => "high",
    }
  }
}

// --- Args & response ---

pub struct Seedance2p0TextToVideoArgs<'a> {
  pub session: &'a MuapiSession,

  /// The prompt describing the desired video.
  pub prompt: String,

  /// The aspect ratio for the output video.
  pub aspect_ratio: AspectRatio,

  /// Duration of the generated video.
  pub duration: Duration,

  /// Quality tier.
  pub quality: Quality,
}

impl Seedance2p0TextToVideoArgs<'_> {
  /// Estimates the credit cost for this generation request.
  ///
  /// Pricing (as of 2026-03):
  ///
  /// | Duration | Basic | High |
  /// |----------|-------|------|
  /// | 5s       | 0.60  | 1.25 |
  /// | 10s      | 1.20  | 2.50 |
  /// | 15s      | 1.80  | 3.75 |
  pub fn estimate_credits(&self) -> f64 {
    match (&self.quality, &self.duration) {
      (Quality::Basic, Duration::FiveSeconds) => 0.6,
      (Quality::Basic, Duration::TenSeconds) => 1.2,
      (Quality::Basic, Duration::FifteenSeconds) => 1.8,
      (Quality::High, Duration::FiveSeconds) => 1.25,
      (Quality::High, Duration::TenSeconds) => 2.5,
      (Quality::High, Duration::FifteenSeconds) => 3.75,
    }
  }

  /// Estimates the USD-cent cost for this generation request.
  ///
  /// Conversion: $1.00 = 1.0 credits.
  ///
  /// | Duration | Basic | High |
  /// |----------|-------|------|
  /// | 5s       |  60¢  | 125¢ |
  /// | 10s      | 120¢  | 250¢ |
  /// | 15s      | 180¢  | 375¢ |
  pub fn estimate_cost_in_usd_cents(&self) -> u64 {
    let credits = self.estimate_credits();
    (credits * 100.0).round() as u64
  }
}

impl std::fmt::Debug for Seedance2p0TextToVideoArgs<'_> {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("Seedance2p0TextToVideoArgs")
      .field("prompt", &self.prompt)
      .field("aspect_ratio", &self.aspect_ratio)
      .field("duration", &self.duration)
      .field("quality", &self.quality)
      .finish()
  }
}

#[derive(Debug)]
pub struct Seedance2p0TextToVideoResponse {
  /// The request ID used to poll for results.
  pub request_id: RequestId,
}

// --- Implementation ---

pub async fn seedance_2p0_text_to_video(
  args: Seedance2p0TextToVideoArgs<'_>,
) -> Result<Seedance2p0TextToVideoResponse, MuapiError> {
  info!("Submitting Seedance 2.0 t2v task to Muapi: {:?}", args);

  let request_body = Seedance2p0T2vRequest {
    prompt: args.prompt,
    aspect_ratio: args.aspect_ratio.as_str(),
    duration: args.duration.as_u8(),
    quality: args.quality.as_str(),
  };

  info!("Muapi request body: {:?}", request_body);

  let api_key = args.session.api_key.as_str();

  let client = Client::builder()
    .build()
    .map_err(|err| MuapiClientError::WreqClientError(err))?;

  let response = client.post(SEEDANCE_2P0_T2V_URL)
    .header("Content-Type", "application/json")
    .header("x-api-key", api_key)
    .json(&request_body)
    .send()
    .await
    .map_err(|err| MuapiGenericApiError::WreqError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| MuapiGenericApiError::WreqError(err))?;

  info!("Muapi response status: {}, body: {}", status, response_body);

  if !status.is_success() {
    return Err(MuapiGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body: response_body,
    }.into());
  }

  let parsed: Seedance2p0T2vResponse = serde_json::from_str(&response_body)
    .map_err(|err| MuapiGenericApiError::SerdeResponseParseErrorWithBody(err, response_body))?;

  Ok(Seedance2p0TextToVideoResponse {
    request_id: RequestId::new(parsed.request_id),
  })
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::muapi_api_key::MuapiApiKey;
  use crate::test_utils::get_test_api_key::get_test_api_key;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  fn dummy_session() -> MuapiSession {
    MuapiSession::new(MuapiApiKey::new(String::new()))
  }

  fn args_with(duration: Duration, quality: Quality) -> Seedance2p0TextToVideoArgs<'static> {
    let session = Box::leak(Box::new(dummy_session()));
    Seedance2p0TextToVideoArgs {
      session,
      prompt: String::new(),
      aspect_ratio: AspectRatio::Landscape16x9,
      duration,
      quality,
    }
  }

  #[test]
  fn test_estimate_credits() {
    // Basic
    assert_eq!(args_with(Duration::FiveSeconds, Quality::Basic).estimate_credits(), 0.6);
    assert_eq!(args_with(Duration::TenSeconds, Quality::Basic).estimate_credits(), 1.2);
    assert_eq!(args_with(Duration::FifteenSeconds, Quality::Basic).estimate_credits(), 1.8);

    // High
    assert_eq!(args_with(Duration::FiveSeconds, Quality::High).estimate_credits(), 1.25);
    assert_eq!(args_with(Duration::TenSeconds, Quality::High).estimate_credits(), 2.5);
    assert_eq!(args_with(Duration::FifteenSeconds, Quality::High).estimate_credits(), 3.75);
  }

  #[test]
  fn test_estimate_cost_in_usd_cents() {
    // Basic
    assert_eq!(args_with(Duration::FiveSeconds, Quality::Basic).estimate_cost_in_usd_cents(), 60);
    assert_eq!(args_with(Duration::TenSeconds, Quality::Basic).estimate_cost_in_usd_cents(), 120);
    assert_eq!(args_with(Duration::FifteenSeconds, Quality::Basic).estimate_cost_in_usd_cents(), 180);

    // High
    assert_eq!(args_with(Duration::FiveSeconds, Quality::High).estimate_cost_in_usd_cents(), 125);
    assert_eq!(args_with(Duration::TenSeconds, Quality::High).estimate_cost_in_usd_cents(), 250);
    assert_eq!(args_with(Duration::FifteenSeconds, Quality::High).estimate_cost_in_usd_cents(), 375);
  }

  #[tokio::test]
  #[ignore] // manually test — requires real API key
  async fn test_seedance_2p0_text_to_video_landscape() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = get_test_api_key()?;
    let args = Seedance2p0TextToVideoArgs {
      session: &session,
      prompt: "A corgi walks past a lighthouse on the shore. In the background, mossy rocks and rolling green hills dot the landscape. The sand is black, and the air is full of fog and mist".to_string(),
      aspect_ratio: AspectRatio::Landscape16x9,
      duration: Duration::FiveSeconds,
      quality: Quality::High,
    };
    let result = seedance_2p0_text_to_video(args).await?;
    println!("Result: {:?}", result);
    println!("Request ID: {}", result.request_id);
    assert!(!result.request_id.as_str().is_empty());
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real API key
  async fn test_seedance_2p0_text_to_video_portrait() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = get_test_api_key()?;
    let args = Seedance2p0TextToVideoArgs {
      session: &session,
      prompt: "A cat sits on a windowsill watching rain fall outside. Lightning flashes and the cat's eyes widen.".to_string(),
      aspect_ratio: AspectRatio::Portrait9x16,
      duration: Duration::TenSeconds,
      quality: Quality::Basic,
    };
    let result = seedance_2p0_text_to_video(args).await?;
    println!("Result: {:?}", result);
    println!("Request ID: {}", result.request_id);
    assert!(!result.request_id.as_str().is_empty());
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }
}
