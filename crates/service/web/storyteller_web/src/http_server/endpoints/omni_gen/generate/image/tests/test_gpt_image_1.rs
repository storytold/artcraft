//! Tests for omni-gen against the GPT Image 1 model.
//!
//! GPT Image 1 is multi-function: text-to-image and image-to-image (edit).
//! The omni-gen distillation routes through Fal for the execution plan and
//! Artcraft for billing.
//!
//! Artcraft-tier pricing (the rate the user is billed):
//!
//!   Output image cost (per output image):
//!     Low    – 2¢ (square/unset) / 2¢ (wide or tall)
//!     Medium – 5¢ (square/unset) / 7¢ (wide or tall)
//!     High   – 17¢ (square/unset) / 25¢ (wide or tall)
//!     None   → defaults to High
//!
//!   Input image cost (edit mode only, per input image):
//!     2¢ per input image (high-fidelity token estimate)
//!
//! The Fal execution plan maps quality from the omni request (defaulting to
//! Medium when unspecified) and maps aspect ratios to three image sizes:
//! Square (1024×1024), Horizontal (1536×1024), Vertical (1024×1536).
//! Auto/unset maps to None (API default).

#[cfg(test)]
mod tests {
  use std::collections::HashMap;

  use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
  use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
  use enums::common::generation::common_image_model::CommonImageModel;
  use enums::common::generation::common_quality::CommonQuality;
  use tokens::tokens::media_files::MediaFileToken;
  use url::Url;

  use crate::http_server::endpoints::omni_gen::generate::image::distill_image_request::{
    distill_image_request, DistilledImageRequest,
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  fn make_request(
    prompt: Option<&str>,
    aspect_ratio: Option<CommonAspectRatio>,
    quality: Option<CommonQuality>,
    image_batch_count: Option<u16>,
    image_media_tokens: Option<Vec<MediaFileToken>>,
  ) -> OmniGenImageCostAndGenerateRequest {
    OmniGenImageCostAndGenerateRequest {
      idempotency_token: Some("11111111-1111-1111-1111-111111111111".to_string()),
      model: Some(CommonImageModel::GptImage1),
      prompt: prompt.map(|s| s.to_string()),
      image_media_tokens,
      resolution: None,
      aspect_ratio,
      quality,
      image_batch_count,
      adjust_horizontal_angle: None,
      adjust_vertical_angle: None,
      adjust_zoom: None,
    }
  }

  fn fake_image_refs(n: usize) -> (Vec<MediaFileToken>, HashMap<MediaFileToken, Url>) {
    let mut tokens = Vec::with_capacity(n);
    let mut map = HashMap::with_capacity(n);
    for i in 0..n {
      let token = MediaFileToken::new_from_str(&format!("mf_test{:028}", i));
      let url = Url::parse(&format!("https://fake.example.com/img{}.png", i)).unwrap();
      map.insert(token.clone(), url);
      tokens.push(token);
    }
    (tokens, map)
  }

  fn distill_text(request: &OmniGenImageCostAndGenerateRequest) -> DistilledImageRequest {
    let empty: HashMap<MediaFileToken, Url> = HashMap::new();
    distill_image_request(request, Some(&empty))
      .expect("distill_image_request should succeed for GPT Image 1 (text)")
  }

  fn distill_edit(
    request: &OmniGenImageCostAndGenerateRequest,
    hydration: &HashMap<MediaFileToken, Url>,
  ) -> DistilledImageRequest {
    distill_image_request(request, Some(hydration))
      .expect("distill_image_request should succeed for GPT Image 1 (edit)")
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   COST
  // ────────────────────────────────────────────────────────────────────────────
  mod cost {
    use super::*;

    mod text {
      use super::*;

      fn cost(
        quality: Option<CommonQuality>,
        aspect_ratio: Option<CommonAspectRatio>,
        batch: Option<u16>,
      ) -> u64 {
        let request = make_request(Some("p"), aspect_ratio, quality, batch, None);
        distill_text(&request).cost.cost_in_usd_cents.unwrap()
      }

      // ── Default quality (None → High) ────────────────────────────────────

      #[test]
      fn default_quality_square_costs_17() {
        assert_eq!(cost(None, Some(CommonAspectRatio::Square), Some(1)), 17);
      }

      #[test]
      fn default_quality_wide_costs_25() {
        assert_eq!(cost(None, Some(CommonAspectRatio::WideSixteenByNine), Some(1)), 25);
      }

      #[test]
      fn default_quality_tall_costs_25() {
        assert_eq!(cost(None, Some(CommonAspectRatio::TallNineBySixteen), Some(1)), 25);
      }

      #[test]
      fn default_quality_unset_size_costs_17() {
        // Unset aspect_ratio → None image_size → treated as square = 17¢
        assert_eq!(cost(None, None, Some(1)), 17);
      }

      #[test]
      fn default_quality_auto_costs_17() {
        assert_eq!(cost(None, Some(CommonAspectRatio::Auto), Some(1)), 17);
      }

      // ── Low quality (2¢/image regardless of size) ────────────────────────

      #[test]
      fn low_square_costs_2() {
        assert_eq!(cost(Some(CommonQuality::Low), Some(CommonAspectRatio::Square), Some(1)), 2);
      }

      #[test]
      fn low_wide_costs_2() {
        assert_eq!(cost(Some(CommonQuality::Low), Some(CommonAspectRatio::WideSixteenByNine), Some(1)), 2);
      }

      #[test]
      fn low_tall_costs_2() {
        assert_eq!(cost(Some(CommonQuality::Low), Some(CommonAspectRatio::TallNineBySixteen), Some(1)), 2);
      }

      #[test]
      fn low_unset_costs_2() {
        assert_eq!(cost(Some(CommonQuality::Low), None, Some(1)), 2);
      }

      #[test]
      fn low_four_images_costs_8() {
        assert_eq!(cost(Some(CommonQuality::Low), None, Some(4)), 8);
      }

      #[test]
      fn low_batch_above_max_clamps_to_8() {
        assert_eq!(cost(Some(CommonQuality::Low), None, Some(7)), 8);
      }

      // ── Medium quality (5¢ square, 7¢ wide/tall) ─────────────────────────

      #[test]
      fn medium_square_costs_5() {
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), Some(1)), 5);
      }

      #[test]
      fn medium_wide_costs_7() {
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideSixteenByNine), Some(1)), 7);
      }

      #[test]
      fn medium_tall_costs_7() {
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::TallNineBySixteen), Some(1)), 7);
      }

      #[test]
      fn medium_unset_costs_5() {
        assert_eq!(cost(Some(CommonQuality::Medium), None, Some(1)), 5);
      }

      #[test]
      fn medium_square_four_images_costs_20() {
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), Some(4)), 20);
      }

      #[test]
      fn medium_wide_four_images_costs_28() {
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideSixteenByNine), Some(4)), 28);
      }

      // ── High quality (17¢ square, 25¢ wide/tall) ─────────────────────────

      #[test]
      fn high_square_costs_17() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(1)), 17);
      }

      #[test]
      fn high_wide_costs_25() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::WideSixteenByNine), Some(1)), 25);
      }

      #[test]
      fn high_tall_costs_25() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::TallNineBySixteen), Some(1)), 25);
      }

      #[test]
      fn high_unset_costs_17() {
        assert_eq!(cost(Some(CommonQuality::High), None, Some(1)), 17);
      }

      #[test]
      fn high_square_four_images_costs_68() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(4)), 68);
      }

      #[test]
      fn high_wide_four_images_costs_100() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::WideSixteenByNine), Some(4)), 100);
      }

      #[test]
      fn high_batch_above_max_clamps_to_four() {
        assert_eq!(cost(Some(CommonQuality::High), None, Some(9)), 68);
      }

      // ── Batch scaling ────────────────────────────────────────────────────

      #[test]
      fn high_square_batch_scaling() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(1)), 17);
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(2)), 34);
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(3)), 51);
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(4)), 68);
      }

      // ── Metadata flags ───────────────────────────────────────────────────

      #[test]
      fn cost_metadata_flags_are_default() {
        let request = make_request(Some("p"), None, None, Some(1), None);
        let distilled = distill_text(&request);
        assert!(!distilled.cost.is_free);
        assert!(!distilled.cost.is_unlimited);
        assert!(!distilled.cost.is_rate_limited);
        assert!(!distilled.cost.has_watermark);
      }

      // ── Cost is independent of prompt ─────────────────────────────────────

      #[test]
      fn cost_is_independent_of_prompt() {
        let with_prompt = distill_text(&make_request(Some("a cat"), None, None, Some(1), None));
        let without_prompt = distill_text(&make_request(None, None, None, Some(1), None));
        assert_eq!(with_prompt.cost.cost_in_usd_cents, without_prompt.cost.cost_in_usd_cents);
      }
    }

    mod edit {
      use super::*;

      fn cost_edit(
        quality: Option<CommonQuality>,
        aspect_ratio: Option<CommonAspectRatio>,
        batch: Option<u16>,
        num_input_images: usize,
      ) -> u64 {
        let (tokens, hydration) = fake_image_refs(num_input_images);
        let request = make_request(Some("p"), aspect_ratio, quality, batch, Some(tokens));
        distill_edit(&request, &hydration).cost.cost_in_usd_cents.unwrap()
      }

      // ── Input image cost adds 2¢ per input ──────────────────────────────

      #[test]
      fn edit_high_square_one_output_one_input() {
        // 17¢ output + 1×2¢ input = 19¢
        assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(1), 1), 19);
      }

      #[test]
      fn edit_high_square_one_output_three_inputs() {
        // 17¢ output + 3×2¢ input = 23¢
        assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(1), 3), 23);
      }

      #[test]
      fn edit_high_square_one_output_five_inputs() {
        // 17¢ output + 5×2¢ input = 27¢
        assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(1), 5), 27);
      }

      #[test]
      fn edit_high_wide_two_outputs_one_input() {
        // 2×25¢ output + 1×2¢ input = 52¢
        assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::WideSixteenByNine), Some(2), 1), 52);
      }

      #[test]
      fn edit_medium_wide_two_outputs_five_inputs() {
        // 2×7¢ output + 5×2¢ input = 24¢
        assert_eq!(cost_edit(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideSixteenByNine), Some(2), 5), 24);
      }

      #[test]
      fn edit_low_square_one_output_two_inputs() {
        // 2¢ output + 2×2¢ input = 6¢
        assert_eq!(cost_edit(Some(CommonQuality::Low), Some(CommonAspectRatio::Square), Some(1), 2), 6);
      }

      #[test]
      fn edit_low_tall_four_outputs_one_input() {
        // 4×2¢ output + 1×2¢ input = 10¢
        assert_eq!(cost_edit(Some(CommonQuality::Low), Some(CommonAspectRatio::TallNineBySixteen), Some(4), 1), 10);
      }

      // ── Default quality in edit mode (None → High) ──────────────────────

      #[test]
      fn edit_default_quality_square_one_output_one_input() {
        // 17¢ output + 2¢ input = 19¢
        assert_eq!(cost_edit(None, Some(CommonAspectRatio::Square), Some(1), 1), 19);
      }

      #[test]
      fn edit_default_quality_wide_one_output_one_input() {
        // 25¢ output + 2¢ input = 27¢
        assert_eq!(cost_edit(None, Some(CommonAspectRatio::WideSixteenByNine), Some(1), 1), 27);
      }

      // ── Quality × size matrix in edit mode (1 output, 1 input) ──────────

      #[test]
      fn edit_low_square() {
        // 2¢ + 2¢ = 4¢
        assert_eq!(cost_edit(Some(CommonQuality::Low), Some(CommonAspectRatio::Square), Some(1), 1), 4);
      }

      #[test]
      fn edit_low_wide() {
        // 2¢ + 2¢ = 4¢
        assert_eq!(cost_edit(Some(CommonQuality::Low), Some(CommonAspectRatio::WideSixteenByNine), Some(1), 1), 4);
      }

      #[test]
      fn edit_medium_square() {
        // 5¢ + 2¢ = 7¢
        assert_eq!(cost_edit(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), Some(1), 1), 7);
      }

      #[test]
      fn edit_medium_wide() {
        // 7¢ + 2¢ = 9¢
        assert_eq!(cost_edit(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideSixteenByNine), Some(1), 1), 9);
      }

      #[test]
      fn edit_medium_tall() {
        // 7¢ + 2¢ = 9¢
        assert_eq!(cost_edit(Some(CommonQuality::Medium), Some(CommonAspectRatio::TallNineBySixteen), Some(1), 1), 9);
      }

      #[test]
      fn edit_high_square() {
        // 17¢ + 2¢ = 19¢
        assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(1), 1), 19);
      }

      #[test]
      fn edit_high_wide() {
        // 25¢ + 2¢ = 27¢
        assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::WideSixteenByNine), Some(1), 1), 27);
      }

      #[test]
      fn edit_high_tall() {
        // 25¢ + 2¢ = 27¢
        assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::TallNineBySixteen), Some(1), 1), 27);
      }

      // ── Batch above max clamps ──────────────────────────────────────────

      #[test]
      fn edit_batch_above_max_clamps() {
        // High square 4×17 + 1×2 = 70¢ (clamped from 9 to 4)
        assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(9), 1), 70);
      }

      // ── Cost matches text + 2¢ per input image ─────────────────────────

      #[test]
      fn edit_and_text_cost_differ_by_input_image_cost() {
        for q in [CommonQuality::Low, CommonQuality::Medium, CommonQuality::High] {
          let text = distill_text(&make_request(Some("p"), None, Some(q), Some(1), None))
            .cost.cost_in_usd_cents.unwrap();
          let (tokens, hydration) = fake_image_refs(1);
          let edit = distill_edit(
            &make_request(Some("p"), None, Some(q), Some(1), Some(tokens)),
            &hydration,
          ).cost.cost_in_usd_cents.unwrap();
          assert_eq!(
            edit - text,
            2,
            "expected edit to cost 2¢ more than text for quality {:?}",
            q,
          );
        }
      }

      // ── Metadata flags ───────────────────────────────────────────────────

      #[test]
      fn cost_metadata_flags_are_default() {
        let (tokens, hydration) = fake_image_refs(1);
        let request = make_request(Some("p"), None, None, Some(1), Some(tokens));
        let distilled = distill_edit(&request, &hydration);
        assert!(!distilled.cost.is_free);
        assert!(!distilled.cost.is_unlimited);
        assert!(!distilled.cost.is_rate_limited);
        assert!(!distilled.cost.has_watermark);
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   PLAN
  // ────────────────────────────────────────────────────────────────────────────
  mod plan {
    use super::*;

    use artcraft_router::generate::generate_image::image_generation_plan::ImageGenerationPlan;
    use artcraft_router::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_1::{
      FalGptImage1ImageSize, FalGptImage1NumImages, FalGptImage1Quality, PlanFalGptImage1,
    };

    fn with_text_plan<F: FnOnce(&PlanFalGptImage1<'_>)>(
      request: &OmniGenImageCostAndGenerateRequest,
      assertion: F,
    ) {
      let distilled = distill_text(request);
      match distilled.plan() {
        ImageGenerationPlan::FalGptImage1(plan) => assertion(plan),
        other => panic!("expected ImageGenerationPlan::FalGptImage1, got {:?}", other),
      }
    }

    fn with_edit_plan<F: FnOnce(&PlanFalGptImage1<'_>)>(
      request: &OmniGenImageCostAndGenerateRequest,
      hydration: &HashMap<MediaFileToken, Url>,
      assertion: F,
    ) {
      let distilled = distill_edit(request, hydration);
      match distilled.plan() {
        ImageGenerationPlan::FalGptImage1(plan) => assertion(plan),
        other => panic!("expected ImageGenerationPlan::FalGptImage1, got {:?}", other),
      }
    }

    mod text {
      use super::*;

      // ── Quality mapping ───────────────────────────────────────────────────

      #[test]
      fn default_quality_is_high() {
        with_text_plan(&make_request(Some("p"), None, None, Some(1), None), |plan| {
          assert!(matches!(plan.quality, FalGptImage1Quality::High));
        });
      }

      #[test]
      fn low_quality_passes_through() {
        with_text_plan(&make_request(Some("p"), None, Some(CommonQuality::Low), Some(1), None), |plan| {
          assert!(matches!(plan.quality, FalGptImage1Quality::Low));
        });
      }

      #[test]
      fn medium_quality_passes_through() {
        with_text_plan(&make_request(Some("p"), None, Some(CommonQuality::Medium), Some(1), None), |plan| {
          assert!(matches!(plan.quality, FalGptImage1Quality::Medium));
        });
      }

      #[test]
      fn high_quality_passes_through() {
        with_text_plan(&make_request(Some("p"), None, Some(CommonQuality::High), Some(1), None), |plan| {
          assert!(matches!(plan.quality, FalGptImage1Quality::High));
        });
      }

      // ── Mode detection ────────────────────────────────────────────────────

      #[test]
      fn text_mode_has_empty_image_urls() {
        with_text_plan(&make_request(Some("p"), None, None, Some(1), None), |plan| {
          assert!(plan.image_urls.is_empty());
        });
      }

      // ── Image size mappings ───────────────────────────────────────────────

      #[test]
      fn default_image_size_is_none() {
        with_text_plan(&make_request(Some("p"), None, None, Some(1), None), |plan| {
          assert!(plan.image_size.is_none());
        });
      }

      #[test]
      fn auto_variants_yield_none() {
        for ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, Some(1), None), |plan| {
            assert!(plan.image_size.is_none(), "expected None for {:?}", ar);
          });
        }
      }

      #[test]
      fn square_yields_square() {
        for ar in [CommonAspectRatio::Square, CommonAspectRatio::SquareHd] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, Some(1), None), |plan| {
            assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Square)), "expected Square for {:?}", ar);
          });
        }
      }

      #[test]
      fn wide_variants_yield_horizontal() {
        let wide_ars = [
          CommonAspectRatio::WideFiveByFour,
          CommonAspectRatio::WideFourByThree,
          CommonAspectRatio::WideThreeByTwo,
          CommonAspectRatio::WideSixteenByNine,
          CommonAspectRatio::WideTwentyOneByNine,
          CommonAspectRatio::Wide,
        ];
        for ar in wide_ars {
          with_text_plan(&make_request(Some("p"), Some(ar), None, Some(1), None), |plan| {
            assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Horizontal)), "expected Horizontal for {:?}", ar);
          });
        }
      }

      #[test]
      fn tall_variants_yield_vertical() {
        let tall_ars = [
          CommonAspectRatio::TallFourByFive,
          CommonAspectRatio::TallThreeByFour,
          CommonAspectRatio::TallTwoByThree,
          CommonAspectRatio::TallNineBySixteen,
          CommonAspectRatio::TallNineByTwentyOne,
          CommonAspectRatio::Tall,
        ];
        for ar in tall_ars {
          with_text_plan(&make_request(Some("p"), Some(ar), None, Some(1), None), |plan| {
            assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Vertical)), "expected Vertical for {:?}", ar);
          });
        }
      }

      // ── Num images mapping ────────────────────────────────────────────────

      #[test]
      fn default_batch_count_is_one() {
        with_text_plan(&make_request(Some("p"), None, None, None, None), |plan| {
          assert!(matches!(plan.num_images, FalGptImage1NumImages::One));
        });
      }

      #[test]
      fn batch_direct_mapping() {
        let cases = [
          (1u16, FalGptImage1NumImages::One),
          (2, FalGptImage1NumImages::Two),
          (3, FalGptImage1NumImages::Three),
          (4, FalGptImage1NumImages::Four),
        ];
        for (count, expected) in cases {
          with_text_plan(&make_request(Some("p"), None, None, Some(count), None), |plan| {
            assert!(
              std::mem::discriminant(&plan.num_images) == std::mem::discriminant(&expected),
              "expected {:?} for count {}", expected, count,
            );
          });
        }
      }

      #[test]
      fn batch_above_four_clamps_to_four() {
        with_text_plan(&make_request(Some("p"), None, None, Some(9), None), |plan| {
          assert!(matches!(plan.num_images, FalGptImage1NumImages::Four));
        });
      }

      // ── Prompt passthrough ────────────────────────────────────────────────

      #[test]
      fn prompt_is_passed_through() {
        with_text_plan(&make_request(Some("a corgi in a hat"), None, None, Some(1), None), |plan| {
          assert_eq!(plan.prompt, Some("a corgi in a hat"));
        });
      }

      #[test]
      fn missing_prompt_is_none() {
        with_text_plan(&make_request(None, None, None, Some(1), None), |plan| {
          assert_eq!(plan.prompt, None);
        });
      }
    }

    mod edit {
      use super::*;

      // ── Mode detection / image-url passthrough ────────────────────────────

      #[test]
      fn edit_mode_populates_image_urls() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| {
            assert_eq!(plan.image_urls.len(), 1);
            assert!(plan.image_urls[0].starts_with("https://fake.example.com/"));
          },
        );
      }

      #[test]
      fn edit_mode_with_two_image_refs() {
        let (tokens, hydration) = fake_image_refs(2);
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| {
            assert_eq!(plan.image_urls.len(), 2);
          },
        );
      }

      #[test]
      fn edit_mode_with_five_image_refs() {
        let (tokens, hydration) = fake_image_refs(5);
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| {
            assert_eq!(plan.image_urls.len(), 5);
          },
        );
      }

      #[test]
      fn edit_image_urls_are_hydrated_from_map() {
        let (tokens, hydration) = fake_image_refs(3);
        let expected: Vec<String> = tokens.iter()
          .map(|t| hydration.get(t).unwrap().to_string())
          .collect();
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(1), Some(tokens.clone())),
          &hydration,
          |plan| {
            assert_eq!(plan.image_urls, expected);
          },
        );
      }

      // ── Quality mapping in edit mode ──────────────────────────────────────

      #[test]
      fn default_quality_is_high_in_edit_mode() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| {
            assert!(matches!(plan.quality, FalGptImage1Quality::High));
          },
        );
      }

      #[test]
      fn low_quality_passes_through_in_edit_mode() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, Some(CommonQuality::Low), Some(1), Some(tokens)),
          &hydration,
          |plan| {
            assert!(matches!(plan.quality, FalGptImage1Quality::Low));
          },
        );
      }

      #[test]
      fn high_quality_passes_through_in_edit_mode() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, Some(CommonQuality::High), Some(1), Some(tokens)),
          &hydration,
          |plan| {
            assert!(matches!(plan.quality, FalGptImage1Quality::High));
          },
        );
      }

      // ── Image size in edit mode ──────────────────────────────────────────

      #[test]
      fn edit_default_image_size_is_none() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(plan.image_size.is_none()); },
        );
      }

      #[test]
      fn edit_square_yields_square() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), Some(CommonAspectRatio::Square), None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Square))); },
        );
      }

      #[test]
      fn edit_wide_yields_horizontal() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), Some(CommonAspectRatio::WideSixteenByNine), None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Horizontal))); },
        );
      }

      #[test]
      fn edit_tall_yields_vertical() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), Some(CommonAspectRatio::TallNineBySixteen), None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Vertical))); },
        );
      }

      #[test]
      fn edit_auto_yields_none() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), Some(CommonAspectRatio::Auto), None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(plan.image_size.is_none()); },
        );
      }

      // ── Num images in edit mode ──────────────────────────────────────────

      #[test]
      fn edit_default_batch_count_is_one() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, None, None, Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.num_images, FalGptImage1NumImages::One)); },
        );
      }

      #[test]
      fn edit_batch_of_four_yields_four() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(4), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.num_images, FalGptImage1NumImages::Four)); },
        );
      }

      #[test]
      fn edit_batch_above_four_clamps_to_four() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(9), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.num_images, FalGptImage1NumImages::Four)); },
        );
      }

      // ── Prompt passthrough in edit mode ────────────────────────────────────

      #[test]
      fn edit_prompt_is_passed_through() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("make it shiny"), None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert_eq!(plan.prompt, Some("make it shiny")); },
        );
      }

      #[test]
      fn edit_missing_prompt_is_none() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(None, None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert_eq!(plan.prompt, None); },
        );
      }
    }
  }
}
