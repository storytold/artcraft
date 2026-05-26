//! Combinatorial cost-parity tests between v1 (`build().estimate_costs()`) and v2
//! (`build2().estimate_cost()`) for the Fal-hosted image models.
//!
//! Both pipelines must produce identical prices for every request shape we
//! expect routers to send. Image cost is simpler than video — it just scales
//! with `num_images` — but we still sweep aspect ratio + batch size + strategy
//! variations to catch any drift in the request plumbing.

#![cfg(test)]

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_image_model::CommonImageModel;
use crate::api::common_quality::CommonQuality;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::api::provider::Provider;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;

fn base_builder(model: CommonImageModel) -> GenerateImageRequestBuilder {
  GenerateImageRequestBuilder {
    model,
    provider: Provider::Fal,
    prompt: Some("a cat in space".to_string()),
    image_inputs: None,
    resolution: None,
    aspect_ratio: None,
    quality: None,
    image_batch_count: None,
    horizontal_angle: None,
    vertical_angle: None,
    zoom: None,
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
  }
}

/// Returns `Some(cost_in_usd_cents)` from the v1 pipeline. If v1 errors out
/// (e.g. unsupported batch size with `ErrorOut`), returns `None` so the
/// parity test compares apples to apples.
fn v1_cost(builder: &GenerateImageRequestBuilder) -> Option<u64> {
  builder
    .build()
    .ok()
    .and_then(|plan| plan.estimate_costs().cost_in_usd_cents)
}

/// Same as `v1_cost`, but for the v2 pipeline.
fn v2_cost(builder: GenerateImageRequestBuilder) -> Option<u64> {
  builder
    .build2()
    .ok()
    .and_then(|dor| dor.estimate_cost().ok())
    .and_then(|estimate| estimate.cost_in_usd_cents)
}

fn v1_credits(builder: &GenerateImageRequestBuilder) -> Option<u64> {
  builder
    .build()
    .ok()
    .and_then(|plan| plan.estimate_costs().cost_in_credits)
}

fn v2_credits(builder: GenerateImageRequestBuilder) -> Option<u64> {
  builder
    .build2()
    .ok()
    .and_then(|dor| dor.estimate_cost().ok())
    .and_then(|estimate| estimate.cost_in_credits)
}

fn all_aspect_ratios() -> &'static [Option<CommonAspectRatio>] {
  &[
    None,
    Some(CommonAspectRatio::Auto),
    Some(CommonAspectRatio::Auto2k),
    Some(CommonAspectRatio::Auto4k),
    Some(CommonAspectRatio::Square),
    Some(CommonAspectRatio::SquareHd),
    Some(CommonAspectRatio::WideFourByThree),
    Some(CommonAspectRatio::WideFiveByFour),
    Some(CommonAspectRatio::WideThreeByTwo),
    Some(CommonAspectRatio::WideSixteenByNine),
    Some(CommonAspectRatio::WideTwentyOneByNine),
    Some(CommonAspectRatio::Wide),
    Some(CommonAspectRatio::TallThreeByFour),
    Some(CommonAspectRatio::TallFourByFive),
    Some(CommonAspectRatio::TallTwoByThree),
    Some(CommonAspectRatio::TallNineBySixteen),
    Some(CommonAspectRatio::TallNineByTwentyOne),
    Some(CommonAspectRatio::Tall),
  ]
}

fn all_strategies() -> &'static [RequestMismatchMitigationStrategy] {
  &[
    RequestMismatchMitigationStrategy::ErrorOut,
    RequestMismatchMitigationStrategy::PayMoreUpgrade,
    RequestMismatchMitigationStrategy::PayLessDowngrade,
  ]
}

// ── Flux Pro 1.1 ──

mod flux_pro_1p1 {
  use super::*;

  fn base() -> GenerateImageRequestBuilder {
    base_builder(CommonImageModel::FluxPro11)
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let batches = [None, Some(1u16), Some(2), Some(3), Some(4)];
    let mut combos = 0;
    for &aspect_ratio in all_aspect_ratios() {
      for &batch in &batches {
        for &strategy in all_strategies() {
          let mut builder = base();
          builder.aspect_ratio = aspect_ratio;
          builder.image_batch_count = batch;
          builder.request_mismatch_mitigation_strategy = strategy;

          let v1 = v1_cost(&builder);
          let v2 = v2_cost(builder.clone());
          assert_eq!(
            v1, v2,
            "flux_pro_1p1 cost mismatch: ar={:?} batch={:?} strat={:?} → v1={:?} v2={:?}",
            aspect_ratio, batch, strategy, v1, v2,
          );

          let v1c = v1_credits(&builder);
          let v2c = v2_credits(builder.clone());
          assert_eq!(
            v1c, v2c,
            "flux_pro_1p1 credits mismatch: ar={:?} batch={:?} strat={:?} → v1={:?} v2={:?}",
            aspect_ratio, batch, strategy, v1c, v2c,
          );

          combos += 1;
        }
      }
    }
    assert_eq!(combos, all_aspect_ratios().len() * batches.len() * all_strategies().len());
  }

  #[test]
  fn cost_parity_out_of_range_batches() {
    // Batches above 4 should error on ErrorOut and clamp to Four otherwise.
    for &batch in &[5u16, 7, 10, 100] {
      for &strategy in all_strategies() {
        let mut builder = base();
        builder.image_batch_count = Some(batch);
        builder.request_mismatch_mitigation_strategy = strategy;
        let v1 = v1_cost(&builder);
        let v2 = v2_cost(builder.clone());
        assert_eq!(
          v1, v2,
          "flux_pro_1p1 out-of-range cost mismatch: batch={} strat={:?} → v1={:?} v2={:?}",
          batch, strategy, v1, v2,
        );
      }
    }
  }

  #[test]
  fn cost_parity_with_extra_fields_set() {
    // v1 ignores resolution/quality/horizontal_angle/etc., so v2 should too.
    let mut builder = base();
    builder.image_batch_count = Some(2);
    builder.resolution = Some(CommonResolution::TenEightyP);
    builder.quality = Some(CommonQuality::High);
    builder.horizontal_angle = Some(45.0);
    builder.vertical_angle = Some(15.0);
    builder.zoom = Some(2.0);
    assert_eq!(v1_cost(&builder), v2_cost(builder.clone()));
  }
}

// ── Flux Pro 1.1 Ultra ──

mod flux_pro_1p1_ultra {
  use super::*;

  fn base() -> GenerateImageRequestBuilder {
    base_builder(CommonImageModel::FluxPro11Ultra)
  }

  #[test]
  fn cost_parity_full_combinatorial() {
    let batches = [None, Some(1u16), Some(2), Some(3), Some(4)];
    let mut combos = 0;
    for &aspect_ratio in all_aspect_ratios() {
      for &batch in &batches {
        for &strategy in all_strategies() {
          let mut builder = base();
          builder.aspect_ratio = aspect_ratio;
          builder.image_batch_count = batch;
          builder.request_mismatch_mitigation_strategy = strategy;

          let v1 = v1_cost(&builder);
          let v2 = v2_cost(builder.clone());
          assert_eq!(
            v1, v2,
            "flux_pro_1p1_ultra cost mismatch: ar={:?} batch={:?} strat={:?} → v1={:?} v2={:?}",
            aspect_ratio, batch, strategy, v1, v2,
          );

          let v1c = v1_credits(&builder);
          let v2c = v2_credits(builder.clone());
          assert_eq!(
            v1c, v2c,
            "flux_pro_1p1_ultra credits mismatch: ar={:?} batch={:?} strat={:?} → v1={:?} v2={:?}",
            aspect_ratio, batch, strategy, v1c, v2c,
          );

          combos += 1;
        }
      }
    }
    assert_eq!(combos, all_aspect_ratios().len() * batches.len() * all_strategies().len());
  }

  #[test]
  fn cost_parity_out_of_range_batches() {
    for &batch in &[5u16, 7, 10, 100] {
      for &strategy in all_strategies() {
        let mut builder = base();
        builder.image_batch_count = Some(batch);
        builder.request_mismatch_mitigation_strategy = strategy;
        let v1 = v1_cost(&builder);
        let v2 = v2_cost(builder.clone());
        assert_eq!(
          v1, v2,
          "flux_pro_1p1_ultra out-of-range cost mismatch: batch={} strat={:?} → v1={:?} v2={:?}",
          batch, strategy, v1, v2,
        );
      }
    }
  }

  #[test]
  fn cost_parity_image_inputs_rejected_by_both() {
    // v1 errors on image_inputs (text-to-image only); v2 should match.
    let mut builder = base();
    builder.image_inputs = Some(ImageListRef::Urls(vec!["https://example.com/x.jpg".to_string()]));
    assert_eq!(v1_cost(&builder), None);
    assert_eq!(v2_cost(builder), None);
  }
}
