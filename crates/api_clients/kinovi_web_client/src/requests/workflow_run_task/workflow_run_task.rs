use crate::creds::kinovi_web_session::KinoviWebSession;
use crate::error::kinovi_web_bad_request_api_error::KinoviWebBadRequestApiError;
use crate::error::kinovi_web_client_error::KinoviWebClientError;
use crate::error::kinovi_web_error::KinoviWebError;
use crate::error::kinovi_web_generic_api_error::KinoviWebGenericApiError;
use crate::requests::workflow_run_task::request_types::*;
use crate::requests::kinovi_host::{KinoviHost, resolve_host};
use crate::utils::categorize_kinovi_web_error::categorize_kinovi_web_error;
use crate::utils::common_headers::FIREFOX_USER_AGENT;
use log::info;
use wreq::Client;
use wreq_util::Emulation;

// --- Request args ---

/// Wrapper that bundles a [`WorkflowRunTaskRequest`] with session and host info.
pub struct WorkflowRunTaskArgs<'a> {
  pub request: WorkflowRunTaskRequest,
  pub session: &'a KinoviWebSession,
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

  /// Output video bitrate. None defaults to "standard" (the field is omitted);
  /// `High` sends `bitrate_mode: "high"`. Does not affect cost.
  pub bitrate: Option<KinoviBitrateRaw>,
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
      .field("bitrate", &self.bitrate)
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

// --- Public enums ---

/// Video resolution / aspect ratio.
#[derive(Debug, Clone, Copy)]
pub enum KinoviAspectRatioRaw {
  /// 16:9 landscape (1280x720)
  Landscape16x9,
  /// 21:9 ultra-wide (1280x540)
  UltraWide21x9,
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
  /// The aspect ratio as a ratio string (e.g. "16:9"), used by models that
  /// send an `aspectRatio` field (Seedance 2.0 Mini) instead of `resolution`.
  fn as_aspect_ratio_str(&self) -> &'static str {
    match self {
      Self::Landscape16x9 => "16:9",
      Self::UltraWide21x9 => "21:9",
      Self::Portrait9x16 => "9:16",
      Self::Square1x1 => "1:1",
      Self::Landscape4x3 => "4:3",
      Self::Portrait3x4 => "3:4",
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
  /// 4K. Only supported by Seedance 2.0 (Pro). Seedance 2.0 Fast does NOT
  /// offer 4K — requesting it for Fast is not valid upstream.
  FourK,
}

impl KinoviOutputResolutionRaw {
  /// Returns the API string to send, or None for 720p (the default, which is
  /// expressed by omitting the field entirely).
  pub fn as_api_str(&self) -> Option<&'static str> {
    match self {
      Self::FourEightyP => Some("480p"),
      Self::SevenTwentyP => None, // Default — omit from request
      Self::TenEightyP => Some("1080p"),
      Self::FourK => Some("4k"),
    }
  }

  /// The API string including the "720p" default, for models that always
  /// send `outputResolution` explicitly (Seedance 2.5 Preview).
  pub fn as_explicit_api_str(&self) -> &'static str {
    match self {
      Self::FourEightyP => "480p",
      Self::SevenTwentyP => "720p",
      Self::TenEightyP => "1080p",
      Self::FourK => "4k",
    }
  }
}

/// Number of videos to generate in a single request.
#[derive(Debug, Clone, Copy)]
pub enum KinoviBatchCountRaw {
  One,
  Two,
  Three,
  Four,
  Five,
  Six,
  Seven,
  Eight,
}

impl KinoviBatchCountRaw {
  fn as_u8(&self) -> u8 {
    match self {
      Self::One => 1,
      Self::Two => 2,
      Self::Three => 3,
      Self::Four => 4,
      Self::Five => 5,
      Self::Six => 6,
      Self::Seven => 7,
      Self::Eight => 8,
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
  /// Seedance 2.0 Mini (cheapest; 480p/720p only).
  Seedance2Mini,
  /// Seedance 2.5 Preview (480p/720p only).
  Seedance2p5Preview,
  /// Seedance 2.5 (480p/720p only).
  Seedance2p5,
  /// Happy Horse 1.0.
  HappyHorse1p0,
}

impl KinoviModelTypeRaw {
  fn as_api_str(&self) -> &'static str {
    match self {
      Self::Seedance2Pro => "seedance-20",
      Self::Seedance2Fast => "seedance2-fast",
      Self::Seedance2Mini => "seedance2.0-mini",
      Self::Seedance2p5Preview => "seedance2-5-preview",
      Self::Seedance2p5 => "seedance2-5",
      Self::HappyHorse1p0 => "happyhorse1.0",
    }
  }

  /// The tRPC `businessType` for this model. Seedance 2.0 Mini and the 2.5
  /// family use their own business types; every other model uses the shared
  /// one. (Seedance 2.5 reuses the *preview* business type on the wire —
  /// only the `model` string differs.)
  fn business_type(&self) -> &'static str {
    match self {
      Self::Seedance2Mini => "seedance20-mini-video-generation",
      Self::Seedance2p5Preview | Self::Seedance2p5 => "seedance25-preview-video-generation",
      Self::HappyHorse1p0 => "happyhorse-video-generation",
      Self::Seedance2Pro | Self::Seedance2Fast => "wan22-video-generation",
    }
  }

  /// Whether the aspect ratio is sent in an `aspectRatio` field (true)
  /// rather than the `resolution` field. Mini, the 2.5 family, and Happy
  /// Horse use `aspectRatio`.
  fn uses_aspect_ratio_field(&self) -> bool {
    matches!(self, Self::Seedance2Mini | Self::Seedance2p5Preview | Self::Seedance2p5 | Self::HappyHorse1p0)
  }

  /// Whether this model uses Happy Horse's `happyhorseMode` (t2v/i2v)
  /// instead of the standard `mode` (keyframe/reference).
  fn uses_happyhorse_mode(&self) -> bool {
    matches!(self, Self::HappyHorse1p0)
  }

  /// Whether reference URLs are sent in split `imageUrls` / `videoUrls`
  /// fields — with `uploadedUrls` mirroring just the images — rather than
  /// one combined `uploadedUrls` list. The 2.5 family uses the split shape.
  /// (In 2.5 keyframe mode the start/end frames go in `imageUrls` with
  /// `uploadedUrls` mirroring them.)
  fn uses_split_reference_url_fields(&self) -> bool {
    matches!(self, Self::Seedance2p5Preview | Self::Seedance2p5)
  }

  /// Whether `mode` is always "reference", even with no references attached.
  /// Seedance 2.5 Preview has no keyframe mode.
  fn always_uses_reference_mode(&self) -> bool {
    matches!(self, Self::Seedance2p5Preview)
  }

  /// Whether `mode` is "keyframe" only when a start/end frame is attached,
  /// and "reference" otherwise (including plain text-to-video). Seedance 2.5
  /// sends text-to-video as mode "reference".
  fn uses_reference_mode_unless_keyframes(&self) -> bool {
    matches!(self, Self::Seedance2p5)
  }

  /// Whether keyframe mode omits the aspect ratio entirely: Seedance 2.5
  /// keyframe (image-to-video) only supports "Adaptive", which is expressed
  /// by sending no `aspectRatio` field at all.
  fn omits_aspect_ratio_in_keyframe_mode(&self) -> bool {
    matches!(self, Self::Seedance2p5)
  }

  /// Whether the default field values (`outputResolution: "720p"`,
  /// `faceBlurMode: "off"`) are always sent explicitly rather than omitted.
  /// The 2.5 family always sends both.
  fn always_sends_default_fields(&self) -> bool {
    matches!(self, Self::Seedance2p5Preview | Self::Seedance2p5)
  }
}

/// Output video bitrate. When omitted, defaults to "standard".
#[derive(Debug, Clone, Copy)]
pub enum KinoviBitrateRaw {
  /// High bitrate (`bitrate_mode: "high"`).
  High,
}

impl KinoviBitrateRaw {
  /// Returns the API string to send, or None for "standard" (the default,
  /// which is expressed by omitting the field entirely).
  pub fn as_api_str(&self) -> Option<&'static str> {
    match self {
      Self::High => Some("high"),
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

pub async fn workflow_run_task(args: WorkflowRunTaskArgs<'_>) -> Result<WorkflowRunTaskResponse, KinoviWebError> {
  let req = args.request;

  info!("Requesting video from Seedance2Pro (v2): {:?}", req);

  let request_body = build_batch_request(req);

  info!("KinoviWeb request (v2): {:?}", request_body);

  send_run_task_request(args.session, args.host_override, &request_body).await
}

/// Run a `workflow.runTask` call whose `apiParams` shape differs from the
/// standard video request — e.g. the Suno audio models, which carry their own
/// parameter sets. The caller provides the tRPC `businessType` and a
/// serializable `apiParams` payload; the HTTP plumbing and response handling
/// are shared with [`workflow_run_task`].
pub async fn workflow_run_task_custom<T: serde::Serialize + std::fmt::Debug>(
  args: WorkflowRunTaskCustomArgs<'_, T>,
) -> Result<WorkflowRunTaskResponse, KinoviWebError> {
  info!(
    "Requesting {} from Seedance2Pro (custom): {:?}",
    args.business_type, args.api_params,
  );

  let request_body = serde_json::json!({
    "0": {
      "json": {
        "businessType": args.business_type,
        "apiParams": args.api_params,
      }
    }
  });

  send_run_task_request(args.session, args.host_override, &request_body).await
}

/// Bundle for [`workflow_run_task_custom`].
pub struct WorkflowRunTaskCustomArgs<'a, T: serde::Serialize + std::fmt::Debug> {
  /// The tRPC `businessType` discriminator (e.g. "suno-music-generation").
  pub business_type: &'static str,
  pub api_params: T,
  pub session: &'a KinoviWebSession,
  pub host_override: Option<KinoviHost>,
}

async fn send_run_task_request<B: serde::Serialize>(
  session: &KinoviWebSession,
  host_override: Option<KinoviHost>,
  request_body: &B,
) -> Result<WorkflowRunTaskResponse, KinoviWebError> {
  let host = resolve_host(host_override.as_ref());
  let base_url = host.api_base_url();
  let run_task_url = format!("{}/api/trpc/workflow.runTask?batch=1", base_url);

  let cookie = session.cookies.as_str();

  let client = Client::builder()
    .emulation(Emulation::Firefox143)
    .build()
    .map_err(|err| KinoviWebClientError::WreqClientError(err))?;

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
    .json(request_body)
    .send()
    .await
    .map_err(|err| KinoviWebGenericApiError::WreqError(err))?;

  let status = response.status();
  let response_body = response.text()
    .await
    .map_err(|err| KinoviWebGenericApiError::WreqError(err))?;

  info!("Response status: {}, body: {}", status, response_body);

  if !status.is_success() {
    return Err(categorize_kinovi_web_error(status, response_body));
  }

  let batch_response: Vec<BatchResponseItem> = serde_json::from_str(&response_body)
    .map_err(|err| KinoviWebGenericApiError::SerdeResponseParseErrorWithBody(err, response_body.clone()))?;

  let task_data = batch_response
    .into_iter()
    .next()
    .ok_or_else(|| KinoviWebGenericApiError::UnexpectedResponseShape {
      explanation: "Empty batch response array".to_string(),
      raw_body: response_body.clone(),
    })?
    .result
    .data
    .json;

  if task_data.violation_warning {
    return Err(KinoviWebBadRequestApiError::VideoGenerationViolation { raw_body: response_body }.into());
  }

  Ok(WorkflowRunTaskResponse {
    task_id: task_data.task_id,
    order_id: task_data.order_id,
    task_ids: task_data.task_ids,
    order_ids: task_data.order_ids,
  })
}

/// Build the tRPC request body for a workflow run-task call.
///
/// Most models carry the aspect ratio as pixel dimensions in `resolution`.
/// Seedance 2.0 Mini instead sends a ratio string in an `aspectRatio` field
/// and a different `businessType`.
fn build_batch_request(req: WorkflowRunTaskRequest) -> BatchRequest {
  let has_reference_images = req.reference_image_urls.as_ref().is_some_and(|urls| !urls.is_empty());
  let has_reference_videos = req.reference_video_urls.as_ref().is_some_and(|urls| !urls.is_empty());
  let has_reference_audio = req.reference_audio_urls.as_ref().is_some_and(|urls| !urls.is_empty());
  let has_characters = req.character_ids.as_ref().is_some_and(|ids| !ids.is_empty());

  let is_reference_mode = has_reference_images || has_reference_videos || has_reference_audio || has_characters;

  let has_keyframes = req.start_frame_url.is_some() || req.end_frame_url.is_some();

  let video_input_mode = if req.model_type.always_uses_reference_mode() {
    "reference"
  } else if req.model_type.uses_reference_mode_unless_keyframes() {
    // Seedance 2.5: text-to-video is sent as "reference"; "keyframe" only
    // when a start/end frame is attached.
    if has_keyframes { "keyframe" } else { "reference" }
  } else if is_reference_mode {
    "reference"
  } else {
    "keyframe"
  };

  // Reference URLs. The 2.5 family sends split `imageUrls` / `videoUrls`
  // fields with `uploadedUrls` mirroring just the images (in 2.5 keyframe
  // mode the start/end frames ride in `imageUrls` + `uploadedUrls`); other
  // models combine videos + images into `uploadedUrls` in reference mode, or
  // send the start/end frames there in keyframe mode.
  let (image_urls, video_urls, uploaded_urls): (Option<Vec<String>>, Option<Vec<String>>, Option<Vec<String>>) = if req.model_type.uses_split_reference_url_fields() {
    if video_input_mode == "keyframe" {
      let mut urls = Vec::new();
      if let Some(url) = req.start_frame_url {
        urls.push(url);
      }
      if let Some(url) = req.end_frame_url {
        urls.push(url);
      }
      let urls = if urls.is_empty() { None } else { Some(urls) };
      (urls.clone(), None, urls)
    } else {
      let image_urls = req.reference_image_urls.filter(|urls| !urls.is_empty());
      let video_urls = req.reference_video_urls.filter(|urls| !urls.is_empty());
      (image_urls.clone(), video_urls, image_urls)
    }
  } else if is_reference_mode {
    let mut urls = Vec::new();
    if let Some(video_urls) = req.reference_video_urls {
      urls.extend(video_urls);
    }
    if let Some(image_urls) = req.reference_image_urls {
      urls.extend(image_urls);
    }
    (None, None, if urls.is_empty() { None } else { Some(urls) })
  } else {
    let mut urls = Vec::new();
    if let Some(url) = req.start_frame_url {
      urls.push(url);
    }
    if let Some(url) = req.end_frame_url {
      urls.push(url);
    }
    (None, None, if urls.is_empty() { None } else { Some(urls) })
  };

  let audio_urls: Option<Vec<String>> = if has_reference_audio {
    req.reference_audio_urls
  } else {
    None
  };

  let face_blur_mode = match req.use_face_blur_hack {
    Some(true) => Some("on"),
    Some(false) => Some("off"),
    None if req.model_type.always_sends_default_fields() => Some("off"),
    None => None,
  };

  let output_resolution = if req.model_type.always_sends_default_fields() {
    let resolution = req.output_resolution.unwrap_or(KinoviOutputResolutionRaw::SevenTwentyP);
    Some(resolution.as_explicit_api_str())
  } else {
    req.output_resolution.and_then(|r| r.as_api_str())
  };

  let batch_count_value = req.batch_count.as_u8();
  let batch_count = if batch_count_value > 1 { Some(batch_count_value) } else { None };

  let duration = format!("{}s", req.duration_seconds);

  // The aspect ratio is sent as a ratio string (e.g. "16:9"). Seedance Pro/Fast
  // carry it in the `resolution` field; Mini, the 2.5 family, and Happy Horse
  // use `aspectRatio`. Seedance 2.5 keyframe mode only supports "Adaptive",
  // which is expressed by omitting the field entirely.
  let aspect_ratio_value = req.aspect_ratio.as_aspect_ratio_str();
  let (resolution, aspect_ratio) = if video_input_mode == "keyframe" && req.model_type.omits_aspect_ratio_in_keyframe_mode() {
    (None, None)
  } else if req.model_type.uses_aspect_ratio_field() {
    (None, Some(aspect_ratio_value))
  } else {
    (Some(aspect_ratio_value.to_string()), None)
  };

  // Happy Horse uses `happyhorseMode` (t2v/i2v) instead of the standard `mode`
  // (keyframe/reference). i2v applies whenever an input image/video is attached.
  let (mode, happyhorse_mode) = if req.model_type.uses_happyhorse_mode() {
    let hh = if uploaded_urls.is_some() { "i2v" } else { "t2v" };
    (None, Some(hh))
  } else {
    (Some(video_input_mode), None)
  };

  info!(
    "Generating video (v2): mode={}, model={}, duration={}, batch={}",
    video_input_mode, req.model_type.as_api_str(), duration, batch_count_value
  );

  BatchRequest {
    zero: BatchRequestInner {
      json: BatchRequestJson {
        business_type: req.model_type.business_type(),
        api_params: ApiParams {
          prompt: req.prompt,
          resolution,
          aspect_ratio,
          content_mode: "normal",
          model: req.model_type.as_api_str(),
          duration,
          mode,
          happyhorse_mode,
          output_resolution,
          face_blur_mode,
          character_ids: req.character_ids,
          image_urls,
          video_urls,
          uploaded_urls,
          audio_urls,
          batch_count,
          bitrate_mode: req.bitrate.and_then(|bitrate| bitrate.as_api_str()),
        },
      },
    },
  }
}

#[cfg(test)]
mod tests {
  use std::fs;
  use super::*;
  use crate::creds::kinovi_web_session::KinoviWebSession;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;
  use crate::requests::prepare_file_upload::prepare_file_upload::{prepare_file_upload, PrepareFileUploadArgs};
  use crate::requests::upload_file::upload_file::{upload_file, UploadFileArgs};

  // ── Bitrate serialization ──
  //
  // The optional `bitrate_mode` field is sent only when `High` is requested;
  // the standard (default) bitrate omits the field entirely.

  mod bitrate_tests {
    use super::*;

    #[test]
    fn high_bitrate_serializes_to_high() {
      assert_eq!(KinoviBitrateRaw::High.as_api_str(), Some("high"));

      let api_params = base_api_params(Some("high"));
      let json = serde_json::to_string(&api_params).unwrap();
      assert!(json.contains(r#""bitrate_mode":"high""#), "expected bitrate_mode in {json}");
    }

    #[test]
    fn standard_bitrate_omits_field() {
      let api_params = base_api_params(None);
      let json = serde_json::to_string(&api_params).unwrap();
      assert!(!json.contains("bitrate_mode"), "expected no bitrate_mode in {json}");
    }

    fn base_api_params(bitrate_mode: Option<&'static str>) -> ApiParams {
      ApiParams {
        prompt: "a corgi".to_string(),
        resolution: Some("16:9".to_string()),
        aspect_ratio: None,
        content_mode: "normal",
        model: "seedance-20",
        duration: "5s".to_string(),
        mode: Some("keyframe"),
        happyhorse_mode: None,
        output_resolution: None,
        face_blur_mode: None,
        character_ids: None,
        image_urls: None,
        video_urls: None,
        uploaded_urls: None,
        audio_urls: None,
        batch_count: None,
        bitrate_mode,
      }
    }
  }

  // ── Output-resolution serialization ──
  //
  // `outputResolution` is sent only when non-default; 720p (the default) omits
  // the field. 4K serializes to the literal "4k".

  mod output_resolution_serialization_tests {
    use super::*;

    #[test]
    fn four_k_maps_to_4k() {
      assert_eq!(KinoviOutputResolutionRaw::FourK.as_api_str(), Some("4k"));
    }

    #[test]
    fn four_k_serializes_on_the_wire() {
      let api_params = base_api_params(KinoviOutputResolutionRaw::FourK.as_api_str());
      let json = serde_json::to_string(&api_params).unwrap();
      assert!(json.contains(r#""outputResolution":"4k""#), "expected outputResolution in {json}");
    }

    #[test]
    fn default_720p_omits_output_resolution() {
      assert_eq!(KinoviOutputResolutionRaw::SevenTwentyP.as_api_str(), None);
      let api_params = base_api_params(KinoviOutputResolutionRaw::SevenTwentyP.as_api_str());
      let json = serde_json::to_string(&api_params).unwrap();
      assert!(!json.contains("outputResolution"), "expected no outputResolution in {json}");
    }

    fn base_api_params(output_resolution: Option<&'static str>) -> ApiParams {
      ApiParams {
        prompt: "a corgi".to_string(),
        resolution: Some("16:9".to_string()),
        aspect_ratio: None,
        content_mode: "normal",
        model: "seedance-20",
        duration: "5s".to_string(),
        mode: Some("reference"),
        happyhorse_mode: None,
        output_resolution,
        face_blur_mode: None,
        character_ids: None,
        image_urls: None,
        video_urls: None,
        uploaded_urls: None,
        audio_urls: None,
        batch_count: None,
        bitrate_mode: None,
      }
    }
  }

  // ── Seedance 2.0 Mini request shape ──
  //
  // Mini differs from the other models on the wire: a
  // `seedance20-mini-video-generation` businessType, a `seedance2.0-mini`
  // model, and an `aspectRatio` ratio string (e.g. "16:9") in place of the
  // pixel-dimension `resolution` field.

  mod mini_request_shape_tests {
    use super::*;

    fn mini_request(
      aspect_ratio: KinoviAspectRatioRaw,
      output_resolution: Option<KinoviOutputResolutionRaw>,
      batch_count: KinoviBatchCountRaw,
    ) -> WorkflowRunTaskRequest {
      WorkflowRunTaskRequest {
        model_type: KinoviModelTypeRaw::Seedance2Mini,
        prompt: "a corgi".to_string(),
        aspect_ratio,
        output_resolution,
        duration_seconds: 5,
        batch_count,
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: None,
        reference_video_urls: None,
        reference_audio_urls: None,
        character_ids: None,
        use_face_blur_hack: None,
        bitrate: None,
      }
    }

    #[test]
    fn mini_uses_aspect_ratio_field_and_business_type() {
      let body = build_batch_request(mini_request(
        KinoviAspectRatioRaw::Landscape4x3,
        Some(KinoviOutputResolutionRaw::FourEightyP),
        KinoviBatchCountRaw::One,
      ));
      let json = serde_json::to_string(&body).unwrap();
      assert!(json.contains(r#""businessType":"seedance20-mini-video-generation""#), "{json}");
      assert!(json.contains(r#""model":"seedance2.0-mini""#), "{json}");
      assert!(json.contains(r#""aspectRatio":"4:3""#), "{json}");
      assert!(json.contains(r#""outputResolution":"480p""#), "{json}");
      // Mini does NOT send the pixel-dimension `resolution` field.
      assert!(!json.contains(r#""resolution":"#), "{json}");
    }

    #[test]
    fn mini_720p_omits_output_resolution() {
      let body = build_batch_request(mini_request(
        KinoviAspectRatioRaw::Landscape16x9,
        None,
        KinoviBatchCountRaw::One,
      ));
      let json = serde_json::to_string(&body).unwrap();
      assert!(json.contains(r#""aspectRatio":"16:9""#), "{json}");
      assert!(!json.contains("outputResolution"), "{json}");
    }

    #[test]
    fn mini_batch_count_eight_serializes() {
      let body = build_batch_request(mini_request(
        KinoviAspectRatioRaw::Landscape16x9,
        None,
        KinoviBatchCountRaw::Eight,
      ));
      let json = serde_json::to_string(&body).unwrap();
      assert!(json.contains(r#""batchCount":8"#), "{json}");
    }

    #[test]
    fn non_mini_still_uses_resolution_field() {
      let mut req = mini_request(KinoviAspectRatioRaw::Landscape16x9, None, KinoviBatchCountRaw::One);
      req.model_type = KinoviModelTypeRaw::Seedance2Pro;
      let body = build_batch_request(req);
      let json = serde_json::to_string(&body).unwrap();
      assert!(json.contains(r#""businessType":"wan22-video-generation""#), "{json}");
      assert!(json.contains(r#""resolution":"16:9""#), "{json}");
      assert!(!json.contains("aspectRatio"), "{json}");
    }

    #[test]
    fn model_strings_and_business_types() {
      assert_eq!(KinoviModelTypeRaw::Seedance2Mini.as_api_str(), "seedance2.0-mini");
      assert_eq!(KinoviModelTypeRaw::Seedance2Mini.business_type(), "seedance20-mini-video-generation");
      assert_eq!(KinoviModelTypeRaw::Seedance2Pro.business_type(), "wan22-video-generation");
      assert_eq!(KinoviModelTypeRaw::Seedance2Fast.business_type(), "wan22-video-generation");
      assert_eq!(KinoviModelTypeRaw::HappyHorse1p0.business_type(), "happyhorse-video-generation");
    }

    #[test]
    fn aspect_ratio_strings() {
      assert_eq!(KinoviAspectRatioRaw::Landscape16x9.as_aspect_ratio_str(), "16:9");
      assert_eq!(KinoviAspectRatioRaw::UltraWide21x9.as_aspect_ratio_str(), "21:9");
      assert_eq!(KinoviAspectRatioRaw::Portrait9x16.as_aspect_ratio_str(), "9:16");
      assert_eq!(KinoviAspectRatioRaw::Square1x1.as_aspect_ratio_str(), "1:1");
      assert_eq!(KinoviAspectRatioRaw::Landscape4x3.as_aspect_ratio_str(), "4:3");
      assert_eq!(KinoviAspectRatioRaw::Portrait3x4.as_aspect_ratio_str(), "3:4");
    }
  }

  // ── Seedance 2.5 Preview request shape ──
  //
  // 2.5 Preview differs from the other models on the wire: a
  // `seedance25-preview-video-generation` businessType, a
  // `seedance2-5-preview` model, an `aspectRatio` ratio string, `mode` always
  // "reference" (even with no references), `outputResolution` and
  // `faceBlurMode` always sent (including their "720p" / "off" defaults), and
  // references split into `imageUrls` / `videoUrls` with `uploadedUrls`
  // mirroring just the images.

  mod seedance_2p5_preview_shape_tests {
    use super::*;

    fn preview_request(
      output_resolution: Option<KinoviOutputResolutionRaw>,
      reference_image_urls: Option<Vec<String>>,
      reference_video_urls: Option<Vec<String>>,
      reference_audio_urls: Option<Vec<String>>,
    ) -> WorkflowRunTaskRequest {
      WorkflowRunTaskRequest {
        model_type: KinoviModelTypeRaw::Seedance2p5Preview,
        prompt: "A man is running from a t-rex".to_string(),
        aspect_ratio: KinoviAspectRatioRaw::Landscape16x9,
        output_resolution,
        duration_seconds: 4,
        batch_count: KinoviBatchCountRaw::One,
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls,
        reference_video_urls,
        reference_audio_urls,
        character_ids: None,
        use_face_blur_hack: None,
        bitrate: None,
      }
    }

    #[test]
    fn text_to_video_matches_observed_request() {
      // Mirrors external/requests/sites/kinovi.ai/2026-07-31-seedance2p5/1_seedance2p5.txt.
      let body = build_batch_request(preview_request(
        Some(KinoviOutputResolutionRaw::FourEightyP), None, None, None));
      let json = serde_json::to_string(&body).unwrap();
      assert!(json.contains(r#""businessType":"seedance25-preview-video-generation""#), "{json}");
      assert!(json.contains(r#""model":"seedance2-5-preview""#), "{json}");
      assert!(json.contains(r#""aspectRatio":"16:9""#), "{json}");
      assert!(json.contains(r#""duration":"4s""#), "{json}");
      assert!(json.contains(r#""outputResolution":"480p""#), "{json}");
      assert!(json.contains(r#""contentMode":"normal""#), "{json}");
      // 2.5 Preview does NOT send the ratio-string `resolution` field.
      assert!(!json.contains(r#""resolution":"#), "{json}");
      // No references attached: no URL fields at all.
      assert!(!json.contains("imageUrls"), "{json}");
      assert!(!json.contains("videoUrls"), "{json}");
      assert!(!json.contains("uploadedUrls"), "{json}");
      assert!(!json.contains("audioUrls"), "{json}");
    }

    #[test]
    fn mode_is_reference_even_without_references() {
      let body = build_batch_request(preview_request(None, None, None, None));
      let json = serde_json::to_string(&body).unwrap();
      assert!(json.contains(r#""mode":"reference""#), "{json}");
      assert!(!json.contains("keyframe"), "{json}");
    }

    #[test]
    fn default_720p_and_face_blur_off_are_sent_explicitly() {
      let body = build_batch_request(preview_request(None, None, None, None));
      let json = serde_json::to_string(&body).unwrap();
      assert!(json.contains(r#""outputResolution":"720p""#), "{json}");
      assert!(json.contains(r#""faceBlurMode":"off""#), "{json}");
    }

    #[test]
    fn image_references_fill_image_urls_and_uploaded_urls() {
      let images = vec![
        "https://static.seedance2-pro.com/materials/a.jpg".to_string(),
        "https://static.seedance2-pro.com/materials/b.png".to_string(),
      ];
      let body = build_batch_request(preview_request(
        Some(KinoviOutputResolutionRaw::SevenTwentyP), Some(images), None, None));
      let json = serde_json::to_string(&body).unwrap();
      let expected_urls = r#"["https://static.seedance2-pro.com/materials/a.jpg","https://static.seedance2-pro.com/materials/b.png"]"#;
      assert!(json.contains(&format!(r#""imageUrls":{expected_urls}"#)), "{json}");
      // `uploadedUrls` mirrors the images.
      assert!(json.contains(&format!(r#""uploadedUrls":{expected_urls}"#)), "{json}");
      assert!(!json.contains("videoUrls"), "{json}");
    }

    #[test]
    fn video_and_audio_references_use_their_own_fields() {
      // Mirrors 3_seedance2p5_third.txt: images + video + audio. The video
      // and audio URLs are NOT mirrored into `uploadedUrls`.
      let body = build_batch_request(preview_request(
        Some(KinoviOutputResolutionRaw::FourEightyP),
        Some(vec!["https://static.seedance2-pro.com/materials/img.jpg".to_string()]),
        Some(vec!["https://static.seedance2-pro.com/materials/dog.mp4".to_string()]),
        Some(vec!["https://static.seedance2-pro.com/materials/bark.wav".to_string()]),
      ));
      let json = serde_json::to_string(&body).unwrap();
      assert!(json.contains(r#""imageUrls":["https://static.seedance2-pro.com/materials/img.jpg"]"#), "{json}");
      assert!(json.contains(r#""videoUrls":["https://static.seedance2-pro.com/materials/dog.mp4"]"#), "{json}");
      assert!(json.contains(r#""audioUrls":["https://static.seedance2-pro.com/materials/bark.wav"]"#), "{json}");
      assert!(json.contains(r#""uploadedUrls":["https://static.seedance2-pro.com/materials/img.jpg"]"#), "{json}");
    }

    #[test]
    fn empty_reference_lists_send_no_url_fields() {
      let body = build_batch_request(preview_request(
        None, Some(vec![]), Some(vec![]), None));
      let json = serde_json::to_string(&body).unwrap();
      assert!(!json.contains("imageUrls"), "{json}");
      assert!(!json.contains("videoUrls"), "{json}");
      assert!(!json.contains("uploadedUrls"), "{json}");
    }

    #[test]
    fn model_string_and_business_type() {
      assert_eq!(KinoviModelTypeRaw::Seedance2p5Preview.as_api_str(), "seedance2-5-preview");
      assert_eq!(KinoviModelTypeRaw::Seedance2p5Preview.business_type(), "seedance25-preview-video-generation");
    }
  }

  // ── Seedance 2.5 request shape ──
  //
  // Seedance 2.5 reuses the *preview* businessType
  // (`seedance25-preview-video-generation`) with model `seedance2-5`. Unlike
  // Preview it has a keyframe (image-to-video) mode: `mode` is "keyframe"
  // only when a start/end frame is attached (text-to-video goes out as
  // "reference"), keyframe requests omit `aspectRatio` entirely (the only
  // choice is "Adaptive"), and the frames ride in `imageUrls` with
  // `uploadedUrls` mirroring them. Reference mode matches Preview's split
  // URL shape. Mirrors
  // external/requests/sites/kinovi.ai/2026-08-07-seedance2p5/.

  mod seedance_2p5_shape_tests {
    use super::*;

    fn base_request(prompt: &str, duration_seconds: u8) -> WorkflowRunTaskRequest {
      WorkflowRunTaskRequest {
        model_type: KinoviModelTypeRaw::Seedance2p5,
        prompt: prompt.to_string(),
        aspect_ratio: KinoviAspectRatioRaw::Landscape16x9,
        output_resolution: Some(KinoviOutputResolutionRaw::FourEightyP),
        duration_seconds,
        batch_count: KinoviBatchCountRaw::One,
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: None,
        reference_video_urls: None,
        reference_audio_urls: None,
        character_ids: None,
        use_face_blur_hack: None,
        bitrate: None,
      }
    }

    #[test]
    fn text_to_video_matches_observed_request() {
      // Mirrors 1_request_text_to_video.txt: mode "reference", aspectRatio
      // "16:9", 480p, 5s, no URL fields.
      let body = build_batch_request(base_request("Lightning hits a building", 5));
      let json = serde_json::to_string(&body).unwrap();
      assert!(json.contains(r#""businessType":"seedance25-preview-video-generation""#), "{json}");
      assert!(json.contains(r#""model":"seedance2-5""#), "{json}");
      assert!(json.contains(r#""mode":"reference""#), "{json}");
      assert!(json.contains(r#""aspectRatio":"16:9""#), "{json}");
      assert!(json.contains(r#""duration":"5s""#), "{json}");
      assert!(json.contains(r#""outputResolution":"480p""#), "{json}");
      assert!(json.contains(r#""faceBlurMode":"off""#), "{json}");
      assert!(json.contains(r#""contentMode":"normal""#), "{json}");
      // No ratio-string `resolution` field, and no URL fields.
      assert!(!json.contains(r#""resolution":"#), "{json}");
      assert!(!json.contains("imageUrls"), "{json}");
      assert!(!json.contains("videoUrls"), "{json}");
      assert!(!json.contains("uploadedUrls"), "{json}");
      assert!(!json.contains("audioUrls"), "{json}");
    }

    #[test]
    fn keyframe_with_both_frames_matches_observed_request() {
      // Mirrors 2_request_keyframe_to_video.txt: mode "keyframe", NO
      // aspectRatio (Adaptive), frames in imageUrls + uploadedUrls.
      let mut request = base_request("Car drives into the sunset", 8);
      request.start_frame_url = Some("https://static.seedance2-pro.com/materials/start.png".to_string());
      request.end_frame_url = Some("https://static.seedance2-pro.com/materials/end.png".to_string());

      let body = build_batch_request(request);
      let json = serde_json::to_string(&body).unwrap();
      assert!(json.contains(r#""mode":"keyframe""#), "{json}");
      // Adaptive: neither the `aspectRatio` nor `resolution` field is sent.
      assert!(!json.contains("aspectRatio"), "{json}");
      assert!(!json.contains(r#""resolution":"#), "{json}");
      let expected_urls = r#"["https://static.seedance2-pro.com/materials/start.png","https://static.seedance2-pro.com/materials/end.png"]"#;
      assert!(json.contains(&format!(r#""imageUrls":{expected_urls}"#)), "{json}");
      assert!(json.contains(&format!(r#""uploadedUrls":{expected_urls}"#)), "{json}");
      assert!(!json.contains("videoUrls"), "{json}");
    }

    #[test]
    fn keyframe_with_start_frame_only_matches_observed_request() {
      // Mirrors 4_request_keyframe_to_video_2.txt: a single start frame.
      let mut request = base_request("The cars drive by", 5);
      request.start_frame_url = Some("https://static.seedance2-pro.com/materials/start.jpg".to_string());

      let body = build_batch_request(request);
      let json = serde_json::to_string(&body).unwrap();
      assert!(json.contains(r#""mode":"keyframe""#), "{json}");
      assert!(!json.contains("aspectRatio"), "{json}");
      let expected_urls = r#"["https://static.seedance2-pro.com/materials/start.jpg"]"#;
      assert!(json.contains(&format!(r#""imageUrls":{expected_urls}"#)), "{json}");
      assert!(json.contains(&format!(r#""uploadedUrls":{expected_urls}"#)), "{json}");
    }

    #[test]
    fn reference_with_all_reference_types_matches_observed_request() {
      // Mirrors 3_request_reference_to_video.txt: mode "reference",
      // aspectRatio "21:9", split imageUrls / videoUrls / audioUrls with
      // uploadedUrls mirroring just the images.
      let mut request = base_request("The t-rex @image1 eats the banana @image2", 8);
      request.aspect_ratio = KinoviAspectRatioRaw::UltraWide21x9;
      request.reference_image_urls = Some(vec![
        "https://static.seedance2-pro.com/materials/a.png".to_string(),
        "https://static.seedance2-pro.com/materials/b.jpg".to_string(),
      ]);
      request.reference_video_urls = Some(vec!["https://static.seedance2-pro.com/materials/ref.mp4".to_string()]);
      request.reference_audio_urls = Some(vec!["https://static.seedance2-pro.com/materials/ref.wav".to_string()]);

      let body = build_batch_request(request);
      let json = serde_json::to_string(&body).unwrap();
      assert!(json.contains(r#""mode":"reference""#), "{json}");
      assert!(json.contains(r#""aspectRatio":"21:9""#), "{json}");
      let expected_images = r#"["https://static.seedance2-pro.com/materials/a.png","https://static.seedance2-pro.com/materials/b.jpg"]"#;
      assert!(json.contains(&format!(r#""imageUrls":{expected_images}"#)), "{json}");
      assert!(json.contains(&format!(r#""uploadedUrls":{expected_images}"#)), "{json}");
      assert!(json.contains(r#""videoUrls":["https://static.seedance2-pro.com/materials/ref.mp4"]"#), "{json}");
      assert!(json.contains(r#""audioUrls":["https://static.seedance2-pro.com/materials/ref.wav"]"#), "{json}");
    }

    #[test]
    fn default_720p_and_face_blur_off_are_sent_explicitly() {
      let mut request = base_request("a corgi", 5);
      request.output_resolution = None;

      let body = build_batch_request(request);
      let json = serde_json::to_string(&body).unwrap();
      assert!(json.contains(r#""outputResolution":"720p""#), "{json}");
      assert!(json.contains(r#""faceBlurMode":"off""#), "{json}");
    }

    #[test]
    fn model_string_and_business_type() {
      assert_eq!(KinoviModelTypeRaw::Seedance2p5.as_api_str(), "seedance2-5");
      assert_eq!(KinoviModelTypeRaw::Seedance2p5.business_type(), "seedance25-preview-video-generation");
    }
  }

  // ── 2026-06-24 request-shape change ──
  //
  // The aspect ratio is now a ratio string ("16:9"). Seedance Pro/Fast keep it
  // in `resolution`; Happy Horse moved to its own `businessType`, an
  // `aspectRatio` field, and a `happyhorseMode` (t2v/i2v) in place of `mode`.

  mod wire_shape_change_tests {
    use super::*;

    fn request(
      model_type: KinoviModelTypeRaw,
      aspect_ratio: KinoviAspectRatioRaw,
      start_frame_url: Option<String>,
    ) -> WorkflowRunTaskRequest {
      WorkflowRunTaskRequest {
        model_type,
        prompt: "a corgi".to_string(),
        aspect_ratio,
        output_resolution: None,
        duration_seconds: 5,
        batch_count: KinoviBatchCountRaw::One,
        start_frame_url,
        end_frame_url: None,
        reference_image_urls: None,
        reference_video_urls: None,
        reference_audio_urls: None,
        character_ids: None,
        use_face_blur_hack: None,
        bitrate: None,
      }
    }

    #[test]
    fn seedance_pro_resolution_is_a_ratio_string() {
      let body = build_batch_request(request(
        KinoviModelTypeRaw::Seedance2Pro, KinoviAspectRatioRaw::Landscape16x9, None));
      let json = serde_json::to_string(&body).unwrap();
      assert!(json.contains(r#""businessType":"wan22-video-generation""#), "{json}");
      assert!(json.contains(r#""resolution":"16:9""#), "{json}");
      assert!(json.contains(r#""mode":"keyframe""#), "{json}");
      assert!(!json.contains("aspectRatio"), "{json}");
      assert!(!json.contains("1280x720"), "{json}");
      assert!(!json.contains("happyhorseMode"), "{json}");
    }

    #[test]
    fn seedance_fast_resolution_is_a_ratio_string() {
      let body = build_batch_request(request(
        KinoviModelTypeRaw::Seedance2Fast, KinoviAspectRatioRaw::Portrait3x4, None));
      let json = serde_json::to_string(&body).unwrap();
      assert!(json.contains(r#""model":"seedance2-fast""#), "{json}");
      assert!(json.contains(r#""resolution":"3:4""#), "{json}");
    }

    #[test]
    fn happy_horse_text_to_video_shape() {
      let body = build_batch_request(request(
        KinoviModelTypeRaw::HappyHorse1p0, KinoviAspectRatioRaw::Portrait9x16, None));
      let json = serde_json::to_string(&body).unwrap();
      assert!(json.contains(r#""businessType":"happyhorse-video-generation""#), "{json}");
      assert!(json.contains(r#""model":"happyhorse1.0""#), "{json}");
      assert!(json.contains(r#""happyhorseMode":"t2v""#), "{json}");
      assert!(json.contains(r#""aspectRatio":"9:16""#), "{json}");
      // Happy Horse omits the standard `mode` and the `resolution` field.
      assert!(!json.contains(r#""mode":"#), "{json}");
      assert!(!json.contains(r#""resolution":"#), "{json}");
    }

    #[test]
    fn happy_horse_image_to_video_uses_i2v() {
      let body = build_batch_request(request(
        KinoviModelTypeRaw::HappyHorse1p0, KinoviAspectRatioRaw::Landscape16x9,
        Some("https://example.com/start.png".to_string())));
      let json = serde_json::to_string(&body).unwrap();
      assert!(json.contains(r#""happyhorseMode":"i2v""#), "{json}");
      assert!(json.contains(r#""uploadedUrls":["https://example.com/start.png"]"#), "{json}");
      assert!(!json.contains(r#""mode":"#), "{json}");
    }

    #[test]
    fn business_types() {
      assert_eq!(KinoviModelTypeRaw::Seedance2Pro.business_type(), "wan22-video-generation");
      assert_eq!(KinoviModelTypeRaw::Seedance2Fast.business_type(), "wan22-video-generation");
      assert_eq!(KinoviModelTypeRaw::Seedance2Mini.business_type(), "seedance20-mini-video-generation");
      assert_eq!(KinoviModelTypeRaw::HappyHorse1p0.business_type(), "happyhorse-video-generation");
    }
  }

  mod real_requests {
    use super::*;

    fn test_session() -> AnyhowResult<KinoviWebSession> {
      let cookies = get_test_cookies()?;
      Ok(KinoviWebSession::from_cookies_string(cookies))
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
          bitrate: None,
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
          bitrate: None,
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
          bitrate: None,
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
          bitrate: None,
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
          bitrate: None,
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
      let session = KinoviWebSession::from_cookies_string(cookies);
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
          bitrate: None,
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
          bitrate: None,
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
          bitrate: None,
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
          bitrate: None,
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
          bitrate: None,
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
            bitrate: None,
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
            bitrate: None,
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
            bitrate: None,
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
            bitrate: None,
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
            bitrate: None,
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
            bitrate: None,
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
            bitrate: None,
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

    fn test_session() -> AnyhowResult<KinoviWebSession> {
      let cookies = get_test_cookies()?;
      Ok(KinoviWebSession::from_cookies_string(cookies))
    }

    fn make_args_with_prompt<'a>(
      prompt: &'a str,
      session: &'a KinoviWebSession,
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
          bitrate: None,
        },
      }
    }

    fn make_args<'a>(
      session: &'a KinoviWebSession,
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

      /// 4K with image references (Seedance 2.0 Pro only), 5-second sample.
      #[tokio::test]
      #[ignore]
      async fn test_4k_image_references() -> AnyhowResult<()> {
        setup_test_logging(LevelFilter::Trace);
        let session = test_session()?;

        // Upload a few reference images first, then drive a 5-second 4K job.
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
            model_type: KinoviModelTypeRaw::Seedance2Pro,
            prompt: "The dog in @1 explores the scenery in @3 near the building in @2. Cinematic 4K detail.".to_string(),
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
            bitrate: None,
            output_resolution: Some(KinoviOutputResolutionRaw::FourK),
          },
        };
        let result = workflow_run_task(args).await?;
        println!("Seedance 2.0 @ 4K (image refs) — task_id={}, order_id={}", result.task_id, result.order_id);
        assert!(!result.task_id.is_empty());
        assert!(!result.order_id.is_empty());
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
