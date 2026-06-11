use crate::creds::comet_api_key::CometApiKey;
use crate::error::comet_client_error::CometClientError;
use crate::error::comet_error::CometError;
use crate::requests::create_video::create_video::{
  create_video, CometInputReferenceImage, CometVideoModelRaw, CometVideoSize,
  CreateVideoArgs, CreateVideoRequest,
};
use crate::requests::video_task_status::CometVideoTaskStatus;

/// Wan 2.7 supports 2-15 second durations.
const MIN_DURATION_SECONDS: u8 = 2;
const MAX_DURATION_SECONDS: u8 = 15;

/// The API default duration when `seconds` is omitted.
const DEFAULT_DURATION_SECONDS: u8 = 5;

// ── Args ──

pub struct GenerateWan2p7Args<'a> {
  pub request: GenerateWan2p7Request,
  pub api_key: &'a CometApiKey,
}

// ── Request ──

#[derive(Clone, Debug)]
pub struct GenerateWan2p7Request {
  pub prompt: String,

  /// 2-15 seconds. `None` uses the API default (5).
  pub duration_seconds: Option<u8>,

  /// `None` uses the API default (720p).
  pub size: Option<Wan2p7Size>,

  /// Reference images for image-to-video and first/last-frame workflows.
  pub input_reference_images: Vec<CometInputReferenceImage>,
}

// ── Enums ──

/// Wan 2.7 renders at 720p or 1080p.
#[derive(Debug, Clone, Copy)]
pub enum Wan2p7Size {
  SevenTwentyP,
  TenEightyP,
}

// ── Pricing ──
//
// Wan 2.7 per-second USD pricing (via CometAPI):
//
// | Resolution | $/sec |
// |------------|-------|
// | 720p       | 0.08  |
// | 1080p      | 0.12  |
//
// Total cost = price per second × video duration (seconds).

impl GenerateWan2p7Request {
  /// Estimate the USD cost in cents for this generation request.
  pub fn estimate_cost_in_usd_cents(&self) -> u64 {
    let cents_per_second: u64 = match self.size {
      Some(Wan2p7Size::TenEightyP) => 12,
      // Default resolution (None) is 720p.
      Some(Wan2p7Size::SevenTwentyP) | None => 8,
    };
    let seconds = self.duration_seconds.unwrap_or(DEFAULT_DURATION_SECONDS);
    u64::from(seconds) * cents_per_second
  }
}

// ── Response ──

pub struct GenerateWan2p7Response {
  /// Poll `GET /v1/videos/{task_id}` until terminal.
  pub task_id: String,
  pub status: CometVideoTaskStatus,
}

// ── Entry point ──

pub async fn generate_wan_2p7(
  args: GenerateWan2p7Args<'_>,
) -> Result<GenerateWan2p7Response, CometError> {
  let raw_request = args.request.to_create_video_request()?;

  let result = create_video(CreateVideoArgs {
    api_key: args.api_key,
    request: raw_request,
  }).await?;

  Ok(GenerateWan2p7Response {
    task_id: result.task_id,
    status: result.status,
  })
}

impl GenerateWan2p7Request {
  /// Validate and lower to the generic wire request.
  pub fn to_create_video_request(&self) -> Result<CreateVideoRequest, CometClientError> {
    if let Some(seconds) = self.duration_seconds {
      if !(MIN_DURATION_SECONDS..=MAX_DURATION_SECONDS).contains(&seconds) {
        return Err(CometClientError::InvalidRequestField {
          field: "duration_seconds",
          raw_value: seconds.to_string(),
          reason: format!("Wan 2.7 supports {MIN_DURATION_SECONDS}-{MAX_DURATION_SECONDS} second durations"),
        });
      }
    }

    Ok(CreateVideoRequest {
      model: CometVideoModelRaw::Wan2p7,
      prompt: self.prompt.clone(),
      maybe_seconds: self.duration_seconds,
      maybe_size: self.size.map(map_size),
      input_reference_images: self.input_reference_images.clone(),
    })
  }
}

fn map_size(size: Wan2p7Size) -> CometVideoSize {
  match size {
    Wan2p7Size::SevenTwentyP => CometVideoSize::Exact { width: 1280, height: 720 },
    Wan2p7Size::TenEightyP => CometVideoSize::Exact { width: 1920, height: 1080 },
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn maps_to_wire_request() {
    let request = GenerateWan2p7Request {
      prompt: "a koi pond at golden hour".to_string(),
      duration_seconds: Some(5),
      size: Some(Wan2p7Size::SevenTwentyP),
      input_reference_images: vec![],
    };

    let raw = request.to_create_video_request().expect("should validate");
    assert_eq!(raw.text_form_fields(), vec![
      ("model", "wan2.7".to_string()),
      ("prompt", "a koi pond at golden hour".to_string()),
      ("seconds", "5".to_string()),
      ("size", "1280x720".to_string()),
    ]);
  }

  #[test]
  fn duration_bounds() {
    assert!(request_with_seconds(Some(1)).to_create_video_request().is_err());
    assert!(request_with_seconds(Some(2)).to_create_video_request().is_ok());
    assert!(request_with_seconds(Some(15)).to_create_video_request().is_ok());
    assert!(request_with_seconds(Some(16)).to_create_video_request().is_err());
    assert!(request_with_seconds(None).to_create_video_request().is_ok());
  }

  #[test]
  fn cost_estimates() {
    // 5 seconds at 720p: 5 × 8¢ = 40¢
    let mut request = request_with_seconds(Some(5));
    request.size = Some(Wan2p7Size::SevenTwentyP);
    assert_eq!(request.estimate_cost_in_usd_cents(), 40);

    // 10 seconds at 1080p: 10 × 12¢ = 120¢
    request.duration_seconds = Some(10);
    request.size = Some(Wan2p7Size::TenEightyP);
    assert_eq!(request.estimate_cost_in_usd_cents(), 120);

    // Defaults (5 seconds, 720p): 40¢
    request.duration_seconds = None;
    request.size = None;
    assert_eq!(request.estimate_cost_in_usd_cents(), 40);
  }

  fn request_with_seconds(duration_seconds: Option<u8>) -> GenerateWan2p7Request {
    GenerateWan2p7Request {
      prompt: "ok".to_string(),
      duration_seconds,
      size: None,
      input_reference_images: vec![],
    }
  }
}
