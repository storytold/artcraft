use std::fmt;

use log::info;
use reqwest::multipart::{Form, Part};

use crate::creds::comet_api_key::CometApiKey;
use crate::error::categorize_comet_error::categorize_create_video_error;
use crate::error::comet_client_error::CometClientError;
use crate::error::comet_error::CometError;
use crate::error::comet_generic_api_error::CometGenericApiError;
use crate::requests::comet_host::COMET_API_BASE_URL;
use crate::requests::create_video::request_types::CreateVideoRawResponse;
use crate::requests::video_task_status::CometVideoTaskStatus;

// ── Public args ──

/// Top-level argument to [`create_video`]. Borrows the API key separately
/// from the request body so callers can log/save [`CreateVideoRequest`]
/// without leaking the credential.
pub struct CreateVideoArgs<'a> {
  pub api_key: &'a CometApiKey,
  pub request: CreateVideoRequest,
}

/// The material part of a video creation request (`POST /v1/videos`).
///
/// This is the generic, model-agnostic wire shape. Per-model duration and
/// size constraints are NOT enforced here — use the strongly-typed bindings
/// in [`crate::generate::video`] which validate before delegating to this.
#[derive(Clone)]
pub struct CreateVideoRequest {
  /// Which video model fulfils the request.
  pub model: CometVideoModelRaw,

  /// Text description of the desired video. Reference attached images in
  /// the prompt as `[Image 1]`, `[Image 2]`, etc.
  pub prompt: String,

  /// Video duration in seconds. Valid ranges are model-specific. Default: 5.
  pub maybe_seconds: Option<u8>,

  /// Output size: an aspect-ratio preset or exact dimensions.
  pub maybe_size: Option<CometVideoSize>,

  /// Optional reference images (JPEG, PNG, WebP) for image-to-video.
  /// Each is sent as a repeated `input_reference` multipart field.
  /// Not all models support image input.
  pub input_reference_images: Vec<CometInputReferenceImage>,
}

/// The video models CometAPI fronts on `POST /v1/videos`.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum CometVideoModelRaw {
  /// Seedance 2.0
  DoubaoSeedance2p0,
  /// Seedance 2.0 Fast
  DoubaoSeedance2p0Fast,
  /// Seedance 1.5 Pro (text-only)
  DoubaoSeedance1p5Pro,
  /// Seedance 1.0 Pro (text-only)
  DoubaoSeedance1p0Pro,
  /// Vidu Q3
  ViduQ3,
  /// Vidu Q3 Turbo
  ViduQ3Turbo,
  /// Alibaba Wan 2.7
  Wan2p7,
  /// Alibaba Wan 2.6
  Wan2p6,
}

/// Output video size: a ratio preset or exact pixel dimensions.
#[derive(Copy, Clone, Debug, PartialEq, Eq)]
pub enum CometVideoSize {
  /// 16:9 (landscape)
  Landscape16x9,
  /// 4:3
  Standard4x3,
  /// 1:1 (square)
  Square,
  /// 3:4
  Portrait3x4,
  /// 9:16 (portrait)
  Portrait9x16,
  /// 21:9 (ultra-wide)
  UltraWide21x9,
  /// Exact dimensions, eg. 1280x720.
  Exact { width: u32, height: u32 },
}

/// A reference image attached to the request as a binary multipart part.
#[derive(Clone)]
pub struct CometInputReferenceImage {
  /// Raw bytes of the image (JPEG, PNG, or WebP). Excluded from `Debug`
  /// output — a megabyte-scale blob shouldn't end up in a log line.
  pub file_bytes: Vec<u8>,

  /// Filename for the multipart `Content-Disposition` header.
  pub filename: String,

  /// Optional MIME type, eg. "image/png". If `None`, reqwest uses
  /// `application/octet-stream`.
  pub maybe_content_type: Option<String>,
}

// ── Public response ──

#[derive(Clone, Debug)]
pub struct CreateVideoSuccess {
  /// Task identifier. Poll `GET /v1/videos/{task_id}` until terminal.
  pub task_id: String,

  /// Initial lifecycle status, typically queued.
  pub status: CometVideoTaskStatus,

  /// The model that will fulfil the task, as echoed by the API.
  pub maybe_model: Option<String>,

  /// 0-100 completion percentage.
  pub maybe_progress: Option<u8>,

  /// Unix timestamp (seconds).
  pub maybe_created_at: Option<i64>,
}

/// Enqueue a Doubao Seedance 2.0 video generation task.
///
/// CometAPI's video creation endpoint takes `multipart/form-data`. The task
/// id in the response is then polled with
/// [`crate::requests::get_video_task::get_video_task::get_video_task`].
pub async fn create_video(args: CreateVideoArgs<'_>) -> Result<CreateVideoSuccess, CometError> {
  let request = &args.request;
  request.validate()?;

  let url = format!("{COMET_API_BASE_URL}/v1/videos");

  let mut form = Form::new();
  for (field, value) in request.text_form_fields() {
    form = form.text(field, value);
  }
  for image in &request.input_reference_images {
    let mut part = Part::bytes(image.file_bytes.clone())
      .file_name(image.filename.clone());
    if let Some(content_type) = &image.maybe_content_type {
      part = part.mime_str(content_type)
        .map_err(|err| CometClientError::InvalidRequestField {
          field: "input_reference_images.maybe_content_type",
          raw_value: content_type.clone(),
          reason: format!("invalid mime type: {err}"),
        })?;
    }
    form = form.part("input_reference", part);
  }

  let client = reqwest::Client::builder()
    .build()
    .map_err(CometClientError::ReqwestClientError)?;

  let response = client.post(&url)
    .bearer_auth(args.api_key.as_str())
    .multipart(form)
    .send()
    .await
    .map_err(CometGenericApiError::ReqwestError)?;

  let status_code = response.status();
  let body = response.text()
    .await
    .map_err(CometGenericApiError::ReqwestError)?;

  if !status_code.is_success() {
    return Err(categorize_create_video_error(status_code, body));
  }

  let raw: CreateVideoRawResponse = serde_json::from_str(&body)
    .map_err(|err| CometGenericApiError::SerdeResponseParseErrorWithBody(err, body.clone()))?;

  info!("Comet video task enqueued: {} (status: {})", raw.id, raw.status);

  Ok(CreateVideoSuccess {
    task_id: raw.id,
    status: raw.status,
    maybe_model: raw.model,
    maybe_progress: raw.progress,
    maybe_created_at: raw.created_at,
  })
}

impl CreateVideoRequest {
  /// The text fields of the multipart form, in wire order. Split out from
  /// [`create_video`] so the form shape is testable without HTTP.
  pub fn text_form_fields(&self) -> Vec<(&'static str, String)> {
    let mut fields = vec![
      ("model", self.model.as_api_str().to_string()),
      ("prompt", self.prompt.clone()),
    ];
    if let Some(seconds) = self.maybe_seconds {
      fields.push(("seconds", seconds.to_string()));
    }
    if let Some(size) = self.maybe_size {
      fields.push(("size", size.as_api_string()));
    }
    fields
  }

  fn validate(&self) -> Result<(), CometClientError> {
    if self.prompt.trim().is_empty() {
      return Err(CometClientError::InvalidRequestField {
        field: "prompt",
        raw_value: self.prompt.clone(),
        reason: "prompt must not be empty".to_string(),
      });
    }

    Ok(())
  }
}

impl CometVideoModelRaw {
  pub fn as_api_str(&self) -> &'static str {
    match self {
      Self::DoubaoSeedance2p0 => "doubao-seedance-2-0",
      Self::DoubaoSeedance2p0Fast => "doubao-seedance-2-0-fast",
      Self::DoubaoSeedance1p5Pro => "doubao-seedance-1-5-pro",
      Self::DoubaoSeedance1p0Pro => "doubao-seedance-1-0-pro",
      Self::ViduQ3 => "viduq3",
      Self::ViduQ3Turbo => "viduq3-turbo",
      Self::Wan2p7 => "wan2.7",
      Self::Wan2p6 => "wan2.6",
    }
  }
}

impl CometVideoSize {
  pub fn as_api_string(&self) -> String {
    match self {
      Self::Landscape16x9 => "16:9".to_string(),
      Self::Standard4x3 => "4:3".to_string(),
      Self::Square => "1:1".to_string(),
      Self::Portrait3x4 => "3:4".to_string(),
      Self::Portrait9x16 => "9:16".to_string(),
      Self::UltraWide21x9 => "21:9".to_string(),
      Self::Exact { width, height } => format!("{width}x{height}"),
    }
  }
}

impl fmt::Debug for CreateVideoRequest {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    f.debug_struct("CreateVideoRequest")
      .field("model", &self.model)
      .field("prompt", &self.prompt)
      .field("maybe_seconds", &self.maybe_seconds)
      .field("maybe_size", &self.maybe_size)
      .field("input_reference_images", &self.input_reference_images)
      .finish()
  }
}

impl fmt::Debug for CometInputReferenceImage {
  // Print byte-length, not raw bytes — derived Debug on Vec<u8> would dump
  // the entire image into the log line.
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    f.debug_struct("CometInputReferenceImage")
      .field("file_bytes_len", &self.file_bytes.len())
      .field("filename", &self.filename)
      .field("maybe_content_type", &self.maybe_content_type)
      .finish()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  mod shape_tests {
    use super::*;

    #[test]
    fn model_api_strings() {
      assert_eq!(CometVideoModelRaw::DoubaoSeedance2p0.as_api_str(), "doubao-seedance-2-0");
      assert_eq!(CometVideoModelRaw::DoubaoSeedance2p0Fast.as_api_str(), "doubao-seedance-2-0-fast");
      assert_eq!(CometVideoModelRaw::DoubaoSeedance1p5Pro.as_api_str(), "doubao-seedance-1-5-pro");
      assert_eq!(CometVideoModelRaw::DoubaoSeedance1p0Pro.as_api_str(), "doubao-seedance-1-0-pro");
      assert_eq!(CometVideoModelRaw::ViduQ3.as_api_str(), "viduq3");
      assert_eq!(CometVideoModelRaw::ViduQ3Turbo.as_api_str(), "viduq3-turbo");
      assert_eq!(CometVideoModelRaw::Wan2p7.as_api_str(), "wan2.7");
      assert_eq!(CometVideoModelRaw::Wan2p6.as_api_str(), "wan2.6");
    }

    #[test]
    fn size_api_strings() {
      assert_eq!(CometVideoSize::Landscape16x9.as_api_string(), "16:9");
      assert_eq!(CometVideoSize::Standard4x3.as_api_string(), "4:3");
      assert_eq!(CometVideoSize::Square.as_api_string(), "1:1");
      assert_eq!(CometVideoSize::Portrait3x4.as_api_string(), "3:4");
      assert_eq!(CometVideoSize::Portrait9x16.as_api_string(), "9:16");
      assert_eq!(CometVideoSize::UltraWide21x9.as_api_string(), "21:9");
      assert_eq!(CometVideoSize::Exact { width: 1280, height: 720 }.as_api_string(), "1280x720");
    }

    #[test]
    fn minimal_form_fields() {
      let request = CreateVideoRequest {
        model: CometVideoModelRaw::DoubaoSeedance2p0Fast,
        prompt: "a corgi running through a field".to_string(),
        maybe_seconds: None,
        maybe_size: None,
        input_reference_images: vec![],
      };

      assert_eq!(request.text_form_fields(), vec![
        ("model", "doubao-seedance-2-0-fast".to_string()),
        ("prompt", "a corgi running through a field".to_string()),
      ]);
    }

    #[test]
    fn full_form_fields() {
      let request = CreateVideoRequest {
        model: CometVideoModelRaw::DoubaoSeedance2p0,
        prompt: "make [Image 1] come alive".to_string(),
        maybe_seconds: Some(10),
        maybe_size: Some(CometVideoSize::Portrait9x16),
        input_reference_images: vec![],
      };

      assert_eq!(request.text_form_fields(), vec![
        ("model", "doubao-seedance-2-0".to_string()),
        ("prompt", "make [Image 1] come alive".to_string()),
        ("seconds", "10".to_string()),
        ("size", "9:16".to_string()),
      ]);
    }
  }

  mod validation_tests {
    use super::*;

    #[test]
    fn empty_prompt_is_rejected() {
      let request = request_with_prompt_and_seconds("  ", None);
      let error = request.validate().expect_err("should reject empty prompt");
      assert!(matches!(error, CometClientError::InvalidRequestField { field: "prompt", .. }));
    }

    // NB: Duration ranges are model-specific and validated by the concrete
    // bindings in `generate::video`; the generic layer accepts any value.

    fn request_with_prompt_and_seconds(prompt: &str, maybe_seconds: Option<u8>) -> CreateVideoRequest {
      CreateVideoRequest {
        model: CometVideoModelRaw::DoubaoSeedance2p0,
        prompt: prompt.to_string(),
        maybe_seconds,
        maybe_size: None,
        input_reference_images: vec![],
      }
    }
  }

  mod live_tests {
    use super::*;
    use crate::test_utils::load_api_key;

    /// Live test: enqueues a REAL generation and INCURS COSTS.
    /// Run manually with:
    ///   cargo test -p comet_api_client live_create_video -- --ignored --nocapture
    #[ignore]
    #[tokio::test]
    async fn live_create_video() {
      let api_key = load_api_key();

      let result = create_video(CreateVideoArgs {
        api_key: &api_key,
        request: CreateVideoRequest {
          model: CometVideoModelRaw::DoubaoSeedance2p0Fast,
          prompt: "a corgi running through a sunny meadow, cinematic".to_string(),
          maybe_seconds: Some(4),
          maybe_size: Some(CometVideoSize::Landscape16x9),
          input_reference_images: vec![],
        },
      }).await.expect("create_video should succeed");

      println!("Enqueued task: {} (status: {})", result.task_id, result.status);
      assert!(!result.task_id.is_empty());
    }

    /// Live test: enqueues a REAL generation and polls it to completion.
    /// INCURS COSTS and takes a few minutes. Run manually with:
    ///   cargo test -p comet_api_client live_create_and_poll_video -- --ignored --nocapture
    #[ignore]
    #[tokio::test]
    async fn live_create_and_poll_video() {
      use std::time::Duration;

      use crate::requests::get_video_task::get_video_task::{get_video_task, GetVideoTaskArgs};

      // NB: Comet's docs claim most tasks finish in 1-3 minutes, but tasks
      // have been observed to sit at `in_progress` well past 10 minutes.
      const POLL_INTERVAL: Duration = Duration::from_secs(15);
      const MAX_POLLS: u32 = 120; // ~30 minutes

      let api_key = load_api_key();

      let created = create_video(CreateVideoArgs {
        api_key: &api_key,
        request: CreateVideoRequest {
          model: CometVideoModelRaw::DoubaoSeedance2p0Fast,
          prompt: "a corgi running through a sunny meadow, cinematic".to_string(),
          maybe_seconds: Some(4),
          maybe_size: Some(CometVideoSize::Landscape16x9),
          input_reference_images: vec![],
        },
      }).await.expect("create_video should succeed");

      println!("Enqueued task: {} (status: {})", created.task_id, created.status);

      for poll in 1..=MAX_POLLS {
        tokio::time::sleep(POLL_INTERVAL).await;

        let task = get_video_task(GetVideoTaskArgs {
          api_key: &api_key,
          task_id: &created.task_id,
        }).await.expect("get_video_task should succeed");

        println!("Poll {}: status {} (progress: {:?})", poll, task.status, task.maybe_progress);

        if task.status.is_terminal() {
          assert!(task.status.is_success(), "task should complete successfully: {:?}", task);
          let video_url = task.maybe_video_url.expect("completed task should have a video url");
          println!("Video URL: {}", video_url);
          return;
        }
      }

      panic!("Task {} did not reach a terminal state in time", created.task_id);
    }
  }
}
