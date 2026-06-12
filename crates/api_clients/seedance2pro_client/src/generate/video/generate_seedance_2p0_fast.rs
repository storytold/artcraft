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

pub struct GenerateSeedance2p0FastArgs<'a> {
  pub request: GenerateSeedance2p0FastRequest,
  pub session: &'a Seedance2ProSession,
  pub host_override: Option<KinoviHost>,
}

// ── Request ──

#[derive(Clone, Debug)]
pub struct GenerateSeedance2p0FastRequest {
  pub prompt: String,
  pub aspect_ratio: Option<KinoviSeedance2p0FastAspectRatio>,
  pub output_resolution: Option<KinoviSeedance2p0FastOutputResolution>,
  pub duration_seconds: u8,
  pub batch_count: Option<KinoviSeedance2p0FastBatchCount>,
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
pub enum KinoviSeedance2p0FastAspectRatio {
  Landscape16x9,
  UltraWide21x9,
  Portrait9x16,
  Square1x1,
  Standard4x3,
  Portrait3x4,
}

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0FastOutputResolution {
  FourEightyP,
  SevenTwentyP,
}

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0FastBatchCount {
  One,
  Two,
  Four,
}

// ── Pricing ──
//
// Seedance 2.0 Fast credit pricing:
//
// | Resolution | Credits/sec |
// |------------|-------------|
// | 480p       |          14 |
// | 720p       |          28 |
//
// Default resolution (None) is 720p.
// Batch count multiplies the total cost.
// Credit package: 525,000 credits for $2,159.0909 (~243.16 credits/$1, rounded down to 243).

impl GenerateSeedance2p0FastRequest {
  /// Calculate the cost of this generation request, in Kinovi credits and
  /// USD cents (rounded up).
  ///
  /// Attaching reference VIDEOS adds a per-output-second surcharge (see the
  /// pricing table below). Reference images and audio are free.
  pub fn calculate_costs(&self) -> KinoviSeedanceGenerationCost {
    let credits_per_second: u64 = match self.output_resolution {
      Some(KinoviSeedance2p0FastOutputResolution::FourEightyP) => 14,
      Some(KinoviSeedance2p0FastOutputResolution::SevenTwentyP) | None => 28,
    };

    // Video-reference surcharge, billed per second of OUTPUT duration
    // (not the reference video's duration):
    //
    // | Resolution | Surcharge credits/sec |
    // |------------|-----------------------|
    // | 480p       |                     4 |
    // | 720p       |                     6 |
    //
    // NB: Assumed flat per generation regardless of how many reference
    // videos are attached (Kinovi's pricing page only shows one).
    let video_reference_surcharge_per_second: u64 = if self.has_video_reference() {
      match self.output_resolution {
        Some(KinoviSeedance2p0FastOutputResolution::FourEightyP) => 4,
        Some(KinoviSeedance2p0FastOutputResolution::SevenTwentyP) | None => 6,
      }
    } else {
      0
    };

    let batch_multiplier: u64 = match self.batch_count {
      None | Some(KinoviSeedance2p0FastBatchCount::One) => 1,
      Some(KinoviSeedance2p0FastBatchCount::Two) => 2,
      Some(KinoviSeedance2p0FastBatchCount::Four) => 4,
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

pub struct GenerateSeedance2p0FastResponse {
  pub task_id: String,
  pub order_id: String,
  pub task_ids: Option<Vec<String>>,
  pub order_ids: Option<Vec<String>>,
}

// ── Entry point ──

pub async fn generate_seedance_2p0_fast(
  args: GenerateSeedance2p0FastArgs<'_>,
) -> Result<GenerateSeedance2p0FastResponse, Seedance2ProError> {
  let req = args.request;

  let raw_request = WorkflowRunTaskRequest {
    model_type: KinoviModelTypeRaw::Seedance2Fast,
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

  Ok(GenerateSeedance2p0FastResponse {
    task_id: raw_response.task_id,
    order_id: raw_response.order_id,
    task_ids: raw_response.task_ids,
    order_ids: raw_response.order_ids,
  })
}

// ── Mapping helpers ──

fn map_aspect_ratio(ar: Option<KinoviSeedance2p0FastAspectRatio>) -> KinoviAspectRatioRaw {
  match ar {
    Some(KinoviSeedance2p0FastAspectRatio::Landscape16x9) => KinoviAspectRatioRaw::Landscape16x9,
    Some(KinoviSeedance2p0FastAspectRatio::UltraWide21x9) => KinoviAspectRatioRaw::UltraWide21x9,
    Some(KinoviSeedance2p0FastAspectRatio::Portrait9x16) => KinoviAspectRatioRaw::Portrait9x16,
    Some(KinoviSeedance2p0FastAspectRatio::Square1x1) => KinoviAspectRatioRaw::Square1x1,
    Some(KinoviSeedance2p0FastAspectRatio::Standard4x3) => KinoviAspectRatioRaw::Landscape4x3,
    Some(KinoviSeedance2p0FastAspectRatio::Portrait3x4) => KinoviAspectRatioRaw::Portrait3x4,
    None => KinoviAspectRatioRaw::Landscape16x9,
  }
}

fn map_output_resolution(res: KinoviSeedance2p0FastOutputResolution) -> KinoviOutputResolutionRaw {
  match res {
    KinoviSeedance2p0FastOutputResolution::FourEightyP => KinoviOutputResolutionRaw::FourEightyP,
    KinoviSeedance2p0FastOutputResolution::SevenTwentyP => KinoviOutputResolutionRaw::SevenTwentyP,
  }
}

fn map_batch_count(bc: Option<KinoviSeedance2p0FastBatchCount>) -> KinoviBatchCountRaw {
  match bc {
    Some(KinoviSeedance2p0FastBatchCount::One) | None => KinoviBatchCountRaw::One,
    Some(KinoviSeedance2p0FastBatchCount::Two) => KinoviBatchCountRaw::Two,
    Some(KinoviSeedance2p0FastBatchCount::Four) => KinoviBatchCountRaw::Four,
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
      output_resolution: Option<KinoviSeedance2p0FastOutputResolution>,
      batch_count: Option<KinoviSeedance2p0FastBatchCount>,
    ) -> GenerateSeedance2p0FastRequest {
      GenerateSeedance2p0FastRequest {
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

    fn r480(dur: u8) -> GenerateSeedance2p0FastRequest {
      build_request(dur, Some(KinoviSeedance2p0FastOutputResolution::FourEightyP), None)
    }

    fn r720(dur: u8) -> GenerateSeedance2p0FastRequest {
      build_request(dur, None, None)
    }

    // ── Comprehensive per-resolution coverage ──
    //
    // Seedance 2.0 Fast: 480p 14/s (+4/s video ref), 720p 28/s (+6/s). No 1080p.
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

          // Base: 14 credits/s × 5s = 70 credits; 7000/243 = 28.8066.
          assert_eq!(costs.base_cost.kinovi_credits, 70);
          assert_eq!(costs.base_cost.usd_cents_rounded_up, 29);
          assert_eq!(costs.base_cost.usd_cents_rounded_down, 28);
          assert!((costs.base_cost.usd_cents_fractional - (7000.0 / 243.0)).abs() < FLOAT_TOLERANCE);

          // No reference video: no surcharge, and the total equals the base.
          assert!(costs.video_reference_surcharge_cost.is_none());

          assert_eq!(costs.total_cost.kinovi_credits, 70);
          assert_eq!(costs.total_cost.usd_cents_rounded_up, 29);
          assert_eq!(costs.total_cost.usd_cents_rounded_down, 28);
          assert!((costs.total_cost.usd_cents_fractional - (7000.0 / 243.0)).abs() < FLOAT_TOLERANCE);
        }

        #[test]
        fn test_with_reference_video() {
          let mut request = r480(5);
          request.reference_video_urls = Some(vec!["https://example.com/ref.mp4".to_string()]);
          let costs = request.calculate_costs();

          // Base: 14 credits/s × 5s = 70 credits; 7000/243 = 28.8066.
          assert_eq!(costs.base_cost.kinovi_credits, 70);
          assert_eq!(costs.base_cost.usd_cents_rounded_up, 29);
          assert_eq!(costs.base_cost.usd_cents_rounded_down, 28);
          assert!((costs.base_cost.usd_cents_fractional - (7000.0 / 243.0)).abs() < FLOAT_TOLERANCE);

          // Surcharge: 4 credits/s × 5s = 20 credits; 2000/243 = 8.2305.
          let surcharge = costs.video_reference_surcharge_cost.expect("should have surcharge");
          assert_eq!(surcharge.kinovi_credits, 20);
          assert_eq!(surcharge.usd_cents_rounded_up, 9);
          assert_eq!(surcharge.usd_cents_rounded_down, 8);
          assert!((surcharge.usd_cents_fractional - (2000.0 / 243.0)).abs() < FLOAT_TOLERANCE);

          // Total: 70 + 20 = 90 credits; 9000/243 = 37.0370.
          assert_eq!(costs.total_cost.kinovi_credits, 90);
          assert_eq!(costs.total_cost.usd_cents_rounded_up, 38);
          assert_eq!(costs.total_cost.usd_cents_rounded_down, 37);
          assert!((costs.total_cost.usd_cents_fractional - (9000.0 / 243.0)).abs() < FLOAT_TOLERANCE);
        }
      }


      mod resolution_720p {
        use super::*;

        #[test]
        fn test_without_reference_video() {
          let costs = r720(5).calculate_costs();

          // Base: 28 credits/s × 5s = 140 credits; 14000/243 = 57.6132.
          assert_eq!(costs.base_cost.kinovi_credits, 140);
          assert_eq!(costs.base_cost.usd_cents_rounded_up, 58);
          assert_eq!(costs.base_cost.usd_cents_rounded_down, 57);
          assert!((costs.base_cost.usd_cents_fractional - (14000.0 / 243.0)).abs() < FLOAT_TOLERANCE);

          // No reference video: no surcharge, and the total equals the base.
          assert!(costs.video_reference_surcharge_cost.is_none());

          assert_eq!(costs.total_cost.kinovi_credits, 140);
          assert_eq!(costs.total_cost.usd_cents_rounded_up, 58);
          assert_eq!(costs.total_cost.usd_cents_rounded_down, 57);
          assert!((costs.total_cost.usd_cents_fractional - (14000.0 / 243.0)).abs() < FLOAT_TOLERANCE);
        }

        #[test]
        fn test_with_reference_video() {
          let mut request = r720(5);
          request.reference_video_urls = Some(vec!["https://example.com/ref.mp4".to_string()]);
          let costs = request.calculate_costs();

          // Base: 28 credits/s × 5s = 140 credits; 14000/243 = 57.6132.
          assert_eq!(costs.base_cost.kinovi_credits, 140);
          assert_eq!(costs.base_cost.usd_cents_rounded_up, 58);
          assert_eq!(costs.base_cost.usd_cents_rounded_down, 57);
          assert!((costs.base_cost.usd_cents_fractional - (14000.0 / 243.0)).abs() < FLOAT_TOLERANCE);

          // Surcharge: 6 credits/s × 5s = 30 credits; 3000/243 = 12.3457.
          let surcharge = costs.video_reference_surcharge_cost.expect("should have surcharge");
          assert_eq!(surcharge.kinovi_credits, 30);
          assert_eq!(surcharge.usd_cents_rounded_up, 13);
          assert_eq!(surcharge.usd_cents_rounded_down, 12);
          assert!((surcharge.usd_cents_fractional - (3000.0 / 243.0)).abs() < FLOAT_TOLERANCE);

          // Total: 140 + 30 = 170 credits; 17000/243 = 69.9588.
          assert_eq!(costs.total_cost.kinovi_credits, 170);
          assert_eq!(costs.total_cost.usd_cents_rounded_up, 70);
          assert_eq!(costs.total_cost.usd_cents_rounded_down, 69);
          assert!((costs.total_cost.usd_cents_fractional - (17000.0 / 243.0)).abs() < FLOAT_TOLERANCE);
        }
      }

    }

    // ── 480p credits (14 credits/sec) ──

    mod credits_480p {
      use super::*;

      #[test]
      fn every_duration() {
        assert_eq!(r480(3).calculate_costs().total_cost.kinovi_credits, 42);
        assert_eq!(r480(4).calculate_costs().total_cost.kinovi_credits, 56);
        assert_eq!(r480(5).calculate_costs().total_cost.kinovi_credits, 70);
        assert_eq!(r480(6).calculate_costs().total_cost.kinovi_credits, 84);
        assert_eq!(r480(7).calculate_costs().total_cost.kinovi_credits, 98);
        assert_eq!(r480(8).calculate_costs().total_cost.kinovi_credits, 112);
        assert_eq!(r480(9).calculate_costs().total_cost.kinovi_credits, 126);
        assert_eq!(r480(10).calculate_costs().total_cost.kinovi_credits, 140);
        assert_eq!(r480(11).calculate_costs().total_cost.kinovi_credits, 154);
        assert_eq!(r480(12).calculate_costs().total_cost.kinovi_credits, 168);
        assert_eq!(r480(13).calculate_costs().total_cost.kinovi_credits, 182);
        assert_eq!(r480(14).calculate_costs().total_cost.kinovi_credits, 196);
        assert_eq!(r480(15).calculate_costs().total_cost.kinovi_credits, 210);
      }
    }

    // ── 720p credits (28 credits/sec) ──

    mod credits_720p {
      use super::*;

      #[test]
      fn every_duration() {
        assert_eq!(r720(3).calculate_costs().total_cost.kinovi_credits, 84);
        assert_eq!(r720(4).calculate_costs().total_cost.kinovi_credits, 112);
        assert_eq!(r720(5).calculate_costs().total_cost.kinovi_credits, 140);
        assert_eq!(r720(6).calculate_costs().total_cost.kinovi_credits, 168);
        assert_eq!(r720(7).calculate_costs().total_cost.kinovi_credits, 196);
        assert_eq!(r720(8).calculate_costs().total_cost.kinovi_credits, 224);
        assert_eq!(r720(9).calculate_costs().total_cost.kinovi_credits, 252);
        assert_eq!(r720(10).calculate_costs().total_cost.kinovi_credits, 280);
        assert_eq!(r720(11).calculate_costs().total_cost.kinovi_credits, 308);
        assert_eq!(r720(12).calculate_costs().total_cost.kinovi_credits, 336);
        assert_eq!(r720(13).calculate_costs().total_cost.kinovi_credits, 364);
        assert_eq!(r720(14).calculate_costs().total_cost.kinovi_credits, 392);
        assert_eq!(r720(15).calculate_costs().total_cost.kinovi_credits, 420);
      }

      #[test]
      fn explicit_720p_same_as_default() {
        let default = r720(5).calculate_costs().total_cost.kinovi_credits;
        let explicit = build_request(5, Some(KinoviSeedance2p0FastOutputResolution::SevenTwentyP), None).calculate_costs().total_cost.kinovi_credits;
        assert_eq!(default, explicit);
      }
    }

    // ── Batch multiplier ──

    mod batch_tests {
      use super::*;

      #[test]
      fn batch_1_is_base() {
        let base = r720(5).calculate_costs().total_cost.kinovi_credits;
        let explicit = build_request(5, None, Some(KinoviSeedance2p0FastBatchCount::One)).calculate_costs().total_cost.kinovi_credits;
        assert_eq!(base, explicit);
      }

      #[test]
      fn batch_2_doubles() {
        let base = r720(5).calculate_costs().total_cost.kinovi_credits;
        let batch2 = build_request(5, None, Some(KinoviSeedance2p0FastBatchCount::Two)).calculate_costs().total_cost.kinovi_credits;
        assert_eq!(batch2, base * 2);
      }

      #[test]
      fn batch_4_quadruples() {
        let base = r720(5).calculate_costs().total_cost.kinovi_credits;
        let batch4 = build_request(5, None, Some(KinoviSeedance2p0FastBatchCount::Four)).calculate_costs().total_cost.kinovi_credits;
        assert_eq!(batch4, base * 4);
      }

      #[test]
      fn batch_multiplier_applies_to_480p() {
        let base = r480(5).calculate_costs().total_cost.kinovi_credits;
        let batch2 = build_request(5, Some(KinoviSeedance2p0FastOutputResolution::FourEightyP), Some(KinoviSeedance2p0FastBatchCount::Two)).calculate_costs().total_cost.kinovi_credits;
        let batch4 = build_request(5, Some(KinoviSeedance2p0FastOutputResolution::FourEightyP), Some(KinoviSeedance2p0FastBatchCount::Four)).calculate_costs().total_cost.kinovi_credits;
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
          let c480 = build_request(dur, Some(KinoviSeedance2p0FastOutputResolution::FourEightyP), None).calculate_costs().total_cost.kinovi_credits;
          let c720 = build_request(dur, None, None).calculate_costs().total_cost.kinovi_credits;
          assert!(c480 < c720, "480p should be cheaper than 720p at {}s", dur);
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
        // 14 credits/s × 5s = 70 credits; 7000/243 = 28.81 → rounds UP to 29¢
        let costs = r480(5).calculate_costs();
        assert_eq!(costs.total_cost.kinovi_credits, 70);
        assert_eq!(costs.total_cost.usd_cents_rounded_up, 29);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 28);
        assert!((costs.total_cost.usd_cents_fractional - (7000.0 / 243.0)).abs() < 1e-9);
        assert_eq!(costs.base_cost.kinovi_credits, 70);
        assert!(costs.video_reference_surcharge_cost.is_none());
      }

      #[test]
      fn costs_720p_5s() {
        // 28 credits/s × 5s = 140 credits; 14000/243 = 57.61 → 58¢
        let costs = r720(5).calculate_costs();
        assert_eq!(costs.total_cost.kinovi_credits, 140);
        assert_eq!(costs.total_cost.usd_cents_rounded_up, 58);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 57);
        assert!((costs.total_cost.usd_cents_fractional - (14000.0 / 243.0)).abs() < 1e-9);
        assert_eq!(costs.base_cost.kinovi_credits, 140);
        assert!(costs.video_reference_surcharge_cost.is_none());
      }

      #[test]
      fn costs_720p_15s() {
        // 28 credits/s × 15s = 420 credits; 42000/243 = 172.84 → 173¢
        let costs = r720(15).calculate_costs();
        assert_eq!(costs.total_cost.kinovi_credits, 420);
        assert_eq!(costs.total_cost.usd_cents_rounded_up, 173);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 172);
        assert!((costs.total_cost.usd_cents_fractional - (42000.0 / 243.0)).abs() < 1e-9);
        assert_eq!(costs.base_cost.kinovi_credits, 420);
        assert!(costs.video_reference_surcharge_cost.is_none());
      }

      #[test]
      fn costs_480p_15s() {
        // 14 credits/s × 15s = 210 credits; 21000/243 = 86.42 → 87¢
        let costs = r480(15).calculate_costs();
        assert_eq!(costs.total_cost.kinovi_credits, 210);
        assert_eq!(costs.total_cost.usd_cents_rounded_up, 87);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 86);
        assert!((costs.total_cost.usd_cents_fractional - (21000.0 / 243.0)).abs() < 1e-9);
        assert_eq!(costs.base_cost.kinovi_credits, 210);
        assert!(costs.video_reference_surcharge_cost.is_none());
      }

      #[test]
      fn costs_batch_2_720p_5s() {
        // 140 credits × 2 = 280 credits; 28000/243 = 115.23 → 116¢
        let costs = build_request(5, None, Some(KinoviSeedance2p0FastBatchCount::Two)).calculate_costs();
        assert_eq!(costs.total_cost.kinovi_credits, 280);
        assert_eq!(costs.total_cost.usd_cents_rounded_up, 116);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 115);
        assert!((costs.total_cost.usd_cents_fractional - (28000.0 / 243.0)).abs() < 1e-9);
        assert_eq!(costs.base_cost.kinovi_credits, 280);
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
    // Per Kinovi's pricing page ("Seedance 2.0 Fast With Video Ref"),
    // attaching a reference video adds a per-output-second surcharge
    // (480p: +4/s, 720p: +6/s).

    mod video_reference_surcharge_tests {
      use super::*;

      fn with_video_ref(mut request: GenerateSeedance2p0FastRequest) -> GenerateSeedance2p0FastRequest {
        request.reference_video_urls = Some(vec!["https://example.com/ref.mp4".to_string()]);
        request
      }

      /// The full base + surcharge table from Kinovi's pricing page
      /// ("Seedance 2.0 Fast With Video Ref", 10 sec video ref). Asserts
      /// every field: base, surcharge, and the derived total.
      #[test]
      fn kinovi_pricing_table_with_video_reference() {
        // (request, duration, base credits, surcharge credits)
        let cases: &[(fn(u8) -> GenerateSeedance2p0FastRequest, u8, u64, u64)] = &[
          // 480p: base + 4/s
          (r480, 4, 56, 16),
          (r480, 5, 70, 20),
          (r480, 10, 140, 40),
          (r480, 15, 210, 60),
          // 720p: base + 6/s
          (r720, 4, 112, 24),
          (r720, 5, 140, 30),
          (r720, 10, 280, 60),
          (r720, 15, 420, 90),
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
        // 720p 5s + video ref = 140 + 30 = 170 credits; 17000/243 = 69.96 → 70¢
        let costs = with_video_ref(r720(5)).calculate_costs();
        assert_eq!(costs.base_cost.kinovi_credits, 140);
        assert_eq!(costs.video_reference_surcharge_cost.map(|c| c.kinovi_credits), Some(30));
        assert_eq!(costs.total_cost.kinovi_credits, 170);
        assert_eq!(costs.total_cost.usd_cents_rounded_up, 70);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 69);
        assert!((costs.total_cost.usd_cents_fractional - (17000.0 / 243.0)).abs() < 1e-9);
      }

      /// The base and surcharge parts each carry their own USD conversions.
      #[test]
      fn parts_have_their_own_usd_conversions() {
        let costs = with_video_ref(r720(5)).calculate_costs();

        // Base: 140 credits; 14000/243 = 57.61.
        assert_eq!(costs.base_cost.usd_cents_rounded_up, 58);
        assert_eq!(costs.base_cost.usd_cents_rounded_down, 57);
        assert!((costs.base_cost.usd_cents_fractional - (14000.0 / 243.0)).abs() < 1e-9);

        // Surcharge: 30 credits; 3000/243 = 12.35.
        let surcharge = costs.video_reference_surcharge_cost.expect("should have surcharge");
        assert_eq!(surcharge.kinovi_credits, 30);
        assert_eq!(surcharge.usd_cents_rounded_up, 13);
        assert_eq!(surcharge.usd_cents_rounded_down, 12);
        assert!((surcharge.usd_cents_fractional - (3000.0 / 243.0)).abs() < 1e-9);
      }

      #[test]
      fn empty_video_reference_list_has_no_surcharge() {
        let mut request = r720(5);
        request.reference_video_urls = Some(vec![]);
        let costs = request.calculate_costs();
        assert_eq!(costs.total_cost.kinovi_credits, 140);
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
        assert_eq!(request.calculate_costs().total_cost.kinovi_credits, 170);
      }

      /// The surcharge applies per generated video, so batches multiply it.
      #[test]
      fn batch_multiplies_surcharge() {
        let request = with_video_ref(build_request(5, None, Some(KinoviSeedance2p0FastBatchCount::Two)));
        // (140 base + 30 surcharge) × 2 = 340 credits
        let costs = request.calculate_costs();
        assert_eq!(costs.base_cost.kinovi_credits, 280);
        assert_eq!(costs.video_reference_surcharge_cost.map(|c| c.kinovi_credits), Some(60));
        assert_eq!(costs.total_cost.kinovi_credits, 340);
      }
    }

    // ── Aspect ratio doesn't affect cost ──

    #[test]
    fn aspect_ratio_does_not_affect_credits() {
      let baseline = r720(5).calculate_costs().total_cost.kinovi_credits;

      let ratios = [
        KinoviSeedance2p0FastAspectRatio::Landscape16x9,
        KinoviSeedance2p0FastAspectRatio::UltraWide21x9,
        KinoviSeedance2p0FastAspectRatio::Portrait9x16,
        KinoviSeedance2p0FastAspectRatio::Square1x1,
        KinoviSeedance2p0FastAspectRatio::Standard4x3,
        KinoviSeedance2p0FastAspectRatio::Portrait3x4,
      ];

      for ar in &ratios {
        let req = GenerateSeedance2p0FastRequest {
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
      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
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
      println!("t2v fast default — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_480p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
          prompt: "A golden retriever running through a field of sunflowers".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0FastAspectRatio::Landscape16x9),
          output_resolution: Some(KinoviSeedance2p0FastOutputResolution::FourEightyP),
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
      println!("t2v fast 480p — task_id={}, order_id={}", result.task_id, result.order_id);
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
      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
          prompt: "A shiba is riding on the back of a sauropod dinosaur".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0FastAspectRatio::UltraWide21x9),
          output_resolution: Some(KinoviSeedance2p0FastOutputResolution::FourEightyP),
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
      println!("fast t2v 21:9 480p — task_id={}, order_id={}", result.task_id, result.order_id);
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

      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
          prompt: "The dogs in @1 set sail across the ocean on a treasure ship.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0FastAspectRatio::UltraWide21x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: Some(vec![start_frame_url]),
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("fast keyframe 21:9 — task_id={}, order_id={}", result.task_id, result.order_id);
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

      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
          prompt: "A corgi dog runs along the lake shore, splashing water.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0FastAspectRatio::Landscape16x9),
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
      println!("fast keyframe — task_id={}, order_id={}", result.task_id, result.order_id);
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
      let img1 = upload_test_image(&session, test_data::web::image_urls::FOREST_BACKDROP_IMAGE_URL).await?;
      let img2 = upload_test_image(&session, test_data::web::image_urls::WHITE_HOUSE_SUNSET_IMAGE_URL).await?;

      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
          prompt: "The dog in @1 runs through the scenery in @2. Golden hour.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0FastAspectRatio::Landscape16x9),
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
      println!("fast image ref — task_id={}, order_id={}", result.task_id, result.order_id);
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

      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
          prompt: "Change @video1 to night time.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0FastAspectRatio::Landscape16x9),
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
      println!("fast video ref — task_id={}, order_id={}", result.task_id, result.order_id);
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

      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
          prompt: "@Mochi the shiba inu is eating a cheese pizza on the table.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0FastAspectRatio::Portrait9x16),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: Some(vec![MOCHI_ID.to_string()]),
          use_face_blur_hack: None,
        },
      }).await?;
      println!("fast character — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_two_characters() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;

      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
          prompt: "@Steampunk Clown and @Mochi are playing fetch in a sunny park.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0FastAspectRatio::Landscape16x9),
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
      println!("fast two characters — task_id={}, order_id={}", result.task_id, result.order_id);
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
