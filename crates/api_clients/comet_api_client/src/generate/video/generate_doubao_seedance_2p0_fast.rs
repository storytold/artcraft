use crate::creds::comet_api_key::CometApiKey;
use crate::error::comet_client_error::CometClientError;
use crate::error::comet_error::CometError;
use crate::requests::create_video::create_video::{
  create_video, CometInputReferenceImage, CometVideoModelRaw, CometVideoSize,
  CreateVideoArgs, CreateVideoRequest,
};
use crate::requests::video_task_status::CometVideoTaskStatus;

/// Seedance 2.0 Fast supports 4-15 second durations.
const MIN_DURATION_SECONDS: u8 = 4;
const MAX_DURATION_SECONDS: u8 = 15;

// ── Args ──

pub struct GenerateDoubaoSeedance2p0FastArgs<'a> {
  pub request: GenerateDoubaoSeedance2p0FastRequest,
  pub api_key: &'a CometApiKey,
}

// ── Request ──

#[derive(Clone, Debug)]
pub struct GenerateDoubaoSeedance2p0FastRequest {
  /// Reference attached images in the prompt as `[Image 1]`, `[Image 2]`, etc.
  pub prompt: String,

  /// 4-15 seconds. `None` uses the API default (5).
  pub duration_seconds: Option<u8>,

  pub size: Option<DoubaoSeedance2p0FastSize>,

  /// Reference images (JPEG, PNG, WebP) for image-to-video.
  pub input_reference_images: Vec<CometInputReferenceImage>,
}

// ── Enums ──

#[derive(Debug, Clone, Copy)]
pub enum DoubaoSeedance2p0FastSize {
  Landscape16x9,
  Standard4x3,
  Square1x1,
  Portrait3x4,
  Portrait9x16,
  UltraWide21x9,
  Exact { width: u32, height: u32 },
}

// ── Response ──

pub struct GenerateDoubaoSeedance2p0FastResponse {
  /// Poll `GET /v1/videos/{task_id}` until terminal.
  pub task_id: String,
  pub status: CometVideoTaskStatus,
}

// ── Entry point ──

pub async fn generate_doubao_seedance_2p0_fast(
  args: GenerateDoubaoSeedance2p0FastArgs<'_>,
) -> Result<GenerateDoubaoSeedance2p0FastResponse, CometError> {
  let raw_request = args.request.to_create_video_request()?;

  let result = create_video(CreateVideoArgs {
    api_key: args.api_key,
    request: raw_request,
  }).await?;

  Ok(GenerateDoubaoSeedance2p0FastResponse {
    task_id: result.task_id,
    status: result.status,
  })
}

impl GenerateDoubaoSeedance2p0FastRequest {
  /// Validate and lower to the generic wire request.
  pub fn to_create_video_request(&self) -> Result<CreateVideoRequest, CometClientError> {
    if let Some(seconds) = self.duration_seconds {
      if !(MIN_DURATION_SECONDS..=MAX_DURATION_SECONDS).contains(&seconds) {
        return Err(CometClientError::InvalidRequestField {
          field: "duration_seconds",
          raw_value: seconds.to_string(),
          reason: format!("Seedance 2.0 Fast supports {MIN_DURATION_SECONDS}-{MAX_DURATION_SECONDS} second durations"),
        });
      }
    }

    Ok(CreateVideoRequest {
      model: CometVideoModelRaw::DoubaoSeedance2p0Fast,
      prompt: self.prompt.clone(),
      maybe_seconds: self.duration_seconds,
      maybe_size: self.size.map(map_size),
      input_reference_images: self.input_reference_images.clone(),
    })
  }
}

fn map_size(size: DoubaoSeedance2p0FastSize) -> CometVideoSize {
  match size {
    DoubaoSeedance2p0FastSize::Landscape16x9 => CometVideoSize::Landscape16x9,
    DoubaoSeedance2p0FastSize::Standard4x3 => CometVideoSize::Standard4x3,
    DoubaoSeedance2p0FastSize::Square1x1 => CometVideoSize::Square,
    DoubaoSeedance2p0FastSize::Portrait3x4 => CometVideoSize::Portrait3x4,
    DoubaoSeedance2p0FastSize::Portrait9x16 => CometVideoSize::Portrait9x16,
    DoubaoSeedance2p0FastSize::UltraWide21x9 => CometVideoSize::UltraWide21x9,
    DoubaoSeedance2p0FastSize::Exact { width, height } => CometVideoSize::Exact { width, height },
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn maps_to_wire_request() {
    let request = GenerateDoubaoSeedance2p0FastRequest {
      prompt: "a corgi surfing".to_string(),
      duration_seconds: Some(4),
      size: Some(DoubaoSeedance2p0FastSize::Landscape16x9),
      input_reference_images: vec![],
    };

    let raw = request.to_create_video_request().expect("should validate");
    assert_eq!(raw.text_form_fields(), vec![
      ("model", "doubao-seedance-2-0-fast".to_string()),
      ("prompt", "a corgi surfing".to_string()),
      ("seconds", "4".to_string()),
      ("size", "16:9".to_string()),
    ]);
  }

  #[test]
  fn duration_bounds() {
    assert!(request_with_seconds(Some(3)).to_create_video_request().is_err());
    assert!(request_with_seconds(Some(4)).to_create_video_request().is_ok());
    assert!(request_with_seconds(Some(15)).to_create_video_request().is_ok());
    assert!(request_with_seconds(Some(16)).to_create_video_request().is_err());
    assert!(request_with_seconds(None).to_create_video_request().is_ok());
  }

  fn request_with_seconds(duration_seconds: Option<u8>) -> GenerateDoubaoSeedance2p0FastRequest {
    GenerateDoubaoSeedance2p0FastRequest {
      prompt: "ok".to_string(),
      duration_seconds,
      size: None,
      input_reference_images: vec![],
    }
  }
}
