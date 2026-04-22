//! Tests for omni-gen against the GPT Image 2 model.
//!
//! GPT Image 2 is multi-function: text-to-image and image-to-image (edit).
//!
//! Artcraft-tier pricing (what the user is billed):
//!   Low    – 1¢ for all sizes
//!   Medium – 4¢ (landscape_4_3/portrait_4_3/landscape_16_9/portrait_16_9)
//!            6¢ (square/square_hd/auto/unset)
//!   High   – 15¢ (landscape_4_3/portrait_4_3)
//!            16¢ (landscape_16_9/portrait_16_9)
//!            22¢ (square/unset)
//!            23¢ (square_hd/auto)  ← default when quality unset
//!
//! The Fal execution plan maps quality from the omni request (defaulting to
//! High when unspecified) and maps aspect ratios to six image sizes plus Auto:
//! SquareHd, Square, Portrait4x3, Portrait16x9, Landscape4x3, Landscape16x9.
//! Auto/unset maps to Auto (treated as square_hd for pricing).

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

      // ── Default quality (None → High) ──

      #[test]
      fn default_quality_square_costs_22() {
        assert_eq!(cost(None, Some(CommonAspectRatio::Square), Some(1)), 22);
      }

      #[test]
      fn default_quality_unset_costs_23() {
        // unset → Auto → 23¢
        assert_eq!(cost(None, None, Some(1)), 23);
      }

      #[test]
      fn default_quality_auto_costs_23() {
        assert_eq!(cost(None, Some(CommonAspectRatio::Auto), Some(1)), 23);
      }

      #[test]
      fn default_quality_square_hd_costs_23() {
        assert_eq!(cost(None, Some(CommonAspectRatio::SquareHd), Some(1)), 23);
      }

      #[test]
      fn default_quality_wide_4x3_costs_15() {
        assert_eq!(cost(None, Some(CommonAspectRatio::WideFourByThree), Some(1)), 15);
      }

      #[test]
      fn default_quality_wide_16x9_costs_16() {
        assert_eq!(cost(None, Some(CommonAspectRatio::WideSixteenByNine), Some(1)), 16);
      }

      #[test]
      fn default_quality_tall_4x5_costs_15() {
        assert_eq!(cost(None, Some(CommonAspectRatio::TallFourByFive), Some(1)), 15);
      }

      #[test]
      fn default_quality_tall_16x9_costs_16() {
        assert_eq!(cost(None, Some(CommonAspectRatio::TallNineBySixteen), Some(1)), 16);
      }

      // ── Low quality (1¢ all sizes) ──

      #[test]
      fn low_square_costs_1() {
        assert_eq!(cost(Some(CommonQuality::Low), Some(CommonAspectRatio::Square), Some(1)), 1);
      }

      #[test]
      fn low_unset_costs_1() {
        assert_eq!(cost(Some(CommonQuality::Low), None, Some(1)), 1);
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
      fn low_four_images() {
        assert_eq!(cost(Some(CommonQuality::Low), None, Some(4)), 4);
      }

      #[test]
      fn low_batch_above_max_clamps() {
        assert_eq!(cost(Some(CommonQuality::Low), None, Some(7)), 4);
      }

      // ── Medium quality (4¢ 4:3/16:9, 6¢ square/square_hd/auto) ──

      #[test]
      fn medium_square_costs_6() {
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), Some(1)), 6);
      }

      #[test]
      fn medium_square_hd_costs_6() {
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::SquareHd), Some(1)), 6);
      }

      #[test]
      fn medium_unset_costs_6() {
        assert_eq!(cost(Some(CommonQuality::Medium), None, Some(1)), 6);
      }

      #[test]
      fn medium_wide_4x3_costs_4() {
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideFourByThree), Some(1)), 4);
      }

      #[test]
      fn medium_wide_16x9_costs_4() {
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideSixteenByNine), Some(1)), 4);
      }

      #[test]
      fn medium_tall_4x3_costs_4() {
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::TallThreeByFour), Some(1)), 4);
      }

      #[test]
      fn medium_tall_16x9_costs_4() {
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::TallNineBySixteen), Some(1)), 4);
      }

      #[test]
      fn medium_square_four_images() {
        assert_eq!(cost(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), Some(4)), 24);
      }

      // ── High quality (15¢ 4:3, 16¢ 16:9, 22¢ square, 23¢ square_hd/auto) ──

      #[test]
      fn high_square_costs_22() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(1)), 22);
      }

      #[test]
      fn high_square_hd_costs_23() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::SquareHd), Some(1)), 23);
      }

      #[test]
      fn high_unset_costs_23() {
        assert_eq!(cost(Some(CommonQuality::High), None, Some(1)), 23);
      }

      #[test]
      fn high_wide_4x3_costs_15() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::WideFourByThree), Some(1)), 15);
      }

      #[test]
      fn high_wide_16x9_costs_16() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::WideSixteenByNine), Some(1)), 16);
      }

      #[test]
      fn high_tall_4x3_costs_15() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::TallThreeByFour), Some(1)), 15);
      }

      #[test]
      fn high_tall_16x9_costs_16() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::TallNineBySixteen), Some(1)), 16);
      }

      #[test]
      fn high_square_four_images() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(4)), 88);
      }

      #[test]
      fn high_square_hd_four_images() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::SquareHd), Some(4)), 92);
      }

      // ── Batch scaling ──

      #[test]
      fn high_square_batch_scaling() {
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(1)), 22);
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(2)), 44);
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(3)), 66);
        assert_eq!(cost(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(4)), 88);
      }

      // ── Metadata flags ──

      #[test]
      fn cost_metadata_flags_are_default() {
        let distilled = distill_text(&make_request(Some("p"), None, None, Some(1), None));
        assert!(!distilled.cost.is_free);
        assert!(!distilled.cost.is_unlimited);
        assert!(!distilled.cost.is_rate_limited);
        assert!(!distilled.cost.has_watermark);
      }

      #[test]
      fn cost_is_independent_of_prompt() {
        let a = distill_text(&make_request(Some("a cat"), None, None, Some(1), None));
        let b = distill_text(&make_request(None, None, None, Some(1), None));
        assert_eq!(a.cost.cost_in_usd_cents, b.cost.cost_in_usd_cents);
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

      #[test]
      fn edit_low_square() { assert_eq!(cost_edit(Some(CommonQuality::Low), Some(CommonAspectRatio::Square), Some(1), 1), 1); }

      #[test]
      fn edit_medium_square() { assert_eq!(cost_edit(Some(CommonQuality::Medium), Some(CommonAspectRatio::Square), Some(1), 1), 6); }

      #[test]
      fn edit_medium_wide_4x3() { assert_eq!(cost_edit(Some(CommonQuality::Medium), Some(CommonAspectRatio::WideFourByThree), Some(1), 1), 4); }

      #[test]
      fn edit_high_square() { assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(1), 1), 22); }

      #[test]
      fn edit_high_square_hd() { assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::SquareHd), Some(1), 1), 23); }

      #[test]
      fn edit_high_wide_16x9() { assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::WideSixteenByNine), Some(1), 1), 16); }

      #[test]
      fn edit_high_tall_4x3() { assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::TallThreeByFour), Some(1), 1), 15); }

      #[test]
      fn edit_default_quality_square() { assert_eq!(cost_edit(None, Some(CommonAspectRatio::Square), Some(1), 1), 22); }

      #[test]
      fn edit_cost_independent_of_input_image_count() {
        for num_refs in [1usize, 2, 3, 5] {
          assert_eq!(
            cost_edit(Some(CommonQuality::Medium), None, Some(2), num_refs),
            12,
            "expected 12¢ regardless of {} input images",
            num_refs,
          );
        }
      }

      #[test]
      fn edit_high_square_four_outputs() {
        assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(4), 1), 88);
      }

      #[test]
      fn edit_batch_above_max_clamps() {
        assert_eq!(cost_edit(Some(CommonQuality::High), Some(CommonAspectRatio::Square), Some(9), 1), 88);
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
          assert_eq!(text, edit, "text/edit cost should match for quality {:?}", q);
        }
      }

      #[test]
      fn cost_metadata_flags_are_default() {
        let (tokens, hydration) = fake_image_refs(1);
        let distilled = distill_edit(&make_request(Some("p"), None, None, Some(1), Some(tokens)), &hydration);
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
    use artcraft_router::generate::generate_image::plan::fal::plan_generate_image_fal_gpt_image_2::{
      FalGptImage2ImageSize, FalGptImage2NumImages, FalGptImage2Quality, PlanFalGptImage2,
    };

    mod text {
      use super::*;

      // ── Quality mapping ──

      #[test]
      fn default_quality_is_high() {
        with_text_plan(&make_request(Some("p"), None, None, Some(1), None), |plan| {
          assert!(matches!(plan.quality, FalGptImage2Quality::High));
        });
      }

      #[test]
      fn low_quality_passes_through() {
        with_text_plan(&make_request(Some("p"), None, Some(CommonQuality::Low), Some(1), None), |plan| {
          assert!(matches!(plan.quality, FalGptImage2Quality::Low));
        });
      }

      #[test]
      fn medium_quality_passes_through() {
        with_text_plan(&make_request(Some("p"), None, Some(CommonQuality::Medium), Some(1), None), |plan| {
          assert!(matches!(plan.quality, FalGptImage2Quality::Medium));
        });
      }

      // ── Mode detection ──

      #[test]
      fn text_mode_has_empty_image_urls() {
        with_text_plan(&make_request(Some("p"), None, None, Some(1), None), |plan| {
          assert!(plan.image_urls.is_empty());
        });
      }

      // ── Image size mappings ──

      #[test]
      fn default_image_size_is_auto() {
        with_text_plan(&make_request(Some("p"), None, None, Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage2ImageSize::Auto)));
        });
      }

      #[test]
      fn auto_variants_yield_auto() {
        for ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, Some(1), None), |plan| {
            assert!(matches!(plan.image_size, Some(FalGptImage2ImageSize::Auto)), "expected Auto for {:?}", ar);
          });
        }
      }

      #[test]
      fn square_yields_square() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::Square), None, Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage2ImageSize::Square)));
        });
      }

      #[test]
      fn square_hd_yields_square_hd() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::SquareHd), None, Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage2ImageSize::SquareHd)));
        });
      }

      #[test]
      fn wide_4x3_yields_landscape_4x3() {
        for ar in [CommonAspectRatio::WideFourByThree, CommonAspectRatio::WideFiveByFour] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, Some(1), None), |plan| {
            assert!(matches!(plan.image_size, Some(FalGptImage2ImageSize::Landscape4x3)), "expected Landscape4x3 for {:?}", ar);
          });
        }
      }

      #[test]
      fn wide_16x9_yields_landscape_16x9() {
        for ar in [CommonAspectRatio::WideSixteenByNine, CommonAspectRatio::Wide, CommonAspectRatio::WideThreeByTwo] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, Some(1), None), |plan| {
            assert!(matches!(plan.image_size, Some(FalGptImage2ImageSize::Landscape16x9)), "expected Landscape16x9 for {:?}", ar);
          });
        }
      }

      #[test]
      fn tall_4x3_yields_portrait_4x3() {
        for ar in [CommonAspectRatio::TallThreeByFour, CommonAspectRatio::TallFourByFive] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, Some(1), None), |plan| {
            assert!(matches!(plan.image_size, Some(FalGptImage2ImageSize::Portrait4x3)), "expected Portrait4x3 for {:?}", ar);
          });
        }
      }

      #[test]
      fn tall_16x9_yields_portrait_16x9() {
        for ar in [CommonAspectRatio::TallNineBySixteen, CommonAspectRatio::Tall, CommonAspectRatio::TallTwoByThree] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, Some(1), None), |plan| {
            assert!(matches!(plan.image_size, Some(FalGptImage2ImageSize::Portrait16x9)), "expected Portrait16x9 for {:?}", ar);
          });
        }
      }

      // ── Num images mapping ──

      #[test]
      fn default_batch_count_is_one() {
        with_text_plan(&make_request(Some("p"), None, None, None, None), |plan| {
          assert!(matches!(plan.num_images, FalGptImage2NumImages::One));
        });
      }

      #[test]
      fn batch_direct_mapping() {
        for (count, expected) in [
          (1u16, FalGptImage2NumImages::One), (2, FalGptImage2NumImages::Two),
          (3, FalGptImage2NumImages::Three), (4, FalGptImage2NumImages::Four),
        ] {
          with_text_plan(&make_request(Some("p"), None, None, Some(count), None), |plan| {
            assert!(std::mem::discriminant(&plan.num_images) == std::mem::discriminant(&expected));
          });
        }
      }

      #[test]
      fn batch_above_four_clamps_to_four() {
        with_text_plan(&make_request(Some("p"), None, None, Some(9), None), |plan| {
          assert!(matches!(plan.num_images, FalGptImage2NumImages::Four));
        });
      }

      // ── Prompt passthrough ──

      #[test]
      fn prompt_is_passed_through() {
        with_text_plan(&make_request(Some("a corgi in a hat"), None, None, Some(1), None), |plan| {
          assert_eq!(plan.prompt, Some("a corgi in a hat".to_string()));
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
      fn edit_mode_with_three_image_refs() {
        let (tokens, hydration) = fake_image_refs(3);
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert_eq!(plan.image_urls.len(), 3); },
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

      #[test]
      fn default_quality_is_high_in_edit_mode() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.quality, FalGptImage2Quality::High)); },
        );
      }

      #[test]
      fn edit_square_yields_square() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), Some(CommonAspectRatio::Square), None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.image_size, Some(FalGptImage2ImageSize::Square))); },
        );
      }

      #[test]
      fn edit_wide_16x9_yields_landscape_16x9() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), Some(CommonAspectRatio::WideSixteenByNine), None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.image_size, Some(FalGptImage2ImageSize::Landscape16x9))); },
        );
      }

      #[test]
      fn edit_batch_above_four_clamps_to_four() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(9), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.num_images, FalGptImage2NumImages::Four)); },
        );
      }

      #[test]
      fn edit_prompt_is_passed_through() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("make it shiny"), None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert_eq!(plan.prompt, Some("make it shiny".to_string())); },
        );
      }
    }

    // ── Plan helpers ──

    fn with_text_plan<F: FnOnce(&PlanFalGptImage2)>(
      request: &OmniGenImageCostAndGenerateRequest,
      assertion: F,
    ) {
      let distilled = distill_text(request);
      match distilled.plan() {
        ImageGenerationPlan::FalGptImage2(plan) => assertion(plan),
        other => panic!("expected FalGptImage2, got {:?}", other),
      }
    }

    fn with_edit_plan<F: FnOnce(&PlanFalGptImage2)>(
      request: &OmniGenImageCostAndGenerateRequest,
      hydration: &HashMap<MediaFileToken, Url>,
      assertion: F,
    ) {
      let distilled = distill_edit(request, hydration);
      match distilled.plan() {
        ImageGenerationPlan::FalGptImage2(plan) => assertion(plan),
        other => panic!("expected FalGptImage2, got {:?}", other),
      }
    }
  }

  // ── Helpers ──

  fn make_request(
    prompt: Option<&str>,
    aspect_ratio: Option<CommonAspectRatio>,
    quality: Option<CommonQuality>,
    image_batch_count: Option<u16>,
    image_media_tokens: Option<Vec<MediaFileToken>>,
  ) -> OmniGenImageCostAndGenerateRequest {
    OmniGenImageCostAndGenerateRequest {
      idempotency_token: Some("11111111-1111-1111-1111-111111111111".to_string()),
      model: Some(CommonImageModel::GptImage2),
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
      .expect("distill_image_request should succeed for GPT Image 2 (text)")
  }

  fn distill_edit(
    request: &OmniGenImageCostAndGenerateRequest,
    hydration: &HashMap<MediaFileToken, Url>,
  ) -> DistilledImageRequest {
    distill_image_request(request, Some(hydration))
      .expect("distill_image_request should succeed for GPT Image 2 (edit)")
  }
}
