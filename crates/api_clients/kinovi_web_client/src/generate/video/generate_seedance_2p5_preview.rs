use crate::creds::kinovi_web_session::KinoviWebSession;
use crate::error::kinovi_web_error::KinoviWebError;
use crate::cost::kinovi_fractional_generation_cost::KinoviFractionalGenerationCost;
use crate::requests::kinovi_host::KinoviHost;
use crate::requests::workflow_run_task::workflow_run_task::{
  workflow_run_task, KinoviAspectRatioRaw, KinoviBatchCountRaw, KinoviModelTypeRaw,
  KinoviOutputResolutionRaw, WorkflowRunTaskArgs, WorkflowRunTaskRequest,
};

// ── Args ──

pub struct GenerateSeedance2p5PreviewArgs<'a> {
  pub request: GenerateSeedance2p5PreviewRequest,
  pub session: &'a KinoviWebSession,
  pub host_override: Option<KinoviHost>,
}

// ── Request ──

/// Seedance 2.5 Preview only supports reference mode (there is no keyframe
/// start/end frame mode), 480p/720p output, and durations of 4–30 seconds.
///
/// Reference URLs must be Kinovi CDN material URLs: upload via
/// `prepare_file_upload` + `upload_file`, then register the file with
/// `create_material` (the site does this for every reference before calling
/// `workflow.runTask`; registration triggers Kinovi's content detection, and
/// unregistered video references have been observed to fail).
#[derive(Clone, Debug)]
pub struct GenerateSeedance2p5PreviewRequest {
  pub prompt: String,
  pub aspect_ratio: Option<KinoviSeedance2p5PreviewAspectRatio>,
  pub output_resolution: Option<KinoviSeedance2p5PreviewOutputResolution>,
  pub duration_seconds: u8,
  /// Reference images, referenced in prompts as @image1, @image2, etc.
  pub reference_image_urls: Option<Vec<String>>,
  /// Reference videos, referenced in prompts as @video1, @video2, etc.
  pub reference_video_urls: Option<Vec<String>>,
  /// Reference audio, referenced in prompts as @audio1, @audio2, etc.
  pub reference_audio_urls: Option<Vec<String>>,
  /// Controls `faceBlurMode`: true sends "on"; false or None sends "off"
  /// (the model always sends the field, unlike older Seedance models).
  pub use_face_blur_hack: Option<bool>,
}

// ── Enums ──

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p5PreviewAspectRatio {
  Landscape16x9,
  UltraWide21x9,
  Portrait9x16,
  Square1x1,
  Standard4x3,
  Portrait3x4,
}

/// Output resolution. 2.5 Preview supports only 480p and 720p.
#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p5PreviewOutputResolution {
  FourEightyP,
  SevenTwentyP,
}

// ── Pricing ──
//
// Seedance 2.5 Preview credit pricing (per second of output duration):
//
// | Resolution | Credits/sec |
// |------------|-------------|
// | 480p       |       46.81 |
// | 720p       |       93.62 |
//
// References (images, videos, and audio) do NOT affect the cost — unlike the
// Seedance 2.0 models, there is no video-reference surcharge. Default
// resolution (None) is 720p.
// Credit package: 525,000 credits for $2,159.0909 (~243 credits/$1).

impl GenerateSeedance2p5PreviewRequest {
  /// Calculate the cost of this generation request, in Kinovi credits
  /// (fractional) and USD cents.
  ///
  /// The math is done in integer hundredths of a credit so the totals land
  /// exactly on the observed values (e.g. 480p × 15s = 702.15, not the
  /// 702.150000000001 float artifact Kinovi's own UI shows).
  pub fn calculate_costs(&self) -> KinoviFractionalGenerationCost {
    let credits_per_second_hundredths: u64 = match self.output_resolution {
      Some(KinoviSeedance2p5PreviewOutputResolution::FourEightyP) => 4_681,
      Some(KinoviSeedance2p5PreviewOutputResolution::SevenTwentyP) | None => 9_362,
    };

    let total_hundredths = credits_per_second_hundredths * u64::from(self.duration_seconds);
    KinoviFractionalGenerationCost::from_kinovi_credits(total_hundredths as f64 / 100.0)
  }
}

// ── Response ──

pub struct GenerateSeedance2p5PreviewResponse {
  pub task_id: String,
  pub order_id: String,
  pub task_ids: Option<Vec<String>>,
  pub order_ids: Option<Vec<String>>,
}

// ── Entry point ──

pub async fn generate_seedance_2p5_preview(
  args: GenerateSeedance2p5PreviewArgs<'_>,
) -> Result<GenerateSeedance2p5PreviewResponse, KinoviWebError> {
  let raw_response = workflow_run_task(WorkflowRunTaskArgs {
    request: to_raw_request(args.request),
    session: args.session,
    host_override: args.host_override,
  }).await?;

  Ok(GenerateSeedance2p5PreviewResponse {
    task_id: raw_response.task_id,
    order_id: raw_response.order_id,
    task_ids: raw_response.task_ids,
    order_ids: raw_response.order_ids,
  })
}

// ── Mapping helpers ──

fn to_raw_request(req: GenerateSeedance2p5PreviewRequest) -> WorkflowRunTaskRequest {
  WorkflowRunTaskRequest {
    model_type: KinoviModelTypeRaw::Seedance2p5Preview,
    prompt: req.prompt,
    aspect_ratio: map_aspect_ratio(req.aspect_ratio),
    output_resolution: req.output_resolution.map(map_output_resolution),
    duration_seconds: req.duration_seconds,
    batch_count: KinoviBatchCountRaw::One,
    start_frame_url: None,
    end_frame_url: None,
    reference_image_urls: req.reference_image_urls,
    reference_video_urls: req.reference_video_urls,
    reference_audio_urls: req.reference_audio_urls,
    character_ids: None,
    use_face_blur_hack: req.use_face_blur_hack,
    bitrate: None,
  }
}

fn map_aspect_ratio(ar: Option<KinoviSeedance2p5PreviewAspectRatio>) -> KinoviAspectRatioRaw {
  match ar {
    Some(KinoviSeedance2p5PreviewAspectRatio::Landscape16x9) => KinoviAspectRatioRaw::Landscape16x9,
    Some(KinoviSeedance2p5PreviewAspectRatio::UltraWide21x9) => KinoviAspectRatioRaw::UltraWide21x9,
    Some(KinoviSeedance2p5PreviewAspectRatio::Portrait9x16) => KinoviAspectRatioRaw::Portrait9x16,
    Some(KinoviSeedance2p5PreviewAspectRatio::Square1x1) => KinoviAspectRatioRaw::Square1x1,
    Some(KinoviSeedance2p5PreviewAspectRatio::Standard4x3) => KinoviAspectRatioRaw::Landscape4x3,
    Some(KinoviSeedance2p5PreviewAspectRatio::Portrait3x4) => KinoviAspectRatioRaw::Portrait3x4,
    None => KinoviAspectRatioRaw::Landscape16x9,
  }
}

fn map_output_resolution(res: KinoviSeedance2p5PreviewOutputResolution) -> KinoviOutputResolutionRaw {
  match res {
    KinoviSeedance2p5PreviewOutputResolution::FourEightyP => KinoviOutputResolutionRaw::FourEightyP,
    KinoviSeedance2p5PreviewOutputResolution::SevenTwentyP => KinoviOutputResolutionRaw::SevenTwentyP,
  }
}

// ── Tests ──

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::kinovi_web_session::KinoviWebSession;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  mod pricing_tests {
    use super::*;

    const FLOAT_TOLERANCE: f64 = 1e-9;

    fn build_request(
      duration_seconds: u8,
      output_resolution: Option<KinoviSeedance2p5PreviewOutputResolution>,
    ) -> GenerateSeedance2p5PreviewRequest {
      GenerateSeedance2p5PreviewRequest {
        prompt: String::new(),
        aspect_ratio: None,
        output_resolution,
        duration_seconds,
        reference_image_urls: None,
        reference_video_urls: None,
        reference_audio_urls: None,
        use_face_blur_hack: None,
      }
    }

    fn r480(dur: u8) -> GenerateSeedance2p5PreviewRequest {
      build_request(dur, Some(KinoviSeedance2p5PreviewOutputResolution::FourEightyP))
    }

    fn r720(dur: u8) -> GenerateSeedance2p5PreviewRequest {
      build_request(dur, None)
    }

    fn with_all_reference_types(mut request: GenerateSeedance2p5PreviewRequest) -> GenerateSeedance2p5PreviewRequest {
      request.reference_image_urls = Some(vec![
        "https://example.com/a.jpg".to_string(),
        "https://example.com/b.png".to_string(),
      ]);
      request.reference_video_urls = Some(vec!["https://example.com/ref.mp4".to_string()]);
      request.reference_audio_urls = Some(vec!["https://example.com/ref.wav".to_string()]);
      request
    }

    // ── Full pricing table (credits) ──
    //
    // The exact per-duration table observed from Kinovi for Seedance 2.5
    // Preview: 480p = 46.81 credits/sec, 720p = 93.62 credits/sec.

    mod kinovi_pricing_table {
      use super::*;

      #[test]
      fn table_480p() {
        assert_eq!(r480(4).calculate_costs().kinovi_credits, 187.24);
        assert_eq!(r480(10).calculate_costs().kinovi_credits, 468.1);
        assert_eq!(r480(15).calculate_costs().kinovi_credits, 702.15);
        assert_eq!(r480(20).calculate_costs().kinovi_credits, 936.2);
        assert_eq!(r480(25).calculate_costs().kinovi_credits, 1170.25);
        assert_eq!(r480(30).calculate_costs().kinovi_credits, 1404.3);
      }

      #[test]
      fn table_720p() {
        assert_eq!(r720(4).calculate_costs().kinovi_credits, 374.48);
        assert_eq!(r720(10).calculate_costs().kinovi_credits, 936.2);
        assert_eq!(r720(15).calculate_costs().kinovi_credits, 1404.3);
        assert_eq!(r720(20).calculate_costs().kinovi_credits, 1872.4);
        assert_eq!(r720(25).calculate_costs().kinovi_credits, 2340.5);
        assert_eq!(r720(30).calculate_costs().kinovi_credits, 2808.6);
      }

      #[test]
      fn explicit_720p_same_as_default() {
        let default = r720(10).calculate_costs();
        let explicit = build_request(10, Some(KinoviSeedance2p5PreviewOutputResolution::SevenTwentyP)).calculate_costs();
        assert_eq!(default, explicit);
      }
    }

    // ── References don't affect cost ──
    //
    // Unlike the Seedance 2.0 models, 2.5 Preview has no video-reference
    // surcharge: adding or removing references of any type leaves the cost
    // unchanged.

    mod references_do_not_affect_cost {
      use super::*;

      #[test]
      fn table_480p_with_references_is_identical() {
        for duration in [4u8, 10, 15, 20, 25, 30] {
          assert_eq!(
            with_all_reference_types(r480(duration)).calculate_costs(),
            r480(duration).calculate_costs(),
            "480p at {duration}s",
          );
        }
      }

      #[test]
      fn table_720p_with_references_is_identical() {
        for duration in [4u8, 10, 15, 20, 25, 30] {
          assert_eq!(
            with_all_reference_types(r720(duration)).calculate_costs(),
            r720(duration).calculate_costs(),
            "720p at {duration}s",
          );
        }
      }

      #[test]
      fn video_reference_alone_adds_no_surcharge() {
        let mut request = r720(10);
        request.reference_video_urls = Some(vec!["https://example.com/ref.mp4".to_string()]);
        assert_eq!(request.calculate_costs().kinovi_credits, 936.2);
      }
    }

    // ── USD cents conversion ──
    //
    // usd_cents = credits × 100 / 243, computed on integer hundredths.

    mod usd_cents {
      use super::*;

      #[test]
      fn cents_480p_4s() {
        // 187.24 credits; 18724/243 = 77.0535 cents.
        let cost = r480(4).calculate_costs();
        assert_eq!(cost.usd_cents_rounded_up, 78);
        assert_eq!(cost.usd_cents_rounded_down, 77);
        assert!((cost.usd_cents_fractional - (18724.0 / 243.0)).abs() < FLOAT_TOLERANCE);
      }

      #[test]
      fn cents_480p_15s() {
        // 702.15 credits; 70215/243 = 288.9506 cents.
        let cost = r480(15).calculate_costs();
        assert_eq!(cost.usd_cents_rounded_up, 289);
        assert_eq!(cost.usd_cents_rounded_down, 288);
        assert!((cost.usd_cents_fractional - (70215.0 / 243.0)).abs() < FLOAT_TOLERANCE);
      }

      #[test]
      fn cents_720p_4s() {
        // 374.48 credits; 37448/243 = 154.1070 cents.
        let cost = r720(4).calculate_costs();
        assert_eq!(cost.usd_cents_rounded_up, 155);
        assert_eq!(cost.usd_cents_rounded_down, 154);
        assert!((cost.usd_cents_fractional - (37448.0 / 243.0)).abs() < FLOAT_TOLERANCE);
      }

      #[test]
      fn cents_720p_30s() {
        // 2808.6 credits; 280860/243 = 1155.8025 cents.
        let cost = r720(30).calculate_costs();
        assert_eq!(cost.usd_cents_rounded_up, 1156);
        assert_eq!(cost.usd_cents_rounded_down, 1155);
        assert!((cost.usd_cents_fractional - (280860.0 / 243.0)).abs() < FLOAT_TOLERANCE);
      }
    }

    // ── Relative pricing ──

    mod relative_tests {
      use super::*;

      #[test]
      fn seven_twenty_is_exactly_double_480p() {
        for duration in [4u8, 10, 15, 20, 25, 30] {
          let c480 = r480(duration).calculate_costs().kinovi_credits;
          let c720 = r720(duration).calculate_costs().kinovi_credits;
          assert_eq!(c720, c480 * 2.0, "720p should be 2× 480p at {duration}s");
        }
      }

      #[test]
      fn cost_scales_linearly_with_duration() {
        let per_second = r480(1).calculate_costs().kinovi_credits;
        assert_eq!(per_second, 46.81);
        for duration in [4u8, 10, 15, 20, 25, 30] {
          let expected = (4_681 * u64::from(duration)) as f64 / 100.0;
          assert_eq!(r480(duration).calculate_costs().kinovi_credits, expected);
        }
      }
    }

    // ── Aspect ratio doesn't affect cost ──

    #[test]
    fn aspect_ratio_does_not_affect_credits() {
      let baseline = r720(10).calculate_costs().kinovi_credits;

      let ratios = [
        KinoviSeedance2p5PreviewAspectRatio::Landscape16x9,
        KinoviSeedance2p5PreviewAspectRatio::UltraWide21x9,
        KinoviSeedance2p5PreviewAspectRatio::Portrait9x16,
        KinoviSeedance2p5PreviewAspectRatio::Square1x1,
        KinoviSeedance2p5PreviewAspectRatio::Standard4x3,
        KinoviSeedance2p5PreviewAspectRatio::Portrait3x4,
      ];

      for ar in &ratios {
        let mut request = r720(10);
        request.aspect_ratio = Some(*ar);
        assert_eq!(
          request.calculate_costs().kinovi_credits, baseline,
          "Aspect ratio {:?} should not change credits from baseline {}", ar, baseline,
        );
      }
    }
  }

  mod real_requests {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_480p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p5_preview(GenerateSeedance2p5PreviewArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p5PreviewRequest {
          prompt: "A man is running from a t-rex".to_string(),
          aspect_ratio: Some(KinoviSeedance2p5PreviewAspectRatio::Landscape16x9),
          output_resolution: Some(KinoviSeedance2p5PreviewOutputResolution::FourEightyP),
          duration_seconds: 4,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("t2v 480p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2, "Inspect output above");
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_720p_default() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p5_preview(GenerateSeedance2p5PreviewArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p5PreviewRequest {
          prompt: "A corgi and a shiba are playing chess against one another".to_string(),
          aspect_ratio: None,
          output_resolution: None,
          duration_seconds: 4,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("t2v 720p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2, "Inspect output above");
      Ok(())
    }

    fn test_session() -> AnyhowResult<KinoviWebSession> {
      let cookies = get_test_cookies()?;
      Ok(KinoviWebSession::from_cookies_string(cookies))
    }
  }
}
