use crate::creds::comet_api_key::CometApiKey;
use crate::error::comet_client_error::CometClientError;
use crate::error::comet_error::CometError;
use crate::requests::create_video::create_video::{
  create_video, CometInputReferenceImage, CometVideoModelRaw, CometVideoSize,
  CreateVideoArgs, CreateVideoRequest,
};
use crate::requests::video_task_status::CometVideoTaskStatus;

/// Seedance 2.0 supports 4-15 second durations.
const MIN_DURATION_SECONDS: u8 = 4;
const MAX_DURATION_SECONDS: u8 = 15;

/// The API default duration when `seconds` is omitted.
const DEFAULT_DURATION_SECONDS: u8 = 5;

// ── Args ──

pub struct GenerateDoubaoSeedance2p0Args<'a> {
  pub request: GenerateDoubaoSeedance2p0Request,
  pub api_key: &'a CometApiKey,
}

// ── Request ──

#[derive(Clone, Debug)]
pub struct GenerateDoubaoSeedance2p0Request {
  /// Reference attached images in the prompt as `[Image 1]`, `[Image 2]`, etc.
  pub prompt: String,

  /// 4-15 seconds. `None` uses the API default (5).
  pub duration_seconds: Option<u8>,

  /// `None` defaults to 16:9 (when a resolution is set).
  pub aspect_ratio: Option<DoubaoSeedance2p0AspectRatio>,

  /// `None` defaults to 720p (when an aspect ratio is set).
  pub resolution: Option<DoubaoSeedance2p0Resolution>,

  /// Reference images (JPEG, PNG, WebP) for image-to-video.
  pub input_reference_images: Vec<CometInputReferenceImage>,
}

// ── Enums ──

#[derive(Debug, Clone, Copy)]
pub enum DoubaoSeedance2p0AspectRatio {
  Landscape16x9,
  Standard4x3,
  Square1x1,
  Portrait3x4,
  Portrait9x16,
  UltraWide21x9,
}

#[derive(Debug, Clone, Copy)]
pub enum DoubaoSeedance2p0Resolution {
  FourEightyP,
  SevenTwentyP,
  TenEightyP,
}

// ── Pricing ──
//
// Seedance 2.0 per-second USD pricing (via CometAPI):
//
// | Resolution | $/sec  |
// |------------|--------|
// | 480p       | 0.063  |
// | 720p       | 0.1368 |
// | 1080p      | 0.3366 |
//
// Total cost = price per second × video duration (seconds).

impl GenerateDoubaoSeedance2p0Request {
  /// Estimate the USD cost in cents for this generation request.
  pub fn estimate_cost_in_usd_cents(&self) -> u64 {
    let dollars_per_second: f64 = match self.resolution {
      Some(DoubaoSeedance2p0Resolution::FourEightyP) => 0.063,
      // Default resolution (None) is 720p.
      Some(DoubaoSeedance2p0Resolution::SevenTwentyP) | None => 0.1368,
      Some(DoubaoSeedance2p0Resolution::TenEightyP) => 0.3366,
    };
    let seconds = self.duration_seconds.unwrap_or(DEFAULT_DURATION_SECONDS);
    (f64::from(seconds) * dollars_per_second * 100.0).round() as u64
  }
}

// ── Response ──

pub struct GenerateDoubaoSeedance2p0Response {
  /// Poll `GET /v1/videos/{task_id}` until terminal.
  pub task_id: String,
  pub status: CometVideoTaskStatus,
}

// ── Entry point ──

pub async fn generate_doubao_seedance_2p0(
  args: GenerateDoubaoSeedance2p0Args<'_>,
) -> Result<GenerateDoubaoSeedance2p0Response, CometError> {
  let raw_request = args.request.to_create_video_request()?;

  let result = create_video(CreateVideoArgs {
    api_key: args.api_key,
    request: raw_request,
  }).await?;

  Ok(GenerateDoubaoSeedance2p0Response {
    task_id: result.task_id,
    status: result.status,
  })
}

impl GenerateDoubaoSeedance2p0Request {
  /// Validate and lower to the generic wire request.
  pub fn to_create_video_request(&self) -> Result<CreateVideoRequest, CometClientError> {
    if let Some(seconds) = self.duration_seconds {
      if !(MIN_DURATION_SECONDS..=MAX_DURATION_SECONDS).contains(&seconds) {
        return Err(CometClientError::InvalidRequestField {
          field: "duration_seconds",
          raw_value: seconds.to_string(),
          reason: format!("Seedance 2.0 supports {MIN_DURATION_SECONDS}-{MAX_DURATION_SECONDS} second durations"),
        });
      }
    }

    Ok(CreateVideoRequest {
      model: CometVideoModelRaw::DoubaoSeedance2p0,
      prompt: self.prompt.clone(),
      maybe_seconds: self.duration_seconds,
      maybe_size: self.resolve_size(),
      input_reference_images: self.input_reference_images.clone(),
    })
  }

  /// The wire `size` is a single exact-dimensions field determined by the
  /// (aspect ratio, resolution) pair. Dimensions mirror CometAPI's own
  /// playground options for `doubao-seedance-2-0`. When neither knob is
  /// set, `size` is omitted and the API picks its default.
  fn resolve_size(&self) -> Option<CometVideoSize> {
    if self.aspect_ratio.is_none() && self.resolution.is_none() {
      return None;
    }

    let aspect_ratio = self.aspect_ratio.unwrap_or(DoubaoSeedance2p0AspectRatio::Landscape16x9);
    let resolution = self.resolution.unwrap_or(DoubaoSeedance2p0Resolution::SevenTwentyP);

    use DoubaoSeedance2p0AspectRatio as Ratio;
    use DoubaoSeedance2p0Resolution as Res;

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

      (Res::TenEightyP, Ratio::Landscape16x9) => (1920, 1080),
      (Res::TenEightyP, Ratio::Standard4x3) => (1664, 1248),
      (Res::TenEightyP, Ratio::Square1x1) => (1440, 1440),
      (Res::TenEightyP, Ratio::Portrait3x4) => (1248, 1664),
      (Res::TenEightyP, Ratio::Portrait9x16) => (1080, 1920),
      (Res::TenEightyP, Ratio::UltraWide21x9) => (2206, 946),
    };

    Some(CometVideoSize::Exact { width, height })
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  use DoubaoSeedance2p0AspectRatio as Ratio;
  use DoubaoSeedance2p0Resolution as Res;

  #[test]
  fn maps_to_wire_request() {
    let request = GenerateDoubaoSeedance2p0Request {
      prompt: "animate [Image 1]".to_string(),
      duration_seconds: Some(8),
      aspect_ratio: Some(Ratio::UltraWide21x9),
      resolution: Some(Res::TenEightyP),
      input_reference_images: vec![],
    };

    let raw = request.to_create_video_request().expect("should validate");
    assert_eq!(raw.text_form_fields(), vec![
      ("model", "doubao-seedance-2-0".to_string()),
      ("prompt", "animate [Image 1]".to_string()),
      ("seconds", "8".to_string()),
      ("size", "2206x946".to_string()),
    ]);
  }

  #[test]
  fn size_matrix_matches_cometapi_playground() {
    // (resolution, ratio) -> exact size, as offered by CometAPI's own
    // playground dropdown for doubao-seedance-2-0.
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
      (Res::TenEightyP, Ratio::Landscape16x9, "1920x1080"),
      (Res::TenEightyP, Ratio::Standard4x3, "1664x1248"),
      (Res::TenEightyP, Ratio::Square1x1, "1440x1440"),
      (Res::TenEightyP, Ratio::Portrait3x4, "1248x1664"),
      (Res::TenEightyP, Ratio::Portrait9x16, "1080x1920"),
      (Res::TenEightyP, Ratio::UltraWide21x9, "2206x946"),
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
    let size = base_request(Some(Ratio::Portrait9x16), None).resolve_size().expect("should resolve");
    assert_eq!(size.as_api_string(), "720x1280");

    // Only resolution set: ratio defaults to 16:9.
    let size = base_request(None, Some(Res::TenEightyP)).resolve_size().expect("should resolve");
    assert_eq!(size.as_api_string(), "1920x1080");
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
    // 5 seconds at 480p: 5 × $0.063 = $0.315 -> 32¢
    let mut request = base_request(None, Some(Res::FourEightyP));
    request.duration_seconds = Some(5);
    assert_eq!(request.estimate_cost_in_usd_cents(), 32);

    // 10 seconds at 1080p: 10 × $0.3366 = $3.366 -> 337¢
    request.resolution = Some(Res::TenEightyP);
    request.duration_seconds = Some(10);
    assert_eq!(request.estimate_cost_in_usd_cents(), 337);

    // Defaults (5 seconds, 720p): 5 × $0.1368 = $0.684 -> 68¢
    request.resolution = None;
    request.duration_seconds = None;
    assert_eq!(request.estimate_cost_in_usd_cents(), 68);
  }

  fn base_request(
    aspect_ratio: Option<DoubaoSeedance2p0AspectRatio>,
    resolution: Option<DoubaoSeedance2p0Resolution>,
  ) -> GenerateDoubaoSeedance2p0Request {
    GenerateDoubaoSeedance2p0Request {
      prompt: "ok".to_string(),
      duration_seconds: None,
      aspect_ratio,
      resolution,
      input_reference_images: vec![],
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // ⚠️  EXPENSIVE LIVE TESTS  ⚠️
  //
  // Each test below enqueues a REAL 10-second Seedance 2.0 generation with
  // four reference images and polls it to completion. These INCUR REAL
  // COSTS (per CometAPI's per-second pricing):
  //
  //   480p:  10s × $0.063  ≈ $0.63
  //   720p:  10s × $0.1368 ≈ $1.37
  //   1080p: 10s × $0.3366 ≈ $3.37
  //
  // They also take a while — generations have been observed to run well
  // past 10 minutes. Run one at a time, manually:
  //
  //   cargo test -p comet_api_client live_generate_480p -- --ignored --nocapture
  // ─────────────────────────────────────────────────────────────────────
  mod live_tests {
    use std::time::Duration;

    use test_data::web::image_urls::{
      ERNEST_GHOST_TREX_IMAGE_URL,
      FOREST_BACKDROP_IMAGE_URL,
      GHOST_IMAGE_URL,
      GRASSY_HILL_TRANSPARENT_IMAGE_URL,
      JUNO_AT_LAKE_IMAGE_URL,
      MOUNTAIN_TREE_IMAGE_URL,
      SUPER_WIDE_FALL_MOUNTAINS_IMAGE_URL,
      TALL_CORGI_SHIBA_TREASURE_OCEAN_URL,
      TALL_MOCHI_WITH_GLASSES_IMAGE_URL,
      TREX_SKELETON_IMAGE_URL,
      WHITE_HOUSE_SUNSET_IMAGE_URL,
      WIDE_CORGI_SHIBA_TREASURE_OCEAN_URL,
    };

    use super::*;
    use crate::requests::get_video_task::get_video_task::{get_video_task, GetVideoTaskArgs};
    use crate::test_utils::load_api_key;

    /// ⚠️ EXPENSIVE: real 10s 480p generation (~$0.63) + a long poll.
    #[ignore]
    #[tokio::test]
    async fn live_generate_480p_with_references() {
      let input_reference_images = download_reference_images(&[
        ERNEST_GHOST_TREX_IMAGE_URL,
        GHOST_IMAGE_URL,
        TREX_SKELETON_IMAGE_URL,
        FOREST_BACKDROP_IMAGE_URL,
      ]).await;

      run_generation_to_completion(GenerateDoubaoSeedance2p0Request {
        prompt: "The frightened man from [Image 1] runs through the dark forest \
          from [Image 4], chased by the glowing ghost from [Image 2]. The t-rex \
          skeleton from [Image 3] rises out of the leaves behind them. Spooky, \
          comedic 90s horror movie tone."
          .to_string(),
        duration_seconds: Some(10),
        aspect_ratio: Some(DoubaoSeedance2p0AspectRatio::Landscape16x9),
        resolution: Some(DoubaoSeedance2p0Resolution::FourEightyP),
        input_reference_images,
      }).await;
    }

    /// ⚠️ EXPENSIVE: real 10s 720p generation (~$1.37) + a long poll.
    #[ignore]
    #[tokio::test]
    async fn live_generate_720p_with_references() {
      let input_reference_images = download_reference_images(&[
        JUNO_AT_LAKE_IMAGE_URL,
        TALL_MOCHI_WITH_GLASSES_IMAGE_URL,
        TALL_CORGI_SHIBA_TREASURE_OCEAN_URL,
        WIDE_CORGI_SHIBA_TREASURE_OCEAN_URL,
      ]).await;

      run_generation_to_completion(GenerateDoubaoSeedance2p0Request {
        prompt: "The dog from [Image 1] and the bespectacled dog from [Image 2] \
          join the corgi and shiba from [Image 3] on the beach, digging up the \
          treasure chest from [Image 4] as waves roll in. Joyful, sunny \
          adventure-film tone."
          .to_string(),
        duration_seconds: Some(10),
        aspect_ratio: Some(DoubaoSeedance2p0AspectRatio::Landscape16x9),
        resolution: Some(DoubaoSeedance2p0Resolution::SevenTwentyP),
        input_reference_images,
      }).await;
    }

    /// ⚠️ EXPENSIVE: real 10s 1080p generation (~$3.37) + a long poll.
    #[ignore]
    #[tokio::test]
    async fn live_generate_1080p_with_references() {
      let input_reference_images = download_reference_images(&[
        GRASSY_HILL_TRANSPARENT_IMAGE_URL,
        MOUNTAIN_TREE_IMAGE_URL,
        SUPER_WIDE_FALL_MOUNTAINS_IMAGE_URL,
        WHITE_HOUSE_SUNSET_IMAGE_URL,
      ]).await;

      run_generation_to_completion(GenerateDoubaoSeedance2p0Request {
        prompt: "A cinematic drone shot glides over the grassy hill from \
          [Image 1], past the lone tree on the mountainside from [Image 2], \
          across the sweeping autumn mountain range from [Image 3], and settles \
          on the white house at sunset from [Image 4]. Golden hour, slow and \
          steady camera movement."
          .to_string(),
        duration_seconds: Some(10),
        aspect_ratio: Some(DoubaoSeedance2p0AspectRatio::Landscape16x9),
        resolution: Some(DoubaoSeedance2p0Resolution::TenEightyP),
        input_reference_images,
      }).await;
    }

    // ── Helpers ──

    async fn download_reference_images(urls: &[&str]) -> Vec<CometInputReferenceImage> {
      let mut images = Vec::with_capacity(urls.len());
      for url in urls {
        images.push(download_reference_image(url).await);
      }
      images
    }

    async fn download_reference_image(url: &str) -> CometInputReferenceImage {
      let response = reqwest::get(url).await.expect("image download should succeed");
      assert!(response.status().is_success(), "image download failed: {} ({})", url, response.status());

      let filename = url.rsplit('/').next().expect("url should have a path").to_string();
      let maybe_content_type = if filename.ends_with(".png") {
        Some("image/png".to_string())
      } else {
        Some("image/jpeg".to_string())
      };
      let file_bytes = response.bytes().await.expect("image body should download").to_vec();

      println!("Downloaded reference: {} ({} bytes)", filename, file_bytes.len());

      CometInputReferenceImage {
        file_bytes,
        filename,
        maybe_content_type,
      }
    }

    /// Enqueue the generation, poll until terminal, and assert success.
    async fn run_generation_to_completion(request: GenerateDoubaoSeedance2p0Request) {
      // NB: Generations have been observed to run well past 10 minutes.
      const POLL_INTERVAL: Duration = Duration::from_secs(15);
      const MAX_POLLS: u32 = 120; // ~30 minutes

      let api_key = load_api_key();
      println!("Estimated cost: {}¢", request.estimate_cost_in_usd_cents());

      let created = generate_doubao_seedance_2p0(GenerateDoubaoSeedance2p0Args {
        request,
        api_key: &api_key,
      }).await.expect("generate_doubao_seedance_2p0 should succeed");

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
