use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_client_error::Seedance2ProClientError;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::error::seedance2pro_generic_api_error::Seedance2ProGenericApiError;
use crate::error::seedance2pro_specific_api_error::Seedance2ProSpecificApiError;
use crate::requests::generate_video_2::request_types::*;
use crate::requests::kinovi_host::{KinoviHost, resolve_host};
use crate::utils::categorize_seedance2pro_error::categorize_seedance2pro_error;
use crate::utils::common_headers::FIREFOX_USER_AGENT;
use log::info;
use wreq::Client;
use wreq_util::Emulation;

// --- Request args ---

/// Wrapper that bundles a [`KinoviGenerateVideo2Request`] with session and host info.
pub struct GenerateVideo2Args<'a> {
  pub request: KinoviGenerateVideo2Request,
  pub session: &'a Seedance2ProSession,
  pub host_override: Option<KinoviHost>,
}

/// Video generation parameters (no session/host info).
#[derive(Clone)]
pub struct KinoviGenerateVideo2Request {
  /// Seedance 2.0 Pro vs Fast
  pub model_type: KinoviModelType2,

  pub prompt: String,

  /// The aspect ratio
  /// (Kinovi terms this "resolution" in the API, confusingly.)
  pub aspect_ratio: KinoviAspectRatio2,

  /// The resolution
  /// Output resolution quality (480p, 720p, 1080p). None defaults to 720p.
  /// (Kinovi terms this "outputResolution" in the API, which is confusingly named)
  pub output_resolution: Option<KinoviOutputResolution2>,

  /// Duration in seconds (4–15).
  pub duration_seconds: u8,

  pub batch_count: KinoviBatchCount2,

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

impl std::fmt::Debug for KinoviGenerateVideo2Request {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("KinoviGenerateVideo2Request")
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

impl std::fmt::Debug for GenerateVideo2Args<'_> {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("GenerateVideo2Args")
      .field("request", &self.request)
      .field("host_override", &self.host_override)
      .finish()
  }
}

impl KinoviGenerateVideo2Request {
  /// Estimates the credit cost for this generation request.
  ///
  /// Pricing is per-second × batch count, with the per-second rate
  /// depending on model type and output resolution:
  ///
  /// | Model     | 480p | 720p | 1080p |
  /// |-----------|------|------|-------|
  /// | Pro       |   15 |   40 |    90 |
  /// | Fast      |   10 |   28 |   n/a |
  ///
  /// Input mode (text, keyframe, reference) has no effect on cost.
  /// Aspect ratio (`resolution` field) has no effect on cost.
  pub fn estimate_credits(&self) -> u32 {
    let credits_per_second: u32 = match (self.model_type, self.output_resolution) {
      // Seedance 2.0 Pro
      (KinoviModelType2::Seedance2Pro, Some(KinoviOutputResolution2::FourEightyP)) => 15,
      (KinoviModelType2::Seedance2Pro, None)
      | (KinoviModelType2::Seedance2Pro, Some(KinoviOutputResolution2::SevenTwentyP)) => 40,
      (KinoviModelType2::Seedance2Pro, Some(KinoviOutputResolution2::TenEightyP)) => 90,

      // Seedance 2.0 Fast
      (KinoviModelType2::Seedance2Fast, Some(KinoviOutputResolution2::FourEightyP)) => 10,
      (KinoviModelType2::Seedance2Fast, None)
      | (KinoviModelType2::Seedance2Fast, Some(KinoviOutputResolution2::SevenTwentyP)) => 28,
      // NB: 1080p not officially supported for Fast, but price as 720p if requested
      (KinoviModelType2::Seedance2Fast, Some(KinoviOutputResolution2::TenEightyP)) => 28,
    };

    let per_video = u32::from(self.duration_seconds) * credits_per_second;
    let batch_multiplier: u32 = match self.batch_count {
      KinoviBatchCount2::One => 1,
      KinoviBatchCount2::Two => 2,
      KinoviBatchCount2::Four => 4,
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
      (KinoviModelType2::Seedance2Pro, None)
      | (KinoviModelType2::Seedance2Pro, Some(KinoviOutputResolution2::SevenTwentyP)) => 250.0,

      // Legacy: Seedance 2.0 Fast @ 720p — 22,000 credits for $99.99
      (KinoviModelType2::Seedance2Fast, None)
      | (KinoviModelType2::Seedance2Fast, Some(KinoviOutputResolution2::SevenTwentyP)) => 220.0,

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
pub enum KinoviAspectRatio2 {
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

impl KinoviAspectRatio2 {
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

/// Output resolution quality. When omitted, defaults to 720p.
#[derive(Debug, Clone, Copy)]
pub enum KinoviOutputResolution2 {
  /// 480p
  FourEightyP,
  /// 720p (default — omitting the field gives this)
  SevenTwentyP,
  /// 1080p
  TenEightyP,
}

impl KinoviOutputResolution2 {
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
pub enum KinoviBatchCount2 {
  One,
  Two,
  Four,
}

impl KinoviBatchCount2 {
  fn as_u8(&self) -> u8 {
    match self {
      Self::One => 1,
      Self::Two => 2,
      Self::Four => 4,
    }
  }
}

/// The Seedance model variant to use.
#[derive(Debug, Clone, Copy)]
pub enum KinoviModelType2 {
  /// Seedance 2.0 Pro (higher quality, slower).
  Seedance2Pro,
  /// Seedance 2.0 Fast (lower quality, faster).
  Seedance2Fast,
}

impl KinoviModelType2 {
  fn as_api_str(&self) -> &'static str {
    match self {
      Self::Seedance2Pro => "seedance-20",
      Self::Seedance2Fast => "seedance2-fast",
    }
  }
}

// --- Response ---

pub struct GenerateVideo2Response {
  pub task_id: String,

  pub order_id: String,

  /// Present when batch_count > 1.
  pub task_ids: Option<Vec<String>>,

  /// Present when batch_count > 1.
  pub order_ids: Option<Vec<String>>,
}

// --- Implementation ---

pub async fn generate_video_2(args: GenerateVideo2Args<'_>) -> Result<GenerateVideo2Response, Seedance2ProError> {
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

  Ok(GenerateVideo2Response {
    task_id: task_data.task_id,
    order_id: task_data.order_id,
    task_ids: task_data.task_ids,
    order_ids: task_data.order_ids,
  })
}
