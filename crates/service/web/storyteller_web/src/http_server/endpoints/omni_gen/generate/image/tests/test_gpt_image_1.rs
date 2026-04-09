//! Tests for omni-gen against the GPT Image 1 model.
//!
//! GPT Image 1 is multi-function: text-to-image and image-to-image (edit).
//! The omni-gen distillation routes through Fal for the execution plan and
//! Artcraft for billing.
//!
//! Artcraft-tier pricing (the rate the user is billed) matches the legacy
//! BYOK handlers (`generate_gpt_image_1_text_to_image_handler` /
//! `gpt_image_1_edit_image_handler`). The artcraft plan defaults quality =
//! High, which is 17¢/image regardless of image size.
//!
//! The Fal execution plan defaults quality = Medium and maps aspect ratios to
//! three image sizes: Square (1024×1024), Horizontal (1536×1024), Vertical
//! (1024×1536). Auto/unset maps to None (API default).

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
      model: Some(CommonImageModel::GptImage1),
      prompt: prompt.map(|s| s.to_string()),
      image_media_tokens,
      resolution: None,
      aspect_ratio,
      quality: None,
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
  //
  // Pricing comes from `estimate_image_cost_artcraft_gpt_image_1`:
  //   quality = High (hardcoded default) → 17¢/image, independent of size.
  //
  // Same rate applies to both text-to-image and edit modes.
  mod cost {
    use super::*;

    mod text {
      use super::*;

      fn cost_for_batch(image_batch_count: Option<u16>) -> (Option<u64>, Option<u64>) {
        let request = make_request(Some("a happy puppy"), None, image_batch_count, None);
        let distilled = distill_text(&request);
        (
          distilled.cost.cost_in_credits,
          distilled.cost.cost_in_usd_cents,
        )
      }

      #[test]
      fn default_batch_costs_17_cents() {
        let (credits, cents) = cost_for_batch(None);
        assert_eq!(credits, Some(17));
        assert_eq!(cents, Some(17));
      }

      #[test]
      fn batch_of_one_costs_17_cents() {
        let (_c, cents) = cost_for_batch(Some(1));
        assert_eq!(cents, Some(17));
      }

      #[test]
      fn batch_of_two_costs_34_cents() {
        let (_c, cents) = cost_for_batch(Some(2));
        assert_eq!(cents, Some(34));
      }

      #[test]
      fn batch_of_three_costs_51_cents() {
        let (_c, cents) = cost_for_batch(Some(3));
        assert_eq!(cents, Some(51));
      }

      #[test]
      fn batch_of_four_costs_68_cents() {
        let (_c, cents) = cost_for_batch(Some(4));
        assert_eq!(cents, Some(68));
      }

      #[test]
      fn batch_above_max_clamps_and_costs_68_cents() {
        // PayMoreUpgrade clamps over-large batches to 4.
        let (_c, cents) = cost_for_batch(Some(7));
        assert_eq!(cents, Some(68));
      }

      #[test]
      fn cost_is_independent_of_aspect_ratio() {
        let aspect_ratios = [
          None,
          Some(CommonAspectRatio::Square),
          Some(CommonAspectRatio::SquareHd),
          Some(CommonAspectRatio::WideSixteenByNine),
          Some(CommonAspectRatio::WideTwentyOneByNine),
          Some(CommonAspectRatio::TallNineBySixteen),
          Some(CommonAspectRatio::TallNineByTwentyOne),
          Some(CommonAspectRatio::Auto),
          Some(CommonAspectRatio::Auto2k),
        ];
        for ar in aspect_ratios {
          let request = make_request(Some("p"), ar, Some(2), None);
          let distilled = distill_text(&request);
          assert_eq!(
            distilled.cost.cost_in_usd_cents,
            Some(34),
            "expected 34¢ regardless of aspect ratio (got {:?})",
            ar,
          );
        }
      }

      #[test]
      fn cost_is_independent_of_prompt() {
        let with_prompt = distill_text(&make_request(Some("a cat"), None, Some(3), None));
        let without_prompt = distill_text(&make_request(None, None, Some(3), None));
        assert_eq!(with_prompt.cost.cost_in_usd_cents, Some(51));
        assert_eq!(without_prompt.cost.cost_in_usd_cents, Some(51));
      }

      #[test]
      fn cost_metadata_flags_are_default() {
        let request = make_request(Some("p"), None, Some(1), None);
        let distilled = distill_text(&request);
        assert!(!distilled.cost.is_free);
        assert!(!distilled.cost.is_unlimited);
        assert!(!distilled.cost.is_rate_limited);
        assert!(!distilled.cost.has_watermark);
      }
    }

    mod edit {
      use super::*;

      fn cost_for_batch_with_refs(
        image_batch_count: Option<u16>,
        num_image_refs: usize,
      ) -> (Option<u64>, Option<u64>) {
        let (tokens, hydration) = fake_image_refs(num_image_refs);
        let request = make_request(Some("make it pop"), None, image_batch_count, Some(tokens));
        let distilled = distill_edit(&request, &hydration);
        (
          distilled.cost.cost_in_credits,
          distilled.cost.cost_in_usd_cents,
        )
      }

      #[test]
      fn default_batch_costs_17_cents() {
        let (credits, cents) = cost_for_batch_with_refs(None, 1);
        assert_eq!(credits, Some(17));
        assert_eq!(cents, Some(17));
      }

      #[test]
      fn batch_of_one_costs_17_cents() {
        let (_c, cents) = cost_for_batch_with_refs(Some(1), 1);
        assert_eq!(cents, Some(17));
      }

      #[test]
      fn batch_of_two_costs_34_cents() {
        let (_c, cents) = cost_for_batch_with_refs(Some(2), 1);
        assert_eq!(cents, Some(34));
      }

      #[test]
      fn batch_of_three_costs_51_cents() {
        let (_c, cents) = cost_for_batch_with_refs(Some(3), 1);
        assert_eq!(cents, Some(51));
      }

      #[test]
      fn batch_of_four_costs_68_cents() {
        let (_c, cents) = cost_for_batch_with_refs(Some(4), 1);
        assert_eq!(cents, Some(68));
      }

      #[test]
      fn batch_above_max_clamps_and_costs_68_cents() {
        let (_c, cents) = cost_for_batch_with_refs(Some(9), 1);
        assert_eq!(cents, Some(68));
      }

      #[test]
      fn cost_is_independent_of_image_ref_count() {
        for num_refs in [1usize, 2, 3, 5] {
          let (_c, cents) = cost_for_batch_with_refs(Some(2), num_refs);
          assert_eq!(
            cents,
            Some(34),
            "expected 34¢ regardless of {} image refs",
            num_refs,
          );
        }
      }

      #[test]
      fn cost_is_independent_of_aspect_ratio() {
        let aspect_ratios = [
          None,
          Some(CommonAspectRatio::Square),
          Some(CommonAspectRatio::Auto),
          Some(CommonAspectRatio::WideSixteenByNine),
          Some(CommonAspectRatio::TallNineBySixteen),
        ];
        for ar in aspect_ratios {
          let (tokens, hydration) = fake_image_refs(2);
          let request = make_request(Some("p"), ar, Some(2), Some(tokens));
          let distilled = distill_edit(&request, &hydration);
          assert_eq!(
            distilled.cost.cost_in_usd_cents,
            Some(34),
            "expected 34¢ regardless of aspect ratio (got {:?})",
            ar,
          );
        }
      }

      #[test]
      fn cost_metadata_flags_are_default() {
        let (tokens, hydration) = fake_image_refs(1);
        let request = make_request(Some("p"), None, Some(1), Some(tokens));
        let distilled = distill_edit(&request, &hydration);
        assert!(!distilled.cost.is_free);
        assert!(!distilled.cost.is_unlimited);
        assert!(!distilled.cost.is_rate_limited);
        assert!(!distilled.cost.has_watermark);
      }

      #[test]
      fn edit_and_text_cost_match_for_same_batch() {
        for batch in [1u16, 2, 3, 4] {
          let text = distill_text(&make_request(Some("p"), None, Some(batch), None));
          let (tokens, hydration) = fake_image_refs(1);
          let edit = distill_edit(
            &make_request(Some("p"), None, Some(batch), Some(tokens)),
            &hydration,
          );
          assert_eq!(
            text.cost.cost_in_usd_cents,
            edit.cost.cost_in_usd_cents,
            "text/edit cost diverged at batch={}",
            batch,
          );
        }
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   PLAN
  // ────────────────────────────────────────────────────────────────────────────
  //
  // The distilled plan is `ImageGenerationPlan::FalGptImage1(PlanFalGptImage1)`.
  // It carries:
  //   - prompt: passthrough
  //   - image_urls: empty in text mode, populated in edit mode
  //   - image_size: None / Square / Horizontal / Vertical
  //   - quality: always Medium (fal plan default)
  //   - num_images: 1..=4 (clamped under PayMoreUpgrade)
  //
  // The handler picks t2i vs edit based on whether image_urls is empty.
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

      fn assert_t2i_for_aspect_ratio<F: FnOnce(&PlanFalGptImage1<'_>)>(
        ar: Option<CommonAspectRatio>,
        assertion: F,
      ) {
        with_text_plan(&make_request(Some("p"), ar, Some(1), None), assertion);
      }

      fn assert_t2i_for_batch<F: FnOnce(&PlanFalGptImage1<'_>)>(
        batch: Option<u16>,
        assertion: F,
      ) {
        with_text_plan(&make_request(Some("p"), None, batch, None), assertion);
      }

      // ── Mode detection ────────────────────────────────────────────────────

      #[test]
      fn text_mode_has_empty_image_urls() {
        with_text_plan(&make_request(Some("p"), None, Some(1), None), |plan| {
          assert!(plan.image_urls.is_empty(), "text mode must have no image_urls");
        });
      }

      // ── Quality default ───────────────────────────────────────────────────

      #[test]
      fn quality_defaults_to_medium() {
        with_text_plan(&make_request(Some("p"), None, Some(1), None), |plan| {
          assert!(matches!(plan.quality, FalGptImage1Quality::Medium));
        });
      }

      // ── Image size mappings ───────────────────────────────────────────────
      //
      // GPT Image 1 has three sizes. Aspect ratios collapse into them:
      //   None / Auto* → None (API default)
      //   Square / SquareHd → Square
      //   All wide → Horizontal
      //   All tall → Vertical

      #[test]
      fn default_image_size_is_none() {
        assert_t2i_for_aspect_ratio(None, |plan| {
          assert!(plan.image_size.is_none());
        });
      }

      #[test]
      fn auto_yields_none() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::Auto), |plan| {
          assert!(plan.image_size.is_none());
        });
      }

      #[test]
      fn auto_2k_yields_none() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::Auto2k), |plan| {
          assert!(plan.image_size.is_none());
        });
      }

      #[test]
      fn auto_4k_yields_none() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::Auto4k), |plan| {
          assert!(plan.image_size.is_none());
        });
      }

      #[test]
      fn square_yields_square() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::Square), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Square)));
        });
      }

      #[test]
      fn square_hd_yields_square() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::SquareHd), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Square)));
        });
      }

      #[test]
      fn wide_5x4_yields_horizontal() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::WideFiveByFour), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Horizontal)));
        });
      }

      #[test]
      fn wide_4x3_yields_horizontal() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::WideFourByThree), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Horizontal)));
        });
      }

      #[test]
      fn wide_3x2_yields_horizontal() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::WideThreeByTwo), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Horizontal)));
        });
      }

      #[test]
      fn wide_16x9_yields_horizontal() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::WideSixteenByNine), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Horizontal)));
        });
      }

      #[test]
      fn wide_alias_yields_horizontal() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::Wide), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Horizontal)));
        });
      }

      #[test]
      fn wide_21x9_yields_horizontal() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::WideTwentyOneByNine), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Horizontal)));
        });
      }

      #[test]
      fn tall_4x5_yields_vertical() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::TallFourByFive), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Vertical)));
        });
      }

      #[test]
      fn tall_3x4_yields_vertical() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::TallThreeByFour), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Vertical)));
        });
      }

      #[test]
      fn tall_2x3_yields_vertical() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::TallTwoByThree), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Vertical)));
        });
      }

      #[test]
      fn tall_9x16_yields_vertical() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::TallNineBySixteen), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Vertical)));
        });
      }

      #[test]
      fn tall_alias_yields_vertical() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::Tall), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Vertical)));
        });
      }

      #[test]
      fn tall_9x21_yields_vertical() {
        assert_t2i_for_aspect_ratio(Some(CommonAspectRatio::TallNineByTwentyOne), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Vertical)));
        });
      }

      // ── Num images mapping ────────────────────────────────────────────────

      #[test]
      fn default_batch_count_is_one() {
        assert_t2i_for_batch(None, |plan| {
          assert!(matches!(plan.num_images, FalGptImage1NumImages::One));
        });
      }

      #[test]
      fn batch_of_one_yields_one() {
        assert_t2i_for_batch(Some(1), |plan| {
          assert!(matches!(plan.num_images, FalGptImage1NumImages::One));
        });
      }

      #[test]
      fn batch_of_two_yields_two() {
        assert_t2i_for_batch(Some(2), |plan| {
          assert!(matches!(plan.num_images, FalGptImage1NumImages::Two));
        });
      }

      #[test]
      fn batch_of_three_yields_three() {
        assert_t2i_for_batch(Some(3), |plan| {
          assert!(matches!(plan.num_images, FalGptImage1NumImages::Three));
        });
      }

      #[test]
      fn batch_of_four_yields_four() {
        assert_t2i_for_batch(Some(4), |plan| {
          assert!(matches!(plan.num_images, FalGptImage1NumImages::Four));
        });
      }

      #[test]
      fn batch_above_four_clamps_to_four() {
        assert_t2i_for_batch(Some(9), |plan| {
          assert!(matches!(plan.num_images, FalGptImage1NumImages::Four));
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

      fn assert_edit_for_aspect_ratio<F: FnOnce(&PlanFalGptImage1<'_>)>(
        ar: Option<CommonAspectRatio>,
        assertion: F,
      ) {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), ar, Some(1), Some(tokens)),
          &hydration,
          assertion,
        );
      }

      fn assert_edit_for_batch<F: FnOnce(&PlanFalGptImage1<'_>)>(
        batch: Option<u16>,
        assertion: F,
      ) {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, batch, Some(tokens)),
          &hydration,
          assertion,
        );
      }

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
      fn edit_mode_with_two_image_refs() {
        let (tokens, hydration) = fake_image_refs(2);
        with_edit_plan(
          &make_request(Some("p"), None, Some(1), Some(tokens)),
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
          &make_request(Some("p"), None, Some(1), Some(tokens)),
          &hydration,
          |plan| {
            assert_eq!(plan.image_urls.len(), 5);
          },
        );
      }

      #[test]
      fn edit_image_urls_are_hydrated_from_map() {
        let (tokens, hydration) = fake_image_refs(3);
        let expected: Vec<String> = tokens
          .iter()
          .map(|t| hydration.get(t).unwrap().to_string())
          .collect();
        with_edit_plan(
          &make_request(Some("p"), None, Some(1), Some(tokens.clone())),
          &hydration,
          |plan| {
            assert_eq!(plan.image_urls, expected);
          },
        );
      }

      // ── Quality default ───────────────────────────────────────────────────

      #[test]
      fn quality_defaults_to_medium() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("p"), None, Some(1), Some(tokens)),
          &hydration,
          |plan| {
            assert!(matches!(plan.quality, FalGptImage1Quality::Medium));
          },
        );
      }

      // ── Image size mappings ───────────────────────────────────────────────

      #[test]
      fn default_image_size_is_none() {
        assert_edit_for_aspect_ratio(None, |plan| {
          assert!(plan.image_size.is_none());
        });
      }

      #[test]
      fn auto_yields_none() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::Auto), |plan| {
          assert!(plan.image_size.is_none());
        });
      }

      #[test]
      fn auto_2k_yields_none() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::Auto2k), |plan| {
          assert!(plan.image_size.is_none());
        });
      }

      #[test]
      fn auto_4k_yields_none() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::Auto4k), |plan| {
          assert!(plan.image_size.is_none());
        });
      }

      #[test]
      fn square_yields_square() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::Square), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Square)));
        });
      }

      #[test]
      fn square_hd_yields_square() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::SquareHd), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Square)));
        });
      }

      #[test]
      fn wide_5x4_yields_horizontal() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::WideFiveByFour), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Horizontal)));
        });
      }

      #[test]
      fn wide_4x3_yields_horizontal() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::WideFourByThree), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Horizontal)));
        });
      }

      #[test]
      fn wide_3x2_yields_horizontal() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::WideThreeByTwo), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Horizontal)));
        });
      }

      #[test]
      fn wide_16x9_yields_horizontal() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::WideSixteenByNine), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Horizontal)));
        });
      }

      #[test]
      fn wide_alias_yields_horizontal() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::Wide), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Horizontal)));
        });
      }

      #[test]
      fn wide_21x9_yields_horizontal() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::WideTwentyOneByNine), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Horizontal)));
        });
      }

      #[test]
      fn tall_4x5_yields_vertical() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::TallFourByFive), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Vertical)));
        });
      }

      #[test]
      fn tall_3x4_yields_vertical() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::TallThreeByFour), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Vertical)));
        });
      }

      #[test]
      fn tall_2x3_yields_vertical() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::TallTwoByThree), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Vertical)));
        });
      }

      #[test]
      fn tall_9x16_yields_vertical() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::TallNineBySixteen), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Vertical)));
        });
      }

      #[test]
      fn tall_alias_yields_vertical() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::Tall), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Vertical)));
        });
      }

      #[test]
      fn tall_9x21_yields_vertical() {
        assert_edit_for_aspect_ratio(Some(CommonAspectRatio::TallNineByTwentyOne), |plan| {
          assert!(matches!(plan.image_size, Some(FalGptImage1ImageSize::Vertical)));
        });
      }

      // ── Num images mapping ────────────────────────────────────────────────

      #[test]
      fn default_batch_count_is_one() {
        assert_edit_for_batch(None, |plan| {
          assert!(matches!(plan.num_images, FalGptImage1NumImages::One));
        });
      }

      #[test]
      fn batch_of_one_yields_one() {
        assert_edit_for_batch(Some(1), |plan| {
          assert!(matches!(plan.num_images, FalGptImage1NumImages::One));
        });
      }

      #[test]
      fn batch_of_two_yields_two() {
        assert_edit_for_batch(Some(2), |plan| {
          assert!(matches!(plan.num_images, FalGptImage1NumImages::Two));
        });
      }

      #[test]
      fn batch_of_three_yields_three() {
        assert_edit_for_batch(Some(3), |plan| {
          assert!(matches!(plan.num_images, FalGptImage1NumImages::Three));
        });
      }

      #[test]
      fn batch_of_four_yields_four() {
        assert_edit_for_batch(Some(4), |plan| {
          assert!(matches!(plan.num_images, FalGptImage1NumImages::Four));
        });
      }

      #[test]
      fn batch_above_four_clamps_to_four() {
        assert_edit_for_batch(Some(9), |plan| {
          assert!(matches!(plan.num_images, FalGptImage1NumImages::Four));
        });
      }

      // ── Prompt passthrough ────────────────────────────────────────────────

      #[test]
      fn prompt_is_passed_through() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(Some("make it shiny"), None, Some(1), Some(tokens)),
          &hydration,
          |plan| {
            assert_eq!(plan.prompt, Some("make it shiny"));
          },
        );
      }

      #[test]
      fn missing_prompt_is_none() {
        let (tokens, hydration) = fake_image_refs(1);
        with_edit_plan(
          &make_request(None, None, Some(1), Some(tokens)),
          &hydration,
          |plan| {
            assert_eq!(plan.prompt, None);
          },
        );
      }
    }
  }
}
