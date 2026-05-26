//! Combinatorial cost-parity tests between v1 (`build().estimate_cost()`) and v2
//! (`build2().estimate_cost()`) for the Fal-hosted Seedance video models.
//!
//! The goal: every request that produces a price in v1 must produce the
//! identical price in v2. If any callsite picks a different price after the
//! port, billing diverges. These tests close that gap.
//!
//! Both pipelines ultimately delegate to the same `FalRequestCostCalculator`
//! impls in `fal_client`, so parity should hold by construction — but we
//! exercise a wide variety of inputs anyway to catch any drift in the request
//! plumbing (e.g. resolution/duration mapping errors, default-value mismatches,
//! aspect-ratio fallthroughs).

#![cfg(test)]

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::common_video_model::CommonVideoModel;
use crate::api::image_ref::ImageRef;
use crate::api::provider::Provider;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;

const DUMMY_IMAGE: &str = "https://example.com/dummy.png";
const DUMMY_END_FRAME: &str = "https://example.com/dummy_end.png";

// ── seedance 1.0 lite ──

mod seedance_1p0_lite {
  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Seedance10Lite,
      provider: Provider::Fal,
      // 1.0 lite is image-to-video only — a start_frame is required.
      start_frame: Some(ImageRef::Url(DUMMY_IMAGE.to_string())),
      ..Default::default()
    }
  }

  fn all_resolutions() -> &'static [Option<CommonResolution>] {
    &[
      None,
      Some(CommonResolution::FourEightyP),
      Some(CommonResolution::SevenTwentyP),
      Some(CommonResolution::TenEightyP),
    ]
  }

  fn all_durations() -> &'static [Option<u16>] {
    &[None, Some(5), Some(10)]
  }

  fn supported_aspect_ratios() -> &'static [Option<CommonAspectRatio>] {
    &[
      None,
      Some(CommonAspectRatio::Auto),
      Some(CommonAspectRatio::Square),
      Some(CommonAspectRatio::WideFourByThree),
      Some(CommonAspectRatio::WideSixteenByNine),
      Some(CommonAspectRatio::Wide),
      Some(CommonAspectRatio::WideTwentyOneByNine),
      Some(CommonAspectRatio::TallThreeByFour),
      Some(CommonAspectRatio::TallNineBySixteen),
      Some(CommonAspectRatio::Tall),
    ]
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let mut combos_checked = 0;
    let mut combos_with_end_frame = 0;

    for &resolution in all_resolutions() {
      for &duration in all_durations() {
        for &aspect_ratio in supported_aspect_ratios() {
          for include_end_frame in [false, true] {
            let mut builder = base_builder();
            builder.resolution = resolution;
            builder.duration_seconds = duration;
            builder.aspect_ratio = aspect_ratio;
            if include_end_frame {
              builder.end_frame = Some(ImageRef::Url(DUMMY_END_FRAME.to_string()));
              combos_with_end_frame += 1;
            }

            let v1 = v1_cost(&builder);
            let v2 = v2_cost(builder.clone());
            assert_eq!(
              v1, v2,
              "1.0 lite cost mismatch: res={:?} dur={:?} ar={:?} end={} → v1={:?} v2={:?}",
              resolution, duration, aspect_ratio, include_end_frame, v1, v2,
            );
            combos_checked += 1;
          }
        }
      }
    }

    // Sanity: we should be checking a meaningful number of combinations.
    assert!(combos_checked >= 240, "expected ≥240 combos, got {}", combos_checked);
    assert!(combos_with_end_frame > 0, "expected at least one with end_frame");
  }
}

// ── seedance 1.5 pro ──

mod seedance_1p5_pro {
  use super::*;

  fn t2v_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Seedance1p5Pro,
      provider: Provider::Fal,
      // No start_frame → text-to-video mode.
      ..Default::default()
    }
  }

  fn i2v_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Seedance1p5Pro,
      provider: Provider::Fal,
      start_frame: Some(ImageRef::Url(DUMMY_IMAGE.to_string())),
      ..Default::default()
    }
  }

  fn all_resolutions() -> &'static [Option<CommonResolution>] {
    &[
      None,
      Some(CommonResolution::FourEightyP),
      Some(CommonResolution::SevenTwentyP),
      Some(CommonResolution::TenEightyP),
    ]
  }

  fn all_durations() -> &'static [Option<u16>] {
    &[None, Some(4), Some(5), Some(6), Some(7), Some(8), Some(9), Some(10), Some(11), Some(12)]
  }

  fn supported_aspect_ratios() -> &'static [Option<CommonAspectRatio>] {
    &[
      None,
      Some(CommonAspectRatio::Auto),
      Some(CommonAspectRatio::Square),
      Some(CommonAspectRatio::WideFourByThree),
      Some(CommonAspectRatio::WideSixteenByNine),
      Some(CommonAspectRatio::Wide),
      Some(CommonAspectRatio::WideTwentyOneByNine),
      Some(CommonAspectRatio::TallThreeByFour),
      Some(CommonAspectRatio::TallNineBySixteen),
      Some(CommonAspectRatio::Tall),
    ]
  }

  fn audio_options() -> &'static [Option<bool>] {
    &[None, Some(true), Some(false)]
  }

  #[test]
  fn cost_parity_t2v_combinatorial() {
    let mut combos_checked = 0;
    for &resolution in all_resolutions() {
      for &duration in all_durations() {
        for &aspect_ratio in supported_aspect_ratios() {
          for &generate_audio in audio_options() {
            let mut builder = t2v_builder();
            builder.resolution = resolution;
            builder.duration_seconds = duration;
            builder.aspect_ratio = aspect_ratio;
            builder.generate_audio = generate_audio;

            let v1 = v1_cost(&builder);
            let v2 = v2_cost(builder.clone());
            assert_eq!(
              v1, v2,
              "1.5 pro t2v cost mismatch: res={:?} dur={:?} ar={:?} audio={:?} → v1={:?} v2={:?}",
              resolution, duration, aspect_ratio, generate_audio, v1, v2,
            );
            combos_checked += 1;
          }
        }
      }
    }
    assert!(combos_checked >= 1000, "expected ≥1000 combos, got {}", combos_checked);
  }

  #[test]
  fn cost_parity_i2v_combinatorial() {
    let mut combos_checked = 0;
    let mut combos_with_end_frame = 0;
    for &resolution in all_resolutions() {
      for &duration in all_durations() {
        for &aspect_ratio in supported_aspect_ratios() {
          for &generate_audio in audio_options() {
            for include_end_frame in [false, true] {
              let mut builder = i2v_builder();
              builder.resolution = resolution;
              builder.duration_seconds = duration;
              builder.aspect_ratio = aspect_ratio;
              builder.generate_audio = generate_audio;
              if include_end_frame {
                builder.end_frame = Some(ImageRef::Url(DUMMY_END_FRAME.to_string()));
                combos_with_end_frame += 1;
              }

              let v1 = v1_cost(&builder);
              let v2 = v2_cost(builder.clone());
              assert_eq!(
                v1, v2,
                "1.5 pro i2v cost mismatch: res={:?} dur={:?} ar={:?} audio={:?} end={} → v1={:?} v2={:?}",
                resolution, duration, aspect_ratio, generate_audio, include_end_frame, v1, v2,
              );
              combos_checked += 1;
            }
          }
        }
      }
    }
    assert!(combos_checked >= 2000, "expected ≥2000 combos, got {}", combos_checked);
    assert!(combos_with_end_frame > 0, "expected at least one with end_frame");
  }

  #[test]
  fn cost_parity_with_pay_less_downgrade_strategy() {
    // Sanity: even when the mismatch strategy downgrades unsupported
    // resolutions/durations, v1 and v2 should pick the same fallback.
    let oddities: &[(Option<CommonResolution>, Option<u16>)] = &[
      (Some(CommonResolution::OneK), None),
      (Some(CommonResolution::TwoK), Some(5)),
      (Some(CommonResolution::FourK), Some(12)),
      (None, Some(13)),
    ];
    for &(resolution, duration) in oddities {
      let mut builder = t2v_builder();
      builder.resolution = resolution;
      builder.duration_seconds = duration;
      builder.request_mismatch_mitigation_strategy =
        RequestMismatchMitigationStrategy::PayLessDowngrade;
      let v1 = v1_cost(&builder);
      let v2 = v2_cost(builder.clone());
      assert_eq!(v1, v2, "PayLessDowngrade mismatch at res={:?} dur={:?}", resolution, duration);
    }
  }

  #[test]
  fn cost_parity_with_pay_more_upgrade_strategy() {
    let oddities: &[(Option<CommonResolution>, Option<u16>)] = &[
      (Some(CommonResolution::OneK), None),
      (Some(CommonResolution::TwoK), Some(5)),
      (Some(CommonResolution::FourK), Some(13)),
      (None, Some(20)),
    ];
    for &(resolution, duration) in oddities {
      let mut builder = t2v_builder();
      builder.resolution = resolution;
      builder.duration_seconds = duration;
      builder.request_mismatch_mitigation_strategy =
        RequestMismatchMitigationStrategy::PayMoreUpgrade;
      let v1 = v1_cost(&builder);
      let v2 = v2_cost(builder.clone());
      assert_eq!(v1, v2, "PayMoreUpgrade mismatch at res={:?} dur={:?}", resolution, duration);
    }
  }
}

// ── helpers ──

/// Returns `Some(cost_in_usd_cents)` from the v1 pipeline. If v1 errors out
/// (e.g. for an unsupported resolution with `ErrorOut` strategy), returns `None`
/// so the parity test can compare apples to apples.
fn v1_cost(builder: &GenerateVideoRequestBuilder) -> Option<u64> {
  builder
    .build()
    .ok()
    .and_then(|plan| plan.estimate_costs().cost_in_usd_cents)
}

/// Same as `v1_cost`, but for the v2 pipeline.
fn v2_cost(builder: GenerateVideoRequestBuilder) -> Option<u64> {
  builder
    .build2()
    .ok()
    .and_then(|dor| dor.estimate_cost().ok())
    .and_then(|estimate| estimate.cost_in_usd_cents)
}

// ── Kling shared helpers ──

mod kling_helpers {
  use super::*;

  pub fn kling_aspect_ratios() -> &'static [Option<CommonAspectRatio>] {
    &[
      None,
      Some(CommonAspectRatio::Square),
      Some(CommonAspectRatio::WideSixteenByNine),
      Some(CommonAspectRatio::TallNineBySixteen),
      Some(CommonAspectRatio::Auto),
      // Unsupported — falls back to 16:9 for non-ErrorOut.
      Some(CommonAspectRatio::WideFourByThree),
    ]
  }
}

// ── Kling 1.6 Pro ──

mod kling_1_6_pro {
  use super::*;
  use super::kling_helpers::kling_aspect_ratios;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling16Pro,
      provider: Provider::Fal,
      start_frame: Some(ImageRef::Url(DUMMY_IMAGE.to_string())),
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(5u16), Some(10)];
    let mut combos = 0;
    for &aspect_ratio in kling_aspect_ratios() {
      for &duration in &durations {
        for include_end_frame in [false, true] {
          let mut builder = base_builder();
          builder.aspect_ratio = aspect_ratio;
          builder.duration_seconds = duration;
          if include_end_frame {
            builder.end_frame = Some(ImageRef::Url(DUMMY_END_FRAME.to_string()));
          }
          let v1 = v1_cost(&builder);
          let v2 = v2_cost(builder.clone());
          assert_eq!(v1, v2, "kling_1_6_pro: ar={:?} dur={:?} end={} → v1={:?} v2={:?}",
            aspect_ratio, duration, include_end_frame, v1, v2);
          combos += 1;
        }
      }
    }
    assert_eq!(combos, 6 * 3 * 2);
  }
}

// ── Kling 2.1 Pro ──

mod kling_2_1_pro {
  use super::*;
  use super::kling_helpers::kling_aspect_ratios;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling21Pro,
      provider: Provider::Fal,
      start_frame: Some(ImageRef::Url(DUMMY_IMAGE.to_string())),
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(5u16), Some(10)];
    let mut combos = 0;
    for &aspect_ratio in kling_aspect_ratios() {
      for &duration in &durations {
        for include_end_frame in [false, true] {
          let mut builder = base_builder();
          builder.aspect_ratio = aspect_ratio;
          builder.duration_seconds = duration;
          if include_end_frame {
            builder.end_frame = Some(ImageRef::Url(DUMMY_END_FRAME.to_string()));
          }
          let v1 = v1_cost(&builder);
          let v2 = v2_cost(builder.clone());
          assert_eq!(v1, v2, "kling_2_1_pro: ar={:?} dur={:?} end={} → v1={:?} v2={:?}",
            aspect_ratio, duration, include_end_frame, v1, v2);
          combos += 1;
        }
      }
    }
    assert_eq!(combos, 6 * 3 * 2);
  }
}

// ── Kling 2.1 Master ──

mod kling_2_1_master {
  use super::*;
  use super::kling_helpers::kling_aspect_ratios;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling21Master,
      provider: Provider::Fal,
      start_frame: Some(ImageRef::Url(DUMMY_IMAGE.to_string())),
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(5u16), Some(10)];
    let mut combos = 0;
    for &aspect_ratio in kling_aspect_ratios() {
      for &duration in &durations {
        let mut builder = base_builder();
        builder.aspect_ratio = aspect_ratio;
        builder.duration_seconds = duration;
        let v1 = v1_cost(&builder);
        let v2 = v2_cost(builder.clone());
        assert_eq!(v1, v2, "kling_2_1_master: ar={:?} dur={:?} → v1={:?} v2={:?}",
          aspect_ratio, duration, v1, v2);
        combos += 1;
      }
    }
    assert_eq!(combos, 6 * 3);
  }
}

// ── Kling 2.5 Turbo Pro ──

mod kling_2_5_turbo_pro {
  use super::*;
  use super::kling_helpers::kling_aspect_ratios;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling2p5TurboPro,
      provider: Provider::Fal,
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(5u16), Some(10)];
    let mut combos = 0;
    for &aspect_ratio in kling_aspect_ratios() {
      for &duration in &durations {
        for has_start in [false, true] {
          for include_end in [false, true] {
            if include_end && !has_start { continue; }
            let mut builder = base_builder();
            builder.aspect_ratio = aspect_ratio;
            builder.duration_seconds = duration;
            if has_start {
              builder.start_frame = Some(ImageRef::Url(DUMMY_IMAGE.to_string()));
            }
            if include_end {
              builder.end_frame = Some(ImageRef::Url(DUMMY_END_FRAME.to_string()));
            }
            let v1 = v1_cost(&builder);
            let v2 = v2_cost(builder.clone());
            assert_eq!(v1, v2, "kling_2_5_turbo_pro: ar={:?} dur={:?} start={} end={} → v1={:?} v2={:?}",
              aspect_ratio, duration, has_start, include_end, v1, v2);
            combos += 1;
          }
        }
      }
    }
    assert!(combos >= 50, "expected ≥50 combos, got {}", combos);
  }
}

// ── Kling 2.6 Pro ──

mod kling_2_6_pro {
  use super::*;
  use super::kling_helpers::kling_aspect_ratios;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling2p6Pro,
      provider: Provider::Fal,
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(5u16), Some(10)];
    let audios = [None, Some(true), Some(false)];
    let mut combos = 0;
    for &aspect_ratio in kling_aspect_ratios() {
      for &duration in &durations {
        for &generate_audio in &audios {
          for has_start in [false, true] {
            let mut builder = base_builder();
            builder.aspect_ratio = aspect_ratio;
            builder.duration_seconds = duration;
            builder.generate_audio = generate_audio;
            if has_start {
              builder.start_frame = Some(ImageRef::Url(DUMMY_IMAGE.to_string()));
            }
            let v1 = v1_cost(&builder);
            let v2 = v2_cost(builder.clone());
            assert_eq!(v1, v2, "kling_2_6_pro: ar={:?} dur={:?} audio={:?} start={} → v1={:?} v2={:?}",
              aspect_ratio, duration, generate_audio, has_start, v1, v2);
            combos += 1;
          }
        }
      }
    }
    assert_eq!(combos, 6 * 3 * 3 * 2);
  }
}

// ── Kling 3.0 Pro ──

mod kling_3p0_pro {
  use super::*;
  use super::kling_helpers::kling_aspect_ratios;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling3p0Pro,
      provider: Provider::Fal,
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    // 3-15s inclusive, plus None and out-of-range.
    let durations = [None, Some(3u16), Some(5), Some(10), Some(15), Some(2), Some(16)];
    let audios = [None, Some(true), Some(false)];
    let mut combos = 0;
    for &aspect_ratio in kling_aspect_ratios() {
      for &duration in &durations {
        for &generate_audio in &audios {
          for has_start in [false, true] {
            for include_end in [false, true] {
              if include_end && !has_start { continue; }
              let mut builder = base_builder();
              builder.aspect_ratio = aspect_ratio;
              builder.duration_seconds = duration;
              builder.generate_audio = generate_audio;
              if has_start {
                builder.start_frame = Some(ImageRef::Url(DUMMY_IMAGE.to_string()));
              }
              if include_end {
                builder.end_frame = Some(ImageRef::Url(DUMMY_END_FRAME.to_string()));
              }
              let v1 = v1_cost(&builder);
              let v2 = v2_cost(builder.clone());
              assert_eq!(v1, v2, "kling_3p0_pro: ar={:?} dur={:?} audio={:?} start={} end={} → v1={:?} v2={:?}",
                aspect_ratio, duration, generate_audio, has_start, include_end, v1, v2);
              combos += 1;
            }
          }
        }
      }
    }
    assert!(combos >= 300, "expected ≥300 combos, got {}", combos);
  }
}

// ── Kling 3.0 Standard ──

mod kling_3p0_standard {
  use super::*;
  use super::kling_helpers::kling_aspect_ratios;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling3p0Standard,
      provider: Provider::Fal,
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(3u16), Some(5), Some(10), Some(15), Some(2), Some(16)];
    let audios = [None, Some(true), Some(false)];
    let mut combos = 0;
    for &aspect_ratio in kling_aspect_ratios() {
      for &duration in &durations {
        for &generate_audio in &audios {
          for has_start in [false, true] {
            let mut builder = base_builder();
            builder.aspect_ratio = aspect_ratio;
            builder.duration_seconds = duration;
            builder.generate_audio = generate_audio;
            if has_start {
              builder.start_frame = Some(ImageRef::Url(DUMMY_IMAGE.to_string()));
            }
            let v1 = v1_cost(&builder);
            let v2 = v2_cost(builder.clone());
            assert_eq!(v1, v2, "kling_3p0_standard: ar={:?} dur={:?} audio={:?} start={} → v1={:?} v2={:?}",
              aspect_ratio, duration, generate_audio, has_start, v1, v2);
            combos += 1;
          }
        }
      }
    }
    assert!(combos >= 200, "expected ≥200 combos, got {}", combos);
  }
}

// ── Sora 2 ──

mod sora_2 {
  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Sora2,
      provider: Provider::Fal,
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let resolutions = [None, Some(CommonResolution::SevenTwentyP), Some(CommonResolution::TenEightyP)];
    let durations = [None, Some(4u16), Some(8), Some(12)];
    let aspect_ratios = [
      None,
      Some(CommonAspectRatio::Auto),
      Some(CommonAspectRatio::WideSixteenByNine),
      Some(CommonAspectRatio::TallNineBySixteen),
      Some(CommonAspectRatio::Square),
    ];
    let mut combos = 0;
    for &resolution in &resolutions {
      for &duration in &durations {
        for &aspect_ratio in &aspect_ratios {
          for has_start in [false, true] {
            let mut builder = base_builder();
            builder.resolution = resolution;
            builder.duration_seconds = duration;
            builder.aspect_ratio = aspect_ratio;
            if has_start {
              builder.start_frame = Some(ImageRef::Url(DUMMY_IMAGE.to_string()));
            }
            let v1 = v1_cost(&builder);
            let v2 = v2_cost(builder.clone());
            assert_eq!(v1, v2, "sora_2: res={:?} dur={:?} ar={:?} start={} → v1={:?} v2={:?}",
              resolution, duration, aspect_ratio, has_start, v1, v2);
            combos += 1;
          }
        }
      }
    }
    assert_eq!(combos, 3 * 4 * 5 * 2);
  }
}

// ── Sora 2 Pro ──

mod sora_2_pro {
  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Sora2Pro,
      provider: Provider::Fal,
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let resolutions = [None, Some(CommonResolution::SevenTwentyP), Some(CommonResolution::TenEightyP)];
    let durations = [None, Some(4u16), Some(8), Some(12)];
    let aspect_ratios = [
      None,
      Some(CommonAspectRatio::Auto),
      Some(CommonAspectRatio::WideSixteenByNine),
      Some(CommonAspectRatio::TallNineBySixteen),
      Some(CommonAspectRatio::Square),
    ];
    let mut combos = 0;
    for &resolution in &resolutions {
      for &duration in &durations {
        for &aspect_ratio in &aspect_ratios {
          for has_start in [false, true] {
            let mut builder = base_builder();
            builder.resolution = resolution;
            builder.duration_seconds = duration;
            builder.aspect_ratio = aspect_ratio;
            if has_start {
              builder.start_frame = Some(ImageRef::Url(DUMMY_IMAGE.to_string()));
            }
            let v1 = v1_cost(&builder);
            let v2 = v2_cost(builder.clone());
            assert_eq!(v1, v2, "sora_2_pro: res={:?} dur={:?} ar={:?} start={} → v1={:?} v2={:?}",
              resolution, duration, aspect_ratio, has_start, v1, v2);
            combos += 1;
          }
        }
      }
    }
    assert_eq!(combos, 3 * 4 * 5 * 2);
  }
}

// ── Veo 2 ──

mod veo_2 {
  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Veo2,
      provider: Provider::Fal,
      ..Default::default()
    }
  }

  fn supported_aspect_ratios() -> &'static [Option<CommonAspectRatio>] {
    &[
      None,
      Some(CommonAspectRatio::Auto),
      Some(CommonAspectRatio::WideSixteenByNine),
      Some(CommonAspectRatio::TallNineBySixteen),
      // Unsupported (router falls back to Auto for non-ErrorOut strategy).
      Some(CommonAspectRatio::Square),
    ]
  }

  fn all_durations() -> &'static [Option<u16>] {
    &[None, Some(5), Some(6), Some(7), Some(8)]
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let mut combos = 0;
    for &aspect_ratio in supported_aspect_ratios() {
      for &duration in all_durations() {
        for has_start_frame in [false, true] {
          let mut builder = base_builder();
          builder.aspect_ratio = aspect_ratio;
          builder.duration_seconds = duration;
          if has_start_frame {
            builder.start_frame = Some(ImageRef::Url(DUMMY_IMAGE.to_string()));
          }
          let v1 = v1_cost(&builder);
          let v2 = v2_cost(builder.clone());
          assert_eq!(
            v1, v2,
            "veo_2 cost mismatch: ar={:?} dur={:?} start={} → v1={:?} v2={:?}",
            aspect_ratio, duration, has_start_frame, v1, v2,
          );
          combos += 1;
        }
      }
    }
    assert_eq!(combos, 5 * 5 * 2);
  }
}

// ── Veo 3 ──

mod veo_3 {
  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Veo3,
      provider: Provider::Fal,
      ..Default::default()
    }
  }

  fn all_resolutions() -> &'static [Option<CommonResolution>] {
    &[None, Some(CommonResolution::SevenTwentyP), Some(CommonResolution::TenEightyP)]
  }

  fn all_durations() -> &'static [Option<u16>] {
    &[None, Some(4), Some(6), Some(8)]
  }

  fn supported_aspect_ratios() -> &'static [Option<CommonAspectRatio>] {
    &[
      None,
      Some(CommonAspectRatio::Auto),
      Some(CommonAspectRatio::WideSixteenByNine),
      Some(CommonAspectRatio::TallNineBySixteen),
      Some(CommonAspectRatio::Square),
    ]
  }

  fn audio_options() -> &'static [Option<bool>] {
    &[None, Some(true), Some(false)]
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let mut combos = 0;
    for &resolution in all_resolutions() {
      for &duration in all_durations() {
        for &aspect_ratio in supported_aspect_ratios() {
          for &generate_audio in audio_options() {
            for has_start_frame in [false, true] {
              let mut builder = base_builder();
              builder.resolution = resolution;
              builder.duration_seconds = duration;
              builder.aspect_ratio = aspect_ratio;
              builder.generate_audio = generate_audio;
              if has_start_frame {
                builder.start_frame = Some(ImageRef::Url(DUMMY_IMAGE.to_string()));
              }
              let v1 = v1_cost(&builder);
              let v2 = v2_cost(builder.clone());
              assert_eq!(
                v1, v2,
                "veo_3 cost mismatch: res={:?} dur={:?} ar={:?} audio={:?} start={} → v1={:?} v2={:?}",
                resolution, duration, aspect_ratio, generate_audio, has_start_frame, v1, v2,
              );
              combos += 1;
            }
          }
        }
      }
    }
    assert_eq!(combos, 3 * 4 * 5 * 3 * 2);
  }
}

// ── Veo 3 Fast (image-to-video only) ──

mod veo_3_fast {
  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Veo3Fast,
      provider: Provider::Fal,
      start_frame: Some(ImageRef::Url(DUMMY_IMAGE.to_string())),
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let resolutions = [None, Some(CommonResolution::SevenTwentyP), Some(CommonResolution::TenEightyP)];
    let durations = [None, Some(4u16), Some(6), Some(8)];
    let audios = [None, Some(true), Some(false)];

    let mut combos = 0;
    for &resolution in &resolutions {
      for &duration in &durations {
        for &generate_audio in &audios {
          let mut builder = base_builder();
          builder.resolution = resolution;
          builder.duration_seconds = duration;
          builder.generate_audio = generate_audio;
          let v1 = v1_cost(&builder);
          let v2 = v2_cost(builder.clone());
          assert_eq!(
            v1, v2,
            "veo_3_fast cost mismatch: res={:?} dur={:?} audio={:?} → v1={:?} v2={:?}",
            resolution, duration, generate_audio, v1, v2,
          );
          combos += 1;
        }
      }
    }
    assert_eq!(combos, 3 * 4 * 3);
  }
}

// ── Veo 3.1 ──

mod veo_3p1 {
  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Veo3p1,
      provider: Provider::Fal,
      ..Default::default()
    }
  }

  fn all_resolutions() -> &'static [Option<CommonResolution>] {
    &[None, Some(CommonResolution::SevenTwentyP), Some(CommonResolution::TenEightyP)]
  }

  fn all_durations() -> &'static [Option<u16>] {
    &[None, Some(4), Some(6), Some(8)]
  }

  fn supported_aspect_ratios() -> &'static [Option<CommonAspectRatio>] {
    &[None, Some(CommonAspectRatio::Auto), Some(CommonAspectRatio::WideSixteenByNine), Some(CommonAspectRatio::TallNineBySixteen)]
  }

  fn audio_options() -> &'static [Option<bool>] {
    &[None, Some(true), Some(false)]
  }

  /// Three modes: text-to-video (no frames), image-to-video (start only),
  /// first/last-frame (both). All three must price identically.
  #[derive(Clone, Copy)]
  enum FrameSetup {
    None_,
    StartOnly,
    StartAndEnd,
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let mut combos = 0;
    for &resolution in all_resolutions() {
      for &duration in all_durations() {
        for &aspect_ratio in supported_aspect_ratios() {
          for &generate_audio in audio_options() {
            for frames in [FrameSetup::None_, FrameSetup::StartOnly, FrameSetup::StartAndEnd] {
              let mut builder = base_builder();
              builder.resolution = resolution;
              builder.duration_seconds = duration;
              builder.aspect_ratio = aspect_ratio;
              builder.generate_audio = generate_audio;
              match frames {
                FrameSetup::None_ => {}
                FrameSetup::StartOnly => {
                  builder.start_frame = Some(ImageRef::Url(DUMMY_IMAGE.to_string()));
                }
                FrameSetup::StartAndEnd => {
                  builder.start_frame = Some(ImageRef::Url(DUMMY_IMAGE.to_string()));
                  builder.end_frame = Some(ImageRef::Url(DUMMY_END_FRAME.to_string()));
                }
              }
              let v1 = v1_cost(&builder);
              let v2 = v2_cost(builder.clone());
              assert_eq!(
                v1, v2,
                "veo_3p1 cost mismatch: res={:?} dur={:?} ar={:?} audio={:?} → v1={:?} v2={:?}",
                resolution, duration, aspect_ratio, generate_audio, v1, v2,
              );
              combos += 1;
            }
          }
        }
      }
    }
    assert_eq!(combos, 3 * 4 * 4 * 3 * 3);
  }
}

// ── Veo 3.1 Fast ──

mod veo_3p1_fast {
  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Veo3p1Fast,
      provider: Provider::Fal,
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let resolutions = [None, Some(CommonResolution::SevenTwentyP), Some(CommonResolution::TenEightyP)];
    let durations = [None, Some(4u16), Some(6), Some(8)];
    let aspect_ratios = [
      None,
      Some(CommonAspectRatio::Auto),
      Some(CommonAspectRatio::WideSixteenByNine),
      Some(CommonAspectRatio::TallNineBySixteen),
    ];
    let audios = [None, Some(true), Some(false)];

    let mut combos = 0;
    for &resolution in &resolutions {
      for &duration in &durations {
        for &aspect_ratio in &aspect_ratios {
          for &generate_audio in &audios {
            for include_end_frame in [false, true] {
              let mut builder = base_builder();
              builder.resolution = resolution;
              builder.duration_seconds = duration;
              builder.aspect_ratio = aspect_ratio;
              builder.generate_audio = generate_audio;
              builder.start_frame = Some(ImageRef::Url(DUMMY_IMAGE.to_string()));
              if include_end_frame {
                builder.end_frame = Some(ImageRef::Url(DUMMY_END_FRAME.to_string()));
              }
              let v1 = v1_cost(&builder);
              let v2 = v2_cost(builder.clone());
              assert_eq!(
                v1, v2,
                "veo_3p1_fast cost mismatch: res={:?} dur={:?} ar={:?} audio={:?} end={} → v1={:?} v2={:?}",
                resolution, duration, aspect_ratio, generate_audio, include_end_frame, v1, v2,
              );
              combos += 1;
            }
          }
        }
      }
    }
    assert_eq!(combos, 3 * 4 * 4 * 3 * 2);
  }
}
