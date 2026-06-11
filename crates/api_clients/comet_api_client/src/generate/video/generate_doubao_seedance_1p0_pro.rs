use crate::creds::comet_api_key::CometApiKey;
use crate::error::comet_client_error::CometClientError;
use crate::error::comet_error::CometError;
use crate::requests::create_video::create_video::{
  create_video, CometVideoModelRaw, CometVideoSize, CreateVideoArgs, CreateVideoRequest,
};
use crate::requests::video_task_status::CometVideoTaskStatus;

/// Seedance 1.0 Pro supports 2-10 second durations.
const MIN_DURATION_SECONDS: u8 = 2;
const MAX_DURATION_SECONDS: u8 = 10;

// ── Args ──

pub struct GenerateDoubaoSeedance1p0ProArgs<'a> {
  pub request: GenerateDoubaoSeedance1p0ProRequest,
  pub api_key: &'a CometApiKey,
}

// ── Request ──

/// NB: Seedance 1.0 Pro is text-only — `input_reference` images are not
/// supported, so this request deliberately has no image field.
#[derive(Clone, Debug)]
pub struct GenerateDoubaoSeedance1p0ProRequest {
  pub prompt: String,

  /// 2-10 seconds. `None` uses the API default (5).
  pub duration_seconds: Option<u8>,

  pub size: Option<DoubaoSeedance1p0ProSize>,
}

// ── Enums ──

#[derive(Debug, Clone, Copy)]
pub enum DoubaoSeedance1p0ProSize {
  Landscape16x9,
  Standard4x3,
  Square1x1,
  Portrait3x4,
  Portrait9x16,
  UltraWide21x9,
  Exact { width: u32, height: u32 },
}

// ── Response ──

pub struct GenerateDoubaoSeedance1p0ProResponse {
  /// Poll `GET /v1/videos/{task_id}` until terminal.
  pub task_id: String,
  pub status: CometVideoTaskStatus,
}

// ── Entry point ──

pub async fn generate_doubao_seedance_1p0_pro(
  args: GenerateDoubaoSeedance1p0ProArgs<'_>,
) -> Result<GenerateDoubaoSeedance1p0ProResponse, CometError> {
  let raw_request = args.request.to_create_video_request()?;

  let result = create_video(CreateVideoArgs {
    api_key: args.api_key,
    request: raw_request,
  }).await?;

  Ok(GenerateDoubaoSeedance1p0ProResponse {
    task_id: result.task_id,
    status: result.status,
  })
}

impl GenerateDoubaoSeedance1p0ProRequest {
  /// Validate and lower to the generic wire request.
  pub fn to_create_video_request(&self) -> Result<CreateVideoRequest, CometClientError> {
    if let Some(seconds) = self.duration_seconds {
      if !(MIN_DURATION_SECONDS..=MAX_DURATION_SECONDS).contains(&seconds) {
        return Err(CometClientError::InvalidRequestField {
          field: "duration_seconds",
          raw_value: seconds.to_string(),
          reason: format!("Seedance 1.0 Pro supports {MIN_DURATION_SECONDS}-{MAX_DURATION_SECONDS} second durations"),
        });
      }
    }

    Ok(CreateVideoRequest {
      model: CometVideoModelRaw::DoubaoSeedance1p0Pro,
      prompt: self.prompt.clone(),
      maybe_seconds: self.duration_seconds,
      maybe_size: self.size.map(map_size),
      input_reference_images: vec![],
    })
  }
}

fn map_size(size: DoubaoSeedance1p0ProSize) -> CometVideoSize {
  match size {
    DoubaoSeedance1p0ProSize::Landscape16x9 => CometVideoSize::Landscape16x9,
    DoubaoSeedance1p0ProSize::Standard4x3 => CometVideoSize::Standard4x3,
    DoubaoSeedance1p0ProSize::Square1x1 => CometVideoSize::Square,
    DoubaoSeedance1p0ProSize::Portrait3x4 => CometVideoSize::Portrait3x4,
    DoubaoSeedance1p0ProSize::Portrait9x16 => CometVideoSize::Portrait9x16,
    DoubaoSeedance1p0ProSize::UltraWide21x9 => CometVideoSize::UltraWide21x9,
    DoubaoSeedance1p0ProSize::Exact { width, height } => CometVideoSize::Exact { width, height },
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn maps_to_wire_request() {
    let request = GenerateDoubaoSeedance1p0ProRequest {
      prompt: "time lapse of a city at dusk".to_string(),
      duration_seconds: Some(2),
      size: Some(DoubaoSeedance1p0ProSize::Square1x1),
    };

    let raw = request.to_create_video_request().expect("should validate");
    assert_eq!(raw.text_form_fields(), vec![
      ("model", "doubao-seedance-1-0-pro".to_string()),
      ("prompt", "time lapse of a city at dusk".to_string()),
      ("seconds", "2".to_string()),
      ("size", "1:1".to_string()),
    ]);
    assert!(raw.input_reference_images.is_empty());
  }

  #[test]
  fn duration_bounds() {
    assert!(request_with_seconds(Some(1)).to_create_video_request().is_err());
    assert!(request_with_seconds(Some(2)).to_create_video_request().is_ok());
    assert!(request_with_seconds(Some(10)).to_create_video_request().is_ok());
    assert!(request_with_seconds(Some(11)).to_create_video_request().is_err());
    assert!(request_with_seconds(None).to_create_video_request().is_ok());
  }

  fn request_with_seconds(duration_seconds: Option<u8>) -> GenerateDoubaoSeedance1p0ProRequest {
    GenerateDoubaoSeedance1p0ProRequest {
      prompt: "ok".to_string(),
      duration_seconds,
      size: None,
    }
  }
}
