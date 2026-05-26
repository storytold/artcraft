//! Combinatorial cost-parity tests between v1 (`build().estimate_costs()`) and
//! v2 (`build2().estimate_cost()`) for the Artcraft-hosted image models.
//!
//! v2 routes everything through the omni-gen image endpoint with the common
//! field types; the server handles all model-specific transformations. v1
//! does the transformations client-side. Both pipelines must produce identical
//! cost estimates for every request shape that v1 accepts.
//!
//! v2 is intentionally permissive: it doesn't pre-validate aspect_ratio
//! mismatches with `ErrorOut` (the server does that on its side). v1 surfaces
//! those mismatches as errors. The parity helpers below short-circuit when
//! v1 errors out — we only assert parity when v1 produced a real cost.

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
    provider: Provider::Artcraft,
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

fn v1_cost(builder: &GenerateImageRequestBuilder) -> Option<u64> {
  builder.build().ok().and_then(|plan| plan.estimate_costs().cost_in_usd_cents)
}

fn v2_cost(builder: GenerateImageRequestBuilder) -> Option<u64> {
  builder.build2().ok()
    .and_then(|dor| dor.estimate_cost().ok())
    .and_then(|estimate| estimate.cost_in_usd_cents)
}

fn v1_credits(builder: &GenerateImageRequestBuilder) -> Option<u64> {
  builder.build().ok().and_then(|plan| plan.estimate_costs().cost_in_credits)
}

fn v2_credits(builder: GenerateImageRequestBuilder) -> Option<u64> {
  builder.build2().ok()
    .and_then(|dor| dor.estimate_cost().ok())
    .and_then(|estimate| estimate.cost_in_credits)
}

/// Assert v1 and v2 produce the same cost when v1 returns Some. When v1
/// errors out (e.g. unsupported aspect_ratio with ErrorOut strategy), v2 is
/// allowed to differ because the v2 endpoint is intentionally permissive —
/// the server handles validation.
fn assert_parity_when_v1_succeeds(builder: &GenerateImageRequestBuilder, msg: &str) {
  let v1 = v1_cost(builder);
  if let Some(expected) = v1 {
    let v2 = v2_cost(builder.clone());
    assert_eq!(v2, Some(expected), "cost mismatch ({}): v1={:?} v2={:?}", msg, v1, v2);

    let v1c = v1_credits(builder);
    let v2c = v2_credits(builder.clone());
    assert_eq!(v2c, v1c, "credits mismatch ({}): v1={:?} v2={:?}", msg, v1c, v2c);
  }
}

fn all_aspect_ratios() -> &'static [Option<CommonAspectRatio>] {
  &[
    None,
    Some(CommonAspectRatio::Auto),
    Some(CommonAspectRatio::Auto2k),
    Some(CommonAspectRatio::Auto3k),
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

fn all_image_inputs() -> Vec<Option<ImageListRef>> {
  vec![
    None,
    Some(ImageListRef::MediaFileTokens(vec![])),
  ]
}

// ── Flat-priced models ──

mod flat_priced_tests {
  use super::*;

  fn sweep(model: CommonImageModel) {
    let batches = [None, Some(1u16), Some(2), Some(3), Some(4)];
    for aspect_ratio in all_aspect_ratios() {
      for batch in &batches {
        for strategy in all_strategies() {
          for image_inputs in &all_image_inputs() {
            let builder = GenerateImageRequestBuilder {
              aspect_ratio: *aspect_ratio,
              image_batch_count: *batch,
              request_mismatch_mitigation_strategy: *strategy,
              image_inputs: image_inputs.clone(),
              ..base_builder(model)
            };
            assert_parity_when_v1_succeeds(
              &builder,
              &format!("model={:?} ar={:?} batch={:?} strat={:?}", model, aspect_ratio, batch, strategy),
            );
          }
        }
      }
    }
  }

  #[test]
  fn flux_1_dev_parity() { sweep(CommonImageModel::Flux1Dev); }

  #[test]
  fn flux_1_schnell_parity() { sweep(CommonImageModel::Flux1Schnell); }

  #[test]
  fn flux_pro_1p1_parity() { sweep(CommonImageModel::FluxPro11); }

  #[test]
  fn flux_pro_1p1_ultra_parity() { sweep(CommonImageModel::FluxPro11Ultra); }

  #[test]
  fn nano_banana_parity() { sweep(CommonImageModel::NanoBanana); }

  #[test]
  fn seedream_4_parity() { sweep(CommonImageModel::Seedream4); }

  #[test]
  fn seedream_4p5_parity() { sweep(CommonImageModel::Seedream4p5); }

  #[test]
  fn seedream_5_lite_parity() { sweep(CommonImageModel::Seedream5Lite); }

  #[test]
  fn out_of_range_batch_parity_for_flat_models() {
    let models = [
      CommonImageModel::Flux1Dev,
      CommonImageModel::FluxPro11,
      CommonImageModel::FluxPro11Ultra,
      CommonImageModel::NanoBanana,
      CommonImageModel::Seedream4,
      CommonImageModel::Seedream4p5,
      CommonImageModel::Seedream5Lite,
    ];
    for &model in &models {
      for &batch in &[5u16, 7, 100] {
        for &strategy in all_strategies() {
          let builder = GenerateImageRequestBuilder {
            image_batch_count: Some(batch),
            request_mismatch_mitigation_strategy: strategy,
            ..base_builder(model)
          };
          assert_parity_when_v1_succeeds(
            &builder,
            &format!("oor batch model={:?} batch={} strat={:?}", model, batch, strategy),
          );
        }
      }
    }
  }
}

// ── Resolution-priced: nano_banana_2 ──

mod nano_banana_2_tests {
  use super::*;

  fn all_resolutions() -> &'static [Option<CommonResolution>] {
    &[
      None,
      Some(CommonResolution::HalfK),
      Some(CommonResolution::OneK),
      Some(CommonResolution::TwoK),
      Some(CommonResolution::ThreeK),
      Some(CommonResolution::FourK),
      Some(CommonResolution::FourEightyP),
      Some(CommonResolution::SevenTwentyP),
      Some(CommonResolution::TenEightyP),
    ]
  }

  #[test]
  fn full_parity_sweep() {
    let batches = [None, Some(1u16), Some(2), Some(3), Some(4)];
    for resolution in all_resolutions() {
      for aspect_ratio in all_aspect_ratios() {
        for batch in &batches {
          for strategy in all_strategies() {
            for image_inputs in &all_image_inputs() {
              let builder = GenerateImageRequestBuilder {
                resolution: *resolution,
                aspect_ratio: *aspect_ratio,
                image_batch_count: *batch,
                request_mismatch_mitigation_strategy: *strategy,
                image_inputs: image_inputs.clone(),
                ..base_builder(CommonImageModel::NanoBanana2)
              };
              assert_parity_when_v1_succeeds(
                &builder,
                &format!("nb2 res={:?} ar={:?} batch={:?} strat={:?}", resolution, aspect_ratio, batch, strategy),
              );
            }
          }
        }
      }
    }
  }
}

// ── Resolution-priced: nano_banana_pro ──

mod nano_banana_pro_tests {
  use super::*;

  fn all_resolutions() -> &'static [Option<CommonResolution>] {
    &[
      None,
      Some(CommonResolution::HalfK),
      Some(CommonResolution::OneK),
      Some(CommonResolution::TwoK),
      Some(CommonResolution::ThreeK),
      Some(CommonResolution::FourK),
      Some(CommonResolution::FourEightyP),
      Some(CommonResolution::SevenTwentyP),
      Some(CommonResolution::TenEightyP),
    ]
  }

  #[test]
  fn full_parity_sweep() {
    let batches = [None, Some(1u16), Some(2), Some(3), Some(4)];
    for resolution in all_resolutions() {
      for aspect_ratio in all_aspect_ratios() {
        for batch in &batches {
          for strategy in all_strategies() {
            for image_inputs in &all_image_inputs() {
              let builder = GenerateImageRequestBuilder {
                resolution: *resolution,
                aspect_ratio: *aspect_ratio,
                image_batch_count: *batch,
                request_mismatch_mitigation_strategy: *strategy,
                image_inputs: image_inputs.clone(),
                ..base_builder(CommonImageModel::NanoBananaPro)
              };
              assert_parity_when_v1_succeeds(
                &builder,
                &format!("nbp res={:?} ar={:?} batch={:?} strat={:?}", resolution, aspect_ratio, batch, strategy),
              );
            }
          }
        }
      }
    }
  }
}

// ── Quality+size matrix: gpt_image_1 / 1p5 / 2 ──

mod gpt_image_tests {
  use super::*;
  use tokens::tokens::media_files::MediaFileToken;

  fn all_qualities() -> &'static [Option<CommonQuality>] {
    &[
      None,
      Some(CommonQuality::Low),
      Some(CommonQuality::Medium),
      Some(CommonQuality::High),
    ]
  }

  fn sweep_text(model: CommonImageModel) {
    let batches = [None, Some(1u16), Some(2), Some(3), Some(4)];
    for quality in all_qualities() {
      for aspect_ratio in all_aspect_ratios() {
        for batch in &batches {
          for strategy in all_strategies() {
            let builder = GenerateImageRequestBuilder {
              quality: *quality,
              aspect_ratio: *aspect_ratio,
              image_batch_count: *batch,
              request_mismatch_mitigation_strategy: *strategy,
              ..base_builder(model)
            };
            assert_parity_when_v1_succeeds(
              &builder,
              &format!("text model={:?} q={:?} ar={:?} batch={:?} strat={:?}", model, quality, aspect_ratio, batch, strategy),
            );
          }
        }
      }
    }
  }

  fn sweep_edit(model: CommonImageModel) {
    // For edit mode, parametrize over num_input_images since gpt_image_1
    // adds 2¢ per input image to the total cost.
    let qualities = [Some(CommonQuality::Low), Some(CommonQuality::Medium), Some(CommonQuality::High), None];
    let aspects = [
      None,
      Some(CommonAspectRatio::Square),
      Some(CommonAspectRatio::WideSixteenByNine),
      Some(CommonAspectRatio::TallNineBySixteen),
    ];
    for &quality in &qualities {
      for &aspect_ratio in &aspects {
        for num_inputs in [1usize, 2, 3, 5] {
          for &batch in &[Some(1u16), Some(2), Some(4)] {
            let tokens: Vec<MediaFileToken> = (0..num_inputs)
              .map(|i| MediaFileToken::new_from_str(&format!("mf_test{:028}", i)))
              .collect();
            let builder = GenerateImageRequestBuilder {
              quality,
              aspect_ratio,
              image_batch_count: batch,
              image_inputs: Some(ImageListRef::MediaFileTokens(tokens)),
              ..base_builder(model)
            };
            assert_parity_when_v1_succeeds(
              &builder,
              &format!("edit model={:?} q={:?} ar={:?} inputs={} batch={:?}", model, quality, aspect_ratio, num_inputs, batch),
            );
          }
        }
      }
    }
  }

  #[test]
  fn gpt_image_1_text_parity() { sweep_text(CommonImageModel::GptImage1); }

  #[test]
  fn gpt_image_1_edit_parity() { sweep_edit(CommonImageModel::GptImage1); }

  #[test]
  fn gpt_image_1p5_text_parity() { sweep_text(CommonImageModel::GptImage1p5); }

  #[test]
  fn gpt_image_1p5_edit_parity() { sweep_edit(CommonImageModel::GptImage1p5); }

  #[test]
  fn gpt_image_2_text_parity() { sweep_text(CommonImageModel::GptImage2); }

  #[test]
  fn gpt_image_2_edit_parity() { sweep_edit(CommonImageModel::GptImage2); }
}

// ── Angle models (Artcraft) ──
//
// v1 angle plans require exactly one input image (MediaFileToken). Cost is
// always 4¢ × num_images regardless of aspect ratio or angles. The parity
// sweep exercises the typical edit-mode input shape.

mod angle_models_tests {
  use super::*;
  use tokens::tokens::media_files::MediaFileToken;

  fn base_with_one_input(model: CommonImageModel) -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      image_inputs: Some(ImageListRef::MediaFileTokens(vec![
        MediaFileToken::new_from_str("mf_test"),
      ])),
      horizontal_angle: Some(45.0),
      vertical_angle: Some(-15.0),
      zoom: Some(2.0),
      ..base_builder(model)
    }
  }

  fn sweep(model: CommonImageModel) {
    let batches = [None, Some(1u16), Some(2), Some(3), Some(4)];
    for aspect_ratio in all_aspect_ratios() {
      for batch in &batches {
        for strategy in all_strategies() {
          let builder = GenerateImageRequestBuilder {
            aspect_ratio: *aspect_ratio,
            image_batch_count: *batch,
            request_mismatch_mitigation_strategy: *strategy,
            ..base_with_one_input(model)
          };
          assert_parity_when_v1_succeeds(
            &builder,
            &format!("angle model={:?} ar={:?} batch={:?} strat={:?}", model, aspect_ratio, batch, strategy),
          );
        }
      }
    }
  }

  #[test]
  fn qwen_edit_2511_angles_parity() { sweep(CommonImageModel::QwenEdit2511Angles); }

  #[test]
  fn flux_2_lora_angles_parity() { sweep(CommonImageModel::Flux2LoraAngles); }
}
