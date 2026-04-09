//! Tests for omni-gen against the GPT Image 1.5 model.
//!
//! GPT Image 1.5 is multi-function: text-to-image and image-to-image (edit).
//!
//! Artcraft-tier pricing (what the user is billed):
//!   Low    – 1¢ (any size)
//!   Medium – 3¢ (square/unset) / 5¢ (wide or tall)  ← default when quality unset
//!   High   – 13¢ (square/unset) / 20¢ (wide or tall)
//!
//! The Fal execution plan maps quality from the omni request (defaulting to
//! Medium when unspecified) and maps aspect ratios to three image sizes:
//! Square (1024×1024), Wide (1536×1024), Tall (1024×1536).
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
      model: Some(CommonImageModel::GptImage1p5),
      prompt: prompt.map(|s| s.to_string()),
      image_media_tokens,
      resolution: None,
      aspect_ratio,
      quality,
      image_batch_count,
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
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
      .expect("distill_image_request should succeed for GPT Image 1.5 (text)")
  }

  fn distill_edit(
    request: &OmniGenImageCostAndGenerateRequest,
    hydration: &HashMap<MediaFileToken, Url>,
  ) -> DistilledImageRequest {
    distill_image_request(request, Some(hydration))
      .expect("distill_image_request should succeed for GPT Image 1.5 (edit)")
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

      // ── Default quality (None → Medium) ──────────────────────────────────

      #[test]
      fn default_quality_square_costs_3() {
        assert_eq!(cost(None, Some(CommonAspectRatio::Square), Some(1)), 3);
      }

      #[test]
      fn default_quality_wide_costs_5() {
        assert_eq!(cost(None, Some(CommonAspectRatio::WideSixteenByNine), Some(1)), 5);
      }

      #[test]
      fn default_quality_tall_costs_5() {
        assert_eq!(cost(None, Some(CommonAspectRatio::TallNineBySixteen), Some(1)), 5);
      }

      #[test]
      fn default_quality_unset_size_costs_3() {
        assert_eq!(cost(None, None, Some(1)), 3);
      }

      #[test]
      fn default_quality_auto_costs_3() {
        assert_eq!(cost(None, Some(CommonAspectRatio::Auto), Some(1)), 3);
      }

      // ── Low quality (1¢/image regardless of size) ────────────────────────

      #[test]
      fn low_square_costs_1() {
        assert_eq!(cost(Some(CommonQuality::Low), Some(CommonAspectRatio::Square), Some(1)), 1);
      }

      #[test]
      fn low_wide_costs_1() {
        assert_eq!(cost(Some(CommonQuality::Low), Some(CommonAspectRatio::WideSixteenByNine), Some(1)), 1);
      }

      #[test]
      fn low_tall_costs_1() {
        assert_eq!(cost(Some(CommonQuality::Low), Some(CommonAspectRatio::TallNineBySixteen), Some(1)), 1);
      }

      #[test]
      fn low_unset_costs_1() {
        assert_eq!(cost(Some(CommonQuality::Low), None, Some(1)), 1);
      }

      #[test]
      fn low_four_images_costs_4() {
        assert_eq!(cost(Some(CommonQuality::Low), None, Some(4)), 4);
      }

      #[test]
      fn low_batch_above_max_clamps() {
        assert_eq!(cost(Some(CommonQuality::Low), None, Some(7)), 4);
      }

      // ── Medium quality (3¢ square, 5¢ wide/tall) ─────────────────────────

      #[test]
      fn medium_square_costs_3() {
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), Some(1)), 3);
      }

      #[test]
      fn medium_wide_costs_5() {
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideSixteenByNine), Some(1)), 5);
      }

      #[test]
      fn medium_tall_costs_5() {
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::TallNineBySixteen), Some(1)), 5);
      }

      #[test]
      fn medium_square_four_images_costs_12() {
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), Some(4)), 12);
      }

      #[test]
      fn medium_wide_four_images_costs_20() {
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideSixteenByNine), Some(4)), 20);
      }

      // ── High quality (13¢ square, 20¢ wide/tall) ─────────────────────────

      #[test]
      fn high_square_costs_13() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(1)), 13);
      }

      #[test]
      fn high_wide_costs_20() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::WideSixteenByNine), Some(1)), 20);
      }

      #[test]
      fn high_tall_costs_20() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::TallNineBySixteen), Some(1)), 20);
      }

      #[test]
      fn high_unset_costs_13() {
        assert_eq!(cost(Some(CommonQuality::High), None, Some(1)), 13);
      }

      #[test]
      fn high_square_four_images_costs_52() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(4)), 52);
      }

      #[test]
      fn high_wide_four_images_costs_80() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::WideSixteenByNine), Some(4)), 80);
      }

      // ── Batch scaling ────────────────────────────────────────────────────

      #[test]
      fn medium_square_batch_scaling() {
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), Some(1)), 3);
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), Some(2)), 6);
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), Some(3)), 9);
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), Some(4)), 12);
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

      // ── Edit mode costs match text mode (no per-input-image surcharge for
      //    1.5 — the artcraft cost estimator for 1.5 does not add input
      //    image token costs like 1.0 does) ──────────────────────────────────

      #[test]
      fn edit_default_quality_square_one_output_one_input() {
        assert_eq!(cost_edit(None, Some(CommonAspectRatio::Square), Some(1), 1), 3);
      }

      #[test]
      fn edit_default_quality_wide_one_output_one_input() {
        assert_eq!(cost_edit(None, Some(CommonAspectRatio::WideSixteenByNine), Some(1), 1), 5);
      }

      #[test]
      fn edit_low_square_one_output_one_input() {
        assert_eq!(cost_edit(Some(CommonQuality::Low), Some(CommonAspectRatio::Square), Some(1), 1), 1);
      }

      #[test]
      fn edit_medium_square_one_output_one_input() {
        assert_eq!(cost_edit(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), Some(1), 1), 3);
      }

      #[test]
      fn edit_medium_wide_one_output_one_input() {
        assert_eq!(cost_edit(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideSixteenByNine), Some(1), 1), 5);
      }

      #[test]
      fn edit_medium_tall_one_output_one_input() {
        assert_eq!(cost_edit(Some(CommonQuality::Medium), Some(CommonAspectRatio::TallNineBySixteen), Some(1), 1), 5);
      }

      #[test]
      fn edit_high_square_one_output_one_input() {
        assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(1), 1), 13);
      }

      #[test]
      fn edit_high_wide_one_output_one_input() {
        assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::WideSixteenByNine), Some(1), 1), 20);
      }

      #[test]
      fn edit_high_square_four_outputs_one_input() {
        assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(4), 1), 52);
      }

      #[test]
      fn edit_cost_independent_of_input_image_count() {
        for num_refs in [1usize, 2, 3, 5] {
          assert_eq!(
            cost_edit(Some(CommonQuality::Medium), None, Some(2), num_refs),
            6,
            "expected 6¢ regardless of {} input images",
            num_refs,
          );
        }
      }

      #[test]
      fn edit_batch_above_max_clamps() {
        assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(9), 1), 52);
      }

      #[test]
      fn edit_and_text_cost_match() {
        for q in [CommonQuality::Low, CommonQuality::Medium, CommonQuality::High] {
          let text = distill_text(&make_request(Some("p"), None, Some(q), Some(2), None))
            .cost.cost_in_usd_cents.unwrap();
          let (tokens, hydration) = fake_image_refs(3);
          let edit = distill_edit(
            &make_request(Some("p"), None, Some(q), Some(2), Some(tokens)),
            &hydration,
          ).cost.cost_in_usd_cents.unwrap();
          assert_eq!(
            text, edit,
            "expected text/edit cost to match for quality {:?}", q,
          );
        }
      }

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
    use artcraft_router::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_1p5::{
      FalGptImage1p5ImageSize, FalGptImage1p5NumImages, FalGptImage1p5Quality, PlanFalGptImage1p5,
    };

    fn with_text_plan<F: FnOnce(&PlanFalGptImage1p5<'_>)>(
      request: &OmniGenImageCostAndGenerateRequest,
      assertion: F,
    ) {
      let distilled = distill_text(request);
      match distilled.plan() {
        ImageGenerationPlan::FalGptImage1p5(plan) => assertion(plan),
        other => panic!("expected ImageGenerationPlan::FalGptImage1p5, got {:?}", other),
      }
    }

    fn with_edit_plan<F: FnOnce(&PlanFalGptImage1p5<'_>)>(
      request: &OmniGenImageCostAndGenerateRequest,
      hydration: &HashMap<MediaFileToken, Url>,
      assertion: F,
    ) {
      let distilled = distill_edit(request, hydration);
      match distilled.plan() {
        ImageGenerationPlan::FalGptImage1p5(plan) => assertion(plan),
        other => panic!("expected ImageGenerationPlan::FalGptImage1p5, got {:?}", other),
      }
    }

    mod text {
      use super::*;

      // ── Quality mapping ───────────────────────────────────────────────────

      #[test]
      fn default_quality_is_high() {
        with_text_plan(&make_request(Some("p"), None, None, Some(1), None), |plan| {
          assert!(matches!(plan.quality, FalGptImage1p5Quality::High));
        });
      }

      #[test]
      fn low_quality_passes_through() {
        with_text_plan(&make_request(Some("p"), None, Some(CommonQuality::Low), Some(1), None), |plan| {
          assert!(matches!(plan.quality, FalGptImage1p5Quality::Low));
        });
      }

      #[test]
      fn medium_quality_passes_through() {
        with_text_plan(&make_request(Some("p"), None, Some(CommonQuality::Medium), Some(1), None), |plan| {
          assert!(matches!(plan.quality, FalGptImage1p5Quality::Medium));
        });
      }

      #[test]
      fn high_quality_passes_through() {
        with_text_plan(&make_request(Some("p"), None, Some(CommonQuality::High), Some(1), None), |plan| {
          assert!(matches!(plan.quality, FalGptImage1p5Quality::High));
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
            assert!(matches!(plan.image_size, Some(FalGptImage1p5ImageSize::Square)), "expected Square for {:?}", ar);
          });
        }
      }

      #[test]
      fn wide_variants_yield_wide() {
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
            assert!(matches!(plan.image_size, Some(FalGptImage1p5ImageSize::Wide)), "expected Wide for {:?}", ar);
          });
        }
      }

      #[test]
      fn tall_variants_yield_tall() {
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
            assert!(matches!(plan.image_size, Some(FalGptImage1p5ImageSize::Tall)), "expected Tall for {:?}", ar);
          });
        }
      }

      // ── Num images mapping ────────────────────────────────────────────────

      #[test]
      fn default_batch_count_is_one() {
        with_text_plan(&make_request(Some("p"), None, None, None, None), |plan| {
          assert!(matches!(plan.num_images, FalGptImage1p5NumImages::One));
        });
      }

      #[test]
      fn batch_direct_mapping() {
        let cases = [
          (1u16, FalGptImage1p5NumImages::One),
          (2, FalGptImage1p5NumImages::Two),
          (3, FalGptImage1p5NumImages::Three),
          (4, FalGptImage1p5NumImages::Four),
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
          assert!(matches!(plan.num_images, FalGptImage1p5NumImages::Four));
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
          |plan| { assert_eq!(plan.image_urls.len(), 2); },
        );
      }

      #[test]
      fn edit_mode_with_five_image_refs() {
        let (tokens, hydration) = fake_image_refs(5);
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert_eq!(plan.image_urls.len(), 5); },
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
          |plan| { assert_eq!(plan.image_urls, expected); },
        );
      }

      // ── Quality mapping in edit mode ──────────────────────────────────────

      #[test]
      fn default_quality_is_medium_in_edit_mode() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.quality, FalGptImage1p5Quality::High)); },
        );
      }

      #[test]
      fn low_quality_passes_through_in_edit_mode() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, Some(CommonQuality::Low), Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.quality, FalGptImage1p5Quality::Low)); },
        );
      }

      #[test]
      fn high_quality_passes_through_in_edit_mode() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, Some(CommonQuality::High), Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.quality, FalGptImage1p5Quality::High)); },
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
          |plan| { assert!(matches!(plan.image_size, Some(FalGptImage1p5ImageSize::Square))); },
        );
      }

      #[test]
      fn edit_wide_yields_wide() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), Some(CommonAspectRatio::WideSixteenByNine), None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.image_size, Some(FalGptImage1p5ImageSize::Wide))); },
        );
      }

      #[test]
      fn edit_tall_yields_tall() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), Some(CommonAspectRatio::TallNineBySixteen), None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.image_size, Some(FalGptImage1p5ImageSize::Tall))); },
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
          |plan| { assert!(matches!(plan.num_images, FalGptImage1p5NumImages::One)); },
        );
      }

      #[test]
      fn edit_batch_of_four_yields_four() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(4), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.num_images, FalGptImage1p5NumImages::Four)); },
        );
      }

      #[test]
      fn edit_batch_above_four_clamps_to_four() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(9), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.num_images, FalGptImage1p5NumImages::Four)); },
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
