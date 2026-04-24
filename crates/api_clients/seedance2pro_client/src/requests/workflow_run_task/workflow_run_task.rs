use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use crate::error::seedance2pro_specific_api_error::Seedance2ProSpecificApiError;
use crate::requests::workflow_run_task::request_types::*;
use crate::requests::kinovi_host::{KinoviHost, resolve_host};
use crate::utils::categorize_seedance2pro_error::categorize_seedance2pro_error;
use crate::utils::common_headers::FIREFOX_USER_AGENT;
use log::info;
use wreq::Client;
use wreq_util::Emulation;

// --- Request args ---

/// Wrapper that bundles a [`WorkflowRunTaskRequest`] with session and host info.
pub struct WorkflowRunTaskArgs<'a> {
  pub request: WorkflowRunTaskRequest,
  pub session: &'a Seedance2ProSession,
  pub host_override: Option<KinoviHost>,
}

/// Video generation parameters (no session/host info).
#[derive(Clone)]
pub struct WorkflowRunTaskRequest {
  /// Seedance 2.0 Pro vs Fast
  pub model_type: KinoviModelTypeRaw,

  pub prompt: String,

  /// The aspect ratio
  /// (Kinovi terms this "resolution" in the API, confusingly.)
  pub aspect_ratio: KinoviAspectRatioRaw,

  /// The resolution
  /// Output resolution quality (480p, 720p, 1080p). None defaults to 720p.
  /// (Kinovi terms this "outputResolution" in the API, which is confusingly named)
  pub output_resolution: Option<KinoviOutputResolutionRaw>,

  /// Duration in seconds (4–15).
  pub duration_seconds: u8,

  pub batch_count: KinoviBatchCountRaw,

  /// Optional start frame image URL (keyframe mode).
  pub start_frame_url: Option<String>,

  /// Optional end frame image URL (keyframe mode).
  pub end_frame_url: Option<String>,

  /// Optional reference image URLs (reference mode).
  /// When present, takes priority over start/end frames.
  pub reference_image_urls: Option<Vec<String>>,

  /// Optional reference video URLs (reference mode).
  /// Can be combined with reference_image_urls.
  /// Videos are referenced in prompts as @video1, @video2, etc.
  /// When present, takes priority over start/end frames.
  pub reference_video_urls: Option<Vec<String>>,

  /// Optional reference audio URLs (reference mode).
  /// Audio is referenced in prompts as @audio1, @audio2, etc.
  /// Sent in a separate `audioUrls` field (not in `uploadedUrls`).
  pub reference_audio_urls: Option<Vec<String>>,

  /// Optional Kinovi character IDs to reference in the prompt.
  /// Characters are referenced in prompts as @CharacterName.
  pub character_ids: Option<Vec<String>>,

  /// Controls the `faceBlurMode` field: true sends "on", false sends "off", None omits it.
  pub use_face_blur_hack: Option<bool>,
}

impl std::fmt::Debug for WorkflowRunTaskRequest {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("WorkflowRunTaskRequest")
      .field("model_type", &self.model_type)
      .field("prompt", &self.prompt)
      .field("aspect_ratio", &self.aspect_ratio)
      .field("duration_seconds", &self.duration_seconds)
      .field("batch_count", &self.batch_count)
      .field("start_frame_url", &self.start_frame_url)
      .field("end_frame_url", &self.end_frame_url)
      .field("reference_image_urls", &self.reference_image_urls)
      .field("reference_video_urls", &self.reference_video_urls)
      .field("reference_audio_urls", &self.reference_audio_urls)
      .field("character_ids", &self.character_ids)
      .field("output_resolution", &self.output_resolution)
      .field("use_face_blur_hack", &self.use_face_blur_hack)
      .finish()
  }
}

impl std::fmt::Debug for WorkflowRunTaskArgs<'_> {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("WorkflowRunTaskArgs")
      .field("request", &self.request)
      .field("host_override", &self.host_override)
      .finish()
  }
}

impl WorkflowRunTaskRequest {
  /// Estimates the credit cost for this generation request.
  ///
  /// Pricing is per-second × batch count, with the per-second rate
  /// depending on model type and output resolution:
  ///
  /// | Model        | 480p | 720p | 1080p |
  /// |--------------|------|------|-------|
  /// | Pro          |   15 |   40 |    90 |
  /// | Fast         |   10 |   28 |   n/a |
  /// | HappyHorse   |   15 |   40 |    90 |
  /// TODO(bt,2026-04-23): Not sure pricing for Happy Horse is correct here.
  ///
  /// Input mode (text, keyframe, reference) has no effect on cost.
  /// Aspect ratio (`resolution` field) has no effect on cost.
  pub fn estimate_credits(&self) -> u32 {
    let credits_per_second: u32 = match (self.model_type, self.output_resolution) {
      // Seedance 2.0 Pro
      (KinoviModelTypeRaw::Seedance2Pro, Some(KinoviOutputResolutionRaw::FourEightyP)) => 15,
      (KinoviModelTypeRaw::Seedance2Pro, None)
      | (KinoviModelTypeRaw::Seedance2Pro, Some(KinoviOutputResolutionRaw::SevenTwentyP)) => 40,
      (KinoviModelTypeRaw::Seedance2Pro, Some(KinoviOutputResolutionRaw::TenEightyP)) => 90,

      // Seedance 2.0 Fast
      (KinoviModelTypeRaw::Seedance2Fast, Some(KinoviOutputResolutionRaw::FourEightyP)) => 10,
      (KinoviModelTypeRaw::Seedance2Fast, None)
      | (KinoviModelTypeRaw::Seedance2Fast, Some(KinoviOutputResolutionRaw::SevenTwentyP)) => 28,
      // NB: 1080p not officially supported for Fast, but price as 720p if requested
      (KinoviModelTypeRaw::Seedance2Fast, Some(KinoviOutputResolutionRaw::TenEightyP)) => 28,

      // TODO(bt,2026-04-23): Not sure pricing for Happy Horse is correct here.
      // Happy Horse 1.0 — same credit rates as Seedance 2.0 Pro
      (KinoviModelTypeRaw::HappyHorse1p0, Some(KinoviOutputResolutionRaw::FourEightyP)) => 15,
      (KinoviModelTypeRaw::HappyHorse1p0, None)
      | (KinoviModelTypeRaw::HappyHorse1p0, Some(KinoviOutputResolutionRaw::SevenTwentyP)) => 40,
      (KinoviModelTypeRaw::HappyHorse1p0, Some(KinoviOutputResolutionRaw::TenEightyP)) => 90,
    };

    let per_video = u32::from(self.duration_seconds) * credits_per_second;
    let batch_multiplier: u32 = match self.batch_count {
      KinoviBatchCountRaw::One => 1,
      KinoviBatchCountRaw::Two => 2,
      KinoviBatchCountRaw::Four => 4,
    };
    per_video * batch_multiplier
  }

  /// Credits per dollar for billing conversion.
  ///
  /// Legacy 720p pricing uses the original Kinovi credit package rates.
  /// All other model/resolution combos use the newer rate: 22,000 credits / $114.
  fn credits_per_dollar(&self) -> f64 {
    match (self.model_type, self.output_resolution) {
      // Legacy: Seedance 2.0 Pro @ 720p — 25,000 credits for $99.99
      (KinoviModelTypeRaw::Seedance2Pro, None)
      | (KinoviModelTypeRaw::Seedance2Pro, Some(KinoviOutputResolutionRaw::SevenTwentyP)) => 250.0,

      // Legacy: Seedance 2.0 Fast @ 720p — 22,000 credits for $99.99
      (KinoviModelTypeRaw::Seedance2Fast, None)
      | (KinoviModelTypeRaw::Seedance2Fast, Some(KinoviOutputResolutionRaw::SevenTwentyP)) => 220.0,

      // New pricing: 22,000 credits for $114 (~192.98 credits/$1)
      _ => 193.0,
    }
  }

  pub fn estimate_cost_in_usd_cents(&self) -> u64 {
    let credits = self.estimate_credits() as f64;
    let credits_per_dollar = self.credits_per_dollar();
    let cost = credits / credits_per_dollar * 100.0;
    cost.round() as u64
  }
}

// --- Public enums ---

/// Video resolution / aspect ratio.
#[derive(Debug, Clone, Copy)]
pub enum KinoviAspectRatioRaw {
  /// 16:9 landscape (1280x720)
  Landscape16x9,
  /// 9:16 portrait (720x1280)
  Portrait9x16,
  /// 1:1 square (720x720)
  Square1x1,
  /// 4:3 standard (960x720)
  Landscape4x3,
  /// 3:4 portrait (720x960)
  Portrait3x4,
}

impl KinoviAspectRatioRaw {
  fn as_str(&self) -> &'static str {
    match self {
      Self::Landscape16x9 => "1280x720",
      Self::Portrait9x16 => "720x1280",
      Self::Square1x1 => "720x720",
      Self::Landscape4x3 => "960x720",
      Self::Portrait3x4 => "720x960",
    }
  }
}

/// Output resolution quality. When omitted, defaults to 720p.
#[derive(Debug, Clone, Copy)]
pub enum KinoviOutputResolutionRaw {
  /// 480p
  FourEightyP,
  /// 720p (default — omitting the field gives this)
  SevenTwentyP,
  /// 1080p
  TenEightyP,
}

impl KinoviOutputResolutionRaw {
  /// Returns the API string to send, or None for 720p (the default, which is
  /// expressed by omitting the field entirely).
  pub fn as_api_str(&self) -> Option<&'static str> {
    match self {
      Self::FourEightyP => Some("480p"),
      Self::SevenTwentyP => None, // Default — omit from request
      Self::TenEightyP => Some("1080p"),
    }
  }
}

/// Number of videos to generate in a single request.
#[derive(Debug, Clone, Copy)]
pub enum KinoviBatchCountRaw {
  One,
  Two,
  Four,
}

impl KinoviBatchCountRaw {
  fn as_u8(&self) -> u8 {
    match self {
      Self::One => 1,
      Self::Two => 2,
      Self::Four => 4,
    }
  }
}

/// The model variant to use.
#[derive(Debug, Clone, Copy)]
pub enum KinoviModelTypeRaw {
  /// Seedance 2.0 Pro (higher quality, slower).
  Seedance2Pro,
  /// Seedance 2.0 Fast (lower quality, faster).
  Seedance2Fast,
  /// Happy Horse 1.0.
  HappyHorse1p0,
}

impl KinoviModelTypeRaw {
  fn as_api_str(&self) -> &'static str {
    match self {
      Self::Seedance2Pro => "seedance-20",
      Self::Seedance2Fast => "seedance2-fast",
      Self::HappyHorse1p0 => "happyhorse1.0",
    }
  }
}

// --- Response ---

pub struct WorkflowRunTaskResponse {
  pub task_id: String,

  pub order_id: String,

  /// Present when batch_count > 1.
  pub task_ids: Option<Vec<String>>,

  /// Present when batch_count > 1.
  pub order_ids: Option<Vec<String>>,
}

// --- Implementation ---

pub async fn workflow_run_task(args: WorkflowRunTaskArgs<'_>) -> Result<WorkflowRunTaskResponse, Seedance2ProError> {
  let host = resolve_host(args.host_override.as_ref());
  let base_url = host.api_base_url();
  let run_task_url = format!("{}/api/trpc/workflow.runTask?batch=1", base_url);

  let req = args.request;

  info!("Requesting video from Seedance2Pro (v2): {:?}", req);

  let has_reference_images = req.reference_image_urls.as_ref().is_some_and(|urls| !urls.is_empty());
  let has_reference_videos = req.reference_video_urls.as_ref().is_some_and(|urls| !urls.is_empty());
  let has_reference_audio = req.reference_audio_urls.as_ref().is_some_and(|urls| !urls.is_empty());

  let is_reference_mode = has_reference_images || has_reference_videos || has_reference_audio;

  let video_input_mode = if is_reference_mode { "reference" } else { "keyframe" };

  let uploaded_urls: Option<Vec<String>> = if is_reference_mode {
    let mut urls = Vec::new();
    if let Some(video_urls) = req.reference_video_urls {
      urls.extend(video_urls);
    }
    if let Some(image_urls) = req.reference_image_urls {
      urls.extend(image_urls);
    }
    if urls.is_empty() { None } else { Some(urls) }
  } else {
    let mut urls = Vec::new();
    if let Some(url) = req.start_frame_url {
      urls.push(url);
    }
    if let Some(url) = req.end_frame_url {
      urls.push(url);
    }
    if urls.is_empty() { None } else { Some(urls) }
  };

  let audio_urls: Option<Vec<String>> = if has_reference_audio {
    req.reference_audio_urls
  } else {
    None
  };

  let face_blur_mode = match req.use_face_blur_hack {
    Some(true) => Some("on"),
    Some(false) => Some("off"),
    None => None,
  };

  let batch_count_value = req.batch_count.as_u8();
  let batch_count = if batch_count_value > 1 { Some(batch_count_value) } else { None };

  let duration = format!("{}s", req.duration_seconds);

  info!(
    "Generating video (v2): mode={}, resolution={}, duration={}, batch={}",
    video_input_mode, req.aspect_ratio.as_str(), duration, batch_count_value
  );

  let request_body = BatchRequest {
    zero: BatchRequestInner {
      json: BatchRequestJson {
        business_type: "wan22-video-generation",
        api_params: ApiParams {
          prompt: req.prompt,
          resolution: req.aspect_ratio.as_str().to_string(),
          content_mode: "normal",
          model: req.model_type.as_api_str(),
          duration,
          mode: video_input_mode,
          output_resolution: req.output_resolution.and_then(|r| r.as_api_str()),
          face_blur_mode,
          character_ids: req.character_ids,
          uploaded_urls,
          audio_urls,
          batch_count,
        },
      },
    },
  };

  info!("Seedance2pro request (v2): {:?}", request_body);

  let cookie = args.session.cookies.as_str();

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .build()
    .map_err(|err| Seedance2ProClientError::WreqClientError(err))?;

  let referer = format!("{}/", base_url);

  let response = client.post(&run_task_url)
    .header("User-Agent", FIREFOX_USER_AGENT)
    .header("Accept", "*/*")
    .header("Accept-Language", "en-US,en;q=0.9")
    .header("Accept-Encoding", "gzip, deflate, br, zstd")
    .header("Referer", &referer)
    .header("Content-Type", "application/json")
    .header("x-trpc-source", "client")
    .header("Origin", base_url)
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
    return Err(categorize_seedance2pro_error(status, response_body));
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

  Ok(WorkflowRunTaskResponse {
    task_id: task_data.task_id,
    order_id: task_data.order_id,
    task_ids: task_data.task_ids,
    order_ids: task_data.order_ids,
  })
}

#[cfg(test)]
mod tests {
  use std::fs;
  use super::*;
  use crate::creds::seedance2pro_session::Seedance2ProSession;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;
  use crate::requests::prepare_file_upload::prepare_file_upload::{prepare_file_upload, PrepareFileUploadArgs};
  use crate::requests::upload_file::upload_file::{upload_file, UploadFileArgs};

  mod pricing_tests {
    use super::*;

    fn make_args(
      model_type: KinoviModelTypeRaw,
      duration_seconds: u8,
      batch_count: KinoviBatchCountRaw,
      output_resolution: Option<KinoviOutputResolutionRaw>,
    ) -> WorkflowRunTaskRequest {
      WorkflowRunTaskRequest {
        model_type,
        prompt: String::new(),
        aspect_ratio: KinoviAspectRatioRaw::Square1x1,
        duration_seconds,
        batch_count,
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: None,
        reference_video_urls: None,
        reference_audio_urls: None,
        character_ids: None,
        output_resolution,
        use_face_blur_hack: None,
      }
    }

    fn pro(dur: u8, batch: KinoviBatchCountRaw) -> WorkflowRunTaskRequest {
      make_args(KinoviModelTypeRaw::Seedance2Pro, dur, batch, None)
    }

    fn pro_res(dur: u8, batch: KinoviBatchCountRaw, res: KinoviOutputResolutionRaw) -> WorkflowRunTaskRequest {
      make_args(KinoviModelTypeRaw::Seedance2Pro, dur, batch, Some(res))
    }

    fn fast(dur: u8, batch: KinoviBatchCountRaw) -> WorkflowRunTaskRequest {
      make_args(KinoviModelTypeRaw::Seedance2Fast, dur, batch, None)
    }

    fn fast_res(dur: u8, batch: KinoviBatchCountRaw, res: KinoviOutputResolutionRaw) -> WorkflowRunTaskRequest {
      make_args(KinoviModelTypeRaw::Seedance2Fast, dur, batch, Some(res))
    }

    // ── Spot checks: exact values from the pricing table ──

    #[test]
    fn spot_check_pro_720p() {
      assert_eq!(pro(5, KinoviBatchCountRaw::One).estimate_credits(), 200);
      assert_eq!(pro(10, KinoviBatchCountRaw::One).estimate_credits(), 400);
      assert_eq!(pro(15, KinoviBatchCountRaw::One).estimate_credits(), 600);
    }

    #[test]
    fn spot_check_pro_480p() {
      assert_eq!(pro_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::FourEightyP).estimate_credits(), 75);
      assert_eq!(pro_res(10, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::FourEightyP).estimate_credits(), 150);
      assert_eq!(pro_res(15, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::FourEightyP).estimate_credits(), 225);
    }

    #[test]
    fn spot_check_pro_1080p() {
      assert_eq!(pro_res(4, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).estimate_credits(), 360);
      assert_eq!(pro_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).estimate_credits(), 450);
      assert_eq!(pro_res(6, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).estimate_credits(), 540);
      assert_eq!(pro_res(7, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).estimate_credits(), 630);
      assert_eq!(pro_res(8, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).estimate_credits(), 720);
      assert_eq!(pro_res(9, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).estimate_credits(), 810);
      assert_eq!(pro_res(10, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).estimate_credits(), 900);
      assert_eq!(pro_res(11, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).estimate_credits(), 990);
      assert_eq!(pro_res(12, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).estimate_credits(), 1080);
      assert_eq!(pro_res(13, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).estimate_credits(), 1170);
      assert_eq!(pro_res(14, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).estimate_credits(), 1260);
      assert_eq!(pro_res(15, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).estimate_credits(), 1350);
    }

    #[test]
    fn spot_check_fast_720p() {
      assert_eq!(fast(5, KinoviBatchCountRaw::One).estimate_credits(), 140);
      assert_eq!(fast(10, KinoviBatchCountRaw::One).estimate_credits(), 280);
    }

    #[test]
    fn spot_check_fast_480p() {
      assert_eq!(fast_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::FourEightyP).estimate_credits(), 50);
      assert_eq!(fast_res(10, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::FourEightyP).estimate_credits(), 100);
    }

    #[test]
    fn pro_more_expensive_than_fast_720p() {
      let p = pro(5, KinoviBatchCountRaw::One).estimate_credits();
      let f = fast(5, KinoviBatchCountRaw::One).estimate_credits();
      assert!(p > f, "Pro 720p ({}) should be more than Fast 720p ({})", p, f);
    }

    #[test]
    fn pro_more_expensive_than_fast_480p() {
      let p = pro_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::FourEightyP).estimate_credits();
      let f = fast_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::FourEightyP).estimate_credits();
      assert!(p > f, "Pro 480p ({}) should be more than Fast 480p ({})", p, f);
    }

    #[test]
    fn pro_1080p_more_than_720p_more_than_480p() {
      let c480 = pro_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::FourEightyP).estimate_credits();
      let c720 = pro(5, KinoviBatchCountRaw::One).estimate_credits();
      let c1080 = pro_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).estimate_credits();
      assert!(c480 < c720, "480p ({}) should be less than 720p ({})", c480, c720);
      assert!(c720 < c1080, "720p ({}) should be less than 1080p ({})", c720, c1080);
    }

    #[test]
    fn fast_720p_more_than_480p() {
      let c480 = fast_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::FourEightyP).estimate_credits();
      let c720 = fast(5, KinoviBatchCountRaw::One).estimate_credits();
      assert!(c480 < c720, "Fast 480p ({}) should be less than Fast 720p ({})", c480, c720);
    }

    #[test]
    fn pro_none_same_as_720p() {
      let none = pro(5, KinoviBatchCountRaw::One).estimate_credits();
      let explicit = pro_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::SevenTwentyP).estimate_credits();
      assert_eq!(none, explicit);
    }

    #[test]
    fn fast_none_same_as_720p() {
      let none = fast(5, KinoviBatchCountRaw::One).estimate_credits();
      let explicit = fast_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::SevenTwentyP).estimate_credits();
      assert_eq!(none, explicit);
    }

    #[test]
    fn table_driven_credits() {
      let cases: Vec<(KinoviModelTypeRaw, Option<KinoviOutputResolutionRaw>, u8, KinoviBatchCountRaw, u32)> = vec![
        (KinoviModelTypeRaw::Seedance2Pro, None, 4, KinoviBatchCountRaw::One, 160),
        (KinoviModelTypeRaw::Seedance2Pro, None, 5, KinoviBatchCountRaw::Two, 400),
        (KinoviModelTypeRaw::Seedance2Pro, None, 10, KinoviBatchCountRaw::Four, 1600),
        (KinoviModelTypeRaw::Seedance2Pro, Some(KinoviOutputResolutionRaw::FourEightyP), 5, KinoviBatchCountRaw::One, 75),
        (KinoviModelTypeRaw::Seedance2Pro, Some(KinoviOutputResolutionRaw::FourEightyP), 10, KinoviBatchCountRaw::Two, 300),
        (KinoviModelTypeRaw::Seedance2Pro, Some(KinoviOutputResolutionRaw::FourEightyP), 15, KinoviBatchCountRaw::Four, 900),
        (KinoviModelTypeRaw::Seedance2Pro, Some(KinoviOutputResolutionRaw::TenEightyP), 5, KinoviBatchCountRaw::One, 450),
        (KinoviModelTypeRaw::Seedance2Pro, Some(KinoviOutputResolutionRaw::TenEightyP), 10, KinoviBatchCountRaw::Two, 1800),
        (KinoviModelTypeRaw::Seedance2Pro, Some(KinoviOutputResolutionRaw::TenEightyP), 15, KinoviBatchCountRaw::Four, 5400),
        (KinoviModelTypeRaw::Seedance2Fast, None, 4, KinoviBatchCountRaw::One, 112),
        (KinoviModelTypeRaw::Seedance2Fast, None, 5, KinoviBatchCountRaw::Two, 280),
        (KinoviModelTypeRaw::Seedance2Fast, None, 15, KinoviBatchCountRaw::Four, 1680),
        (KinoviModelTypeRaw::Seedance2Fast, Some(KinoviOutputResolutionRaw::FourEightyP), 5, KinoviBatchCountRaw::One, 50),
        (KinoviModelTypeRaw::Seedance2Fast, Some(KinoviOutputResolutionRaw::FourEightyP), 10, KinoviBatchCountRaw::Two, 200),
        (KinoviModelTypeRaw::Seedance2Fast, Some(KinoviOutputResolutionRaw::FourEightyP), 15, KinoviBatchCountRaw::Four, 600),
      ];

      for (i, (model, res, dur, batch, expected)) in cases.iter().enumerate() {
        let args = make_args(*model, *dur, *batch, *res);
        let actual = args.estimate_credits();
        assert_eq!(
          actual, *expected,
          "Case {}: {:?} {:?} {}s batch {:?} — expected {} credits, got {}",
          i, model, res, dur, batch, expected, actual,
        );
      }
    }

    #[test]
    fn aspect_ratio_does_not_affect_credits() {
      let resolutions = [
        KinoviAspectRatioRaw::Landscape16x9,
        KinoviAspectRatioRaw::Portrait9x16,
        KinoviAspectRatioRaw::Square1x1,
        KinoviAspectRatioRaw::Landscape4x3,
        KinoviAspectRatioRaw::Portrait3x4,
      ];

      let baseline = pro(5, KinoviBatchCountRaw::One).estimate_credits();

      for res in &resolutions {
        let req = WorkflowRunTaskRequest {
          model_type: KinoviModelTypeRaw::Seedance2Pro,
          prompt: String::new(),
          aspect_ratio: *res,
          duration_seconds: 5,
          batch_count: KinoviBatchCountRaw::One,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          output_resolution: None,
          use_face_blur_hack: None,
        };
        assert_eq!(
          req.estimate_credits(), baseline,
          "Aspect ratio {:?} should not change credits from baseline {}",
          res, baseline,
        );
      }
    }

    #[test]
    fn usd_cents_legacy_pro_720p() {
      assert_eq!(pro(5, KinoviBatchCountRaw::One).estimate_cost_in_usd_cents(), 80);
      assert_eq!(pro(10, KinoviBatchCountRaw::One).estimate_cost_in_usd_cents(), 160);
      assert_eq!(pro(15, KinoviBatchCountRaw::One).estimate_cost_in_usd_cents(), 240);
      assert_eq!(pro(5, KinoviBatchCountRaw::Two).estimate_cost_in_usd_cents(), 160);
      assert_eq!(pro(5, KinoviBatchCountRaw::Four).estimate_cost_in_usd_cents(), 320);
    }

    #[test]
    fn usd_cents_legacy_fast_720p() {
      assert_eq!(fast(5, KinoviBatchCountRaw::One).estimate_cost_in_usd_cents(), 64);
      assert_eq!(fast(10, KinoviBatchCountRaw::One).estimate_cost_in_usd_cents(), 127);
    }

    #[test]
    fn usd_cents_new_pro_480p() {
      assert_eq!(pro_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::FourEightyP).estimate_cost_in_usd_cents(), 39);
      assert_eq!(pro_res(10, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::FourEightyP).estimate_cost_in_usd_cents(), 78);
    }

    #[test]
    fn usd_cents_new_pro_1080p() {
      assert_eq!(pro_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).estimate_cost_in_usd_cents(), 233);
      assert_eq!(pro_res(10, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).estimate_cost_in_usd_cents(), 466);
    }

    #[test]
    fn usd_cents_new_fast_480p() {
      assert_eq!(fast_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::FourEightyP).estimate_cost_in_usd_cents(), 26);
      assert_eq!(fast_res(10, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::FourEightyP).estimate_cost_in_usd_cents(), 52);
    }

    #[test]
    fn credits_per_dollar_legacy_rates() {
      assert_eq!(pro(5, KinoviBatchCountRaw::One).credits_per_dollar(), 250.0);
      assert_eq!(fast(5, KinoviBatchCountRaw::One).credits_per_dollar(), 220.0);
      assert_eq!(pro_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::SevenTwentyP).credits_per_dollar(), 250.0);
      assert_eq!(fast_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::SevenTwentyP).credits_per_dollar(), 220.0);
    }

    #[test]
    fn credits_per_dollar_new_rate() {
      assert_eq!(pro_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::FourEightyP).credits_per_dollar(), 193.0);
      assert_eq!(pro_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).credits_per_dollar(), 193.0);
      assert_eq!(fast_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::FourEightyP).credits_per_dollar(), 193.0);
      assert_eq!(fast_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).credits_per_dollar(), 193.0);
    }

    // ── Happy Horse 1.0 ──

    fn happy_horse(dur: u8, batch: KinoviBatchCountRaw) -> WorkflowRunTaskRequest {
      make_args(KinoviModelTypeRaw::HappyHorse1p0, dur, batch, None)
    }

    fn happy_horse_res(dur: u8, batch: KinoviBatchCountRaw, res: KinoviOutputResolutionRaw) -> WorkflowRunTaskRequest {
      make_args(KinoviModelTypeRaw::HappyHorse1p0, dur, batch, Some(res))
    }

    #[test]
    fn spot_check_happy_horse_720p() {
      // Same as Pro: 40 credits/sec
      assert_eq!(happy_horse(5, KinoviBatchCountRaw::One).estimate_credits(), 200);
      assert_eq!(happy_horse(10, KinoviBatchCountRaw::One).estimate_credits(), 400);
      assert_eq!(happy_horse(15, KinoviBatchCountRaw::One).estimate_credits(), 600);
    }

    #[test]
    fn spot_check_happy_horse_480p() {
      assert_eq!(happy_horse_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::FourEightyP).estimate_credits(), 75);
    }

    #[test]
    fn spot_check_happy_horse_1080p() {
      assert_eq!(happy_horse_res(4, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).estimate_credits(), 360);
      assert_eq!(happy_horse_res(15, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).estimate_credits(), 1350);
    }

    #[test]
    fn happy_horse_uses_new_pricing_rate() {
      // All Happy Horse resolutions use the new 193 credits/$1 rate (not legacy)
      assert_eq!(happy_horse(5, KinoviBatchCountRaw::One).credits_per_dollar(), 193.0);
      assert_eq!(happy_horse_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::SevenTwentyP).credits_per_dollar(), 193.0);
      assert_eq!(happy_horse_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::FourEightyP).credits_per_dollar(), 193.0);
      assert_eq!(happy_horse_res(5, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).credits_per_dollar(), 193.0);
    }

    #[test]
    fn happy_horse_usd_cents_1080p() {
      // 193 credits/$1: 360 credits (4s×90) = 186.53 → 187¢
      assert_eq!(happy_horse_res(4, KinoviBatchCountRaw::One, KinoviOutputResolutionRaw::TenEightyP).estimate_cost_in_usd_cents(), 187);
    }
  }

  mod real_requests {
    use super::*;

    fn test_session() -> AnyhowResult<Seedance2ProSession> {
      let cookies = get_test_cookies()?;
      Ok(Seedance2ProSession::from_cookies_string(cookies))
    }

    #[tokio::test]
    #[ignore]
    async fn test_generate_text_to_video() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let args = WorkflowRunTaskArgs {
        session: &session,
        host_override: None,
        request: WorkflowRunTaskRequest {
          model_type: KinoviModelTypeRaw::Seedance2Pro,
          prompt: "A corgi eating a cake in a fancy kitchen.".to_string(),
          aspect_ratio: KinoviAspectRatioRaw::Square1x1,
          duration_seconds: 5,
          batch_count: KinoviBatchCountRaw::One,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
          output_resolution: None,
        },
      };
      let result = workflow_run_task(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_generate_keyframe_video() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let args = WorkflowRunTaskArgs {
        session: &session,
        host_override: None,
        request: WorkflowRunTaskRequest {
          model_type: KinoviModelTypeRaw::Seedance2Pro,
          prompt: "A dog shakes the glasses off its head. The camera pans out as the shiba shakes. The shiba barks.".to_string(),
          aspect_ratio: KinoviAspectRatioRaw::Landscape16x9,
          duration_seconds: 5,
          batch_count: KinoviBatchCountRaw::One,
          start_frame_url: Some("https://static.seedance2-pro.com/materials/20260219/1771496300184-fb32e08c.jpg".to_string()),
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
          output_resolution: None,
        },
      };
      let result = workflow_run_task(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_generate_reference_image_video() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let args = WorkflowRunTaskArgs {
        session: &session,
        host_override: None,
        request: WorkflowRunTaskRequest {
          model_type: KinoviModelTypeRaw::Seedance2Pro,
          prompt: "The dog in @2 is in the office at @1 without the man. The office is dark and moonlight streams in through the windows. Particles of dust gleam in the moon beams. Suddenly, the dog jumps walks in front of the desk and barks.".to_string(),
          aspect_ratio: KinoviAspectRatioRaw::Landscape4x3,
          duration_seconds: 10,
          batch_count: KinoviBatchCountRaw::One,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: Some(vec![
            "https://static.seedance2-pro.com/materials/20260219/1771463564512-b14bfe90.png".to_string(),
            "https://static.seedance2-pro.com/materials/20260219/1771496300184-fb32e08c.jpg".to_string(),
          ]),
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
          output_resolution: None,
        },
      };
      let result = workflow_run_task(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_generate_reference_video_only() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let args = WorkflowRunTaskArgs {
        session: &session,
        host_override: None,
        request: WorkflowRunTaskRequest {
          model_type: KinoviModelTypeRaw::Seedance2Pro,
          prompt: "Change the Video @video1 to night time.".to_string(),
          aspect_ratio: KinoviAspectRatioRaw::Landscape16x9,
          duration_seconds: 5,
          batch_count: KinoviBatchCountRaw::One,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: Some(vec![
            "https://static.seedance2-pro.com/materials/20260315/1773594284659-3a46d231.mp4".to_string(),
          ]),
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
          output_resolution: None,
        },
      };
      let result = workflow_run_task(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_generate_reference_video_and_image() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let args = WorkflowRunTaskArgs {
        session: &session,
        host_override: None,
        request: WorkflowRunTaskRequest {
          model_type: KinoviModelTypeRaw::Seedance2Pro,
          prompt: "Put the robot in @video1 next to the house in @image1".to_string(),
          aspect_ratio: KinoviAspectRatioRaw::Landscape16x9,
          duration_seconds: 5,
          batch_count: KinoviBatchCountRaw::One,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: Some(vec![
            "https://static.seedance2-pro.com/materials/20260315/1773595053724-07a1d500.png".to_string(),
          ]),
          reference_video_urls: Some(vec![
            "https://static.seedance2-pro.com/materials/20260315/1773594284659-3a46d231.mp4".to_string(),
          ]),
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
          output_resolution: None,
        },
      };
      let result = workflow_run_task(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_video_ref_file_that_is_too_long() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);

      let cookies = get_test_cookies()?;
      let session = Seedance2ProSession::from_cookies_string(cookies);
      let prepare_args = PrepareFileUploadArgs {
        session: &session,
        extension: "mp4".to_string(),
        host_override: None,
      };
      let prepare_result = prepare_file_upload(prepare_args).await?;
      println!("Upload URL: {}", prepare_result.upload_url);

      let file_bytes = fs::read("/Users/bt/Videos/Artcraft/Artcraft Best/ArtCraft Seedance Knight.mp4")?;
      println!("File size: {} bytes", file_bytes.len());

      let upload_args = UploadFileArgs {
        upload_url: prepare_result.upload_url,
        file_bytes,
        host_override: None,
      };
      let result = upload_file(upload_args).await?;
      println!("Public URL: {}", result.public_url);

      let args = WorkflowRunTaskArgs {
        session: &session,
        host_override: None,
        request: WorkflowRunTaskRequest {
          model_type: KinoviModelTypeRaw::Seedance2Pro,
          prompt: "Change @video1 to night time".to_string(),
          aspect_ratio: KinoviAspectRatioRaw::Landscape16x9,
          duration_seconds: 5,
          batch_count: KinoviBatchCountRaw::One,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: Some(vec![result.public_url]),
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
          output_resolution: None,
        },
      };
      let result = workflow_run_task(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);

      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_pro_keyframe_with_start_frame() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;

      let image_bytes = crate::test_utils::http_download::http_download_to_bytes(
        test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL,
      ).await?;

      let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
        session: &session,
        extension: "jpg".to_string(),
        host_override: None,
      }).await?;

      let upload_result = upload_file(UploadFileArgs {
        upload_url: prepare_result.upload_url,
        file_bytes: image_bytes,
        host_override: None,
      }).await?;

      println!("Uploaded start frame: {}", upload_result.public_url);

      let args = WorkflowRunTaskArgs {
        session: &session,
        host_override: None,
        request: WorkflowRunTaskRequest {
          model_type: KinoviModelTypeRaw::Seedance2Pro,
          prompt: "The corgi dog watches the lake.".to_string(),
          aspect_ratio: KinoviAspectRatioRaw::Portrait9x16,
          duration_seconds: 5,
          batch_count: KinoviBatchCountRaw::One,
          start_frame_url: Some(upload_result.public_url),
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
          output_resolution: None,
        },
      };
      let result = workflow_run_task(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_fast_keyframe_with_start_frame() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;

      let image_bytes = crate::test_utils::http_download::http_download_to_bytes(
        test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL,
      ).await?;

      let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
        session: &session,
        extension: "jpg".to_string(),
        host_override: None,
      }).await?;

      let upload_result = upload_file(UploadFileArgs {
        upload_url: prepare_result.upload_url,
        file_bytes: image_bytes,
        host_override: None,
      }).await?;

      println!("Uploaded start frame: {}", upload_result.public_url);

      let args = WorkflowRunTaskArgs {
        session: &session,
        host_override: None,
        request: WorkflowRunTaskRequest {
          model_type: KinoviModelTypeRaw::Seedance2Fast,
          prompt: "A corgi dog runs along the lake shore, splashing water. Camera follows.".to_string(),
          aspect_ratio: KinoviAspectRatioRaw::Landscape16x9,
          duration_seconds: 5,
          batch_count: KinoviBatchCountRaw::One,
          start_frame_url: Some(upload_result.public_url),
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
          output_resolution: None,
        },
      };
      let result = workflow_run_task(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_fast_three_image_references() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;

      let image_urls_to_upload = [
        test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL,
        test_data::web::image_urls::WHITE_HOUSE_SUNSET_IMAGE_URL,
        test_data::web::image_urls::FOREST_BACKDROP_IMAGE_URL,
      ];

      let mut uploaded_urls = Vec::new();
      for (i, source_url) in image_urls_to_upload.iter().enumerate() {
        let image_bytes = crate::test_utils::http_download::http_download_to_bytes(source_url).await?;
        let ext = if source_url.ends_with(".png") { "png" } else { "jpg" };

        let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
          session: &session,
          extension: ext.to_string(),
          host_override: None,
        }).await?;

        let upload_result = upload_file(UploadFileArgs {
          upload_url: prepare_result.upload_url,
          file_bytes: image_bytes,
          host_override: None,
        }).await?;

        println!("Uploaded ref image {}: {}", i + 1, upload_result.public_url);
        uploaded_urls.push(upload_result.public_url);
      }

      let args = WorkflowRunTaskArgs {
        session: &session,
        host_override: None,
        request: WorkflowRunTaskRequest {
          model_type: KinoviModelTypeRaw::Seedance2Fast,
          prompt: "The dog in @1 is running through the scenery in @3 towards the building in @2. Golden hour lighting.".to_string(),
          aspect_ratio: KinoviAspectRatioRaw::Landscape16x9,
          duration_seconds: 5,
          batch_count: KinoviBatchCountRaw::One,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: Some(uploaded_urls),
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
          output_resolution: None,
        },
      };
      let result = workflow_run_task(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_fast_audio_reference_with_text() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;

      let audio_path = test_utils::test_file_path::test_file_path(
        "test_data/audio/mp3/super_mario_rpg_beware_the_forests_mushrooms.mp3",
      )?;
      let audio_bytes = fs::read(&audio_path)?;
      println!("Audio file size: {} bytes", audio_bytes.len());

      let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
        session: &session,
        extension: "mp3".to_string(),
        host_override: None,
      }).await?;

      let upload_result = upload_file(UploadFileArgs {
        upload_url: prepare_result.upload_url,
        file_bytes: audio_bytes,
        host_override: None,
      }).await?;

      println!("Uploaded audio: {}", upload_result.public_url);

      let args = WorkflowRunTaskArgs {
        session: &session,
        host_override: None,
        request: WorkflowRunTaskRequest {
          model_type: KinoviModelTypeRaw::Seedance2Fast,
          prompt: "A fantasy forest with mushrooms glowing in the dark. Fireflies dance between the trees. A small character walks along a winding path.".to_string(),
          aspect_ratio: KinoviAspectRatioRaw::Landscape16x9,
          duration_seconds: 5,
          batch_count: KinoviBatchCountRaw::One,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: Some(vec![upload_result.public_url]),
          character_ids: None,
          use_face_blur_hack: None,
          output_resolution: None,
        },
      };
      let result = workflow_run_task(args).await?;
      println!("Task ID: {}", result.task_id);
      println!("Order ID: {}", result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    mod character_tests {
      use super::*;

      const STEAMPUNK_CLOWN_ID: &str = "char_1775176566518_sik0te";
      const MOCHI_ID: &str = "char_1775177718294_g2pitx";

      #[tokio::test]
      #[ignore]
      async fn test_text_prompt_with_character_pro() -> AnyhowResult<()> {
        setup_test_logging(LevelFilter::Trace);
        let session = test_session()?;
        let args = WorkflowRunTaskArgs {
          session: &session,
          host_override: None,
          request: WorkflowRunTaskRequest {
            model_type: KinoviModelTypeRaw::Seedance2Pro,
            prompt: "@Steampunk Clown is juggling flaming torches in a circus tent.".to_string(),
            aspect_ratio: KinoviAspectRatioRaw::Landscape16x9,
            duration_seconds: 5,
            batch_count: KinoviBatchCountRaw::One,
            start_frame_url: None,
            end_frame_url: None,
            reference_image_urls: None,
            reference_video_urls: None,
            reference_audio_urls: None,
            character_ids: Some(vec![STEAMPUNK_CLOWN_ID.to_string()]),
            use_face_blur_hack: None,
            output_resolution: None,
          },
        };
        let result = workflow_run_task(args).await?;
        println!("Task ID: {}", result.task_id);
        println!("Order ID: {}", result.order_id);
        assert!(!result.task_id.is_empty());
        assert!(!result.order_id.is_empty());
        assert_eq!(1, 2);
        Ok(())
      }

      #[tokio::test]
      #[ignore]
      async fn test_text_prompt_with_character_fast() -> AnyhowResult<()> {
        setup_test_logging(LevelFilter::Trace);
        let session = test_session()?;
        let args = WorkflowRunTaskArgs {
          session: &session,
          host_override: None,
          request: WorkflowRunTaskRequest {
            model_type: KinoviModelTypeRaw::Seedance2Fast,
            prompt: "@Mochi the female shiba inu is eating a cheese pizza while standing on the table".to_string(),
            aspect_ratio: KinoviAspectRatioRaw::Portrait9x16,
            duration_seconds: 5,
            batch_count: KinoviBatchCountRaw::One,
            start_frame_url: None,
            end_frame_url: None,
            reference_image_urls: None,
            reference_video_urls: None,
            reference_audio_urls: None,
            character_ids: Some(vec![MOCHI_ID.to_string()]),
            use_face_blur_hack: None,
            output_resolution: None,
          },
        };
        let result = workflow_run_task(args).await?;
        println!("Task ID: {}", result.task_id);
        println!("Order ID: {}", result.order_id);
        assert!(!result.task_id.is_empty());
        assert!(!result.order_id.is_empty());
        assert_eq!(1, 2);
        Ok(())
      }

      #[tokio::test]
      #[ignore]
      async fn test_character_with_image_ref_pro() -> AnyhowResult<()> {
        setup_test_logging(LevelFilter::Trace);
        let session = test_session()?;
        let args = WorkflowRunTaskArgs {
          session: &session,
          host_override: None,
          request: WorkflowRunTaskRequest {
            model_type: KinoviModelTypeRaw::Seedance2Pro,
            prompt: "@Steampunk Clown is walking up to pet a dog on the couch.".to_string(),
            aspect_ratio: KinoviAspectRatioRaw::Landscape16x9,
            duration_seconds: 5,
            batch_count: KinoviBatchCountRaw::One,
            start_frame_url: None,
            end_frame_url: None,
            reference_image_urls: Some(vec![
              "https://static.seedance2-pro.com/materials/20260329/1774752385699-1ff44886.jpeg".to_string(),
            ]),
            reference_video_urls: None,
            reference_audio_urls: None,
            character_ids: Some(vec![STEAMPUNK_CLOWN_ID.to_string()]),
            use_face_blur_hack: None,
            output_resolution: None,
          },
        };
        let result = workflow_run_task(args).await?;
        println!("Task ID: {}", result.task_id);
        println!("Order ID: {}", result.order_id);
        assert!(!result.task_id.is_empty());
        assert!(!result.order_id.is_empty());
        assert_eq!(1, 2);
        Ok(())
      }

      #[tokio::test]
      #[ignore]
      async fn test_two_characters_fast() -> AnyhowResult<()> {
        setup_test_logging(LevelFilter::Trace);
        let session = test_session()?;
        let args = WorkflowRunTaskArgs {
          session: &session,
          host_override: None,
          request: WorkflowRunTaskRequest {
            model_type: KinoviModelTypeRaw::Seedance2Fast,
            prompt: "@Steampunk Clown and @Mochi are playing fetch in a sunny park.".to_string(),
            aspect_ratio: KinoviAspectRatioRaw::Landscape16x9,
            duration_seconds: 5,
            batch_count: KinoviBatchCountRaw::One,
            start_frame_url: None,
            end_frame_url: None,
            reference_image_urls: None,
            reference_video_urls: None,
            reference_audio_urls: None,
            character_ids: Some(vec![
              STEAMPUNK_CLOWN_ID.to_string(),
              MOCHI_ID.to_string(),
            ]),
            use_face_blur_hack: None,
            output_resolution: None,
          },
        };
        let result = workflow_run_task(args).await?;
        println!("Task ID: {}", result.task_id);
        println!("Order ID: {}", result.order_id);
        assert!(!result.task_id.is_empty());
        assert!(!result.order_id.is_empty());
        assert_eq!(1, 2);
        Ok(())
      }
    }

    mod happy_horse_tests {
      use super::*;

      #[tokio::test]
      #[ignore]
      async fn test_happy_horse_text_to_video_1080p() -> AnyhowResult<()> {
        setup_test_logging(LevelFilter::Trace);
        let session = test_session()?;
        let args = WorkflowRunTaskArgs {
          session: &session,
          host_override: None,
          request: WorkflowRunTaskRequest {
            model_type: KinoviModelTypeRaw::HappyHorse1p0,
            prompt: "A corgi and shiba are in a bamboo forest. They are samurai battling one anotherplaying chess against one another".to_string(),
            aspect_ratio: KinoviAspectRatioRaw::Landscape16x9,
            duration_seconds: 4,
            batch_count: KinoviBatchCountRaw::One,
            start_frame_url: None,
            end_frame_url: None,
            reference_image_urls: None,
            reference_video_urls: None,
            reference_audio_urls: None,
            character_ids: None,
            use_face_blur_hack: Some(false),
            output_resolution: Some(KinoviOutputResolutionRaw::TenEightyP),
          },
        };
        let result = workflow_run_task(args).await?;
        println!("Happy Horse t2v 1080p — task_id={}, order_id={}", result.task_id, result.order_id);
        assert!(!result.task_id.is_empty());
        assert!(!result.order_id.is_empty());
        assert_eq!(1, 2);
        Ok(())
      }

      #[tokio::test]
      #[ignore]
      async fn test_happy_horse_keyframe_720p() -> AnyhowResult<()> {
        setup_test_logging(LevelFilter::Trace);
        let session = test_session()?;

        let image_bytes = crate::test_utils::http_download::http_download_to_bytes(
          test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL,
        ).await?;

        let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
          session: &session,
          extension: "jpg".to_string(),
          host_override: None,
        }).await?;

        let upload_result = upload_file(UploadFileArgs {
          upload_url: prepare_result.upload_url,
          file_bytes: image_bytes,
          host_override: None,
        }).await?;

        println!("Uploaded start frame: {}", upload_result.public_url);

        let args = WorkflowRunTaskArgs {
          session: &session,
          host_override: None,
          request: WorkflowRunTaskRequest {
            model_type: KinoviModelTypeRaw::HappyHorse1p0,
            prompt: "The corgi dog watches the lake as the sun sets.".to_string(),
            aspect_ratio: KinoviAspectRatioRaw::Portrait9x16,
            duration_seconds: 8,
            batch_count: KinoviBatchCountRaw::One,
            start_frame_url: Some(upload_result.public_url),
            end_frame_url: None,
            reference_image_urls: None,
            reference_video_urls: None,
            reference_audio_urls: None,
            character_ids: None,
            use_face_blur_hack: Some(false),
            output_resolution: None,
          },
        };
        let result = workflow_run_task(args).await?;
        println!("Happy Horse keyframe 720p — task_id={}, order_id={}", result.task_id, result.order_id);
        assert!(!result.task_id.is_empty());
        assert!(!result.order_id.is_empty());
        assert_eq!(1, 2);
        Ok(())
      }

      #[tokio::test]
      #[ignore]
      async fn test_happy_horse_keyframe_1080p_square() -> AnyhowResult<()> {
        setup_test_logging(LevelFilter::Trace);
        let session = test_session()?;

        let image_bytes = crate::test_utils::http_download::http_download_to_bytes(
          test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL,
        ).await?;

        let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
          session: &session,
          extension: "jpg".to_string(),
          host_override: None,
        }).await?;

        let upload_result = upload_file(UploadFileArgs {
          upload_url: prepare_result.upload_url,
          file_bytes: image_bytes,
          host_override: None,
        }).await?;

        println!("Uploaded start frame: {}", upload_result.public_url);

        let args = WorkflowRunTaskArgs {
          session: &session,
          host_override: None,
          request: WorkflowRunTaskRequest {
            model_type: KinoviModelTypeRaw::HappyHorse1p0,
            prompt: "A dragon and a raptor fighting on the beach.".to_string(),
            aspect_ratio: KinoviAspectRatioRaw::Square1x1,
            duration_seconds: 15,
            batch_count: KinoviBatchCountRaw::One,
            start_frame_url: Some(upload_result.public_url),
            end_frame_url: None,
            reference_image_urls: None,
            reference_video_urls: None,
            reference_audio_urls: None,
            character_ids: None,
            use_face_blur_hack: Some(false),
            output_resolution: Some(KinoviOutputResolutionRaw::TenEightyP),
          },
        };
        let result = workflow_run_task(args).await?;
        println!("Happy Horse keyframe 1080p square — task_id={}, order_id={}", result.task_id, result.order_id);
        assert!(!result.task_id.is_empty());
        assert!(!result.order_id.is_empty());
        assert_eq!(1, 2);
        Ok(())
      }
    }
  }

  mod output_resolution_tests {
    use super::*;

    fn test_session() -> AnyhowResult<Seedance2ProSession> {
      let cookies = get_test_cookies()?;
      Ok(Seedance2ProSession::from_cookies_string(cookies))
    }

    fn make_args_with_prompt<'a>(
      prompt: &'a str,
      session: &'a Seedance2ProSession,
      model_type: KinoviModelTypeRaw,
      output_resolution: Option<KinoviOutputResolutionRaw>,
    ) -> WorkflowRunTaskArgs<'a> {
      WorkflowRunTaskArgs {
        session,
        host_override: None,
        request: WorkflowRunTaskRequest {
          model_type,
          prompt: prompt.to_string(),
          aspect_ratio: KinoviAspectRatioRaw::Landscape16x9,
          duration_seconds: 4,
          batch_count: KinoviBatchCountRaw::One,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          output_resolution,
          use_face_blur_hack: None,
        },
      }
    }

    fn make_args<'a>(
      session: &'a Seedance2ProSession,
      model_type: KinoviModelTypeRaw,
      output_resolution: Option<KinoviOutputResolutionRaw>,
    ) -> WorkflowRunTaskArgs<'a> {
      make_args_with_prompt("A corgi running through a field of flowers", session, model_type, output_resolution)
    }

    mod seedance_2 {
      use super::*;

      #[tokio::test]
      #[ignore]
      async fn test_480p() -> AnyhowResult<()> {
        setup_test_logging(LevelFilter::Trace);
        let session = test_session()?;
        let args = make_args(&session, KinoviModelTypeRaw::Seedance2Pro, Some(KinoviOutputResolutionRaw::FourEightyP));
        let result = workflow_run_task(args).await?;
        println!("Seedance 2.0 @ 480p — task_id={}, order_id={}", result.task_id, result.order_id);
        assert_eq!(1, 2, "Inspect output above");
        Ok(())
      }

      #[tokio::test]
      #[ignore]
      async fn test_720p() -> AnyhowResult<()> {
        setup_test_logging(LevelFilter::Trace);
        let session = test_session()?;
        let prompt = "A corgi running through a field of stars";
        let args = make_args_with_prompt(prompt, &session, KinoviModelTypeRaw::Seedance2Pro, None);
        let result = workflow_run_task(args).await?;
        println!("Seedance 2.0 @ 720p (default) — task_id={}, order_id={}", result.task_id, result.order_id);
        assert_eq!(1, 2, "Inspect output above");
        Ok(())
      }

      #[tokio::test]
      #[ignore]
      async fn test_1080p() -> AnyhowResult<()> {
        setup_test_logging(LevelFilter::Trace);
        let session = test_session()?;
        let prompt = "A shiba running through a field of stars";
        let args = make_args_with_prompt(prompt, &session, KinoviModelTypeRaw::Seedance2Pro, Some(KinoviOutputResolutionRaw::TenEightyP));
        let result = workflow_run_task(args).await?;
        println!("Seedance 2.0 @ 1080p — task_id={}, order_id={}", result.task_id, result.order_id);
        assert_eq!(1, 2, "Inspect output above");
        Ok(())
      }
    }

    mod seedance_2_fast {
      use super::*;

      #[tokio::test]
      #[ignore]
      async fn test_480p() -> AnyhowResult<()> {
        setup_test_logging(LevelFilter::Trace);
        let session = test_session()?;
        let prompt = "A corgi running through a foggy meadow at dawn";
        let args = make_args_with_prompt(prompt, &session, KinoviModelTypeRaw::Seedance2Fast, Some(KinoviOutputResolutionRaw::FourEightyP));
        let result = workflow_run_task(args).await?;
        println!("Seedance 2.0 Fast @ 480p — task_id={}, order_id={}", result.task_id, result.order_id);
        assert_eq!(1, 2, "Inspect output above");
        Ok(())
      }

      #[tokio::test]
      #[ignore]
      async fn test_720p() -> AnyhowResult<()> {
        setup_test_logging(LevelFilter::Trace);
        let session = test_session()?;
        let prompt = "A shiba running through a foggy meadow at dawn";
        let args = make_args_with_prompt(prompt, &session, KinoviModelTypeRaw::Seedance2Fast, None);
        let result = workflow_run_task(args).await?;
        println!("Seedance 2.0 Fast @ 720p (default) — task_id={}, order_id={}", result.task_id, result.order_id);
        assert_eq!(1, 2, "Inspect output above");
        Ok(())
      }

      #[tokio::test]
      #[ignore]
      async fn test_1080p() -> AnyhowResult<()> {
        setup_test_logging(LevelFilter::Trace);
        let session = test_session()?;
        let prompt = "A small klee kai dog running through a foggy meadow at dawn";
        let args = make_args_with_prompt(prompt, &session, KinoviModelTypeRaw::Seedance2Fast, Some(KinoviOutputResolutionRaw::TenEightyP));
        let result = workflow_run_task(args).await?;
        println!("Seedance 2.0 Fast @ 1080p — task_id={}, order_id={}", result.task_id, result.order_id);
        assert_eq!(1, 2, "Inspect output above");
        Ok(())
      }
    }
  }
}
