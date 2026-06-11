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

/// The API default duration when `seconds` is omitted.
const DEFAULT_DURATION_SECONDS: u8 = 5;

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

  /// `None` defaults to 16:9 (when a resolution is set).
  pub aspect_ratio: Option<DoubaoSeedance2p0FastAspectRatio>,

  /// `None` defaults to 720p (when an aspect ratio is set).
  pub resolution: Option<DoubaoSeedance2p0FastResolution>,

  /// Reference images (JPEG, PNG, WebP) for image-to-video.
  pub input_reference_images: Vec<CometInputReferenceImage>,
}

// ── Enums ──

#[derive(Debug, Clone, Copy)]
pub enum DoubaoSeedance2p0FastAspectRatio {
  Landscape16x9,
  Standard4x3,
  Square1x1,
  Portrait3x4,
  Portrait9x16,
  UltraWide21x9,
}

/// NB: 1080p is available for all Seedance models EXCEPT 2.0 Fast, so this
/// enum deliberately has no 1080p variant.
#[derive(Debug, Clone, Copy)]
pub enum DoubaoSeedance2p0FastResolution {
  FourEightyP,
  SevenTwentyP,
}

// ── Pricing ──
//
// Seedance 2.0 Fast per-second USD pricing (via CometAPI):
//
// | Resolution | $/sec  |
// |------------|--------|
// | 480p       | 0.0504 |
// | 720p       | 0.108  |
//
// Total cost = price per second × video duration (seconds).

impl GenerateDoubaoSeedance2p0FastRequest {
  /// Estimate the USD cost in cents for this generation request.
  pub fn estimate_cost_in_usd_cents(&self) -> u64 {
    let dollars_per_second: f64 = match self.resolution {
      Some(DoubaoSeedance2p0FastResolution::FourEightyP) => 0.0504,
      // Default resolution (None) is 720p.
      Some(DoubaoSeedance2p0FastResolution::SevenTwentyP) | None => 0.108,
    };
    let seconds = self.duration_seconds.unwrap_or(DEFAULT_DURATION_SECONDS);
    (f64::from(seconds) * dollars_per_second * 100.0).round() as u64
  }
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
      maybe_size: self.resolve_size(),
      input_reference_images: self.input_reference_images.clone(),
    })
  }

  /// The wire `size` is a single exact-dimensions field determined by the
  /// (aspect ratio, resolution) pair. Dimensions mirror CometAPI's own
  /// playground options for the Seedance 2.0 family. When neither knob is
  /// set, `size` is omitted and the API picks its default.
  fn resolve_size(&self) -> Option<CometVideoSize> {
    if self.aspect_ratio.is_none() && self.resolution.is_none() {
      return None;
    }

    let aspect_ratio = self.aspect_ratio.unwrap_or(DoubaoSeedance2p0FastAspectRatio::Landscape16x9);
    let resolution = self.resolution.unwrap_or(DoubaoSeedance2p0FastResolution::SevenTwentyP);

    use DoubaoSeedance2p0FastAspectRatio as Ratio;
    use DoubaoSeedance2p0FastResolution as Res;

    let (width, height) = match (resolution, aspect_ratio) {
      (Res::FourEightyP, Ratio::Landscape16x9) => (864, 496),
      (Res::FourEightyP, Ratio::Standard4x3) => (752, 560),
      (Res::FourEightyP, Ratio::Square1x1) => (640, 640),
      (Res::FourEightyP, Ratio::Portrait3x4) => (560, 752),
      (Res::FourEightyP, Ratio::Portrait9x16) => (496, 864),
      (Res::FourEightyP, Ratio::UltraWide21x9) => (992, 432),

      (Res::SevenTwentyP, Ratio::Landscape16x9) => (1280, 720),
      (Res::SevenTwentyP, Ratio::Standard4x3) => (1112, 834),
      (Res::SevenTwentyP, Ratio::Square1x1) => (960, 960),
      (Res::SevenTwentyP, Ratio::Portrait3x4) => (834, 1112),
      (Res::SevenTwentyP, Ratio::Portrait9x16) => (720, 1280),
      (Res::SevenTwentyP, Ratio::UltraWide21x9) => (1470, 630),
    };

    Some(CometVideoSize::Exact { width, height })
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  use DoubaoSeedance2p0FastAspectRatio as Ratio;
  use DoubaoSeedance2p0FastResolution as Res;

  #[test]
  fn maps_to_wire_request() {
    let request = GenerateDoubaoSeedance2p0FastRequest {
      prompt: "a corgi surfing".to_string(),
      duration_seconds: Some(4),
      aspect_ratio: Some(Ratio::Landscape16x9),
      resolution: Some(Res::FourEightyP),
      input_reference_images: vec![],
    };

    let raw = request.to_create_video_request().expect("should validate");
    assert_eq!(raw.text_form_fields(), vec![
      ("model", "doubao-seedance-2-0-fast".to_string()),
      ("prompt", "a corgi surfing".to_string()),
      ("seconds", "4".to_string()),
      ("size", "864x496".to_string()),
    ]);
  }

  #[test]
  fn size_matrix_matches_cometapi_playground() {
    // (resolution, ratio) -> exact size, as offered by CometAPI's own
    // playground dropdown for the Seedance 2.0 family. No 1080p row: Fast
    // doesn't support it (enforced by the resolution enum).
    let cases = [
      (Res::FourEightyP, Ratio::Landscape16x9, "864x496"),
      (Res::FourEightyP, Ratio::Standard4x3, "752x560"),
      (Res::FourEightyP, Ratio::Square1x1, "640x640"),
      (Res::FourEightyP, Ratio::Portrait3x4, "560x752"),
      (Res::FourEightyP, Ratio::Portrait9x16, "496x864"),
      (Res::FourEightyP, Ratio::UltraWide21x9, "992x432"),
      (Res::SevenTwentyP, Ratio::Landscape16x9, "1280x720"),
      (Res::SevenTwentyP, Ratio::Standard4x3, "1112x834"),
      (Res::SevenTwentyP, Ratio::Square1x1, "960x960"),
      (Res::SevenTwentyP, Ratio::Portrait3x4, "834x1112"),
      (Res::SevenTwentyP, Ratio::Portrait9x16, "720x1280"),
      (Res::SevenTwentyP, Ratio::UltraWide21x9, "1470x630"),
    ];

    for (resolution, aspect_ratio, expected) in cases {
      let request = base_request(Some(aspect_ratio), Some(resolution));
      let size = request.resolve_size().expect("should resolve");
      assert_eq!(size.as_api_string(), expected,
        "({resolution:?}, {aspect_ratio:?}) should map to {expected}");
    }
  }

  #[test]
  fn size_defaults() {
    // Neither knob set: omit size, let the API default.
    assert!(base_request(None, None).resolve_size().is_none());

    // Only ratio set: resolution defaults to 720p.
    let size = base_request(Some(Ratio::Square1x1), None).resolve_size().expect("should resolve");
    assert_eq!(size.as_api_string(), "960x960");

    // Only resolution set: ratio defaults to 16:9.
    let size = base_request(None, Some(Res::FourEightyP)).resolve_size().expect("should resolve");
    assert_eq!(size.as_api_string(), "864x496");
  }

  #[test]
  fn duration_bounds() {
    let mut request = base_request(None, None);
    for (seconds, ok) in [(Some(3), false), (Some(4), true), (Some(15), true), (Some(16), false), (None, true)] {
      request.duration_seconds = seconds;
      assert_eq!(request.to_create_video_request().is_ok(), ok, "seconds: {seconds:?}");
    }
  }

  #[test]
  fn cost_estimates() {
    // 5 seconds at 480p: 5 × $0.0504 = $0.252 -> 25¢
    let mut request = base_request(None, Some(Res::FourEightyP));
    request.duration_seconds = Some(5);
    assert_eq!(request.estimate_cost_in_usd_cents(), 25);

    // 15 seconds at 720p: 15 × $0.108 = $1.62 -> 162¢
    request.resolution = Some(Res::SevenTwentyP);
    request.duration_seconds = Some(15);
    assert_eq!(request.estimate_cost_in_usd_cents(), 162);

    // Defaults (5 seconds, 720p): 5 × $0.108 = $0.54 -> 54¢
    request.resolution = None;
    request.duration_seconds = None;
    assert_eq!(request.estimate_cost_in_usd_cents(), 54);
  }

  fn base_request(
    aspect_ratio: Option<DoubaoSeedance2p0FastAspectRatio>,
    resolution: Option<DoubaoSeedance2p0FastResolution>,
  ) -> GenerateDoubaoSeedance2p0FastRequest {
    GenerateDoubaoSeedance2p0FastRequest {
      prompt: "ok".to_string(),
      duration_seconds: None,
      aspect_ratio,
      resolution,
      input_reference_images: vec![],
    }
  }
}
