use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use crate::error::seedance2pro_specific_api_error::Seedance2ProSpecificApiError;
use crate::requests::generate_video::request_types::*;
use crate::utils::common_headers::FIREFOX_USER_AGENT;
use log::info;
use wreq::Client;
use wreq_util::Emulation;

const RUN_TASK_URL: &str = "https://seedance2-pro.com/api/trpc/workflow.runTask?batch=1";

// --- Request args ---

pub struct GenerateVideoArgs<'a> {
  pub session: &'a Seedance2ProSession,

  pub prompt: String,

  pub resolution: Resolution,

  /// Duration in seconds (4–15).
  pub duration_seconds: u8,

  pub batch_count: BatchCount,

  /// Optional start frame image URL (keyframe mode).
  pub start_frame_url: Option<String>,

  /// Optional end frame image URL (keyframe mode).
  pub end_frame_url: Option<String>,

  /// Optional reference image URLs (reference mode). When present, takes priority over start/end frames.
  pub reference_image_urls: Option<Vec<String>>,
}

impl GenerateVideoArgs<'_> {
  /// Estimates the credit cost for this generation request.
  ///
  /// Pricing rules:
  /// - 40 credits per second of video (4s = 160, 15s = 600)
  /// - Resolution has no effect on cost
  /// - Input mode (text, keyframe, reference) has no effect on cost
  /// - Batch 1 = 1×, Batch 2 = 2×, Batch 4 = 3× (not 4×)
  pub fn estimate_credits(&self) -> u32 {
    let per_video = u32::from(self.duration_seconds) * 40;
    let batch_multiplier = match self.batch_count {
      BatchCount::One => 1,
      BatchCount::Two => 2,
      BatchCount::Four => 3, // NB: 3x, not 4x.
    };
    per_video * batch_multiplier
  }

  pub fn estimate_cost_in_usd_cents(&self) -> u64 {
    // 25000 Credits costs $99.99 as of 2026-02-20
    // 250 for $1.
    let credits = self.estimate_credits() as f64;
    let cost = credits / 250.0 * 100.0;
    cost.round() as u64
  }
}

// --- Public enums ---

/// Video resolution / aspect ratio.
#[derive(Debug, Clone, Copy)]
pub enum Resolution {
  /// 16:9 landscape (1280x720)
  Landscape16x9,
  /// 9:16 portrait (720x1280)
  Portrait9x16,
  /// 1:1 square (720x720)
  Square1x1,
  /// 4:3 standard (960x720)
  Standard4x3,
  /// 3:4 portrait (720x960)
  Portrait3x4,
}

impl Resolution {
  fn as_str(&self) -> &'static str {
    match self {
      Self::Landscape16x9 => "1280x720",
      Self::Portrait9x16 => "720x1280",
      Self::Square1x1 => "720x720",
      Self::Standard4x3 => "960x720",
      Self::Portrait3x4 => "720x960",
    }
  }
}

/// Number of videos to generate in a single request.
#[derive(Debug, Clone, Copy)]
pub enum BatchCount {
  One,
  Two,
  Four,
}

impl BatchCount {
  fn as_u8(&self) -> u8 {
    match self {
      Self::One => 1,
      Self::Two => 2,
      Self::Four => 4,
    }
  }
}

// --- Response ---

pub struct GenerateVideoResponse {
  pub task_id: String,

  pub order_id: String,

  /// Present when batch_count > 1.
  pub task_ids: Option<Vec<String>>,

  /// Present when batch_count > 1.
  pub order_ids: Option<Vec<String>>,
}

// --- Implementation ---

pub async fn generate_video(args: GenerateVideoArgs<'_>) -> Result<GenerateVideoResponse, Seedance2ProError> {
  let is_reference_mode = args.reference_image_urls.as_ref().is_some_and(|urls| !urls.is_empty());

  let video_input_mode = if is_reference_mode { "reference" } else { "keyframe" };

  let uploaded_urls: Option<Vec<String>> = if is_reference_mode {
    args.reference_image_urls
  } else {
    let mut urls = Vec::new();
    if let Some(url) = args.start_frame_url {
      urls.push(url);
    }
    if let Some(url) = args.end_frame_url {
      urls.push(url);
    }
    if urls.is_empty() { None } else { Some(urls) }
  };

  let batch_count_value = args.batch_count.as_u8();
  let batch_count = if batch_count_value > 1 { Some(batch_count_value) } else { None };

  let duration = format!("{}s", args.duration_seconds);

  info!(
    "Generating video: mode={}, resolution={}, duration={}, batch={}",
    video_input_mode, args.resolution.as_str(), duration, batch_count_value
  );

  let request_body = BatchRequest {
    zero: BatchRequestInner {
      json: BatchRequestJson {
        business_type: "wan22-video-generation",
        api_params: ApiParams {
          prompt: args.prompt,
          resolution: args.resolution.as_str().to_string(),
          content_mode: "normal",
          model: "seedance-20",
          duration,
          mode: video_input_mode,
          uploaded_urls,
          batch_count,
        },
      },
    },
  };

  let cookie = args.session.cookies.as_str();

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .build()
    .map_err(|err| Seedance2ProClientError::WreqClientError(err))?;

  let response = client.post(RUN_TASK_URL)
    .header("User-Agent", FIREFOX_USER_AGENT)
    .header("Accept", "*/*")
    .header("Accept-Language", "en-US,en;q=0.9")
    .header("Accept-Encoding", "gzip, deflate, br, zstd")
    .header("Referer", "https://seedance2-pro.com/")
    .header("Content-Type", "application/json")
    .header("x-trpc-source", "client")
    .header("Origin", "https://seedance2-pro.com")
    .header("Connection", "keep-alive")
    .header("Cookie", cookie)
    .header("Sec-Fetch-Dest", "empty")
    .header("Sec-Fetch-Mode", "cors")
    .header("Sec-Fetch-Site", "same-origin")
    .header("Priority", "u=4")
    .header("TE", "trailers")
    .json(&request_body)
    .send()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| Seedance2ProGenericApiError::WreqError(err))?;

  info!("Response status: {}, body: {}", status, response_body);

  if !status.is_success() {
    return Err(Seedance2ProGenericApiError::UncategorizedBadResponseWithStatusAndBody {
      status_code: status,
      body: response_body,
    }.into());
  }

  let batch_response: Vec<BatchResponseItem> = serde_json::from_str(&response_body)
    .map_err(|err| Seedance2ProGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  let task_data = batch_response
    .into_iter()
    .next()
    .ok_or_else(|| Seedance2ProGenericApiError::UncategorizedBadResponse(
      "Empty batch response array".to_string()
    ))?
    .result
    .data
    .json;

  if task_data.violation_warning {
    return Err(Seedance2ProSpecificApiError::VideoGenerationViolation(response_body).into());
  }

  Ok(GenerateVideoResponse {
    task_id: task_data.task_id,
    order_id: task_data.order_id,
    task_ids: task_data.task_ids,
    order_ids: task_data.order_ids,
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

  fn dummy_session() -> Seedance2ProSession {
    Seedance2ProSession::from_cookies_string(String::new())
  }

  fn args_with(duration_seconds: u8, batch_count: BatchCount) -> GenerateVideoArgs<'static> {
    // Safety: the dummy session is leaked so the reference is 'static for test purposes.
    let session = Box::leak(Box::new(dummy_session()));
    GenerateVideoArgs {
      session,
      prompt: String::new(),
      resolution: Resolution::Square1x1,
      duration_seconds,
      batch_count,
      start_frame_url: None,
      end_frame_url: None,
      reference_image_urls: None,
    }
  }

  #[test]
  fn test_estimate_credits() {
    // 40 credits per second, batch 1
    assert_eq!(args_with(4, BatchCount::One).estimate_credits(), 160);
    assert_eq!(args_with(5, BatchCount::One).estimate_credits(), 200);
    assert_eq!(args_with(6, BatchCount::One).estimate_credits(), 240);
    assert_eq!(args_with(7, BatchCount::One).estimate_credits(), 280);
    assert_eq!(args_with(15, BatchCount::One).estimate_credits(), 600);

    // Batch 2 = 2×
    assert_eq!(args_with(4, BatchCount::Two).estimate_credits(), 320);
    assert_eq!(args_with(5, BatchCount::Two).estimate_credits(), 400);
    assert_eq!(args_with(15, BatchCount::Two).estimate_credits(), 1200);

    // Batch 4 = 3× (not 4×)
    assert_eq!(args_with(4, BatchCount::Four).estimate_credits(), 480);
    assert_eq!(args_with(5, BatchCount::Four).estimate_credits(), 600);
    assert_eq!(args_with(15, BatchCount::Four).estimate_credits(), 1800);
  }

  #[test]
  fn test_estimate_cost_usd_cents() {
    // 40 credits per second, batch 1
    assert_eq!(args_with(4, BatchCount::One).estimate_cost_in_usd_cents(), 64);
    assert_eq!(args_with(5, BatchCount::One).estimate_cost_in_usd_cents(), 80);
    assert_eq!(args_with(6, BatchCount::One).estimate_cost_in_usd_cents(), 96);
    assert_eq!(args_with(7, BatchCount::One).estimate_cost_in_usd_cents(), 112);
    assert_eq!(args_with(15, BatchCount::One).estimate_cost_in_usd_cents(), 240);

    // Batch 2 = 2×
    assert_eq!(args_with(4, BatchCount::Two).estimate_cost_in_usd_cents(), 128);
    assert_eq!(args_with(5, BatchCount::Two).estimate_cost_in_usd_cents(), 160);
    assert_eq!(args_with(15, BatchCount::Two).estimate_cost_in_usd_cents(), 480);

    // Batch 4 = 3× (not 4×)
    assert_eq!(args_with(4, BatchCount::Four).estimate_cost_in_usd_cents(), 192);
    assert_eq!(args_with(5, BatchCount::Four).estimate_cost_in_usd_cents(), 240);
    assert_eq!(args_with(15, BatchCount::Four).estimate_cost_in_usd_cents(), 720);
  }

  fn test_session() -> AnyhowResult<Seedance2ProSession> {
    let cookies = get_test_cookies()?;
    Ok(Seedance2ProSession::from_cookies_string(cookies))
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies
  async fn test_generate_text_to_video() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;
    let args = GenerateVideoArgs {
      session: &session,
      prompt: "A corgi eating a cake in a fancy kitchen.".to_string(),
      resolution: Resolution::Square1x1,
      duration_seconds: 5,
      batch_count: BatchCount::One,
      start_frame_url: None,
      end_frame_url: None,
      reference_image_urls: None,
    };
    let result = generate_video(args).await?;
    println!("Task ID: {}", result.task_id);
    println!("Order ID: {}", result.order_id);
    assert!(!result.task_id.is_empty());
    assert!(!result.order_id.is_empty());
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies
  async fn test_generate_keyframe_video() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;
    let args = GenerateVideoArgs {
      session: &session,
      prompt: "A dog shakes the glasses off its head. The camera pans out as the shiba shakes. The shiba barks.".to_string(),
      resolution: Resolution::Landscape16x9,
      duration_seconds: 5,
      batch_count: BatchCount::One,
      start_frame_url: Some("https://static.seedance2-pro.com/materials/20260219/1771496300184-fb32e08c.jpg".to_string()),
      end_frame_url: None,
      reference_image_urls: None,
    };
    let result = generate_video(args).await?;
    println!("Task ID: {}", result.task_id);
    println!("Order ID: {}", result.order_id);
    assert!(!result.task_id.is_empty());
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }

  #[tokio::test]
  #[ignore] // manually test — requires real cookies
  async fn test_generate_reference_video() -> AnyhowResult<()> {
    setup_test_logging(LevelFilter::Trace);
    let session = test_session()?;
    let args = GenerateVideoArgs {
      session: &session,
      prompt: "The dog in @2 is in the office at @1 without the man. The office is dark and moonlight streams in through the windows. Particles of dust gleam in the moon beams. Suddenly, the dog jumps walks in front of the desk and barks.".to_string(),
      resolution: Resolution::Standard4x3,
      duration_seconds: 10,
      batch_count: BatchCount::One,
      start_frame_url: None,
      end_frame_url: None,
      reference_image_urls: Some(vec![
        "https://static.seedance2-pro.com/materials/20260219/1771463564512-b14bfe90.png".to_string(),
        "https://static.seedance2-pro.com/materials/20260219/1771496300184-fb32e08c.jpg".to_string(),
      ]),
    };
    let result = generate_video(args).await?;
    println!("Task ID: {}", result.task_id);
    println!("Order ID: {}", result.order_id);
    assert!(!result.task_id.is_empty());
    assert_eq!(1, 2); // NB: Intentional failure to inspect output.
    Ok(())
  }
}
