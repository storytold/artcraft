//! Combinatorial cost-parity tests between v1 (`build().estimate_costs()`) and v2
//! (`build2().estimate_cost()`) for the Artcraft-hosted Veo video models.
//!
//! All 5 Veo variants run on the v2 omni-gen path, but each owns its own
//! pricing formula in v2 (mirroring the v1 plan-based price). These tests
//! prove the new formula reproduces v1 prices across every shape we expect
//! routers to send.

#![cfg(test)]

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::common_video_model::CommonVideoModel;
use crate::api::image_ref::ImageRef;
use crate::api::provider::Provider;
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
    Some(CommonAspectRatio::Auto),
    Some(CommonAspectRatio::WideSixteenByNine),
    Some(CommonAspectRatio::TallNineBySixteen),
    Some(CommonAspectRatio::Square),
  ]
}

fn resolutions() -> &'static [Option<CommonResolution>] {
  &[None, Some(CommonResolution::SevenTwentyP), Some(CommonResolution::TenEightyP)]
}

// ── Veo 2 ──

mod veo_2 {
  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Veo2,
      provider: Provider::Artcraft,
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(5u16), Some(6), Some(7), Some(8)];
    let mut combos = 0;
    for &aspect_ratio in supported_aspect_ratios() {
      for &duration in &durations {
        for has_start in [false, true] {
          let mut builder = base_builder();
          builder.aspect_ratio = aspect_ratio;
          builder.duration_seconds = duration;
          if has_start {
            builder.start_frame = Some(ImageRef::MediaFileToken(dummy_token()));
          }
          let v1 = v1_cost(&builder);
          let v2 = v2_cost(builder.clone());
          assert_eq!(v1, v2, "artcraft veo_2: ar={:?} dur={:?} start={} → v1={:?} v2={:?}",
            aspect_ratio, duration, has_start, v1, v2);
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
      provider: Provider::Artcraft,
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(4u16), Some(6), Some(8)];
    let audios = [None, Some(true), Some(false)];
    let mut combos = 0;
    for &aspect_ratio in supported_aspect_ratios() {
      for &resolution in resolutions() {
        for &duration in &durations {
          for &generate_audio in &audios {
            for has_start in [false, true] {
              let mut builder = base_builder();
              builder.aspect_ratio = aspect_ratio;
              builder.resolution = resolution;
              builder.duration_seconds = duration;
              builder.generate_audio = generate_audio;
              if has_start {
                builder.start_frame = Some(ImageRef::MediaFileToken(dummy_token()));
              }
              let v1 = v1_cost(&builder);
              let v2 = v2_cost(builder.clone());
              assert_eq!(v1, v2, "artcraft veo_3: ar={:?} res={:?} dur={:?} audio={:?} start={} → v1={:?} v2={:?}",
                aspect_ratio, resolution, duration, generate_audio, has_start, v1, v2);
              combos += 1;
            }
          }
        }
      }
    }
    assert!(combos >= 200, "expected ≥200 combos, got {}", combos);
  }
}

// ── Veo 3 Fast ──

mod veo_3_fast {
  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Veo3Fast,
      provider: Provider::Artcraft,
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    // Veo 3 Fast accepts only Some(8) — anything else with non-ErrorOut clamps to 8.
    let durations = [None, Some(8u16)];
    let audios = [None, Some(true), Some(false)];
    let mut combos = 0;
    for &aspect_ratio in supported_aspect_ratios() {
      for &resolution in resolutions() {
        for &duration in &durations {
          for &generate_audio in &audios {
            for has_start in [false, true] {
              let mut builder = base_builder();
              builder.aspect_ratio = aspect_ratio;
              builder.resolution = resolution;
              builder.duration_seconds = duration;
              builder.generate_audio = generate_audio;
              if has_start {
                builder.start_frame = Some(ImageRef::MediaFileToken(dummy_token()));
              }
              let v1 = v1_cost(&builder);
              let v2 = v2_cost(builder.clone());
              assert_eq!(v1, v2, "artcraft veo_3_fast: ar={:?} res={:?} dur={:?} audio={:?} start={} → v1={:?} v2={:?}",
                aspect_ratio, resolution, duration, generate_audio, has_start, v1, v2);
              combos += 1;
            }
          }
        }
      }
    }
    assert!(combos >= 100, "expected ≥100 combos, got {}", combos);
  }
}

// ── Veo 3.1 ──

mod veo_3p1 {
  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Veo3p1,
      provider: Provider::Artcraft,
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(4u16), Some(6), Some(8)];
    let audios = [None, Some(true), Some(false)];
    let mut combos = 0;
    for &aspect_ratio in supported_aspect_ratios() {
      for &resolution in resolutions() {
        for &duration in &durations {
          for &generate_audio in &audios {
            for has_start in [false, true] {
              let mut builder = base_builder();
              builder.aspect_ratio = aspect_ratio;
              builder.resolution = resolution;
              builder.duration_seconds = duration;
              builder.generate_audio = generate_audio;
              if has_start {
                builder.start_frame = Some(ImageRef::MediaFileToken(dummy_token()));
              }
              let v1 = v1_cost(&builder);
              let v2 = v2_cost(builder.clone());
              assert_eq!(v1, v2, "artcraft veo_3p1: ar={:?} res={:?} dur={:?} audio={:?} start={} → v1={:?} v2={:?}",
                aspect_ratio, resolution, duration, generate_audio, has_start, v1, v2);
              combos += 1;
            }
          }
        }
      }
    }
    assert!(combos >= 200, "expected ≥200 combos, got {}", combos);
  }
}

// ── Veo 3.1 Fast ──

mod veo_3p1_fast {
  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Veo3p1Fast,
      provider: Provider::Artcraft,
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(4u16), Some(6), Some(8)];
    let audios = [None, Some(true), Some(false)];
    let mut combos = 0;
    for &aspect_ratio in supported_aspect_ratios() {
      for &resolution in resolutions() {
        for &duration in &durations {
          for &generate_audio in &audios {
            for has_start in [false, true] {
              let mut builder = base_builder();
              builder.aspect_ratio = aspect_ratio;
              builder.resolution = resolution;
              builder.duration_seconds = duration;
              builder.generate_audio = generate_audio;
              if has_start {
                builder.start_frame = Some(ImageRef::MediaFileToken(dummy_token()));
              }
              let v1 = v1_cost(&builder);
              let v2 = v2_cost(builder.clone());
              assert_eq!(v1, v2, "artcraft veo_3p1_fast: ar={:?} res={:?} dur={:?} audio={:?} start={} → v1={:?} v2={:?}",
                aspect_ratio, resolution, duration, generate_audio, has_start, v1, v2);
              combos += 1;
            }
          }
        }
      }
    }
    assert!(combos >= 200, "expected ≥200 combos, got {}", combos);
  }
}
