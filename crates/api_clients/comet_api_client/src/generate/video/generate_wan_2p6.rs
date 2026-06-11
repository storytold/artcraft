use crate::creds::comet_api_key::CometApiKey;
use crate::error::comet_client_error::CometClientError;
use crate::error::comet_error::CometError;
use crate::requests::create_video::create_video::{
  create_video, CometInputReferenceImage, CometVideoModelRaw, CometVideoSize,
  CreateVideoArgs, CreateVideoRequest,
};
use crate::requests::video_task_status::CometVideoTaskStatus;

/// Wan 2.6 supports 2-15 second durations.
const MIN_DURATION_SECONDS: u8 = 2;
const MAX_DURATION_SECONDS: u8 = 15;

/// The API default duration when `seconds` is omitted.
const DEFAULT_DURATION_SECONDS: u8 = 5;

/// Wan 2.6 accepts up to 5 references.
const MAX_REFERENCE_IMAGES: usize = 5;

// ── Args ──

pub struct GenerateWan2p6Args<'a> {
  pub request: GenerateWan2p6Request,
  pub api_key: &'a CometApiKey,
}

// ── Request ──

#[derive(Clone, Debug)]
pub struct GenerateWan2p6Request {
  pub prompt: String,

  /// 2-15 seconds. `None` uses the API default (5).
  pub duration_seconds: Option<u8>,

  /// `None` uses the API default (720p).
  pub size: Option<Wan2p6Size>,

  /// Reference images for image-to-video and reference-to-video workflows.
  /// Wan 2.6 accepts up to 5 references.
  pub input_reference_images: Vec<CometInputReferenceImage>,
}

// ── Enums ──

/// Wan 2.6 renders at 720p or 1080p.
#[derive(Debug, Clone, Copy)]
pub enum Wan2p6Size {
  SevenTwentyP,
  TenEightyP,
}

// ── Pricing ──
//
// Wan 2.6 per-second USD pricing (via CometAPI):
//
// | Resolution | $/sec |
// |------------|-------|
// | 720p       | 0.08  |
// | 1080p      | 0.12  |
//
// Total cost = price per second × video duration (seconds).

impl GenerateWan2p6Request {
  /// Estimate the USD cost in cents for this generation request.
  pub fn estimate_cost_in_usd_cents(&self) -> u64 {
    let cents_per_second: u64 = match self.size {
      Some(Wan2p6Size::TenEightyP) => 12,
      // Default resolution (None) is 720p.
      Some(Wan2p6Size::SevenTwentyP) | None => 8,
    };
    let seconds = self.duration_seconds.unwrap_or(DEFAULT_DURATION_SECONDS);
    u64::from(seconds) * cents_per_second
  }
}

// ── Response ──

pub struct GenerateWan2p6Response {
  /// Poll `GET /v1/videos/{task_id}` until terminal.
  pub task_id: String,
  pub status: CometVideoTaskStatus,
}

// ── Entry point ──

pub async fn generate_wan_2p6(
  args: GenerateWan2p6Args<'_>,
) -> Result<GenerateWan2p6Response, CometError> {
  let raw_request = args.request.to_create_video_request()?;

  let result = create_video(CreateVideoArgs {
    api_key: args.api_key,
    request: raw_request,
  }).await?;

  Ok(GenerateWan2p6Response {
    task_id: result.task_id,
    status: result.status,
  })
}

impl GenerateWan2p6Request {
  /// Validate and lower to the generic wire request.
  pub fn to_create_video_request(&self) -> Result<CreateVideoRequest, CometClientError> {
    if let Some(seconds) = self.duration_seconds {
      if !(MIN_DURATION_SECONDS..=MAX_DURATION_SECONDS).contains(&seconds) {
        return Err(CometClientError::InvalidRequestField {
          field: "duration_seconds",
          raw_value: seconds.to_string(),
          reason: format!("Wan 2.6 supports {MIN_DURATION_SECONDS}-{MAX_DURATION_SECONDS} second durations"),
        });
      }
    }

    if self.input_reference_images.len() > MAX_REFERENCE_IMAGES {
      return Err(CometClientError::InvalidRequestField {
        field: "input_reference_images",
        raw_value: self.input_reference_images.len().to_string(),
        reason: format!("Wan 2.6 accepts at most {MAX_REFERENCE_IMAGES} references"),
      });
    }

    Ok(CreateVideoRequest {
      model: CometVideoModelRaw::Wan2p6,
      prompt: self.prompt.clone(),
      maybe_seconds: self.duration_seconds,
      maybe_size: self.size.map(map_size),
      input_reference_images: self.input_reference_images.clone(),
    })
  }
}

fn map_size(size: Wan2p6Size) -> CometVideoSize {
  match size {
    Wan2p6Size::SevenTwentyP => CometVideoSize::Exact { width: 1280, height: 720 },
    Wan2p6Size::TenEightyP => CometVideoSize::Exact { width: 1920, height: 1080 },
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn maps_to_wire_request() {
    let request = GenerateWan2p6Request {
      prompt: "a steam train crossing a viaduct".to_string(),
      duration_seconds: Some(15),
      size: Some(Wan2p6Size::TenEightyP),
      input_reference_images: vec![],
    };

    let raw = request.to_create_video_request().expect("should validate");
    assert_eq!(raw.text_form_fields(), vec![
      ("model", "wan2.6".to_string()),
      ("prompt", "a steam train crossing a viaduct".to_string()),
      ("seconds", "15".to_string()),
      ("size", "1920x1080".to_string()),
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
  fn too_many_references_rejected() {
    let mut request = request_with_seconds(Some(5));
    request.input_reference_images = (0..6)
      .map(|i| CometInputReferenceImage {
        file_bytes: vec![0u8],
        filename: format!("ref_{i}.png"),
        maybe_content_type: Some("image/png".to_string()),
      })
      .collect();

    let error = request.to_create_video_request().expect_err("should reject 6 references");
    assert!(matches!(error, CometClientError::InvalidRequestField { field: "input_reference_images", .. }));

    request.input_reference_images.truncate(5);
    assert!(request.to_create_video_request().is_ok());
  }

  #[test]
  fn cost_estimates() {
    // 5 seconds at 720p: 5 × 8¢ = 40¢
    let mut request = request_with_seconds(Some(5));
    request.size = Some(Wan2p6Size::SevenTwentyP);
    assert_eq!(request.estimate_cost_in_usd_cents(), 40);

    // 10 seconds at 1080p: 10 × 12¢ = 120¢
    request.duration_seconds = Some(10);
    request.size = Some(Wan2p6Size::TenEightyP);
    assert_eq!(request.estimate_cost_in_usd_cents(), 120);

    // Defaults (5 seconds, 720p): 40¢
    request.duration_seconds = None;
    request.size = None;
    assert_eq!(request.estimate_cost_in_usd_cents(), 40);
  }

  fn request_with_seconds(duration_seconds: Option<u8>) -> GenerateWan2p6Request {
    GenerateWan2p6Request {
      prompt: "ok".to_string(),
      duration_seconds,
      size: None,
      input_reference_images: vec![],
    }
  }
}
