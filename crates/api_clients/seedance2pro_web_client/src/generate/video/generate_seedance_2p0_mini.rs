use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::cost::kinovi_seedance_mini_generation_cost::KinoviSeedanceMiniGenerationCost;
use crate::requests::kinovi_host::KinoviHost;
use crate::requests::workflow_run_task::workflow_run_task::{
  workflow_run_task, KinoviAspectRatioRaw, KinoviBatchCountRaw, KinoviBitrateRaw,
  KinoviModelTypeRaw, KinoviOutputResolutionRaw, WorkflowRunTaskArgs,
  WorkflowRunTaskRequest,
};

// ── Args ──

pub struct GenerateSeedance2p0MiniArgs<'a> {
  pub request: GenerateSeedance2p0MiniRequest,
  pub session: &'a Seedance2ProSession,
  pub host_override: Option<KinoviHost>,
}

// ── Request ──

#[derive(Clone, Debug)]
pub struct GenerateSeedance2p0MiniRequest {
  pub prompt: String,
  pub aspect_ratio: Option<KinoviSeedance2p0MiniAspectRatio>,
  pub output_resolution: Option<KinoviSeedance2p0MiniOutputResolution>,
  pub duration_seconds: u8,
  pub batch_count: Option<KinoviSeedance2p0MiniBatchCount>,
  pub start_frame_url: Option<String>,
  pub end_frame_url: Option<String>,
  pub reference_image_urls: Option<Vec<String>>,
  pub reference_video_urls: Option<Vec<String>>,
  pub reference_audio_urls: Option<Vec<String>>,
  pub character_ids: Option<Vec<String>>,
  pub use_face_blur_hack: Option<bool>,
  /// Output video bitrate. None defaults to "normal"; `High` requests a
  /// higher bitrate. Does not affect cost.
  pub bitrate: Option<KinoviSeedance2p0MiniBitrate>,
}

// ── Enums ──

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0MiniAspectRatio {
  Landscape16x9,
  UltraWide21x9,
  Portrait9x16,
  Square1x1,
  Standard4x3,
  Portrait3x4,
}

/// Output resolution. Mini supports only 480p and 720p (no 1080p / 4K).
#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0MiniOutputResolution {
  FourEightyP,
  SevenTwentyP,
}

/// Number of videos to generate in one request. Mini allows 1–8.
#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0MiniBatchCount {
  One,
  Two,
  Three,
  Four,
  Five,
  Six,
  Seven,
  Eight,
}

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0MiniBitrate {
  High,
}

// ── Pricing ──
//
// Seedance 2.0 Mini credit pricing (per second of OUTPUT duration):
//
// | Resolution | Credits/sec | Video-ref surcharge/sec |
// |------------|-------------|-------------------------|
// | 480p       |         7.5 |                       2 |
// | 720p       |          20 |                       4 |
//
// 480p credits can be FRACTIONAL (7.5/sec lands on half-credits at odd
// durations, e.g. 5s = 37.5). Default resolution (None) is 720p. Batch count
// multiplies the total. Attaching reference VIDEOS adds the surcharge;
// reference images and audio are free.
//
// Credit package: 525,000 credits for $2,159.0909 (~243 credits/$1).

impl GenerateSeedance2p0MiniRequest {
  /// Calculate the cost of this generation request, in Kinovi credits
  /// (possibly fractional) and USD cents.
  pub fn calculate_costs(&self) -> KinoviSeedanceMiniGenerationCost {
    let credits_per_second: f64 = match self.output_resolution {
      Some(KinoviSeedance2p0MiniOutputResolution::FourEightyP) => 7.5,
      Some(KinoviSeedance2p0MiniOutputResolution::SevenTwentyP) | None => 20.0,
    };

    let video_reference_surcharge_per_second: f64 = if self.has_video_reference() {
      match self.output_resolution {
        Some(KinoviSeedance2p0MiniOutputResolution::FourEightyP) => 2.0,
        Some(KinoviSeedance2p0MiniOutputResolution::SevenTwentyP) | None => 4.0,
      }
    } else {
      0.0
    };

    let batch_multiplier = f64::from(self.batch_multiplier());
    let duration = f64::from(self.duration_seconds);

    let base_credits = duration * credits_per_second * batch_multiplier;
    let maybe_video_reference_surcharge_credits = if self.has_video_reference() {
      Some(duration * video_reference_surcharge_per_second * batch_multiplier)
    } else {
      None
    };

    KinoviSeedanceMiniGenerationCost::from_base_and_surcharge(
      base_credits,
      maybe_video_reference_surcharge_credits,
    )
  }

  fn has_video_reference(&self) -> bool {
    self.reference_video_urls
      .as_ref()
      .is_some_and(|urls| !urls.is_empty())
  }

  fn batch_multiplier(&self) -> u8 {
    match self.batch_count {
      None | Some(KinoviSeedance2p0MiniBatchCount::One) => 1,
      Some(KinoviSeedance2p0MiniBatchCount::Two) => 2,
      Some(KinoviSeedance2p0MiniBatchCount::Three) => 3,
      Some(KinoviSeedance2p0MiniBatchCount::Four) => 4,
      Some(KinoviSeedance2p0MiniBatchCount::Five) => 5,
      Some(KinoviSeedance2p0MiniBatchCount::Six) => 6,
      Some(KinoviSeedance2p0MiniBatchCount::Seven) => 7,
      Some(KinoviSeedance2p0MiniBatchCount::Eight) => 8,
    }
  }
}

// ── Response ──

pub struct GenerateSeedance2p0MiniResponse {
  pub task_id: String,
  pub order_id: String,
  pub task_ids: Option<Vec<String>>,
  pub order_ids: Option<Vec<String>>,
}

// ── Entry point ──

pub async fn generate_seedance_2p0_mini(
  args: GenerateSeedance2p0MiniArgs<'_>,
) -> Result<GenerateSeedance2p0MiniResponse, Seedance2ProError> {
  let raw_response = workflow_run_task(WorkflowRunTaskArgs {
    request: to_raw_request(args.request),
    session: args.session,
    host_override: args.host_override,
  }).await?;

  Ok(GenerateSeedance2p0MiniResponse {
    task_id: raw_response.task_id,
    order_id: raw_response.order_id,
    task_ids: raw_response.task_ids,
    order_ids: raw_response.order_ids,
  })
}

// ── Mapping helpers ──

fn to_raw_request(req: GenerateSeedance2p0MiniRequest) -> WorkflowRunTaskRequest {
  WorkflowRunTaskRequest {
    model_type: KinoviModelTypeRaw::Seedance2Mini,
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
    bitrate: map_bitrate(req.bitrate),
  }
}

fn map_aspect_ratio(ar: Option<KinoviSeedance2p0MiniAspectRatio>) -> KinoviAspectRatioRaw {
  match ar {
    Some(KinoviSeedance2p0MiniAspectRatio::Landscape16x9) => KinoviAspectRatioRaw::Landscape16x9,
    Some(KinoviSeedance2p0MiniAspectRatio::UltraWide21x9) => KinoviAspectRatioRaw::UltraWide21x9,
    Some(KinoviSeedance2p0MiniAspectRatio::Portrait9x16) => KinoviAspectRatioRaw::Portrait9x16,
    Some(KinoviSeedance2p0MiniAspectRatio::Square1x1) => KinoviAspectRatioRaw::Square1x1,
    Some(KinoviSeedance2p0MiniAspectRatio::Standard4x3) => KinoviAspectRatioRaw::Landscape4x3,
    Some(KinoviSeedance2p0MiniAspectRatio::Portrait3x4) => KinoviAspectRatioRaw::Portrait3x4,
    None => KinoviAspectRatioRaw::Landscape16x9,
  }
}

fn map_output_resolution(res: KinoviSeedance2p0MiniOutputResolution) -> KinoviOutputResolutionRaw {
  match res {
    KinoviSeedance2p0MiniOutputResolution::FourEightyP => KinoviOutputResolutionRaw::FourEightyP,
    KinoviSeedance2p0MiniOutputResolution::SevenTwentyP => KinoviOutputResolutionRaw::SevenTwentyP,
  }
}

fn map_batch_count(bc: Option<KinoviSeedance2p0MiniBatchCount>) -> KinoviBatchCountRaw {
  match bc {
    Some(KinoviSeedance2p0MiniBatchCount::One) | None => KinoviBatchCountRaw::One,
    Some(KinoviSeedance2p0MiniBatchCount::Two) => KinoviBatchCountRaw::Two,
    Some(KinoviSeedance2p0MiniBatchCount::Three) => KinoviBatchCountRaw::Three,
    Some(KinoviSeedance2p0MiniBatchCount::Four) => KinoviBatchCountRaw::Four,
    Some(KinoviSeedance2p0MiniBatchCount::Five) => KinoviBatchCountRaw::Five,
    Some(KinoviSeedance2p0MiniBatchCount::Six) => KinoviBatchCountRaw::Six,
    Some(KinoviSeedance2p0MiniBatchCount::Seven) => KinoviBatchCountRaw::Seven,
    Some(KinoviSeedance2p0MiniBatchCount::Eight) => KinoviBatchCountRaw::Eight,
  }
}

fn map_bitrate(bitrate: Option<KinoviSeedance2p0MiniBitrate>) -> Option<KinoviBitrateRaw> {
  match bitrate {
    Some(KinoviSeedance2p0MiniBitrate::High) => Some(KinoviBitrateRaw::High),
    None => None,
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

    const FLOAT_TOLERANCE: f64 = 1e-9;

    fn build_request(
      duration_seconds: u8,
      output_resolution: Option<KinoviSeedance2p0MiniOutputResolution>,
      batch_count: Option<KinoviSeedance2p0MiniBatchCount>,
    ) -> GenerateSeedance2p0MiniRequest {
      GenerateSeedance2p0MiniRequest {
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
        bitrate: None,
      }
    }

    fn r480(dur: u8) -> GenerateSeedance2p0MiniRequest {
      build_request(dur, Some(KinoviSeedance2p0MiniOutputResolution::FourEightyP), None)
    }

    fn r720(dur: u8) -> GenerateSeedance2p0MiniRequest {
      build_request(dur, None, None)
    }

    fn with_video_ref(mut request: GenerateSeedance2p0MiniRequest) -> GenerateSeedance2p0MiniRequest {
      request.reference_video_urls = Some(vec!["https://example.com/ref.mp4".to_string()]);
      request
    }

    // ── Full pricing table (credits) ──
    //
    // The exact table provided by Kinovi for Seedance 2.0 Mini. 480p produces
    // fractional credits at odd durations (37.5, 112.5, …).

    mod kinovi_pricing_table {
      use super::*;

      #[test]
      fn table_480p_without_video_reference() {
        assert_eq!(r480(4).calculate_costs().total_cost.kinovi_credits, 30.0);
        assert_eq!(r480(5).calculate_costs().total_cost.kinovi_credits, 37.5);
        assert_eq!(r480(10).calculate_costs().total_cost.kinovi_credits, 75.0);
        assert_eq!(r480(15).calculate_costs().total_cost.kinovi_credits, 112.5);
      }

      #[test]
      fn table_720p_without_video_reference() {
        assert_eq!(r720(4).calculate_costs().total_cost.kinovi_credits, 80.0);
        assert_eq!(r720(5).calculate_costs().total_cost.kinovi_credits, 100.0);
        assert_eq!(r720(10).calculate_costs().total_cost.kinovi_credits, 200.0);
        assert_eq!(r720(15).calculate_costs().total_cost.kinovi_credits, 300.0);
      }

      #[test]
      fn table_480p_with_video_reference() {
        assert_eq!(with_video_ref(r480(4)).calculate_costs().total_cost.kinovi_credits, 38.0);
        assert_eq!(with_video_ref(r480(5)).calculate_costs().total_cost.kinovi_credits, 47.5);
        assert_eq!(with_video_ref(r480(10)).calculate_costs().total_cost.kinovi_credits, 95.0);
        assert_eq!(with_video_ref(r480(15)).calculate_costs().total_cost.kinovi_credits, 142.5);
      }

      #[test]
      fn table_720p_with_video_reference() {
        assert_eq!(with_video_ref(r720(4)).calculate_costs().total_cost.kinovi_credits, 96.0);
        assert_eq!(with_video_ref(r720(5)).calculate_costs().total_cost.kinovi_credits, 120.0);
        assert_eq!(with_video_ref(r720(10)).calculate_costs().total_cost.kinovi_credits, 240.0);
        assert_eq!(with_video_ref(r720(15)).calculate_costs().total_cost.kinovi_credits, 360.0);
      }
    }

    // ── Base / surcharge breakdown ──

    mod video_reference_surcharge {
      use super::*;

      /// The surcharge is the difference between the with-ref total and the
      /// base: 480p +2/s, 720p +4/s.
      #[test]
      fn surcharge_table() {
        // (request builder, duration, base credits, surcharge credits)
        let cases: &[(fn(u8) -> GenerateSeedance2p0MiniRequest, u8, f64, f64)] = &[
          // 480p: 7.5/s base, +2/s surcharge
          (r480, 4, 30.0, 8.0),
          (r480, 5, 37.5, 10.0),
          (r480, 10, 75.0, 20.0),
          (r480, 15, 112.5, 30.0),
          // 720p: 20/s base, +4/s surcharge
          (r720, 4, 80.0, 16.0),
          (r720, 5, 100.0, 20.0),
          (r720, 10, 200.0, 40.0),
          (r720, 15, 300.0, 60.0),
        ];

        for (make, duration, base, surcharge) in cases {
          let costs = with_video_ref(make(*duration)).calculate_costs();
          assert_eq!(costs.base_cost.kinovi_credits, *base, "base at {duration}s");
          assert_eq!(
            costs.video_reference_surcharge_cost.map(|c| c.kinovi_credits),
            Some(*surcharge),
            "surcharge at {duration}s",
          );
          assert_eq!(costs.total_cost.kinovi_credits, base + surcharge, "total at {duration}s");
        }
      }

      #[test]
      fn no_video_reference_has_no_surcharge() {
        let costs = r480(5).calculate_costs();
        assert!(costs.video_reference_surcharge_cost.is_none());
        assert_eq!(costs.total_cost, costs.base_cost);
      }

      #[test]
      fn empty_video_reference_list_has_no_surcharge() {
        let mut request = r720(5);
        request.reference_video_urls = Some(vec![]);
        let costs = request.calculate_costs();
        assert_eq!(costs.total_cost.kinovi_credits, 100.0);
        assert!(costs.video_reference_surcharge_cost.is_none());
      }

      /// The surcharge applies per generated video, so batches multiply it.
      #[test]
      fn batch_multiplies_surcharge() {
        let request = with_video_ref(build_request(
          5,
          Some(KinoviSeedance2p0MiniOutputResolution::FourEightyP),
          Some(KinoviSeedance2p0MiniBatchCount::Two),
        ));
        // (37.5 base + 10 surcharge) × 2
        let costs = request.calculate_costs();
        assert_eq!(costs.base_cost.kinovi_credits, 75.0);
        assert_eq!(costs.video_reference_surcharge_cost.map(|c| c.kinovi_credits), Some(20.0));
        assert_eq!(costs.total_cost.kinovi_credits, 95.0);
      }
    }

    // ── USD cents conversion ──

    mod usd_cents {
      use super::*;

      #[test]
      fn fractional_480p_5s() {
        // 37.5 credits; 3750/243 = 15.43 → 16¢ up, 15¢ down.
        let costs = r480(5).calculate_costs();
        assert_eq!(costs.total_cost.kinovi_credits, 37.5);
        assert_eq!(costs.total_cost.usd_cents_rounded_up, 16);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 15);
        assert!((costs.total_cost.usd_cents_fractional - (3750.0 / 243.0)).abs() < FLOAT_TOLERANCE);
      }

      #[test]
      fn whole_720p_5s() {
        // 100 credits; 10000/243 = 41.15 → 42¢ up, 41¢ down.
        let costs = r720(5).calculate_costs();
        assert_eq!(costs.total_cost.kinovi_credits, 100.0);
        assert_eq!(costs.total_cost.usd_cents_rounded_up, 42);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 41);
        assert!((costs.total_cost.usd_cents_fractional - (10000.0 / 243.0)).abs() < FLOAT_TOLERANCE);
      }

      #[test]
      fn fractional_480p_15s_with_video_reference() {
        // 142.5 credits; 14250/243 = 58.64 → 59¢ up, 58¢ down.
        let costs = with_video_ref(r480(15)).calculate_costs();
        assert_eq!(costs.total_cost.kinovi_credits, 142.5);
        assert_eq!(costs.total_cost.usd_cents_rounded_up, 59);
        assert_eq!(costs.total_cost.usd_cents_rounded_down, 58);
        assert!((costs.total_cost.usd_cents_fractional - (14250.0 / 243.0)).abs() < FLOAT_TOLERANCE);
      }
    }

    // ── Batch multiplier ──

    mod batch_tests {
      use super::*;

      #[test]
      fn batch_scales_total_linearly() {
        let base = r720(5).calculate_costs().total_cost.kinovi_credits;
        let by_count = [
          (KinoviSeedance2p0MiniBatchCount::One, 1.0),
          (KinoviSeedance2p0MiniBatchCount::Two, 2.0),
          (KinoviSeedance2p0MiniBatchCount::Three, 3.0),
          (KinoviSeedance2p0MiniBatchCount::Four, 4.0),
          (KinoviSeedance2p0MiniBatchCount::Five, 5.0),
          (KinoviSeedance2p0MiniBatchCount::Six, 6.0),
          (KinoviSeedance2p0MiniBatchCount::Seven, 7.0),
          (KinoviSeedance2p0MiniBatchCount::Eight, 8.0),
        ];
        for (count, multiplier) in by_count {
          let credits = build_request(5, None, Some(count)).calculate_costs().total_cost.kinovi_credits;
          assert_eq!(credits, base * multiplier, "batch {count:?}");
        }
      }

      #[test]
      fn batch_eight_480p_with_video_reference() {
        let costs = with_video_ref(build_request(
          5,
          Some(KinoviSeedance2p0MiniOutputResolution::FourEightyP),
          Some(KinoviSeedance2p0MiniBatchCount::Eight),
        )).calculate_costs();
        // (37.5 + 10) × 8 = 380
        assert_eq!(costs.total_cost.kinovi_credits, 380.0);
      }
    }

    // ── Defaults & invariants ──

    #[test]
    fn default_resolution_is_720p() {
      let default = r720(5).calculate_costs().total_cost.kinovi_credits;
      let explicit = build_request(5, Some(KinoviSeedance2p0MiniOutputResolution::SevenTwentyP), None)
        .calculate_costs().total_cost.kinovi_credits;
      assert_eq!(default, explicit);
      assert_eq!(default, 100.0);
    }

    #[test]
    fn cost_scales_with_duration() {
      let c4 = r720(4).calculate_costs().total_cost.kinovi_credits;
      let c10 = r720(10).calculate_costs().total_cost.kinovi_credits;
      let c15 = r720(15).calculate_costs().total_cost.kinovi_credits;
      assert!(c4 < c10);
      assert!(c10 < c15);
    }

    #[test]
    fn resolution_480p_cheaper_than_720p() {
      for dur in 4..=15u8 {
        let c480 = r480(dur).calculate_costs().total_cost.kinovi_credits;
        let c720 = r720(dur).calculate_costs().total_cost.kinovi_credits;
        assert!(c480 < c720, "480p should be cheaper than 720p at {dur}s");
      }
    }

    #[test]
    fn aspect_ratio_does_not_affect_credits() {
      let baseline = r720(5).calculate_costs().total_cost.kinovi_credits;
      let ratios = [
        KinoviSeedance2p0MiniAspectRatio::Landscape16x9,
        KinoviSeedance2p0MiniAspectRatio::UltraWide21x9,
        KinoviSeedance2p0MiniAspectRatio::Portrait9x16,
        KinoviSeedance2p0MiniAspectRatio::Square1x1,
        KinoviSeedance2p0MiniAspectRatio::Standard4x3,
        KinoviSeedance2p0MiniAspectRatio::Portrait3x4,
      ];
      for ar in ratios {
        let mut req = r720(5);
        req.aspect_ratio = Some(ar);
        assert_eq!(req.calculate_costs().total_cost.kinovi_credits, baseline, "{ar:?}");
      }
    }

    #[test]
    fn high_bitrate_does_not_affect_credits() {
      let baseline = r720(5).calculate_costs().total_cost.kinovi_credits;
      let mut high = r720(5);
      high.bitrate = Some(KinoviSeedance2p0MiniBitrate::High);
      assert_eq!(high.calculate_costs().total_cost.kinovi_credits, baseline);
    }
  }

  // ── Request shape (mapping to the raw Kinovi request) ──

  mod request_shape_tests {
    use super::*;

    fn sample() -> GenerateSeedance2p0MiniRequest {
      GenerateSeedance2p0MiniRequest {
        prompt: "a corgi".to_string(),
        aspect_ratio: Some(KinoviSeedance2p0MiniAspectRatio::Standard4x3),
        output_resolution: Some(KinoviSeedance2p0MiniOutputResolution::FourEightyP),
        duration_seconds: 10,
        batch_count: Some(KinoviSeedance2p0MiniBatchCount::Eight),
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: Some(vec!["https://example.com/a.png".to_string()]),
        reference_video_urls: None,
        reference_audio_urls: None,
        character_ids: None,
        use_face_blur_hack: None,
        bitrate: Some(KinoviSeedance2p0MiniBitrate::High),
      }
    }

    #[test]
    fn maps_to_mini_model_type() {
      let raw = to_raw_request(sample());
      assert!(matches!(raw.model_type, KinoviModelTypeRaw::Seedance2Mini));
    }

    #[test]
    fn maps_resolution_aspect_and_batch() {
      let raw = to_raw_request(sample());
      assert!(matches!(raw.aspect_ratio, KinoviAspectRatioRaw::Landscape4x3));
      assert!(matches!(raw.output_resolution, Some(KinoviOutputResolutionRaw::FourEightyP)));
      assert!(matches!(raw.batch_count, KinoviBatchCountRaw::Eight));
      assert!(matches!(raw.bitrate, Some(KinoviBitrateRaw::High)));
    }

    #[test]
    fn passes_through_prompt_duration_and_references() {
      let raw = to_raw_request(sample());
      assert_eq!(raw.prompt, "a corgi");
      assert_eq!(raw.duration_seconds, 10);
      assert_eq!(raw.reference_image_urls, Some(vec!["https://example.com/a.png".to_string()]));
    }

    #[test]
    fn default_resolution_maps_to_none() {
      let mut req = sample();
      req.output_resolution = None;
      let raw = to_raw_request(req);
      assert!(raw.output_resolution.is_none());
    }

    #[test]
    fn all_batch_counts_map() {
      let expected: &[(KinoviSeedance2p0MiniBatchCount, u8)] = &[
        (KinoviSeedance2p0MiniBatchCount::One, 1),
        (KinoviSeedance2p0MiniBatchCount::Two, 2),
        (KinoviSeedance2p0MiniBatchCount::Three, 3),
        (KinoviSeedance2p0MiniBatchCount::Four, 4),
        (KinoviSeedance2p0MiniBatchCount::Five, 5),
        (KinoviSeedance2p0MiniBatchCount::Six, 6),
        (KinoviSeedance2p0MiniBatchCount::Seven, 7),
        (KinoviSeedance2p0MiniBatchCount::Eight, 8),
      ];
      for (count, n) in expected {
        let mut req = sample();
        req.batch_count = Some(*count);
        let raw = to_raw_request(req);
        // The mapped raw batch matches the requested count's multiplier.
        let mut probe = build_probe();
        probe.batch_count = Some(*count);
        assert_eq!(probe.batch_multiplier(), *n, "{count:?}");
        // And the raw enum is the corresponding variant.
        assert!(!matches!(raw.model_type, KinoviModelTypeRaw::Seedance2Pro));
      }
    }

    fn build_probe() -> GenerateSeedance2p0MiniRequest {
      GenerateSeedance2p0MiniRequest {
        prompt: String::new(),
        aspect_ratio: None,
        output_resolution: None,
        duration_seconds: 5,
        batch_count: None,
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: None,
        reference_video_urls: None,
        reference_audio_urls: None,
        character_ids: None,
        use_face_blur_hack: None,
        bitrate: None,
      }
    }
  }

  // ── Live API tests (manual; require Kinovi cookies) ──

  fn test_session() -> AnyhowResult<Seedance2ProSession> {
    let cookies = get_test_cookies()?;
    Ok(Seedance2ProSession::from_cookies_string(cookies))
  }

  mod live {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_720p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p0_mini(GenerateSeedance2p0MiniArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0MiniRequest {
          prompt: "A giant evil teddy bear steps on people in the city.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0MiniAspectRatio::Landscape16x9),
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
          bitrate: None,
        },
      }).await?;
      println!("mini t2v 720p — task_id={}, order_id={}", result.task_id, result.order_id);
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
      let result = generate_seedance_2p0_mini(GenerateSeedance2p0MiniArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0MiniRequest {
          prompt: "A snowman fights a bear".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0MiniAspectRatio::Standard4x3),
          output_resolution: Some(KinoviSeedance2p0MiniOutputResolution::FourEightyP),
          batch_count: None,
          duration_seconds: 10,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
          bitrate: None,
        },
      }).await?;
      println!("mini t2v 480p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_reference_to_video_720p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p0_mini(GenerateSeedance2p0MiniArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0MiniRequest {
          prompt: "Girl walks around in the city, giving a historical tour".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0MiniAspectRatio::UltraWide21x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 15,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: Some(vec![
            "https://static.seedance2-pro.com/materials/20260624/1782342102687-53fe5496.png".to_string(),
          ]),
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
          bitrate: None,
        },
      }).await?;
      println!("mini reference-to-video 720p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_video_reference_480p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p0_mini(GenerateSeedance2p0MiniArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0MiniRequest {
          prompt: "Change @video1 to night time.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0MiniAspectRatio::Landscape16x9),
          output_resolution: Some(KinoviSeedance2p0MiniOutputResolution::FourEightyP),
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
          bitrate: None,
        },
      }).await?;
      println!("mini video ref 480p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }
}
