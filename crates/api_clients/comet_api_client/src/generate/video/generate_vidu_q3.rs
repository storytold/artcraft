use crate::creds::comet_api_key::CometApiKey;
use crate::error::comet_client_error::CometClientError;
use crate::error::comet_error::CometError;
use crate::requests::create_video::create_video::{
  create_video, CometInputReferenceImage, CometVideoModelRaw, CometVideoSize,
  CreateVideoArgs, CreateVideoRequest,
};
use crate::requests::video_task_status::CometVideoTaskStatus;

/// Vidu Q3 supports 1-16 second durations.
const MIN_DURATION_SECONDS: u8 = 1;
const MAX_DURATION_SECONDS: u8 = 16;

// ── Args ──

pub struct GenerateViduQ3Args<'a> {
  pub request: GenerateViduQ3Request,
  pub api_key: &'a CometApiKey,
}

// ── Request ──

#[derive(Clone, Debug)]
pub struct GenerateViduQ3Request {
  pub prompt: String,

  /// 1-16 seconds. `None` uses the API default (5).
  pub duration_seconds: Option<u8>,

  pub size: Option<ViduQ3Size>,

  /// Reference images for image-to-video / start-end-to-video workflows.
  pub input_reference_images: Vec<CometInputReferenceImage>,
}

// ── Enums ──

/// Vidu Q3 renders at 540p/720p/1080p (24 FPS). The API's `size` field takes
/// an aspect ratio preset or exact dimensions (eg. 960x528).
#[derive(Debug, Clone, Copy)]
pub enum ViduQ3Size {
  Landscape16x9,
  Standard4x3,
  Square1x1,
  Portrait3x4,
  Portrait9x16,
  Exact { width: u32, height: u32 },
}

// ── Pricing ──
//
// Vidu Q3 per-second USD pricing (via CometAPI):
//
// | Resolution  | $/sec   |
// |-------------|---------|
// | 360p/540p   | 0.056   |
// | 720p/1080p  | 0.1232  |
//
// Total cost = price per second × video duration (seconds).
// NB: Not modeled as an estimator because the `size` field is an aspect
// ratio in the common case, which doesn't determine the billed resolution.

// ── Response ──

pub struct GenerateViduQ3Response {
  /// Poll `GET /v1/videos/{task_id}` until terminal.
  pub task_id: String,
  pub status: CometVideoTaskStatus,
}

// ── Entry point ──

pub async fn generate_vidu_q3(
  args: GenerateViduQ3Args<'_>,
) -> Result<GenerateViduQ3Response, CometError> {
  let raw_request = args.request.to_create_video_request()?;

  let result = create_video(CreateVideoArgs {
    api_key: args.api_key,
    request: raw_request,
  }).await?;

  Ok(GenerateViduQ3Response {
    task_id: result.task_id,
    status: result.status,
  })
}

impl GenerateViduQ3Request {
  /// Validate and lower to the generic wire request.
  pub fn to_create_video_request(&self) -> Result<CreateVideoRequest, CometClientError> {
    if let Some(seconds) = self.duration_seconds {
      if !(MIN_DURATION_SECONDS..=MAX_DURATION_SECONDS).contains(&seconds) {
        return Err(CometClientError::InvalidRequestField {
          field: "duration_seconds",
          raw_value: seconds.to_string(),
          reason: format!("Vidu Q3 supports {MIN_DURATION_SECONDS}-{MAX_DURATION_SECONDS} second durations"),
        });
      }
    }

    Ok(CreateVideoRequest {
      model: CometVideoModelRaw::ViduQ3,
      prompt: self.prompt.clone(),
      maybe_seconds: self.duration_seconds,
      maybe_size: self.size.map(map_size),
      input_reference_images: self.input_reference_images.clone(),
    })
  }
}

fn map_size(size: ViduQ3Size) -> CometVideoSize {
  match size {
    ViduQ3Size::Landscape16x9 => CometVideoSize::Landscape16x9,
    ViduQ3Size::Standard4x3 => CometVideoSize::Standard4x3,
    ViduQ3Size::Square1x1 => CometVideoSize::Square,
    ViduQ3Size::Portrait3x4 => CometVideoSize::Portrait3x4,
    ViduQ3Size::Portrait9x16 => CometVideoSize::Portrait9x16,
    ViduQ3Size::Exact { width, height } => CometVideoSize::Exact { width, height },
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn maps_to_wire_request() {
    let request = GenerateViduQ3Request {
      prompt: "a lighthouse in fog".to_string(),
      duration_seconds: Some(16),
      size: Some(ViduQ3Size::Exact { width: 960, height: 528 }),
      input_reference_images: vec![],
    };

    let raw = request.to_create_video_request().expect("should validate");
    assert_eq!(raw.text_form_fields(), vec![
      ("model", "viduq3".to_string()),
      ("prompt", "a lighthouse in fog".to_string()),
      ("seconds", "16".to_string()),
      ("size", "960x528".to_string()),
    ]);
  }

  #[test]
  fn duration_bounds() {
    assert!(request_with_seconds(Some(0)).to_create_video_request().is_err());
    assert!(request_with_seconds(Some(1)).to_create_video_request().is_ok());
    assert!(request_with_seconds(Some(16)).to_create_video_request().is_ok());
    assert!(request_with_seconds(Some(17)).to_create_video_request().is_err());
    assert!(request_with_seconds(None).to_create_video_request().is_ok());
  }

  fn request_with_seconds(duration_seconds: Option<u8>) -> GenerateViduQ3Request {
    GenerateViduQ3Request {
      prompt: "ok".to_string(),
      duration_seconds,
      size: None,
      input_reference_images: vec![],
    }
  }
}
