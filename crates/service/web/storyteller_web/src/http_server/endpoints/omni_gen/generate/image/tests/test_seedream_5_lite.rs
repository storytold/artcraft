//! Tests for omni-gen against the Seedream 5 Lite model.
//!
//! Seedream 5 Lite is multi-function: text-to-image and image-to-image (edit).
//!
//! Artcraft-tier pricing: flat 4¢/image regardless of size, quality, or mode.
//!
//! The Fal execution plan maps aspect ratios to Seedream-native image sizes.
//! V5 Lite supports Auto2k and Auto3k (no bare Auto, no Auto4k):
//!   - Auto / Auto2k → Auto2k
//!   - Auto4k → Auto3k (fallback)
//! Unsupported ratios (5:4, 3:2, 21:9, 4:5, 2:3, 9:21) fall back under
//! PayMoreUpgrade to the nearest 16:9 or 9:16 variant.

#[cfg(test)]
mod tests {
  use std::collections::HashMap;

  use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_image_cost_and_generate_request::OmniGenImageCostAndGenerateRequest;
  use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
  use enums::common::generation::common_image_model::CommonImageModel;
  use tokens::tokens::media_files::MediaFileToken;
  use url::Url;

  use crate::http_server::endpoints::omni_gen::generate::image::distill_image_request::{
    distill_image_request, DistilledImageRequest,
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  fn make_request(
    prompt: Option<&str>,
    aspect_ratio: Option<CommonAspectRatio>,
    image_batch_count: Option<u16>,
    image_media_tokens: Option<Vec<MediaFileToken>>,
  ) -> OmniGenImageCostAndGenerateRequest {
    OmniGenImageCostAndGenerateRequest {
      idempotency_token: Some("11111111-1111-1111-1111-111111111111".to_string()),
      model: Some(CommonImageModel::Seedream5Lite),
      prompt: prompt.map(|s| s.to_string()),
      image_media_tokens,
      resolution: None,
      aspect_ratio,
      quality: None,
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
      .expect("distill_image_request should succeed for Seedream 5 Lite (text)")
  }

  fn distill_edit(
    request: &OmniGenImageCostAndGenerateRequest,
    hydration: &HashMap<MediaFileToken, Url>,
  ) -> DistilledImageRequest {
    distill_image_request(request, Some(hydration))
      .expect("distill_image_request should succeed for Seedream 5 Lite (edit)")
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   COST — flat 4¢/image
  // ────────────────────────────────────────────────────────────────────────────
  mod cost {
    use super::*;

    mod text {
      use super::*;

      fn cost_for_batch(batch: Option<u16>) -> u64 {
        let request = make_request(Some("p"), None, batch, None);
        distill_text(&request).cost.cost_in_usd_cents.unwrap()
      }

      #[test]
      fn default_batch_costs_4_cents() { assert_eq!(cost_for_batch(None), 4); }

      #[test]
      fn batch_of_one_costs_4() { assert_eq!(cost_for_batch(Some(1)), 4); }

      #[test]
      fn batch_of_two_costs_8() { assert_eq!(cost_for_batch(Some(2)), 8); }

      #[test]
      fn batch_of_three_costs_12() { assert_eq!(cost_for_batch(Some(3)), 12); }

      #[test]
      fn batch_of_four_costs_16() { assert_eq!(cost_for_batch(Some(4)), 16); }

      #[test]
      fn batch_above_max_clamps_to_16() { assert_eq!(cost_for_batch(Some(7)), 16); }

      #[test]
      fn cost_is_independent_of_aspect_ratio() {
        let ars = [
          None,
          Some(CommonAspectRatio::Square),
          Some(CommonAspectRatio::SquareHd),
          Some(CommonAspectRatio::WideSixteenByNine),
          Some(CommonAspectRatio::WideFourByThree),
          Some(CommonAspectRatio::TallNineBySixteen),
          Some(CommonAspectRatio::TallThreeByFour),
          Some(CommonAspectRatio::Auto),
          Some(CommonAspectRatio::Auto2k),
          Some(CommonAspectRatio::Auto3k),
          Some(CommonAspectRatio::Auto4k),
        ];
        for ar in ars {
          let request = make_request(Some("p"), ar, Some(2), None);
          assert_eq!(
            distill_text(&request).cost.cost_in_usd_cents.unwrap(), 8,
            "expected 8¢ regardless of aspect ratio {:?}", ar,
          );
        }
      }

      #[test]
      fn cost_is_independent_of_prompt() {
        let a = distill_text(&make_request(Some("a cat"), None, Some(1), None));
        let b = distill_text(&make_request(None, None, Some(1), None));
        assert_eq!(a.cost.cost_in_usd_cents, b.cost.cost_in_usd_cents);
      }

      #[test]
      fn cost_metadata_flags_are_default() {
        let d = distill_text(&make_request(Some("p"), None, Some(1), None));
        assert!(!d.cost.is_free);
        assert!(!d.cost.is_unlimited);
        assert!(!d.cost.is_rate_limited);
        assert!(!d.cost.has_watermark);
      }
    }

    mod edit {
      use super::*;

      fn cost_edit(batch: Option<u16>, num_refs: usize) -> u64 {
        let (tokens, hydration) = fake_image_refs(num_refs);
        let request = make_request(Some("p"), None, batch, Some(tokens));
        distill_edit(&request, &hydration).cost.cost_in_usd_cents.unwrap()
      }

      #[test]
      fn default_batch_costs_4() { assert_eq!(cost_edit(None, 1), 4); }

      #[test]
      fn batch_of_one_costs_4() { assert_eq!(cost_edit(Some(1), 1), 4); }

      #[test]
      fn batch_of_two_costs_8() { assert_eq!(cost_edit(Some(2), 1), 8); }

      #[test]
      fn batch_of_four_costs_16() { assert_eq!(cost_edit(Some(4), 1), 16); }

      #[test]
      fn batch_above_max_clamps_to_16() { assert_eq!(cost_edit(Some(9), 1), 16); }

      #[test]
      fn cost_independent_of_input_image_count() {
        for num_refs in [1usize, 2, 3, 5] {
          assert_eq!(cost_edit(Some(2), num_refs), 8, "expected 8¢ regardless of {} input images", num_refs);
        }
      }

      #[test]
      fn edit_and_text_cost_match() {
        for batch in [1u16, 2, 3, 4] {
          let text = distill_text(&make_request(Some("p"), None, Some(batch), None))
            .cost.cost_in_usd_cents.unwrap();
          let (tokens, hydration) = fake_image_refs(1);
          let edit = distill_edit(
            &make_request(Some("p"), None, Some(batch), Some(tokens)),
            &hydration,
          ).cost.cost_in_usd_cents.unwrap();
          assert_eq!(text, edit, "text/edit cost diverged at batch={}", batch);
        }
      }

      #[test]
      fn cost_metadata_flags_are_default() {
        let (tokens, hydration) = fake_image_refs(1);
        let d = distill_edit(&make_request(Some("p"), None, Some(1), Some(tokens)), &hydration);
        assert!(!d.cost.is_free);
        assert!(!d.cost.is_unlimited);
        assert!(!d.cost.is_rate_limited);
        assert!(!d.cost.has_watermark);
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   PLAN
  // ────────────────────────────────────────────────────────────────────────────
  mod plan {
    use super::*;

    use artcraft_router::generate::generate_image::image_generation_plan::ImageGenerationPlan;
    use artcraft_router::generate::generate_image::plan::fal::plan_generate_image_fal_seedream_5_lite::{
      FalSeedream5LiteImageSize, FalSeedream5LiteNumImages, PlanFalSeedream5Lite,
    };

    fn with_text_plan<F: FnOnce(&PlanFalSeedream5Lite<'_>)>(
      request: &OmniGenImageCostAndGenerateRequest,
      assertion: F,
    ) {
      let distilled = distill_text(request);
      match distilled.plan() {
        ImageGenerationPlan::FalSeedream5Lite(plan) => assertion(plan),
        other => panic!("expected FalSeedream5Lite, got {:?}", other),
      }
    }

    fn with_edit_plan<F: FnOnce(&PlanFalSeedream5Lite<'_>)>(
      request: &OmniGenImageCostAndGenerateRequest,
      hydration: &HashMap<MediaFileToken, Url>,
      assertion: F,
    ) {
      let distilled = distill_edit(request, hydration);
      match distilled.plan() {
        ImageGenerationPlan::FalSeedream5Lite(plan) => assertion(plan),
        other => panic!("expected FalSeedream5Lite, got {:?}", other),
      }
    }

    mod text {
      use super::*;

      // ── Mode detection ────────────────────────────────────────────────────

      #[test]
      fn text_mode_has_empty_image_urls() {
        with_text_plan(&make_request(Some("p"), None, Some(1), None), |plan| {
          assert!(plan.image_urls.is_empty());
        });
      }

      // ── Image size: direct mappings ───────────────────────────────────────

      #[test]
      fn default_image_size_is_none() {
        with_text_plan(&make_request(Some("p"), None, Some(1), None), |plan| {
          assert!(plan.image_size.is_none());
        });
      }

      #[test]
      fn square_yields_square() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::Square), Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::Square)));
        });
      }

      #[test]
      fn square_hd_yields_square_hd() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::SquareHd), Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::SquareHd)));
        });
      }

      #[test]
      fn wide_16x9_yields_landscape_sixteen_nine() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::WideSixteenByNine), Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::LandscapeSixteenNine)));
        });
      }

      #[test]
      fn wide_alias_yields_landscape_sixteen_nine() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::Wide), Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::LandscapeSixteenNine)));
        });
      }

      #[test]
      fn wide_4x3_yields_landscape_four_three() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::WideFourByThree), Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::LandscapeFourThree)));
        });
      }

      #[test]
      fn tall_9x16_yields_portrait_sixteen_nine() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::TallNineBySixteen), Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::PortraitSixteenNine)));
        });
      }

      #[test]
      fn tall_alias_yields_portrait_sixteen_nine() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::Tall), Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::PortraitSixteenNine)));
        });
      }

      #[test]
      fn tall_3x4_yields_portrait_four_three() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::TallThreeByFour), Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::PortraitFourThree)));
        });
      }

      // ── Image size: Auto variants (no bare Auto, no Auto4k) ───────────────

      #[test]
      fn auto_yields_auto_2k() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::Auto), Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::Auto2k)));
        });
      }

      #[test]
      fn auto_2k_yields_auto_2k() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::Auto2k), Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::Auto2k)));
        });
      }

      #[test]
      fn auto_4k_falls_back_to_auto_3k() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::Auto4k), Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::Auto3k)));
        });
      }

      // ── Image size: fallbacks ─────────────────────────────────────────────

      #[test]
      fn wide_5x4_falls_back_to_landscape_sixteen_nine() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::WideFiveByFour), Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::LandscapeSixteenNine)));
        });
      }

      #[test]
      fn wide_3x2_falls_back_to_landscape_sixteen_nine() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::WideThreeByTwo), Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::LandscapeSixteenNine)));
        });
      }

      #[test]
      fn wide_21x9_falls_back_to_landscape_sixteen_nine() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::WideTwentyOneByNine), Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::LandscapeSixteenNine)));
        });
      }

      #[test]
      fn tall_4x5_falls_back_to_portrait_sixteen_nine() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::TallFourByFive), Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::PortraitSixteenNine)));
        });
      }

      #[test]
      fn tall_2x3_falls_back_to_portrait_sixteen_nine() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::TallTwoByThree), Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::PortraitSixteenNine)));
        });
      }

      #[test]
      fn tall_9x21_falls_back_to_portrait_sixteen_nine() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::TallNineByTwentyOne), Some(1), None), |plan| {
          assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::PortraitSixteenNine)));
        });
      }

      // ── Num images ────────────────────────────────────────────────────────

      #[test]
      fn default_batch_count_is_one() {
        with_text_plan(&make_request(Some("p"), None, None, None), |plan| {
          assert!(matches!(plan.num_images, FalSeedream5LiteNumImages::One));
        });
      }

      #[test]
      fn batch_direct_mapping() {
        for (count, expected) in [
          (1u16, FalSeedream5LiteNumImages::One), (2, FalSeedream5LiteNumImages::Two),
          (3, FalSeedream5LiteNumImages::Three), (4, FalSeedream5LiteNumImages::Four),
        ] {
          with_text_plan(&make_request(Some("p"), None, Some(count), None), |plan| {
            assert!(std::mem::discriminant(&plan.num_images) == std::mem::discriminant(&expected));
          });
        }
      }

      #[test]
      fn batch_above_four_clamps_to_four() {
        with_text_plan(&make_request(Some("p"), None, Some(9), None), |plan| {
          assert!(matches!(plan.num_images, FalSeedream5LiteNumImages::Four));
        });
      }

      // ── Prompt passthrough ────────────────────────────────────────────────

      #[test]
      fn prompt_is_passed_through() {
        with_text_plan(&make_request(Some("a corgi in a hat"), None, Some(1), None), |plan| {
          assert_eq!(plan.prompt, Some("a corgi in a hat"));
        });
      }

      #[test]
      fn missing_prompt_is_none() {
        with_text_plan(&make_request(None, None, Some(1), None), |plan| {
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
          &make_request(Some("p"), None, Some(1), Some(tokens)),
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
          &make_request(Some("p"), None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert_eq!(plan.image_urls.len(), 3); },
        );
      }

      #[test]
      fn edit_mode_with_five_image_refs() {
        let (tokens, hydration) = fake_image_refs(5);
        with_edit_plan(
          &make_request(Some("p"), None, Some(1), Some(tokens)),
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
          &make_request(Some("p"), None, Some(1), Some(tokens.clone())),
          &hydration,
          |plan| { assert_eq!(plan.image_urls, expected); },
        );
      }

      // ── Auto in edit mode also maps to Auto2k (no bare Auto in v5 lite) ───

      #[test]
      fn auto_in_edit_mode_yields_auto_2k() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), Some(CommonAspectRatio::Auto), Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::Auto2k))); },
        );
      }

      #[test]
      fn auto_4k_in_edit_mode_yields_auto_3k() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), Some(CommonAspectRatio::Auto4k), Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::Auto3k))); },
        );
      }

      // ── Image size direct mappings in edit mode ───────────────────────────

      #[test]
      fn edit_default_image_size_is_none() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(plan.image_size.is_none()); },
        );
      }

      #[test]
      fn edit_square_yields_square() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), Some(CommonAspectRatio::Square), Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::Square))); },
        );
      }

      #[test]
      fn edit_wide_16x9_yields_landscape_sixteen_nine() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), Some(CommonAspectRatio::WideSixteenByNine), Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::LandscapeSixteenNine))); },
        );
      }

      #[test]
      fn edit_tall_9x16_yields_portrait_sixteen_nine() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), Some(CommonAspectRatio::TallNineBySixteen), Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::PortraitSixteenNine))); },
        );
      }

      #[test]
      fn edit_auto_2k() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), Some(CommonAspectRatio::Auto2k), Some(1), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.image_size, Some(FalSeedream5LiteImageSize::Auto2k))); },
        );
      }

      // ── Num images in edit mode ───────────────────────────────────────────

      #[test]
      fn edit_default_batch_count_is_one() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, None, Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.num_images, FalSeedream5LiteNumImages::One)); },
        );
      }

      #[test]
      fn edit_batch_of_four_yields_four() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, Some(4), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.num_images, FalSeedream5LiteNumImages::Four)); },
        );
      }

      #[test]
      fn edit_batch_above_four_clamps_to_four() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, Some(9), Some(tokens)),
          &hydration,
          |plan| { assert!(matches!(plan.num_images, FalSeedream5LiteNumImages::Four)); },
        );
      }

      // ── Prompt passthrough ────────────────────────────────────────────────

      #[test]
      fn edit_prompt_is_passed_through() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("make it shiny"), None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert_eq!(plan.prompt, Some("make it shiny")); },
        );
      }

      #[test]
      fn edit_missing_prompt_is_none() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| { assert_eq!(plan.prompt, None); },
        );
      }
    }
  }
}
