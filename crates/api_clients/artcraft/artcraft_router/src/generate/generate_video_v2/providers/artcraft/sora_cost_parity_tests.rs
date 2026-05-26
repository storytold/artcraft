//! Combinatorial cost-parity tests between v1 (`build().estimate_costs()`) and v2
//! (`build2().estimate_cost()`) for the Artcraft-hosted Sora 2 / Sora 2 Pro models.

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

// ── Sora 2 ──

mod sora_2 {
  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Sora2,
      provider: Provider::Artcraft,
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(4u16), Some(8), Some(12)];
    let resolutions = [None, Some(CommonResolution::SevenTwentyP)];
    let mut combos = 0;
    for &aspect_ratio in supported_aspect_ratios() {
      for &resolution in &resolutions {
        for &duration in &durations {
          for has_start in [false, true] {
            let mut builder = base_builder();
            builder.aspect_ratio = aspect_ratio;
            builder.resolution = resolution;
            builder.duration_seconds = duration;
            if has_start {
              builder.start_frame = Some(ImageRef::MediaFileToken(dummy_token()));
            }
            let v1 = v1_cost(&builder);
            let v2 = v2_cost(builder.clone());
            assert_eq!(v1, v2, "artcraft sora_2: ar={:?} res={:?} dur={:?} start={} → v1={:?} v2={:?}",
              aspect_ratio, resolution, duration, has_start, v1, v2);
            combos += 1;
          }
        }
      }
    }
    assert_eq!(combos, 5 * 2 * 4 * 2);
  }
}

// ── Sora 2 Pro ──

mod sora_2_pro {
  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Sora2Pro,
      provider: Provider::Artcraft,
      ..Default::default()
    }
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let durations = [None, Some(4u16), Some(8), Some(12)];
    let resolutions = [None, Some(CommonResolution::SevenTwentyP), Some(CommonResolution::TenEightyP)];
    let mut combos = 0;
    for &aspect_ratio in supported_aspect_ratios() {
      for &resolution in &resolutions {
        for &duration in &durations {
          for has_start in [false, true] {
            let mut builder = base_builder();
            builder.aspect_ratio = aspect_ratio;
            builder.resolution = resolution;
            builder.duration_seconds = duration;
            if has_start {
              builder.start_frame = Some(ImageRef::MediaFileToken(dummy_token()));
            }
            let v1 = v1_cost(&builder);
            let v2 = v2_cost(builder.clone());
            assert_eq!(v1, v2, "artcraft sora_2_pro: ar={:?} res={:?} dur={:?} start={} → v1={:?} v2={:?}",
              aspect_ratio, resolution, duration, has_start, v1, v2);
            combos += 1;
          }
        }
      }
    }
    assert_eq!(combos, 5 * 3 * 4 * 2);
  }
}
