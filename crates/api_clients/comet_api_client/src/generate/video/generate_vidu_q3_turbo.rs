use crate::creds::comet_api_key::CometApiKey;
use crate::error::comet_client_error::CometClientError;
use crate::error::comet_error::CometError;
use crate::requests::create_video::create_video::{
  create_video, CometInputReferenceImage, CometVideoModelRaw, CometVideoSize,
  CreateVideoArgs, CreateVideoRequest,
};
use crate::requests::video_task_status::CometVideoTaskStatus;

/// Vidu Q3 Turbo supports 1-16 second durations.
const MIN_DURATION_SECONDS: u8 = 1;
const MAX_DURATION_SECONDS: u8 = 16;

// ── Args ──

pub struct GenerateViduQ3TurboArgs<'a> {
  pub request: GenerateViduQ3TurboRequest,
  pub api_key: &'a CometApiKey,
}

// ── Request ──

#[derive(Clone, Debug)]
pub struct GenerateViduQ3TurboRequest {
  pub prompt: String,

  /// 1-16 seconds. `None` uses the API default (5).
  pub duration_seconds: Option<u8>,

  pub size: Option<ViduQ3TurboSize>,

  /// Reference images for image-to-video / start-end-to-video workflows.
  pub input_reference_images: Vec<CometInputReferenceImage>,
}

// ── Enums ──

/// Vidu Q3 Turbo renders at 540p/720p/1080p (24 FPS). The API's `size` field
/// takes an aspect ratio preset or exact dimensions (eg. 960x528).
#[derive(Debug, Clone, Copy)]
pub enum ViduQ3TurboSize {
  Landscape16x9,
  Standard4x3,
  Square1x1,
  Portrait3x4,
  Portrait9x16,
  Exact { width: u32, height: u32 },
}

// ── Pricing ──
//
// Vidu Q3 Turbo per-second USD pricing (via CometAPI):
//
// | Resolution  | $/sec   |
// |-------------|---------|
// | 360p/540p   | 0.028   |
// | 720p/1080p  | 0.0616  |
//
// Total cost = price per second × video duration (seconds).
// NB: Not modeled as an estimator because the `size` field is an aspect
// ratio in the common case, which doesn't determine the billed resolution.

// ── Response ──

pub struct GenerateViduQ3TurboResponse {
  /// Poll `GET /v1/videos/{task_id}` until terminal.
  pub task_id: String,
  pub status: CometVideoTaskStatus,
}

// ── Entry point ──

pub async fn generate_vidu_q3_turbo(
  args: GenerateViduQ3TurboArgs<'_>,
) -> Result<GenerateViduQ3TurboResponse, CometError> {
  let raw_request = args.request.to_create_video_request()?;

  let result = create_video(CreateVideoArgs {
    api_key: args.api_key,
    request: raw_request,
  }).await?;

  Ok(GenerateViduQ3TurboResponse {
    task_id: result.task_id,
    status: result.status,
  })
}

impl GenerateViduQ3TurboRequest {
  /// Validate and lower to the generic wire request.
  pub fn to_create_video_request(&self) -> Result<CreateVideoRequest, CometClientError> {
    if let Some(seconds) = self.duration_seconds {
      if !(MIN_DURATION_SECONDS..=MAX_DURATION_SECONDS).contains(&seconds) {
        return Err(CometClientError::InvalidRequestField {
          field: "duration_seconds",
          raw_value: seconds.to_string(),
          reason: format!("Vidu Q3 Turbo supports {MIN_DURATION_SECONDS}-{MAX_DURATION_SECONDS} second durations"),
        });
      }
    }

    Ok(CreateVideoRequest {
      model: CometVideoModelRaw::ViduQ3Turbo,
      prompt: self.prompt.clone(),
      maybe_seconds: self.duration_seconds,
      maybe_size: self.size.map(map_size),
      input_reference_images: self.input_reference_images.clone(),
    })
  }
}

fn map_size(size: ViduQ3TurboSize) -> CometVideoSize {
  match size {
    ViduQ3TurboSize::Landscape16x9 => CometVideoSize::Landscape16x9,
    ViduQ3TurboSize::Standard4x3 => CometVideoSize::Standard4x3,
    ViduQ3TurboSize::Square1x1 => CometVideoSize::Square,
    ViduQ3TurboSize::Portrait3x4 => CometVideoSize::Portrait3x4,
    ViduQ3TurboSize::Portrait9x16 => CometVideoSize::Portrait9x16,
    ViduQ3TurboSize::Exact { width, height } => CometVideoSize::Exact { width, height },
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn maps_to_wire_request() {
    let request = GenerateViduQ3TurboRequest {
      prompt: "raindrops on a window".to_string(),
      duration_seconds: Some(1),
      size: Some(ViduQ3TurboSize::Portrait9x16),
      input_reference_images: vec![],
    };

    let raw = request.to_create_video_request().expect("should validate");
    assert_eq!(raw.text_form_fields(), vec![
      ("model", "viduq3-turbo".to_string()),
      ("prompt", "raindrops on a window".to_string()),
      ("seconds", "1".to_string()),
      ("size", "9:16".to_string()),
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

  fn request_with_seconds(duration_seconds: Option<u8>) -> GenerateViduQ3TurboRequest {
    GenerateViduQ3TurboRequest {
      prompt: "ok".to_string(),
      duration_seconds,
      size: None,
      input_reference_images: vec![],
    }
  }
}
