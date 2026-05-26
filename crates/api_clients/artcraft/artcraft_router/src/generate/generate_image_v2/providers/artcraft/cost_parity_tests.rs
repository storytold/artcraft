//! Strict combinatorial cost-parity tests between v1 (`build().estimate_costs()`)
//! and v2 (`build2().estimate_cost()`) for every Artcraft image model.
//!
//! All sweeps use `PayMoreUpgrade` so v1 falls back to nearest-supported
//! options instead of erroring out — this lets us assert strict `v1 == v2`
//! parity across the full input domain. Both cents and credits are checked.
//! Tests cover text-to-image AND image-to-image paths.
//!
//! If a sweep starts failing: don't `#[ignore]`. Either fix the v2 cost
//! calculator to match v1, or fix the v1 plan, until both agree.

#![cfg(test)]

use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_image_model::CommonImageModel;
use crate::api::common_quality::CommonQuality;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::api::provider::Provider;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use tokens::tokens::media_files::MediaFileToken;

// ── Shared sweep dimensions ────────────────────────────────────────────────

const BATCHES: &[Option<u16>] = &[
  None,
  Some(1),
  Some(2),
  Some(3),
  Some(4),
];

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

fn all_qualities() -> &'static [Option<CommonQuality>] {
  &[
    None,
    Some(CommonQuality::Low),
    Some(CommonQuality::Medium),
    Some(CommonQuality::High),
  ]
}

/// MediaFileTokens at lengths 0/1/2/3 for sweeping the input-count axis.
/// `None` is the text-to-image path; tokens are the image-to-image path.
/// (Artcraft accepts only MediaFileTokens — URL form is rejected.)
fn t2i_and_i2i_inputs() -> Vec<Option<ImageListRef>> {
  vec![
    None,
    Some(ImageListRef::MediaFileTokens(vec![])),
    Some(ImageListRef::MediaFileTokens(vec![token(0)])),
    Some(ImageListRef::MediaFileTokens(vec![token(0), token(1)])),
    Some(ImageListRef::MediaFileTokens(vec![token(0), token(1), token(2)])),
  ]
}

/// Angle models reject empty/missing inputs in both v1 and v2 — restrict the
/// sweep to non-empty MediaFileTokens shapes that both pipelines accept.
fn angle_inputs() -> Vec<Option<ImageListRef>> {
  vec![
    Some(ImageListRef::MediaFileTokens(vec![token(0)])),
    Some(ImageListRef::MediaFileTokens(vec![token(0), token(1)])),
    Some(ImageListRef::MediaFileTokens(vec![token(0), token(1), token(2)])),
  ]
}

fn token(i: usize) -> MediaFileToken {
  MediaFileToken::new_from_str(&format!("mf_test{:028}", i))
}

// ── Builder + parity helpers ───────────────────────────────────────────────

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
    // PayMoreUpgrade so v1 gracefully degrades on unsupported options instead
    // of erroring — strict parity holds across the full sweep.
    request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::PayMoreUpgrade,
    generation_mode_mismatch_strategy: None,
    idempotency_token: None,
  }
}

fn assert_strict_cost_parity(builder: &GenerateImageRequestBuilder, msg: &str) {
  let v1_plan = builder.build();
  let v2_dor = builder.clone().build2();

  match (&v1_plan, &v2_dor) {
    (Ok(_), Ok(_)) => {}
    (Err(_), Err(_)) => return,
    (Ok(_), Err(e)) => panic!("{} — v1 succeeded but v2 errored: {:?}", msg, e),
    (Err(e), Ok(_)) => panic!("{} — v2 succeeded but v1 errored: {:?}", msg, e),
  }
  let v1_estimate = v1_plan.unwrap().estimate_costs();
  let v2_estimate = v2_dor.unwrap().estimate_cost().expect("v2 estimate_cost should succeed");

  assert_eq!(
    v2_estimate.cost_in_usd_cents, v1_estimate.cost_in_usd_cents,
    "{} — cost_in_usd_cents mismatch (v1={:?}, v2={:?})",
    msg, v1_estimate.cost_in_usd_cents, v2_estimate.cost_in_usd_cents,
  );
  assert_eq!(
    v2_estimate.cost_in_credits, v1_estimate.cost_in_credits,
    "{} — cost_in_credits mismatch (v1={:?}, v2={:?})",
    msg, v1_estimate.cost_in_credits, v2_estimate.cost_in_credits,
  );
  assert_eq!(
    v2_estimate.is_free, v1_estimate.is_free,
    "{} — is_free mismatch (v1={}, v2={})",
    msg, v1_estimate.is_free, v2_estimate.is_free,
  );
  assert_eq!(
    v2_estimate.is_unlimited, v1_estimate.is_unlimited,
    "{} — is_unlimited mismatch (v1={}, v2={})",
    msg, v1_estimate.is_unlimited, v2_estimate.is_unlimited,
  );
}

// ── Flat-priced (aspect × batch × inputs) ──────────────────────────────────

mod flat_priced_tests {
  use super::*;

  fn sweep(model: CommonImageModel) {
    for aspect_ratio in all_aspect_ratios() {
      for batch in BATCHES {
        for image_inputs in &t2i_and_i2i_inputs() {
          let builder = GenerateImageRequestBuilder {
            aspect_ratio: *aspect_ratio,
            image_batch_count: *batch,
            image_inputs: image_inputs.clone(),
            ..base_builder(model)
          };
          assert_strict_cost_parity(
            &builder,
            &format!(
              "{:?} ar={:?} batch={:?} inputs={:?}",
              model, aspect_ratio, batch, image_inputs,
            ),
          );
        }
      }
    }
  }

  #[test] fn flux_1_dev_parity() { sweep(CommonImageModel::Flux1Dev); }
  #[test] fn flux_1_schnell_parity() { sweep(CommonImageModel::Flux1Schnell); }
  #[test] fn flux_pro_1p1_parity() { sweep(CommonImageModel::FluxPro11); }
  #[test] fn flux_pro_1p1_ultra_parity() { sweep(CommonImageModel::FluxPro11Ultra); }
  #[test] fn nano_banana_parity() { sweep(CommonImageModel::NanoBanana); }
  #[test] fn seedream_4_parity() { sweep(CommonImageModel::Seedream4); }
  #[test] fn seedream_4p5_parity() { sweep(CommonImageModel::Seedream4p5); }
  #[test] fn seedream_5_lite_aspect_parity() { sweep(CommonImageModel::Seedream5Lite); }
}

// ── Resolution-priced (aspect × batch × resolution × inputs) ───────────────

mod resolution_priced_tests {
  use super::*;

  fn sweep(model: CommonImageModel) {
    for resolution in all_resolutions() {
      for aspect_ratio in all_aspect_ratios() {
        for batch in BATCHES {
          for image_inputs in &t2i_and_i2i_inputs() {
            let builder = GenerateImageRequestBuilder {
              resolution: *resolution,
              aspect_ratio: *aspect_ratio,
              image_batch_count: *batch,
              image_inputs: image_inputs.clone(),
              ..base_builder(model)
            };
            assert_strict_cost_parity(
              &builder,
              &format!(
                "{:?} res={:?} ar={:?} batch={:?} inputs={:?}",
                model, resolution, aspect_ratio, batch, image_inputs,
              ),
            );
          }
        }
      }
    }
  }

  #[test] fn nano_banana_2_parity() { sweep(CommonImageModel::NanoBanana2); }
  #[test] fn nano_banana_pro_parity() { sweep(CommonImageModel::NanoBananaPro); }

  // Seedream 5 Lite cost is num_images-only, but the build path varies by
  // resolution (Auto2k vs Auto3k fallback for the bare-Auto case). Sweep
  // resolution too to make sure neither side derives a stray cost from it.
  #[test] fn seedream_5_lite_resolution_parity() { sweep(CommonImageModel::Seedream5Lite); }
}

// ── Quality+size matrix (aspect × quality × batch × inputs) ────────────────

mod quality_priced_tests {
  use super::*;

  fn sweep(model: CommonImageModel) {
    for quality in all_qualities() {
      for aspect_ratio in all_aspect_ratios() {
        for batch in BATCHES {
          for image_inputs in &t2i_and_i2i_inputs() {
            let builder = GenerateImageRequestBuilder {
              quality: *quality,
              aspect_ratio: *aspect_ratio,
              image_batch_count: *batch,
              image_inputs: image_inputs.clone(),
              ..base_builder(model)
            };
            assert_strict_cost_parity(
              &builder,
              &format!(
                "{:?} q={:?} ar={:?} batch={:?} inputs={:?}",
                model, quality, aspect_ratio, batch, image_inputs,
              ),
            );
          }
        }
      }
    }
  }

  #[test] fn gpt_image_1_parity() { sweep(CommonImageModel::GptImage1); }
  #[test] fn gpt_image_1p5_parity() { sweep(CommonImageModel::GptImage1p5); }
  #[test] fn gpt_image_2_parity() { sweep(CommonImageModel::GptImage2); }
}

// ── Angle models (require ≥1 input; sweep angles × aspect × batch) ─────────

mod angle_tests {
  use super::*;

  const ANGLES: &[Option<f64>] = &[None, Some(-45.0), Some(0.0), Some(45.0)];
  const ZOOMS: &[Option<f64>] = &[None, Some(0.0), Some(2.0)];

  fn sweep(model: CommonImageModel) {
    for inputs in &angle_inputs() {
      for aspect_ratio in all_aspect_ratios() {
        for batch in BATCHES {
          for h in ANGLES {
            for v in ANGLES {
              for z in ZOOMS {
                let builder = GenerateImageRequestBuilder {
                  image_inputs: inputs.clone(),
                  aspect_ratio: *aspect_ratio,
                  image_batch_count: *batch,
                  horizontal_angle: *h,
                  vertical_angle: *v,
                  zoom: *z,
                  ..base_builder(model)
                };
                assert_strict_cost_parity(
                  &builder,
                  &format!(
                    "{:?} ar={:?} batch={:?} h={:?} v={:?} z={:?} inputs={:?}",
                    model, aspect_ratio, batch, h, v, z, inputs,
                  ),
                );
              }
            }
          }
        }
      }
    }
  }

  #[test] fn qwen_edit_2511_angles_parity() { sweep(CommonImageModel::QwenEdit2511Angles); }
  #[test] fn flux_2_lora_angles_parity() { sweep(CommonImageModel::Flux2LoraAngles); }
}
