//! Combinatorial cost-parity tests between v1 (`build().estimate_costs()`) and v2
//! (`build2().estimate_cost()`) for the Artcraft-hosted Kling video models.
//!
//! All 7 Kling variants run on the v2 omni-gen path, but each owns its own
//! pricing formula in v2 (mirroring the v1 plan-based price). These tests
//! prove the new formula reproduces v1 prices across every shape we expect
//! routers to send.

#![cfg(test)]

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_video_model::CommonVideoModel;
use crate::api::image_ref::ImageRef;
use crate::api::provider::Provider;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use tokens::tokens::media_files::MediaFileToken;

fn v1_cost(builder: &GenerateVideoRequestBuilder) -> Option<u64> {
  builder.build().ok().and_then(|plan| plan.estimate_costs().cost_in_usd_cents)
}

fn v2_cost(builder: GenerateVideoRequestBuilder) -> Option<u64> {
  builder
    .build2()
    .ok()
    .and_then(|dor| dor.estimate_cost().ok())
    .and_then(|estimate| estimate.cost_in_usd_cents)
}

fn dummy_token() -> MediaFileToken {
  MediaFileToken::new("mf_dummy".to_string())
}

fn supported_aspect_ratios() -> &'static [Option<CommonAspectRatio>] {
  &[
    None,
    Some(CommonAspectRatio::Square),
    Some(CommonAspectRatio::WideSixteenByNine),
    Some(CommonAspectRatio::TallNineBySixteen),
    Some(CommonAspectRatio::Auto),
    // Unsupported — falls back to nearest_aspect_ratio per omni-gen helper.
    Some(CommonAspectRatio::WideFourByThree),
  ]
}

// ── Kling 1.6 Pro ──

mod kling_1_6_pro {
  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling16Pro,
      provider: Provider::Artcraft,
      start_frame: Some(ImageRef::MediaFileToken(dummy_token())),
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(5u16), Some(10)];
    let mut combos = 0;
    for &aspect_ratio in supported_aspect_ratios() {
      for &duration in &durations {
        for include_end_frame in [false, true] {
          let mut builder = base_builder();
          builder.aspect_ratio = aspect_ratio;
          builder.duration_seconds = duration;
          if include_end_frame {
            builder.end_frame = Some(ImageRef::MediaFileToken(dummy_token()));
          }
          let v1 = v1_cost(&builder);
          let v2 = v2_cost(builder.clone());
          assert_eq!(v1, v2, "artcraft kling_1_6_pro: ar={:?} dur={:?} end={} → v1={:?} v2={:?}",
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

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling21Pro,
      provider: Provider::Artcraft,
      start_frame: Some(ImageRef::MediaFileToken(dummy_token())),
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(5u16), Some(10)];
    let mut combos = 0;
    for &aspect_ratio in supported_aspect_ratios() {
      for &duration in &durations {
        for include_end_frame in [false, true] {
          let mut builder = base_builder();
          builder.aspect_ratio = aspect_ratio;
          builder.duration_seconds = duration;
          if include_end_frame {
            builder.end_frame = Some(ImageRef::MediaFileToken(dummy_token()));
          }
          let v1 = v1_cost(&builder);
          let v2 = v2_cost(builder.clone());
          assert_eq!(v1, v2, "artcraft kling_2_1_pro: ar={:?} dur={:?} end={} → v1={:?} v2={:?}",
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

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling21Master,
      provider: Provider::Artcraft,
      start_frame: Some(ImageRef::MediaFileToken(dummy_token())),
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(5u16), Some(10)];
    let mut combos = 0;
    for &aspect_ratio in supported_aspect_ratios() {
      for &duration in &durations {
        let mut builder = base_builder();
        builder.aspect_ratio = aspect_ratio;
        builder.duration_seconds = duration;
        let v1 = v1_cost(&builder);
        let v2 = v2_cost(builder.clone());
        assert_eq!(v1, v2, "artcraft kling_2_1_master: ar={:?} dur={:?} → v1={:?} v2={:?}",
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

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling2p5TurboPro,
      provider: Provider::Artcraft,
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(5u16), Some(10)];
    let mut combos = 0;
    for &aspect_ratio in supported_aspect_ratios() {
      for &duration in &durations {
        for has_start in [false, true] {
          for include_end in [false, true] {
            if include_end && !has_start { continue; }
            let mut builder = base_builder();
            builder.aspect_ratio = aspect_ratio;
            builder.duration_seconds = duration;
            if has_start {
              builder.start_frame = Some(ImageRef::MediaFileToken(dummy_token()));
            }
            if include_end {
              builder.end_frame = Some(ImageRef::MediaFileToken(dummy_token()));
            }
            let v1 = v1_cost(&builder);
            let v2 = v2_cost(builder.clone());
            assert_eq!(v1, v2, "artcraft kling_2_5_turbo_pro: ar={:?} dur={:?} start={} end={} → v1={:?} v2={:?}",
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

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling2p6Pro,
      provider: Provider::Artcraft,
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(5u16), Some(10)];
    let audios = [None, Some(true), Some(false)];
    let mut combos = 0;
    for &aspect_ratio in supported_aspect_ratios() {
      for &duration in &durations {
        for &generate_audio in &audios {
          for has_start in [false, true] {
            let mut builder = base_builder();
            builder.aspect_ratio = aspect_ratio;
            builder.duration_seconds = duration;
            builder.generate_audio = generate_audio;
            if has_start {
              builder.start_frame = Some(ImageRef::MediaFileToken(dummy_token()));
            }
            let v1 = v1_cost(&builder);
            let v2 = v2_cost(builder.clone());
            assert_eq!(v1, v2, "artcraft kling_2_6_pro: ar={:?} dur={:?} audio={:?} start={} → v1={:?} v2={:?}",
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

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling3p0Pro,
      provider: Provider::Artcraft,
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(3u16), Some(5), Some(10), Some(15)];
    let audios = [None, Some(true), Some(false)];
    let mut combos = 0;
    for &aspect_ratio in supported_aspect_ratios() {
      for &duration in &durations {
        for &generate_audio in &audios {
          for has_start in [false, true] {
            let mut builder = base_builder();
            builder.aspect_ratio = aspect_ratio;
            builder.duration_seconds = duration;
            builder.generate_audio = generate_audio;
            if has_start {
              builder.start_frame = Some(ImageRef::MediaFileToken(dummy_token()));
            }
            let v1 = v1_cost(&builder);
            let v2 = v2_cost(builder.clone());
            assert_eq!(v1, v2, "artcraft kling_3p0_pro: ar={:?} dur={:?} audio={:?} start={} → v1={:?} v2={:?}",
              aspect_ratio, duration, generate_audio, has_start, v1, v2);
            combos += 1;
          }
        }
      }
    }
    assert!(combos >= 150, "expected ≥150 combos, got {}", combos);
  }

  #[test]
  fn cost_parity_out_of_range_durations() {
    for &(d, strategy) in &[
      (2, RequestMismatchMitigationStrategy::PayLessDowngrade),
      (16, RequestMismatchMitigationStrategy::PayMoreUpgrade),
      (20, RequestMismatchMitigationStrategy::PayLessDowngrade),
    ] {
      let mut builder = base_builder();
      builder.duration_seconds = Some(d);
      builder.request_mismatch_mitigation_strategy = strategy;
      let v1 = v1_cost(&builder);
      let v2 = v2_cost(builder.clone());
      assert_eq!(v1, v2, "artcraft kling_3p0_pro out-of-range: d={} strat={:?} → v1={:?} v2={:?}", d, strategy, v1, v2);
    }
  }
}

// ── Kling 3.0 Standard ──

mod kling_3p0_standard {
  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Kling3p0Standard,
      provider: Provider::Artcraft,
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(3u16), Some(5), Some(10), Some(15)];
    let audios = [None, Some(true), Some(false)];
    let mut combos = 0;
    for &aspect_ratio in supported_aspect_ratios() {
      for &duration in &durations {
        for &generate_audio in &audios {
          for has_start in [false, true] {
            let mut builder = base_builder();
            builder.aspect_ratio = aspect_ratio;
            builder.duration_seconds = duration;
            builder.generate_audio = generate_audio;
            if has_start {
              builder.start_frame = Some(ImageRef::MediaFileToken(dummy_token()));
            }
            let v1 = v1_cost(&builder);
            let v2 = v2_cost(builder.clone());
            assert_eq!(v1, v2, "artcraft kling_3p0_standard: ar={:?} dur={:?} audio={:?} start={} → v1={:?} v2={:?}",
              aspect_ratio, duration, generate_audio, has_start, v1, v2);
            combos += 1;
          }
        }
      }
    }
    assert!(combos >= 150, "expected ≥150 combos, got {}", combos);
  }
}
