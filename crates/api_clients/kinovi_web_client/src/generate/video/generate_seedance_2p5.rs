use crate::creds::kinovi_web_session::KinoviWebSession;
use crate::error::kinovi_web_error::KinoviWebError;
use crate::cost::kinovi_fractional_generation_cost::KinoviFractionalGenerationCost;
use crate::requests::kinovi_host::KinoviHost;
use crate::requests::workflow_run_task::workflow_run_task::{
  workflow_run_task, KinoviAspectRatioRaw, KinoviBatchCountRaw, KinoviModelTypeRaw,
  KinoviOutputResolutionRaw, WorkflowRunTaskArgs, WorkflowRunTaskRequest,
};

// ── Constants ──

/// Seedance 2.5 supports at most 30 seconds of video: reference-video input
/// seconds beyond this are clamped for billing.
pub const MAX_BILLED_INPUT_SECONDS: u8 = 30;

/// The minimum TOTAL billed input seconds when video references are
/// attached: however short the input videos are, the total bills at least 4
/// seconds. (Three 1-second videos sum to 3 and clamp to 4; three 3-second
/// videos sum to 9 and bill 9.)
pub const MIN_BILLED_INPUT_SECONDS: u8 = 4;

// ── Args ──

pub struct GenerateSeedance2p5Args<'a> {
  pub request: GenerateSeedance2p5Request,
  pub session: &'a KinoviWebSession,
  pub host_override: Option<KinoviHost>,
}

// ── Request ──

/// Seedance 2.5 supports keyframe (image-to-video) and reference
/// (text-to-video / reference-to-video) modalities, and 480p/720p output.
///
/// On the wire it reuses the 2.5 *Preview* business type
/// (`seedance25-preview-video-generation`) with model `seedance2-5`;
/// text-to-video is sent as mode "reference".
#[derive(Clone, Debug)]
pub struct GenerateSeedance2p5Request {
  pub prompt: String,

  pub modality: KinoviSeedance2p5Modality,

  pub output_resolution: Option<KinoviSeedance2p5OutputResolution>,

  pub duration_seconds: u8,

  /// CALCULATION-ONLY (never sent on the wire): the total seconds of
  /// reference video input, summed across all reference videos. When video
  /// references are attached, Kinovi bills the input seconds on top of the
  /// output duration — see the pricing notes on [`calculate_costs`].
  ///
  /// [`calculate_costs`]: GenerateSeedance2p5Request::calculate_costs
  pub total_input_seconds: Option<u8>,

  /// Controls `faceBlurMode`: true sends "on"; false or None sends "off"
  /// (the model always sends the field, like 2.5 Preview).
  pub use_face_blur_hack: Option<bool>,
}

// ── Modality ──

/// The generation modality. The aspect ratio choice lives here because the
/// two modalities support disjoint aspect ratio sets.
#[derive(Clone, Debug)]
pub enum KinoviSeedance2p5Modality {
  /// Image-to-video (start frame + optional end frame).
  ///
  /// The aspect ratio is always "Adaptive" — the only choice the API allows
  /// in this modality, expressed on the wire by omitting the `aspectRatio`
  /// field entirely — so there is nothing to configure.
  Keyframe {
    start_frame_url: String,
    end_frame_url: Option<String>,
  },

  /// Text-to-video / reference-to-video. "Adaptive" is NOT supported here;
  /// `None` defaults to 16:9.
  Reference {
    aspect_ratio: Option<KinoviSeedance2p5AspectRatio>,
    /// Reference images, referenced in prompts as @image1, @image2, etc.
    reference_image_urls: Option<Vec<String>>,
    /// Reference videos, referenced in prompts as @video1, @video2, etc.
    reference_video_urls: Option<Vec<String>>,
    /// Reference audio, referenced in prompts as @audio1, @audio2, etc.
    reference_audio_urls: Option<Vec<String>>,
  },
}

// ── Enums ──

/// Aspect ratios for the reference (text/reference-to-video) modality.
/// There is deliberately no "Adaptive" variant: Adaptive is keyframe-only
/// (and there it is the only choice).
#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p5AspectRatio {
  Landscape16x9,
  UltraWide21x9,
  Portrait9x16,
  Square1x1,
  Standard4x3,
  Portrait3x4,
}

/// Output resolution. Seedance 2.5 supports only 480p and 720p for now.
#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p5OutputResolution {
  FourEightyP,
  SevenTwentyP,
}

// ── Pricing ──
//
// Seedance 2.5 credit pricing (whole credits per billed second):
//
// | Resolution | No video refs | With video refs |
// |------------|---------------|-----------------|
// | 480p       |            26 |              16 |
// | 720p       |            59 |              35 |
//
// Without video references (text-to-video, keyframe, and reference mode with
// only image/audio references), billed seconds = output duration.
//
// With video references, the rate drops but the billed seconds are the
// output duration PLUS the total seconds of reference video input
// (`total_input_seconds`, summed across all reference videos and clamped to
// the [`MIN_BILLED_INPUT_SECONDS`]..=[`MAX_BILLED_INPUT_SECONDS`] range). E.g. a 30s output with a 10s video
// reference bills as 40 seconds; a 30s output with two 7s references (14s
// total input) bills as 44 seconds.
//
// Default resolution (None) is 720p.
// Credit package: 525,000 credits for $2,159.0909 (~243 credits/$1).

impl GenerateSeedance2p5Request {
  /// Calculate the cost of this generation request, in Kinovi credits and
  /// USD cents.
  pub fn calculate_costs(&self) -> KinoviFractionalGenerationCost {
    let has_video_references = matches!(
      &self.modality,
      KinoviSeedance2p5Modality::Reference { reference_video_urls: Some(urls), .. } if !urls.is_empty()
    );

    let (credits_per_second, billed_seconds) = if has_video_references {
      let rate = match self.output_resolution {
        Some(KinoviSeedance2p5OutputResolution::FourEightyP) => 16u64,
        Some(KinoviSeedance2p5OutputResolution::SevenTwentyP) | None => 35u64,
      };
      // An unknown (None) or zero input duration bills the worst-case
      // maximum — never default toward the minimum.
      let input_seconds = match self.total_input_seconds {
        None | Some(0) => MAX_BILLED_INPUT_SECONDS,
        Some(seconds) => seconds.clamp(MIN_BILLED_INPUT_SECONDS, MAX_BILLED_INPUT_SECONDS),
      };
      let seconds = u64::from(self.duration_seconds) + u64::from(input_seconds);
      (rate, seconds)
    } else {
      let rate = match self.output_resolution {
        Some(KinoviSeedance2p5OutputResolution::FourEightyP) => 26u64,
        Some(KinoviSeedance2p5OutputResolution::SevenTwentyP) | None => 59u64,
      };
      (rate, u64::from(self.duration_seconds))
    };

    let total_credits = credits_per_second * billed_seconds;
    KinoviFractionalGenerationCost::from_kinovi_credits(total_credits as f64)
  }
}

// ── Response ──

pub struct GenerateSeedance2p5Response {
  pub task_id: String,
  pub order_id: String,
  pub task_ids: Option<Vec<String>>,
  pub order_ids: Option<Vec<String>>,
}

// ── Entry point ──

pub async fn generate_seedance_2p5(
  args: GenerateSeedance2p5Args<'_>,
) -> Result<GenerateSeedance2p5Response, KinoviWebError> {
  let raw_response = workflow_run_task(WorkflowRunTaskArgs {
    request: to_raw_request(args.request),
    session: args.session,
    host_override: args.host_override,
  }).await?;

  Ok(GenerateSeedance2p5Response {
    task_id: raw_response.task_id,
    order_id: raw_response.order_id,
    task_ids: raw_response.task_ids,
    order_ids: raw_response.order_ids,
  })
}

// ── Mapping helpers ──

fn to_raw_request(req: GenerateSeedance2p5Request) -> WorkflowRunTaskRequest {
  let (
    aspect_ratio,
    start_frame_url,
    end_frame_url,
    reference_image_urls,
    reference_video_urls,
    reference_audio_urls,
  ) = match req.modality {
    KinoviSeedance2p5Modality::Keyframe { start_frame_url, end_frame_url } => (
      // Keyframe is always "Adaptive"; the raw layer omits the aspect ratio
      // for 2.5 keyframe requests, so this placeholder never hits the wire.
      KinoviAspectRatioRaw::Landscape16x9,
      Some(start_frame_url),
      end_frame_url,
      None,
      None,
      None,
    ),
    KinoviSeedance2p5Modality::Reference {
      aspect_ratio,
      reference_image_urls,
      reference_video_urls,
      reference_audio_urls,
    } => (
      map_aspect_ratio(aspect_ratio),
      None,
      None,
      reference_image_urls,
      reference_video_urls,
      reference_audio_urls,
    ),
  };

  WorkflowRunTaskRequest {
    model_type: KinoviModelTypeRaw::Seedance2p5,
    prompt: req.prompt,
    aspect_ratio,
    output_resolution: req.output_resolution.map(map_output_resolution),
    duration_seconds: req.duration_seconds,
    batch_count: KinoviBatchCountRaw::One,
    start_frame_url,
    end_frame_url,
    reference_image_urls,
    reference_video_urls,
    reference_audio_urls,
    character_ids: None,
    use_face_blur_hack: req.use_face_blur_hack,
    bitrate: None,
  }
}

fn map_aspect_ratio(ar: Option<KinoviSeedance2p5AspectRatio>) -> KinoviAspectRatioRaw {
  match ar {
    Some(KinoviSeedance2p5AspectRatio::Landscape16x9) => KinoviAspectRatioRaw::Landscape16x9,
    Some(KinoviSeedance2p5AspectRatio::UltraWide21x9) => KinoviAspectRatioRaw::UltraWide21x9,
    Some(KinoviSeedance2p5AspectRatio::Portrait9x16) => KinoviAspectRatioRaw::Portrait9x16,
    Some(KinoviSeedance2p5AspectRatio::Square1x1) => KinoviAspectRatioRaw::Square1x1,
    Some(KinoviSeedance2p5AspectRatio::Standard4x3) => KinoviAspectRatioRaw::Landscape4x3,
    Some(KinoviSeedance2p5AspectRatio::Portrait3x4) => KinoviAspectRatioRaw::Portrait3x4,
    None => KinoviAspectRatioRaw::Landscape16x9,
  }
}

fn map_output_resolution(res: KinoviSeedance2p5OutputResolution) -> KinoviOutputResolutionRaw {
  match res {
    KinoviSeedance2p5OutputResolution::FourEightyP => KinoviOutputResolutionRaw::FourEightyP,
    KinoviSeedance2p5OutputResolution::SevenTwentyP => KinoviOutputResolutionRaw::SevenTwentyP,
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

    // ── No video references: output-duration billing ──
    //
    // 480p = 26 credits/sec, 720p = 59 credits/sec.

    mod without_video_references {
      use super::*;

      #[test]
      fn table_480p() {
        assert_eq!(t2v_480(1).calculate_costs().kinovi_credits, 26.0);
        assert_eq!(t2v_480(5).calculate_costs().kinovi_credits, 130.0);
        assert_eq!(t2v_480(10).calculate_costs().kinovi_credits, 260.0);
        assert_eq!(t2v_480(15).calculate_costs().kinovi_credits, 390.0);
        assert_eq!(t2v_480(30).calculate_costs().kinovi_credits, 780.0);
      }

      #[test]
      fn table_720p() {
        assert_eq!(t2v_720(1).calculate_costs().kinovi_credits, 59.0);
        assert_eq!(t2v_720(5).calculate_costs().kinovi_credits, 295.0);
        assert_eq!(t2v_720(10).calculate_costs().kinovi_credits, 590.0);
        assert_eq!(t2v_720(15).calculate_costs().kinovi_credits, 885.0);
        assert_eq!(t2v_720(30).calculate_costs().kinovi_credits, 1770.0);
      }

      #[test]
      fn default_resolution_is_720p() {
        let default = t2v_720(10).calculate_costs();
        let mut explicit = t2v_720(10);
        explicit.output_resolution = Some(KinoviSeedance2p5OutputResolution::SevenTwentyP);
        assert_eq!(default, explicit.calculate_costs());
      }

      #[test]
      fn keyframe_modality_uses_no_reference_rates() {
        let mut request = keyframe_request(10);
        request.output_resolution = Some(KinoviSeedance2p5OutputResolution::FourEightyP);
        assert_eq!(request.calculate_costs().kinovi_credits, 260.0);

        let request_720 = keyframe_request(10);
        assert_eq!(request_720.calculate_costs().kinovi_credits, 590.0);
      }

      #[test]
      fn image_and_audio_references_do_not_change_the_rate() {
        let mut request = t2v_480(10);
        set_reference_urls(
          &mut request,
          Some(vec!["https://example.com/a.png".to_string(), "https://example.com/b.jpg".to_string()]),
          None,
          Some(vec!["https://example.com/ref.wav".to_string()]),
        );
        assert_eq!(request.calculate_costs().kinovi_credits, 260.0);
      }

      #[test]
      fn empty_video_reference_list_counts_as_no_references() {
        let mut request = t2v_480(10);
        set_reference_urls(&mut request, None, Some(Vec::new()), None);
        assert_eq!(request.calculate_costs().kinovi_credits, 260.0);
      }

      #[test]
      fn total_input_seconds_is_ignored_without_video_references() {
        let mut request = t2v_480(10);
        request.total_input_seconds = Some(60);
        assert_eq!(request.calculate_costs().kinovi_credits, 260.0);
      }
    }

    // ── With video references: input seconds are billed too ──
    //
    // 480p = 16 credits/sec, 720p = 35 credits/sec, over
    // (output duration + total_input_seconds) billed seconds.

    mod with_video_references {
      use super::*;

      #[test]
      fn thirty_second_output_with_ten_second_reference_bills_forty_seconds() {
        // The canonical example: 30s output + 10s of input video = 40 billed seconds.
        let request = video_ref_480(30, Some(10));
        assert_eq!(request.calculate_costs().kinovi_credits, (16 * 40) as f64);

        let request = video_ref_720(30, Some(10));
        assert_eq!(request.calculate_costs().kinovi_credits, (35 * 40) as f64);
      }

      #[test]
      fn two_seven_second_references_bill_forty_four_seconds() {
        // Two 7s references (14s total input) + 30s output = 44 billed seconds.
        let mut request = video_ref_480(30, Some(14));
        set_reference_urls(
          &mut request,
          None,
          Some(vec![
            "https://example.com/ref1.mp4".to_string(),
            "https://example.com/ref2.mp4".to_string(),
          ]),
          None,
        );
        assert_eq!(request.calculate_costs().kinovi_credits, (16 * 44) as f64);
      }

      #[test]
      fn table_480p_with_ten_input_seconds() {
        assert_eq!(video_ref_480(5, Some(10)).calculate_costs().kinovi_credits, (16 * 15) as f64);
        assert_eq!(video_ref_480(10, Some(10)).calculate_costs().kinovi_credits, (16 * 20) as f64);
        assert_eq!(video_ref_480(30, Some(10)).calculate_costs().kinovi_credits, (16 * 40) as f64);
      }

      #[test]
      fn table_720p_with_ten_input_seconds() {
        assert_eq!(video_ref_720(5, Some(10)).calculate_costs().kinovi_credits, (35 * 15) as f64);
        assert_eq!(video_ref_720(10, Some(10)).calculate_costs().kinovi_credits, (35 * 20) as f64);
        assert_eq!(video_ref_720(30, Some(10)).calculate_costs().kinovi_credits, (35 * 40) as f64);
      }

      #[test]
      fn input_totals_under_four_seconds_clamp_to_four() {
        // Total input clamps to a 4-second minimum: 1s, 3s, and 4s totals
        // all bill 4; 5s bills 5.
        assert_eq!(video_ref_480(30, Some(1)).calculate_costs().kinovi_credits, (16 * 34) as f64);
        assert_eq!(video_ref_480(30, Some(3)).calculate_costs().kinovi_credits, (16 * 34) as f64);
        assert_eq!(video_ref_480(30, Some(4)).calculate_costs().kinovi_credits, (16 * 34) as f64);
        assert_eq!(video_ref_480(30, Some(5)).calculate_costs().kinovi_credits, (16 * 35) as f64);
      }

      #[test]
      fn missing_total_input_seconds_bills_the_worst_case_maximum() {
        // Unknown input duration with video references attached: assume the
        // 30-second maximum so the estimate never undershoots the charge.
        assert_eq!(video_ref_480(10, None).calculate_costs().kinovi_credits, (16 * 40) as f64);
        assert_eq!(video_ref_720(10, None).calculate_costs().kinovi_credits, (35 * 40) as f64);
      }

      #[test]
      fn input_seconds_clamp_to_max_billed_input_seconds() {
        // 200 input seconds clamp to 30: 30s output + 30 = 60 billed seconds.
        assert_eq!(video_ref_480(30, Some(200)).calculate_costs().kinovi_credits, (16 * 60) as f64);
        assert_eq!(
          video_ref_480(30, Some(200)).calculate_costs(),
          video_ref_480(30, Some(MAX_BILLED_INPUT_SECONDS)).calculate_costs(),
        );
      }

      #[test]
      fn mixed_references_still_use_video_reference_rates() {
        let mut request = video_ref_480(10, Some(5));
        set_reference_urls(
          &mut request,
          Some(vec!["https://example.com/a.png".to_string()]),
          Some(vec!["https://example.com/ref.mp4".to_string()]),
          Some(vec!["https://example.com/ref.wav".to_string()]),
        );
        assert_eq!(request.calculate_costs().kinovi_credits, (16 * 15) as f64);
      }
    }

    // ── USD cents conversion ──
    //
    // usd_cents = credits × 100 / 243, computed on integer hundredths.

    mod usd_cents {
      use super::*;

      #[test]
      fn cents_480p_5s() {
        // 130 credits; 13000/243 = 53.4979 cents.
        let cost = t2v_480(5).calculate_costs();
        assert_eq!(cost.usd_cents_rounded_up, 54);
        assert_eq!(cost.usd_cents_rounded_down, 53);
        assert!((cost.usd_cents_fractional - (13000.0 / 243.0)).abs() < FLOAT_TOLERANCE);
      }

      #[test]
      fn cents_720p_30s() {
        // 1770 credits; 177000/243 = 728.3951 cents.
        let cost = t2v_720(30).calculate_costs();
        assert_eq!(cost.usd_cents_rounded_up, 729);
        assert_eq!(cost.usd_cents_rounded_down, 728);
        assert!((cost.usd_cents_fractional - (177000.0 / 243.0)).abs() < FLOAT_TOLERANCE);
      }

      #[test]
      fn cents_720p_video_ref_40_billed_seconds() {
        // 35 × 40 = 1400 credits; 140000/243 = 576.1317 cents.
        let cost = video_ref_720(30, Some(10)).calculate_costs();
        assert_eq!(cost.usd_cents_rounded_up, 577);
        assert_eq!(cost.usd_cents_rounded_down, 576);
        assert!((cost.usd_cents_fractional - (140000.0 / 243.0)).abs() < FLOAT_TOLERANCE);
      }
    }

    // ── Relative pricing ──

    mod relative_tests {
      use super::*;

      #[test]
      fn video_reference_rate_is_cheaper_per_second() {
        // 16 < 26 and 35 < 59: the with-references rate is lower per billed
        // second (the input seconds are where the money goes). Compare at
        // the minimum billed input (1s clamps to 4) — unknown or zero input
        // assumes the 30-second maximum, which would swamp the rate
        // comparison.
        assert!(video_ref_480(10, Some(1)).calculate_costs().kinovi_credits
          < t2v_480(10).calculate_costs().kinovi_credits);
        assert!(video_ref_720(10, Some(1)).calculate_costs().kinovi_credits
          < t2v_720(10).calculate_costs().kinovi_credits);
      }

      #[test]
      fn cost_scales_linearly_with_duration() {
        for duration in [1u8, 5, 10, 30] {
          assert_eq!(
            t2v_480(duration).calculate_costs().kinovi_credits,
            (26 * u64::from(duration)) as f64,
          );
        }
      }
    }

    // ── Aspect ratio doesn't affect cost ──

    #[test]
    fn aspect_ratio_does_not_affect_credits() {
      let baseline = t2v_720(10).calculate_costs().kinovi_credits;

      let ratios = [
        KinoviSeedance2p5AspectRatio::Landscape16x9,
        KinoviSeedance2p5AspectRatio::UltraWide21x9,
        KinoviSeedance2p5AspectRatio::Portrait9x16,
        KinoviSeedance2p5AspectRatio::Square1x1,
        KinoviSeedance2p5AspectRatio::Standard4x3,
        KinoviSeedance2p5AspectRatio::Portrait3x4,
      ];

      for ar in &ratios {
        let mut request = t2v_720(10);
        request.modality = KinoviSeedance2p5Modality::Reference {
          aspect_ratio: Some(*ar),
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
        };
        assert_eq!(
          request.calculate_costs().kinovi_credits, baseline,
          "Aspect ratio {:?} should not change credits from baseline {}", ar, baseline,
        );
      }
    }

    // ── Helpers ──

    fn text_to_video_request(
      duration_seconds: u8,
      output_resolution: Option<KinoviSeedance2p5OutputResolution>,
    ) -> GenerateSeedance2p5Request {
      GenerateSeedance2p5Request {
        prompt: String::new(),
        modality: KinoviSeedance2p5Modality::Reference {
          aspect_ratio: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
        },
        output_resolution,
        duration_seconds,
        total_input_seconds: None,
        use_face_blur_hack: None,
      }
    }

    fn t2v_480(duration: u8) -> GenerateSeedance2p5Request {
      text_to_video_request(duration, Some(KinoviSeedance2p5OutputResolution::FourEightyP))
    }

    fn t2v_720(duration: u8) -> GenerateSeedance2p5Request {
      text_to_video_request(duration, None)
    }

    fn keyframe_request(duration: u8) -> GenerateSeedance2p5Request {
      GenerateSeedance2p5Request {
        prompt: String::new(),
        modality: KinoviSeedance2p5Modality::Keyframe {
          start_frame_url: "https://example.com/start.png".to_string(),
          end_frame_url: Some("https://example.com/end.png".to_string()),
        },
        output_resolution: None,
        duration_seconds: duration,
        total_input_seconds: None,
        use_face_blur_hack: None,
      }
    }

    fn video_ref_480(duration: u8, total_input_seconds: Option<u8>) -> GenerateSeedance2p5Request {
      let mut request = t2v_480(duration);
      set_reference_urls(&mut request, None, Some(vec!["https://example.com/ref.mp4".to_string()]), None);
      request.total_input_seconds = total_input_seconds;
      request
    }

    fn video_ref_720(duration: u8, total_input_seconds: Option<u8>) -> GenerateSeedance2p5Request {
      let mut request = t2v_720(duration);
      set_reference_urls(&mut request, None, Some(vec!["https://example.com/ref.mp4".to_string()]), None);
      request.total_input_seconds = total_input_seconds;
      request
    }

    fn set_reference_urls(
      request: &mut GenerateSeedance2p5Request,
      images: Option<Vec<String>>,
      videos: Option<Vec<String>>,
      audio: Option<Vec<String>>,
    ) {
      let KinoviSeedance2p5Modality::Reference {
        reference_image_urls,
        reference_video_urls,
        reference_audio_urls,
        ..
      } = &mut request.modality else {
        panic!("set_reference_urls requires the Reference modality");
      };
      *reference_image_urls = images;
      *reference_video_urls = videos;
      *reference_audio_urls = audio;
    }
  }

  mod raw_mapping_tests {
    use super::*;

    #[test]
    fn keyframe_maps_frames_and_no_references() {
      let raw = to_raw_request(GenerateSeedance2p5Request {
        prompt: "Car drives into the sunset".to_string(),
        modality: KinoviSeedance2p5Modality::Keyframe {
          start_frame_url: "https://example.com/start.png".to_string(),
          end_frame_url: Some("https://example.com/end.png".to_string()),
        },
        output_resolution: Some(KinoviSeedance2p5OutputResolution::FourEightyP),
        duration_seconds: 8,
        total_input_seconds: None,
        use_face_blur_hack: None,
      });

      assert!(matches!(raw.model_type, KinoviModelTypeRaw::Seedance2p5));
      assert_eq!(raw.start_frame_url.as_deref(), Some("https://example.com/start.png"));
      assert_eq!(raw.end_frame_url.as_deref(), Some("https://example.com/end.png"));
      assert!(raw.reference_image_urls.is_none());
      assert!(raw.reference_video_urls.is_none());
      assert!(raw.reference_audio_urls.is_none());
    }

    #[test]
    fn reference_maps_references_and_no_frames() {
      let raw = to_raw_request(GenerateSeedance2p5Request {
        prompt: "The t-rex @image1 eats the banana".to_string(),
        modality: KinoviSeedance2p5Modality::Reference {
          aspect_ratio: Some(KinoviSeedance2p5AspectRatio::UltraWide21x9),
          reference_image_urls: Some(vec!["https://example.com/a.png".to_string()]),
          reference_video_urls: Some(vec!["https://example.com/ref.mp4".to_string()]),
          reference_audio_urls: Some(vec!["https://example.com/ref.wav".to_string()]),
        },
        output_resolution: None,
        duration_seconds: 8,
        total_input_seconds: Some(7),
        use_face_blur_hack: None,
      });

      assert!(matches!(raw.aspect_ratio, KinoviAspectRatioRaw::UltraWide21x9));
      assert!(raw.start_frame_url.is_none());
      assert!(raw.end_frame_url.is_none());
      assert_eq!(raw.reference_image_urls.as_deref().map(|urls| urls.len()), Some(1));
      assert_eq!(raw.reference_video_urls.as_deref().map(|urls| urls.len()), Some(1));
      assert_eq!(raw.reference_audio_urls.as_deref().map(|urls| urls.len()), Some(1));
    }

    #[test]
    fn reference_aspect_ratio_defaults_to_16x9() {
      let raw = to_raw_request(GenerateSeedance2p5Request {
        prompt: "Lightning hits a building".to_string(),
        modality: KinoviSeedance2p5Modality::Reference {
          aspect_ratio: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
        },
        output_resolution: None,
        duration_seconds: 5,
        total_input_seconds: None,
        use_face_blur_hack: None,
      });

      assert!(matches!(raw.aspect_ratio, KinoviAspectRatioRaw::Landscape16x9));
    }
  }

  mod real_requests {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_480p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p5(GenerateSeedance2p5Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p5Request {
          prompt: "Lightning hits a building".to_string(),
          modality: KinoviSeedance2p5Modality::Reference {
            aspect_ratio: Some(KinoviSeedance2p5AspectRatio::Landscape16x9),
            reference_image_urls: None,
            reference_video_urls: None,
            reference_audio_urls: None,
          },
          output_resolution: Some(KinoviSeedance2p5OutputResolution::FourEightyP),
          duration_seconds: 5,
          total_input_seconds: None,
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
    async fn test_keyframe_to_video_adaptive_480p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p5(GenerateSeedance2p5Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p5Request {
          prompt: "Car drives into the sunset".to_string(),
          modality: KinoviSeedance2p5Modality::Keyframe {
            start_frame_url: "https://static.seedance2-pro.com/materials/20260807/1786128486168-a2bf6132.png".to_string(),
            end_frame_url: Some("https://static.seedance2-pro.com/materials/20260807/1786128493608-d708413a.png".to_string()),
          },
          output_resolution: Some(KinoviSeedance2p5OutputResolution::FourEightyP),
          duration_seconds: 8,
          total_input_seconds: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("keyframe 480p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2, "Inspect output above");
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_reference_to_video_480p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p5(GenerateSeedance2p5Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p5Request {
          prompt: "The t-rex @image1 eats the banana @image2".to_string(),
          modality: KinoviSeedance2p5Modality::Reference {
            aspect_ratio: Some(KinoviSeedance2p5AspectRatio::UltraWide21x9),
            reference_image_urls: Some(vec![
              "https://static.seedance2-pro.com/materials/20260807/1786128628611-d6ca7afd.png".to_string(),
              "https://static.seedance2-pro.com/materials/20260807/1786128638331-5395ff1c.jpg".to_string(),
            ]),
            reference_video_urls: None,
            reference_audio_urls: None,
          },
          output_resolution: Some(KinoviSeedance2p5OutputResolution::FourEightyP),
          duration_seconds: 8,
          total_input_seconds: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("reference 480p — task_id={}, order_id={}", result.task_id, result.order_id);
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
