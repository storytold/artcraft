use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::cost::kinovi_seedance_generation_cost::KinoviSeedanceGenerationCost;
use crate::requests::kinovi_host::KinoviHost;
use crate::requests::workflow_run_task::workflow_run_task::{
  workflow_run_task, KinoviAspectRatioRaw, KinoviBatchCountRaw,
  KinoviModelTypeRaw, KinoviOutputResolutionRaw, WorkflowRunTaskArgs,
  WorkflowRunTaskRequest,
};

// ── Args ──

pub struct GenerateSeedance2p0Args<'a> {
  pub request: GenerateSeedance2p0Request,
  pub session: &'a Seedance2ProSession,
  pub host_override: Option<KinoviHost>,
}

// ── Request ──

#[derive(Clone, Debug)]
pub struct GenerateSeedance2p0Request {
  pub prompt: String,
  pub aspect_ratio: Option<KinoviSeedance2p0AspectRatio>,
  pub output_resolution: Option<KinoviSeedance2p0OutputResolution>,
  pub duration_seconds: u8,
  pub batch_count: Option<KinoviSeedance2p0BatchCount>,
  pub start_frame_url: Option<String>,
  pub end_frame_url: Option<String>,
  pub reference_image_urls: Option<Vec<String>>,
  pub reference_video_urls: Option<Vec<String>>,
  pub reference_audio_urls: Option<Vec<String>>,
  pub character_ids: Option<Vec<String>>,
  pub use_face_blur_hack: Option<bool>,
}

// ── Enums ──

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0AspectRatio {
  Landscape16x9,
  UltraWide21x9,
  Portrait9x16,
  Square1x1,
  Standard4x3,
  Portrait3x4,
}

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0OutputResolution {
  FourEightyP,
  SevenTwentyP,
  TenEightyP,
}

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0BatchCount {
  One,
  Two,
  Four,
}

// ── Pricing ──
//
// Seedance 2.0 Pro credit pricing:
//
// | Resolution | Credits/sec |
// |------------|-------------|
// | 480p       |          15 |
// | 720p       |          40 |
// | 1080p      |          90 |
//
// Default resolution (None) is 720p.
// Batch count multiplies the total cost.
// Credit package: 525,000 credits for $2,159.0909 (~243.16 credits/$1, rounded down to 243).

impl GenerateSeedance2p0Request {
  /// Calculate the cost of this generation request, in Kinovi credits and
  /// USD cents (rounded up).
  ///
  /// Attaching reference VIDEOS adds a per-output-second surcharge (see the
  /// pricing table below). Reference images and audio are free.
  pub fn calculate_costs(&self) -> KinoviSeedanceGenerationCost {
    let credits_per_second: u64 = match self.output_resolution {
      Some(KinoviSeedance2p0OutputResolution::FourEightyP) => 15,
      Some(KinoviSeedance2p0OutputResolution::SevenTwentyP) | None => 40,
      Some(KinoviSeedance2p0OutputResolution::TenEightyP) => 90,
    };

    // Video-reference surcharge, billed per second of OUTPUT duration
    // (not the reference video's duration):
    //
    // | Resolution | Surcharge credits/sec |
    // |------------|-----------------------|
    // | 480p       |                     4 |
    // | 720p       |                     8 |
    // | 1080p      |                    18 |
    //
    // NB: Assumed flat per generation regardless of how many reference
    // videos are attached (Kinovi's pricing page only shows one).
    let video_reference_surcharge_per_second: u64 = if self.has_video_reference() {
      match self.output_resolution {
        Some(KinoviSeedance2p0OutputResolution::FourEightyP) => 4,
        Some(KinoviSeedance2p0OutputResolution::SevenTwentyP) | None => 8,
        Some(KinoviSeedance2p0OutputResolution::TenEightyP) => 18,
      }
    } else {
      0
    };

    let batch_multiplier: u64 = match self.batch_count {
      None | Some(KinoviSeedance2p0BatchCount::One) => 1,
      Some(KinoviSeedance2p0BatchCount::Two) => 2,
      Some(KinoviSeedance2p0BatchCount::Four) => 4,
    };

    let duration = u64::from(self.duration_seconds);
    let base_credits = duration * credits_per_second * batch_multiplier;
    let maybe_video_reference_surcharge_credits = if self.has_video_reference() {
      Some(duration * video_reference_surcharge_per_second * batch_multiplier)
    } else {
      None
    };

    KinoviSeedanceGenerationCost::from_base_and_surcharge(
      base_credits,
      maybe_video_reference_surcharge_credits,
    )
  }

  fn has_video_reference(&self) -> bool {
    self.reference_video_urls
      .as_ref()
      .is_some_and(|urls| !urls.is_empty())
  }

  /// Estimate the credit cost for this generation request.
  #[deprecated(note = "Use calculate_costs() instead")]
  pub fn estimate_credits(&self) -> u32 {
    self.calculate_costs().total_cost.kinovi_credits as u32
  }

  /// Estimate the USD cost in cents for this generation request.
  /// NB: Rounds UP fractional cents (the historical behavior rounded to nearest).
  #[deprecated(note = "Use calculate_costs() instead")]
  pub fn estimate_cost_in_usd_cents(&self) -> u64 {
    self.calculate_costs().total_cost.usd_cents_rounded_up
  }
}

// ── Response ──

pub struct GenerateSeedance2p0Response {
  pub task_id: String,
  pub order_id: String,
  pub task_ids: Option<Vec<String>>,
  pub order_ids: Option<Vec<String>>,
}

// ── Entry point ──

pub async fn generate_seedance_2p0(
  args: GenerateSeedance2p0Args<'_>,
) -> Result<GenerateSeedance2p0Response, Seedance2ProError> {
  let req = args.request;

  let raw_request = WorkflowRunTaskRequest {
    model_type: KinoviModelTypeRaw::Seedance2Pro,
    prompt: req.prompt,
    aspect_ratio: map_aspect_ratio(req.aspect_ratio),
    output_resolution: req.output_resolution.map(map_output_resolution),
    batch_count: map_batch_count(req.batch_count),
    duration_seconds: req.duration_seconds,
    start_frame_url: req.start_frame_url,
    end_frame_url: req.end_frame_url,
    reference_image_urls: req.reference_image_urls,
    reference_video_urls: req.reference_video_urls,
    reference_audio_urls: req.reference_audio_urls,
    character_ids: req.character_ids,
    use_face_blur_hack: req.use_face_blur_hack,
  };

  let raw_response = workflow_run_task(WorkflowRunTaskArgs {
    request: raw_request,
    session: args.session,
    host_override: args.host_override,
  }).await?;

  Ok(GenerateSeedance2p0Response {
    task_id: raw_response.task_id,
    order_id: raw_response.order_id,
    task_ids: raw_response.task_ids,
    order_ids: raw_response.order_ids,
  })
}

// ── Mapping helpers ──

fn map_aspect_ratio(ar: Option<KinoviSeedance2p0AspectRatio>) -> KinoviAspectRatioRaw {
  match ar {
    Some(KinoviSeedance2p0AspectRatio::Landscape16x9) => KinoviAspectRatioRaw::Landscape16x9,
    Some(KinoviSeedance2p0AspectRatio::UltraWide21x9) => KinoviAspectRatioRaw::UltraWide21x9,
    Some(KinoviSeedance2p0AspectRatio::Portrait9x16) => KinoviAspectRatioRaw::Portrait9x16,
    Some(KinoviSeedance2p0AspectRatio::Square1x1) => KinoviAspectRatioRaw::Square1x1,
    Some(KinoviSeedance2p0AspectRatio::Standard4x3) => KinoviAspectRatioRaw::Landscape4x3,
    Some(KinoviSeedance2p0AspectRatio::Portrait3x4) => KinoviAspectRatioRaw::Portrait3x4,
    None => KinoviAspectRatioRaw::Landscape16x9,
  }
}

fn map_output_resolution(res: KinoviSeedance2p0OutputResolution) -> KinoviOutputResolutionRaw {
  match res {
    KinoviSeedance2p0OutputResolution::FourEightyP => KinoviOutputResolutionRaw::FourEightyP,
    KinoviSeedance2p0OutputResolution::SevenTwentyP => KinoviOutputResolutionRaw::SevenTwentyP,
    KinoviSeedance2p0OutputResolution::TenEightyP => KinoviOutputResolutionRaw::TenEightyP,
  }
}

fn map_batch_count(bc: Option<KinoviSeedance2p0BatchCount>) -> KinoviBatchCountRaw {
  match bc {
    Some(KinoviSeedance2p0BatchCount::One) | None => KinoviBatchCountRaw::One,
    Some(KinoviSeedance2p0BatchCount::Two) => KinoviBatchCountRaw::Two,
    Some(KinoviSeedance2p0BatchCount::Four) => KinoviBatchCountRaw::Four,
  }
}

// ── Tests ──

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::seedance2pro_session::Seedance2ProSession;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  mod pricing_tests {
    use super::*;

    fn build_request(
      duration_seconds: u8,
      output_resolution: Option<KinoviSeedance2p0OutputResolution>,
      batch_count: Option<KinoviSeedance2p0BatchCount>,
    ) -> GenerateSeedance2p0Request {
      GenerateSeedance2p0Request {
        prompt: String::new(),
        aspect_ratio: None,
        output_resolution,
        batch_count,
        duration_seconds,
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: None,
        reference_video_urls: None,
        reference_audio_urls: None,
        character_ids: None,
        use_face_blur_hack: None,
      }
    }

    fn r480(dur: u8) -> GenerateSeedance2p0Request {
      build_request(dur, Some(KinoviSeedance2p0OutputResolution::FourEightyP), None)
    }

    fn r720(dur: u8) -> GenerateSeedance2p0Request {
      build_request(dur, None, None)
    }

    fn r1080(dur: u8) -> GenerateSeedance2p0Request {
      build_request(dur, Some(KinoviSeedance2p0OutputResolution::TenEightyP), None)
    }

    // ── Comprehensive per-resolution coverage ──
    //
    // Seedance 2.0: 480p 15/s (+4/s video ref), 720p 40/s (+8/s), 1080p 90/s (+18/s).
    // Every field and subfield is asserted: total_cost, base_cost,
    // video_reference_surcharge_cost × (kinovi_credits, usd_cents_rounded_up,
    // usd_cents_rounded_down, usd_cents_fractional). All cases use a 5 second
    // duration with no batching.

    mod comprehensive {
      use super::*;

      const FLOAT_TOLERANCE: f64 = 1e-9;


      mod resolution_480p {
        use super::*;

        #[test]
        fn test_without_reference_video() {
          let costs = r480(5).calculate_costs();

          // Base: 15 credits/s × 5s = 75 credits; 7500/243 = 30.8642.
          assert_eq!(costs.base_cost.kinovi_credits, 75);
          assert_eq!(costs.base_cost.usd_cents_rounded_up, 31);
          assert_eq!(costs.base_cost.usd_cents_rounded_down, 30);
          assert!((costs.base_cost.usd_cents_fractional - (7500.0 / 243.0)).abs() < FLOAT_TOLERANCE);

          // No reference video: no surcharge, and the total equals the base.
          assert!(costs.video_reference_surcharge_cost.is_none());

          assert_eq!(costs.total_cost.kinovi_credits, 75);
          assert_eq!(costs.total_cost.usd_cents_rounded_up, 31);
          assert_eq!(costs.total_cost.usd_cents_rounded_down, 30);
          assert!((costs.total_cost.usd_cents_fractional - (7500.0 / 243.0)).abs() < FLOAT_TOLERANCE);
        }

        #[test]
        fn test_with_reference_video() {
          let mut request = r480(5);
          request.reference_video_urls = Some(vec!["https://example.com/ref.mp4".to_string()]);
          let costs = request.calculate_costs();

          // Base: 15 credits/s × 5s = 75 credits; 7500/243 = 30.8642.
          assert_eq!(costs.base_cost.kinovi_credits, 75);
          assert_eq!(costs.base_cost.usd_cents_rounded_up, 31);
          assert_eq!(costs.base_cost.usd_cents_rounded_down, 30);
          assert!((costs.base_cost.usd_cents_fractional - (7500.0 / 243.0)).abs() < FLOAT_TOLERANCE);

          // Surcharge: 4 credits/s × 5s = 20 credits; 2000/243 = 8.2305.
          let surcharge = costs.video_reference_surcharge_cost.expect("should have surcharge");
          assert_eq!(surcharge.kinovi_credits, 20);
          assert_eq!(surcharge.usd_cents_rounded_up, 9);
          assert_eq!(surcharge.usd_cents_rounded_down, 8);
          assert!((surcharge.usd_cents_fractional - (2000.0 / 243.0)).abs() < FLOAT_TOLERANCE);

          // Total: 75 + 20 = 95 credits; 9500/243 = 39.0947.
          assert_eq!(costs.total_cost.kinovi_credits, 95);
          assert_eq!(costs.total_cost.usd_cents_rounded_up, 40);
          assert_eq!(costs.total_cost.usd_cents_rounded_down, 39);
          assert!((costs.total_cost.usd_cents_fractional - (9500.0 / 243.0)).abs() < FLOAT_TOLERANCE);
        }
      }


      mod resolution_720p {
        use super::*;

        #[test]
        fn test_without_reference_video() {
          let costs = r720(5).calculate_costs();

          // Base: 40 credits/s × 5s = 200 credits; 20000/243 = 82.3045.
          assert_eq!(costs.base_cost.kinovi_credits, 200);
          assert_eq!(costs.base_cost.usd_cents_rounded_up, 83);
          assert_eq!(costs.base_cost.usd_cents_rounded_down, 82);
          assert!((costs.base_cost.usd_cents_fractional - (20000.0 / 243.0)).abs() < FLOAT_TOLERANCE);

          // No reference video: no surcharge, and the total equals the base.
          assert!(costs.video_reference_surcharge_cost.is_none());

          assert_eq!(costs.total_cost.kinovi_credits, 200);
          assert_eq!(costs.total_cost.usd_cents_rounded_up, 83);
          assert_eq!(costs.total_cost.usd_cents_rounded_down, 82);
          assert!((costs.total_cost.usd_cents_fractional - (20000.0 / 243.0)).abs() < FLOAT_TOLERANCE);
        }

        #[test]
        fn test_with_reference_video() {
          let mut request = r720(5);
          request.reference_video_urls = Some(vec!["https://example.com/ref.mp4".to_string()]);
          let costs = request.calculate_costs();

          // Base: 40 credits/s × 5s = 200 credits; 20000/243 = 82.3045.
          assert_eq!(costs.base_cost.kinovi_credits, 200);
          assert_eq!(costs.base_cost.usd_cents_rounded_up, 83);
          assert_eq!(costs.base_cost.usd_cents_rounded_down, 82);
          assert!((costs.base_cost.usd_cents_fractional - (20000.0 / 243.0)).abs() < FLOAT_TOLERANCE);

          // Surcharge: 8 credits/s × 5s = 40 credits; 4000/243 = 16.4609.
          let surcharge = costs.video_reference_surcharge_cost.expect("should have surcharge");
          assert_eq!(surcharge.kinovi_credits, 40);
          assert_eq!(surcharge.usd_cents_rounded_up, 17);
          assert_eq!(surcharge.usd_cents_rounded_down, 16);
          assert!((surcharge.usd_cents_fractional - (4000.0 / 243.0)).abs() < FLOAT_TOLERANCE);

          // Total: 200 + 40 = 240 credits; 24000/243 = 98.7654.
          assert_eq!(costs.total_cost.kinovi_credits, 240);
          assert_eq!(costs.total_cost.usd_cents_rounded_up, 99);
          assert_eq!(costs.total_cost.usd_cents_rounded_down, 98);
          assert!((costs.total_cost.usd_cents_fractional - (24000.0 / 243.0)).abs() < FLOAT_TOLERANCE);
        }
      }


      mod resolution_1080p {
        use super::*;

        #[test]
        fn test_without_reference_video() {
          let costs = r1080(5).calculate_costs();

          // Base: 90 credits/s × 5s = 450 credits; 45000/243 = 185.1852.
          assert_eq!(costs.base_cost.kinovi_credits, 450);
          assert_eq!(costs.base_cost.usd_cents_rounded_up, 186);
          assert_eq!(costs.base_cost.usd_cents_rounded_down, 185);
          assert!((costs.base_cost.usd_cents_fractional - (45000.0 / 243.0)).abs() < FLOAT_TOLERANCE);

          // No reference video: no surcharge, and the total equals the base.
          assert!(costs.video_reference_surcharge_cost.is_none());

          assert_eq!(costs.total_cost.kinovi_credits, 450);
          assert_eq!(costs.total_cost.usd_cents_rounded_up, 186);
          assert_eq!(costs.total_cost.usd_cents_rounded_down, 185);
          assert!((costs.total_cost.usd_cents_fractional - (45000.0 / 243.0)).abs() < FLOAT_TOLERANCE);
        }

        #[test]
        fn test_with_reference_video() {
          let mut request = r1080(5);
          request.reference_video_urls = Some(vec!["https://example.com/ref.mp4".to_string()]);
          let costs = request.calculate_costs();

          // Base: 90 credits/s × 5s = 450 credits; 45000/243 = 185.1852.
          assert_eq!(costs.base_cost.kinovi_credits, 450);
          assert_eq!(costs.base_cost.usd_cents_rounded_up, 186);
          assert_eq!(costs.base_cost.usd_cents_rounded_down, 185);
          assert!((costs.base_cost.usd_cents_fractional - (45000.0 / 243.0)).abs() < FLOAT_TOLERANCE);

          // Surcharge: 18 credits/s × 5s = 90 credits; 9000/243 = 37.0370.
          let surcharge = costs.video_reference_surcharge_cost.expect("should have surcharge");
          assert_eq!(surcharge.kinovi_credits, 90);
          assert_eq!(surcharge.usd_cents_rounded_up, 38);
          assert_eq!(surcharge.usd_cents_rounded_down, 37);
          assert!((surcharge.usd_cents_fractional - (9000.0 / 243.0)).abs() < FLOAT_TOLERANCE);

          // Total: 450 + 90 = 540 credits; 54000/243 = 222.2222.
          assert_eq!(costs.total_cost.kinovi_credits, 540);
          assert_eq!(costs.total_cost.usd_cents_rounded_up, 223);
          assert_eq!(costs.total_cost.usd_cents_rounded_down, 222);
          assert!((costs.total_cost.usd_cents_fractional - (54000.0 / 243.0)).abs() < FLOAT_TOLERANCE);
        }
      }

    }

    // ── 480p credits (15 credits/sec) ──

    mod credits_480p {
      use super::*;

      #[test]
      fn every_duration() {
        assert_eq!(r480(3).calculate_costs().total_cost.kinovi_credits, 45);
        assert_eq!(r480(4).calculate_costs().total_cost.kinovi_credits, 60);
        assert_eq!(r480(5).calculate_costs().total_cost.kinovi_credits, 75);
        assert_eq!(r480(6).calculate_costs().total_cost.kinovi_credits, 90);
        assert_eq!(r480(7).calculate_costs().total_cost.kinovi_credits, 105);
        assert_eq!(r480(8).calculate_costs().total_cost.kinovi_credits, 120);
        assert_eq!(r480(9).calculate_costs().total_cost.kinovi_credits, 135);
        assert_eq!(r480(10).calculate_costs().total_cost.kinovi_credits, 150);
        assert_eq!(r480(11).calculate_costs().total_cost.kinovi_credits, 165);
        assert_eq!(r480(12).calculate_costs().total_cost.kinovi_credits, 180);
        assert_eq!(r480(13).calculate_costs().total_cost.kinovi_credits, 195);
        assert_eq!(r480(14).calculate_costs().total_cost.kinovi_credits, 210);
        assert_eq!(r480(15).calculate_costs().total_cost.kinovi_credits, 225);
      }
    }

    // ── 720p credits (40 credits/sec) ──

    mod credits_720p {
      use super::*;

      #[test]
      fn every_duration() {
        assert_eq!(r720(3).calculate_costs().total_cost.kinovi_credits, 120);
        assert_eq!(r720(4).calculate_costs().total_cost.kinovi_credits, 160);
        assert_eq!(r720(5).calculate_costs().total_cost.kinovi_credits, 200);
        assert_eq!(r720(6).calculate_costs().total_cost.kinovi_credits, 240);
        assert_eq!(r720(7).calculate_costs().total_cost.kinovi_credits, 280);
        assert_eq!(r720(8).calculate_costs().total_cost.kinovi_credits, 320);
        assert_eq!(r720(9).calculate_costs().total_cost.kinovi_credits, 360);
        assert_eq!(r720(10).calculate_costs().total_cost.kinovi_credits, 400);
        assert_eq!(r720(11).calculate_costs().total_cost.kinovi_credits, 440);
        assert_eq!(r720(12).calculate_costs().total_cost.kinovi_credits, 480);
        assert_eq!(r720(13).calculate_costs().total_cost.kinovi_credits, 520);
        assert_eq!(r720(14).calculate_costs().total_cost.kinovi_credits, 560);
        assert_eq!(r720(15).calculate_costs().total_cost.kinovi_credits, 600);
      }

      #[test]
      fn explicit_720p_same_as_default() {
        let default = r720(5).calculate_costs().total_cost.kinovi_credits;
        let explicit = build_request(5, Some(KinoviSeedance2p0OutputResolution::SevenTwentyP), None).calculate_costs().total_cost.kinovi_credits;
        assert_eq!(default, explicit);
      }
    }

    // ── 1080p credits (90 credits/sec) ──

    mod credits_1080p {
      use super::*;

      #[test]
      fn every_duration() {
        assert_eq!(r1080(3).calculate_costs().total_cost.kinovi_credits, 270);
        assert_eq!(r1080(4).calculate_costs().total_cost.kinovi_credits, 360);
        assert_eq!(r1080(5).calculate_costs().total_cost.kinovi_credits, 450);
        assert_eq!(r1080(6).calculate_costs().total_cost.kinovi_credits, 540);
        assert_eq!(r1080(7).calculate_costs().total_cost.kinovi_credits, 630);
        assert_eq!(r1080(8).calculate_costs().total_cost.kinovi_credits, 720);
        assert_eq!(r1080(9).calculate_costs().total_cost.kinovi_credits, 810);
        assert_eq!(r1080(10).calculate_costs().total_cost.kinovi_credits, 900);
        assert_eq!(r1080(11).calculate_costs().total_cost.kinovi_credits, 990);
        assert_eq!(r1080(12).calculate_costs().total_cost.kinovi_credits, 1080);
        assert_eq!(r1080(13).calculate_costs().total_cost.kinovi_credits, 1170);
        assert_eq!(r1080(14).calculate_costs().total_cost.kinovi_credits, 1260);
        assert_eq!(r1080(15).calculate_costs().total_cost.kinovi_credits, 1350);
      }
    }

    // ── Batch multiplier ──

    mod batch_tests {
      use super::*;

      #[test]
      fn batch_1_is_base() {
        let base = r720(5).calculate_costs().total_cost.kinovi_credits;
        let explicit = build_request(5, None, Some(KinoviSeedance2p0BatchCount::One)).calculate_costs().total_cost.kinovi_credits;
        assert_eq!(base, explicit);
      }

      #[test]
      fn batch_2_doubles() {
        let base = r720(5).calculate_costs().total_cost.kinovi_credits;
        let batch2 = build_request(5, None, Some(KinoviSeedance2p0BatchCount::Two)).calculate_costs().total_cost.kinovi_credits;
        assert_eq!(batch2, base * 2);
      }

      #[test]
      fn batch_4_quadruples() {
        let base = r720(5).calculate_costs().total_cost.kinovi_credits;
        let batch4 = build_request(5, None, Some(KinoviSeedance2p0BatchCount::Four)).calculate_costs().total_cost.kinovi_credits;
        assert_eq!(batch4, base * 4);
      }

      #[test]
      fn batch_multiplier_applies_to_1080p() {
        let base = r1080(5).calculate_costs().total_cost.kinovi_credits;
        let batch2 = build_request(5, Some(KinoviSeedance2p0OutputResolution::TenEightyP), Some(KinoviSeedance2p0BatchCount::Two)).calculate_costs().total_cost.kinovi_credits;
        let batch4 = build_request(5, Some(KinoviSeedance2p0OutputResolution::TenEightyP), Some(KinoviSeedance2p0BatchCount::Four)).calculate_costs().total_cost.kinovi_credits;
        assert_eq!(batch2, base * 2);
        assert_eq!(batch4, base * 4);
      }

      #[test]
      fn batch_multiplier_applies_to_480p() {
        let base = r480(5).calculate_costs().total_cost.kinovi_credits;
        let batch2 = build_request(5, Some(KinoviSeedance2p0OutputResolution::FourEightyP), Some(KinoviSeedance2p0BatchCount::Two)).calculate_costs().total_cost.kinovi_credits;
        let batch4 = build_request(5, Some(KinoviSeedance2p0OutputResolution::FourEightyP), Some(KinoviSeedance2p0BatchCount::Four)).calculate_costs().total_cost.kinovi_credits;
        assert_eq!(batch2, base * 2);
        assert_eq!(batch4, base * 4);
      }
    }

    // ── Relative pricing ──

    mod relative_tests {
      use super::*;

      #[test]
      fn cost_scales_with_duration() {
        let c3 = r720(3).calculate_costs().total_cost.kinovi_credits;
        let c10 = r720(10).calculate_costs().total_cost.kinovi_credits;
        let c15 = r720(15).calculate_costs().total_cost.kinovi_credits;
        assert!(c3 < c10);
        assert!(c10 < c15);
      }

      #[test]
      fn resolution_ordering() {
        for dur in 3..=15u8 {
          let c480 = build_request(dur, Some(KinoviSeedance2p0OutputResolution::FourEightyP), None).calculate_costs().total_cost.kinovi_credits;
          let c720 = build_request(dur, None, None).calculate_costs().total_cost.kinovi_credits;
          let c1080 = build_request(dur, Some(KinoviSeedance2p0OutputResolution::TenEightyP), None).calculate_costs().total_cost.kinovi_credits;
          assert!(c480 < c720, "480p should be cheaper than 720p at {}s", dur);
          assert!(c720 < c1080, "720p should be cheaper than 1080p at {}s", dur);
        }
      }
    }

    // ── USD cents ──

    mod calculate_costs_tests {
      use super::*;

      /// Both fields together: credits and ceil-rounded USD cents.
      /// (USD cents are always rounded UP when fractional.)
      #[test]
      fn costs_480p_5s() {
        // 15 credits/s × 5s = 75 credits; 7500/243 = 30.86 → 31¢
        let costs = r480(5).calculate_costs();
        assert_eq!(costs.total_cost.kinovi_credits, 75);
        assert_eq!(costs.total_cost.usd_cents_rounded_up, 31);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 30);
        assert!((costs.total_cost.usd_cents_fractional - (7500.0 / 243.0)).abs() < 1e-9);
        assert_eq!(costs.base_cost.kinovi_credits, 75);
        assert!(costs.video_reference_surcharge_cost.is_none());
      }

      #[test]
      fn costs_720p_5s() {
        // 40 credits/s × 5s = 200 credits; 20000/243 = 82.30 → 83¢
        let costs = r720(5).calculate_costs();
        assert_eq!(costs.total_cost.kinovi_credits, 200);
        assert_eq!(costs.total_cost.usd_cents_rounded_up, 83);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 82);
        assert!((costs.total_cost.usd_cents_fractional - (20000.0 / 243.0)).abs() < 1e-9);
        assert_eq!(costs.base_cost.kinovi_credits, 200);
        assert!(costs.video_reference_surcharge_cost.is_none());
      }

      #[test]
      fn costs_1080p_5s() {
        // 90 credits/s × 5s = 450 credits; 45000/243 = 185.19 → rounds UP to 186¢
        let costs = r1080(5).calculate_costs();
        assert_eq!(costs.total_cost.kinovi_credits, 450);
        assert_eq!(costs.total_cost.usd_cents_rounded_up, 186);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 185);
        assert!((costs.total_cost.usd_cents_fractional - (45000.0 / 243.0)).abs() < 1e-9);
        assert_eq!(costs.base_cost.kinovi_credits, 450);
        assert!(costs.video_reference_surcharge_cost.is_none());
      }

      #[test]
      fn costs_720p_15s() {
        // 40 credits/s × 15s = 600 credits; 60000/243 = 246.91 → 247¢
        let costs = r720(15).calculate_costs();
        assert_eq!(costs.total_cost.kinovi_credits, 600);
        assert_eq!(costs.total_cost.usd_cents_rounded_up, 247);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 246);
        assert!((costs.total_cost.usd_cents_fractional - (60000.0 / 243.0)).abs() < 1e-9);
        assert_eq!(costs.base_cost.kinovi_credits, 600);
        assert!(costs.video_reference_surcharge_cost.is_none());
      }

      #[test]
      fn costs_1080p_15s() {
        // 90 credits/s × 15s = 1350 credits; 135000/243 = 555.56 → rounds UP to 556¢
        let costs = r1080(15).calculate_costs();
        assert_eq!(costs.total_cost.kinovi_credits, 1350);
        assert_eq!(costs.total_cost.usd_cents_rounded_up, 556);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 555);
        assert!((costs.total_cost.usd_cents_fractional - (135000.0 / 243.0)).abs() < 1e-9);
        assert_eq!(costs.base_cost.kinovi_credits, 1350);
        assert!(costs.video_reference_surcharge_cost.is_none());
      }

      #[test]
      fn costs_batch_4_720p_5s() {
        // 200 credits × 4 = 800 credits; 80000/243 = 329.22 → 330¢
        let costs = build_request(5, None, Some(KinoviSeedance2p0BatchCount::Four)).calculate_costs();
        assert_eq!(costs.total_cost.kinovi_credits, 800);
        assert_eq!(costs.total_cost.usd_cents_rounded_up, 330);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 329);
        assert!((costs.total_cost.usd_cents_fractional - (80000.0 / 243.0)).abs() < 1e-9);
        assert_eq!(costs.base_cost.kinovi_credits, 800);
        assert!(costs.video_reference_surcharge_cost.is_none());
      }

      /// The deprecated shims return the corresponding struct fields.
      #[test]
      #[allow(deprecated)]
      fn deprecated_methods_delegate() {
        let request = r720(5);
        let costs = request.calculate_costs();
        assert_eq!(u64::from(request.estimate_credits()), costs.total_cost.kinovi_credits);
        assert_eq!(request.estimate_cost_in_usd_cents(), costs.total_cost.usd_cents_rounded_up);
      }
    }

    // ── Video-reference surcharge ──
    //
    // Per Kinovi's pricing page, attaching a reference video adds a
    // per-output-second surcharge (480p: +4/s, 720p: +8/s, 1080p: +18/s).

    mod video_reference_surcharge_tests {
      use super::*;

      fn with_video_ref(mut request: GenerateSeedance2p0Request) -> GenerateSeedance2p0Request {
        request.reference_video_urls = Some(vec!["https://example.com/ref.mp4".to_string()]);
        request
      }

      /// The full base + surcharge table from Kinovi's pricing page
      /// ("With Video Uploads", 10 sec video ref). Asserts every field:
      /// base, surcharge, and the derived total.
      #[test]
      fn kinovi_pricing_table_with_video_reference() {
        // (request, duration, base credits, surcharge credits)
        let cases: &[(fn(u8) -> GenerateSeedance2p0Request, u8, u64, u64)] = &[
          // 480p: base + 4/s
          (r480, 4, 60, 16),
          (r480, 5, 75, 20),
          (r480, 10, 150, 40),
          (r480, 15, 225, 60),
          // 720p: base + 8/s
          (r720, 4, 160, 32),
          (r720, 5, 200, 40),
          (r720, 10, 400, 80),
          (r720, 15, 600, 120),
          // 1080p: base + 18/s
          (r1080, 4, 360, 72),
          (r1080, 5, 450, 90),
          (r1080, 10, 900, 180),
          (r1080, 15, 1350, 270),
        ];

        for (make, duration, base, surcharge) in cases {
          let costs = with_video_ref(make(*duration)).calculate_costs();
          assert_eq!(costs.base_cost.kinovi_credits, *base, "base for {duration}s");
          assert_eq!(costs.video_reference_surcharge_cost.map(|c| c.kinovi_credits), Some(*surcharge), "surcharge for {duration}s");
          assert_eq!(costs.total_cost.kinovi_credits, base + surcharge, "total for {duration}s");
        }
      }

      #[test]
      fn surcharge_includes_usd_cents() {
        // 720p 5s + video ref = 200 + 40 = 240 credits; 24000/243 = 98.77 → 99¢
        let costs = with_video_ref(r720(5)).calculate_costs();
        assert_eq!(costs.base_cost.kinovi_credits, 200);
        assert_eq!(costs.video_reference_surcharge_cost.map(|c| c.kinovi_credits), Some(40));
        assert_eq!(costs.total_cost.kinovi_credits, 240);
        assert_eq!(costs.total_cost.usd_cents_rounded_up, 99);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 98);
        assert!((costs.total_cost.usd_cents_fractional - (24000.0 / 243.0)).abs() < 1e-9);
      }

      /// The base and surcharge parts each carry their own USD conversions.
      #[test]
      fn parts_have_their_own_usd_conversions() {
        let costs = with_video_ref(r720(5)).calculate_costs();

        // Base: 200 credits; 20000/243 = 82.30.
        assert_eq!(costs.base_cost.usd_cents_rounded_up, 83);
        assert_eq!(costs.base_cost.usd_cents_rounded_down, 82);
        assert!((costs.base_cost.usd_cents_fractional - (20000.0 / 243.0)).abs() < 1e-9);

        // Surcharge: 40 credits; 4000/243 = 16.46.
        let surcharge = costs.video_reference_surcharge_cost.expect("should have surcharge");
        assert_eq!(surcharge.kinovi_credits, 40);
        assert_eq!(surcharge.usd_cents_rounded_up, 17);
        assert_eq!(surcharge.usd_cents_rounded_down, 16);
        assert!((surcharge.usd_cents_fractional - (4000.0 / 243.0)).abs() < 1e-9);
      }

      #[test]
      fn empty_video_reference_list_has_no_surcharge() {
        let mut request = r720(5);
        request.reference_video_urls = Some(vec![]);
        let costs = request.calculate_costs();
        assert_eq!(costs.total_cost.kinovi_credits, 200);
        assert!(costs.video_reference_surcharge_cost.is_none());
      }

      /// Surcharge is flat per generation regardless of how many reference
      /// videos are attached (assumption — Kinovi's page only shows one).
      #[test]
      fn multiple_video_references_charge_once() {
        let mut request = r720(5);
        request.reference_video_urls = Some(vec![
          "https://example.com/a.mp4".to_string(),
          "https://example.com/b.mp4".to_string(),
        ]);
        assert_eq!(request.calculate_costs().total_cost.kinovi_credits, 240);
      }

      /// The surcharge applies per generated video, so batches multiply it.
      #[test]
      fn batch_multiplies_surcharge() {
        let request = with_video_ref(build_request(5, None, Some(KinoviSeedance2p0BatchCount::Two)));
        // (200 base + 40 surcharge) × 2 = 480 credits
        let costs = request.calculate_costs();
        assert_eq!(costs.base_cost.kinovi_credits, 400);
        assert_eq!(costs.video_reference_surcharge_cost.map(|c| c.kinovi_credits), Some(80));
        assert_eq!(costs.total_cost.kinovi_credits, 480);
      }
    }

    // ── Aspect ratio doesn't affect cost ──

    #[test]
    fn aspect_ratio_does_not_affect_credits() {
      let baseline = r720(5).calculate_costs().total_cost.kinovi_credits;

      let ratios = [
        KinoviSeedance2p0AspectRatio::Landscape16x9,
        KinoviSeedance2p0AspectRatio::UltraWide21x9,
        KinoviSeedance2p0AspectRatio::Portrait9x16,
        KinoviSeedance2p0AspectRatio::Square1x1,
        KinoviSeedance2p0AspectRatio::Standard4x3,
        KinoviSeedance2p0AspectRatio::Portrait3x4,
      ];

      for ar in &ratios {
        let req = GenerateSeedance2p0Request {
          prompt: String::new(),
          aspect_ratio: Some(*ar),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
        };
        assert_eq!(
          req.calculate_costs().total_cost.kinovi_credits, baseline,
          "Aspect ratio {:?} should not change credits from baseline {}", ar, baseline,
        );
      }
    }
  }

  use crate::requests::prepare_file_upload::prepare_file_upload::{prepare_file_upload, PrepareFileUploadArgs};
  use crate::requests::upload_file::upload_file::{upload_file, UploadFileArgs};

  const STEAMPUNK_CLOWN_ID: &str = "char_1775176566518_sik0te";
  const MOCHI_ID: &str = "char_1775177718294_g2pitx";

  mod text_to_video {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_default() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p0(GenerateSeedance2p0Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0Request {
          prompt: "A corgi and a shiba are playing chess against one another".to_string(),
          aspect_ratio: None,
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("t2v default — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_1080p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p0(GenerateSeedance2p0Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0Request {
          prompt: "A dragon soaring over a medieval castle at sunset".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0AspectRatio::Landscape16x9),
          output_resolution: Some(KinoviSeedance2p0OutputResolution::TenEightyP),
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("t2v 1080p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  mod ultra_wide {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_21x9() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p0(GenerateSeedance2p0Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0Request {
          prompt: "A corgi is riding on the back of a sauropod dinosaur".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0AspectRatio::UltraWide21x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("t2v 21:9 — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_keyframe_21x9() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let start_frame_url = upload_test_image(&session, test_data::web::image_urls::WIDE_CORGI_SHIBA_TREASURE_OCEAN_URL).await?;

      let result = generate_seedance_2p0(GenerateSeedance2p0Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0Request {
          prompt: "The dogs sail across the ocean on a treasure ship.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0AspectRatio::UltraWide21x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: Some(start_frame_url),
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("keyframe 21:9 — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  mod keyframe {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_keyframe_start_frame() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let start_frame_url = upload_test_image(&session, test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL).await?;

      let result = generate_seedance_2p0(GenerateSeedance2p0Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0Request {
          prompt: "The corgi dog watches the lake as the sun sets.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0AspectRatio::Landscape16x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: Some(start_frame_url),
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("keyframe — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_keyframe_start_and_end_frame() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let start_frame_url = upload_test_image(&session, test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL).await?;
      let end_frame_url = upload_test_image(&session, test_data::web::image_urls::FOREST_BACKDROP_IMAGE_URL).await?;

      let result = generate_seedance_2p0(GenerateSeedance2p0Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0Request {
          prompt: "The dog walks from the lake toward the camera.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0AspectRatio::Landscape16x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: Some(start_frame_url),
          end_frame_url: Some(end_frame_url),
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("keyframe start+end — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  mod image_reference {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_image_references() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let img1 = upload_test_image(&session, test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL).await?;
      let img2 = upload_test_image(&session, test_data::web::image_urls::WHITE_HOUSE_SUNSET_IMAGE_URL).await?;

      let result = generate_seedance_2p0(GenerateSeedance2p0Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0Request {
          prompt: "The dog in @1 runs through the scenery in @2.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0AspectRatio::Landscape16x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: Some(vec![img1, img2]),
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("image ref — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  mod video_reference {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_video_reference() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;

      let result = generate_seedance_2p0(GenerateSeedance2p0Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0Request {
          prompt: "Change @video1 to a nighttime scene with moonlight.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0AspectRatio::Landscape16x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: Some(vec![
            "https://static.seedance2-pro.com/materials/20260315/1773594284659-3a46d231.mp4".to_string(),
          ]),
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("video ref — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  mod character_reference {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_single_character() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;

      let result = generate_seedance_2p0(GenerateSeedance2p0Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0Request {
          prompt: "@Steampunk Clown is juggling flaming torches in a circus tent.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0AspectRatio::Landscape16x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: Some(vec![STEAMPUNK_CLOWN_ID.to_string()]),
          use_face_blur_hack: None,
        },
      }).await?;
      println!("character ref — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_two_characters() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;

      let result = generate_seedance_2p0(GenerateSeedance2p0Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0Request {
          prompt: "@Steampunk Clown and @Mochi are playing fetch in a sunny park.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0AspectRatio::Landscape16x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: Some(vec![STEAMPUNK_CLOWN_ID.to_string(), MOCHI_ID.to_string()]),
          use_face_blur_hack: None,
        },
      }).await?;
      println!("two characters — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  fn test_session() -> AnyhowResult<Seedance2ProSession> {
    let cookies = get_test_cookies()?;
    Ok(Seedance2ProSession::from_cookies_string(cookies))
  }

  async fn upload_test_image(session: &Seedance2ProSession, image_url: &str) -> AnyhowResult<String> {
    let image_bytes = crate::test_utils::http_download::http_download_to_bytes(
      image_url,
    ).await?;

    let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
      session,
      extension: "jpg".to_string(),
      host_override: None,
    }).await?;

    let upload_result = upload_file(UploadFileArgs {
      upload_url: prepare_result.upload_url,
      file_bytes: image_bytes,
      host_override: None,
    }).await?;

    Ok(upload_result.public_url)
  }
}
