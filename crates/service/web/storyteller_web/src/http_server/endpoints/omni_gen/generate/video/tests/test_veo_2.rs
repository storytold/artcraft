//! Tests for omni-gen video against the Veo 2 model.
//!
//! Veo 2 is image-to-video only — a start_frame is always required.
//! There is no text-to-video mode.
//!
//! Pricing: $2.50 for the first 5 seconds, +$0.50 per additional second.
//!   5s → 250¢, 6s → 300¢, 7s → 350¢, 8s → 400¢
//!
//! Supported aspect ratios: Auto, WideSixteenNine, TallNineSixteen.
//! Unsupported ratios fall back to Auto under PayMoreUpgrade.
//!
//! Supported durations: 5–8 seconds. Over-max clamps to 8s (PayMoreUpgrade).

#[cfg(test)]
mod tests {
  use std::collections::HashMap;

  use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
  use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
  use enums::common::generation::common_video_model::CommonVideoModel;
  use tokens::tokens::media_files::MediaFileToken;
  use url::Url;

  use crate::http_server::endpoints::omni_gen::generate::video::distill_video_request::{
    distill_video_request, DistilledVideoRequest,
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  fn make_request(
    prompt: Option<&str>,
    aspect_ratio: Option<CommonAspectRatio>,
    duration_seconds: Option<u16>,
    start_frame_token: Option<MediaFileToken>,
  ) -> OmniGenVideoCostAndGenerateRequest {
    OmniGenVideoCostAndGenerateRequest {
      idempotency_token: Some("11111111-1111-1111-1111-111111111111".to_string()),
      model: Some(CommonVideoModel::Veo2),
      prompt: prompt.map(|s| s.to_string()),
      negative_prompt: None,
      start_frame_image_media_token: start_frame_token,
      end_frame_image_media_token: None,
      reference_image_media_tokens: None,
      reference_video_media_tokens: None,
      reference_audio_media_tokens: None,
      reference_character_tokens: None,
      resolution: None,
      aspect_ratio,
      quality: None,
      duration_seconds,
      video_batch_count: None,
      generate_audio: None,
    }
  }

  fn fake_token(name: &str) -> (MediaFileToken, HashMap<MediaFileToken, Url>) {
    let token = MediaFileToken::new_from_str(name);
    let url = Url::parse(&format!("https://fake.example.com/{}.png", name)).unwrap();
    let mut map = HashMap::new();
    map.insert(token.clone(), url);
    (token, map)
  }

  fn distill(
    request: &OmniGenVideoCostAndGenerateRequest,
    hydration: &HashMap<MediaFileToken, Url>,
  ) -> DistilledVideoRequest {
    distill_video_request(request, Some(hydration))
      .expect("distill_video_request should succeed for Veo 2")
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   COST
  // ────────────────────────────────────────────────────────────────────────────
  //
  // Pricing: 5s = 250¢, +50¢ per additional second above 5.
  // Default duration = 5s = 250¢.
  mod cost {
    use super::*;

    mod image {
      use super::*;

      fn cost(duration: Option<u16>) -> u64 {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, duration, Some(start));
        distill(&request, &map).cost.cost_in_usd_cents.unwrap()
      }

      // ── Duration-based pricing ────────────────────────────────────────────

      #[test]
      fn default_duration_costs_250_cents() {
        assert_eq!(cost(None), 250);
      }

      #[test]
      fn five_seconds_costs_250_cents() {
        assert_eq!(cost(Some(5)), 250);
      }

      #[test]
      fn six_seconds_costs_300_cents() {
        assert_eq!(cost(Some(6)), 300);
      }

      #[test]
      fn seven_seconds_costs_350_cents() {
        assert_eq!(cost(Some(7)), 350);
      }

      #[test]
      fn eight_seconds_costs_400_cents() {
        assert_eq!(cost(Some(8)), 400);
      }

      #[test]
      fn duration_above_8_clamps_to_400_cents() {
        // PayMoreUpgrade clamps over-max to 8s.
        assert_eq!(cost(Some(15)), 400);
      }

      // ── Cost is independent of aspect ratio ───────────────────────────────

      #[test]
      fn cost_independent_of_aspect_ratio() {
        let ars = [
          None,
          Some(CommonAspectRatio::Auto),
          Some(CommonAspectRatio::WideSixteenByNine),
          Some(CommonAspectRatio::TallNineBySixteen),
          Some(CommonAspectRatio::Square),
        ];
        for ar in ars {
          let (start, map) = fake_token("mf_start0000000000000000000000");
          let request = make_request(Some("p"), ar, None, Some(start));
          assert_eq!(
            distill(&request, &map).cost.cost_in_usd_cents.unwrap(), 250,
            "expected 250¢ regardless of aspect ratio {:?}", ar,
          );
        }
      }

      // ── Cost is independent of prompt ─────────────────────────────────────

      #[test]
      fn cost_independent_of_prompt() {
        let (s1, m1) = fake_token("mf_start0000000000000000000000");
        let (s2, m2) = fake_token("mf_start0000000000000000000000");
        let a = distill(&make_request(Some("a cat"), None, None, Some(s1)), &m1);
        let b = distill(&make_request(None, None, None, Some(s2)), &m2);
        assert_eq!(a.cost.cost_in_usd_cents, b.cost.cost_in_usd_cents);
      }

      // ── Metadata flags ────────────────────────────────────────────────────

      #[test]
      fn cost_metadata_flags_are_default() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let d = distill(&make_request(Some("p"), None, None, Some(start)), &map);
        assert!(!d.cost.is_free);
        assert!(!d.cost.is_unlimited);
        assert!(!d.cost.is_rate_limited);
        assert!(!d.cost.has_watermark);
      }
    }

    mod text {
      // Veo 2 is image-to-video only; there is no text-to-video mode.
      // (start_frame is required and the plan errors without it.)
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   PLAN
  // ────────────────────────────────────────────────────────────────────────────
  mod plan {
    use super::*;

    use artcraft_router::generate::generate_video::video_generation_plan::VideoGenerationPlan;
    use artcraft_router::generate::generate_video::plan::fal::plan_generate_video_fal_veo_2::PlanFalVeo2;
    use fal_client::requests::webhook::video::image::enqueue_veo_2_image_to_video_webhook::{
      Veo2AspectRatio, Veo2Duration,
    };

    fn with_plan<F: FnOnce(&PlanFalVeo2)>(
      request: &OmniGenVideoCostAndGenerateRequest,
      hydration: &HashMap<MediaFileToken, Url>,
      assertion: F,
    ) {
      let distilled = distill(request, hydration);
      match distilled.plan() {
        VideoGenerationPlan::FalVeo2(plan) => assertion(plan),
        other => panic!("expected FalVeo2, got {:?}", other),
      }
    }

    mod image {
      use super::*;

      // ── Start frame hydration ─────────────────────────────────────────────

      #[test]
      fn start_frame_url_matches_hydration_map() {
        let token = MediaFileToken::new_from_str("mf_myframe0000000000000000000000");
        let expected_url = "https://cdn.example.com/frames/my_frame.png";
        let mut map = HashMap::new();
        map.insert(token.clone(), Url::parse(expected_url).unwrap());

        let request = make_request(Some("p"), None, None, Some(token));
        with_plan(&request, &map, |plan| {
          assert_eq!(plan.start_frame_url, expected_url);
        });
      }

      #[test]
      fn start_frame_from_larger_hydration_map() {
        let start = MediaFileToken::new_from_str("mf_start0000000000000000000000");
        let extra1 = MediaFileToken::new_from_str("mf_extra1000000000000000000000000");
        let extra2 = MediaFileToken::new_from_str("mf_extra2000000000000000000000000");

        let start_url = "https://cdn.example.com/start.png";

        let mut map = HashMap::new();
        map.insert(start.clone(), Url::parse(start_url).unwrap());
        map.insert(extra1, Url::parse("https://cdn.example.com/extra1.png").unwrap());
        map.insert(extra2, Url::parse("https://cdn.example.com/extra2.png").unwrap());

        let request = make_request(Some("p"), None, None, Some(start));
        with_plan(&request, &map, |plan| {
          assert_eq!(plan.start_frame_url, start_url);
        });
      }

      // ── Prompt passthrough ────────────────────────────────────────────────

      #[test]
      fn prompt_is_passed_through() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("a horse on mars"), None, None, Some(start));
        with_plan(&request, &map, |plan| {
          assert_eq!(plan.prompt, "a horse on mars");
        });
      }

      #[test]
      fn missing_prompt_is_empty_string() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(None, None, None, Some(start));
        with_plan(&request, &map, |plan| {
          assert_eq!(plan.prompt, "");
        });
      }

      // ── Aspect ratio mappings ─────────────────────────────────────────────

      #[test]
      fn default_aspect_ratio_is_auto() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, Some(start));
        with_plan(&request, &map, |plan| {
          assert!(matches!(plan.aspect_ratio, Veo2AspectRatio::Auto));
        });
      }

      #[test]
      fn auto_yields_auto() {
        for ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
          let (start, map) = fake_token("mf_start0000000000000000000000");
          let request = make_request(Some("p"), Some(ar), None, Some(start));
          with_plan(&request, &map, |plan| {
            assert!(matches!(plan.aspect_ratio, Veo2AspectRatio::Auto), "expected Auto for {:?}", ar);
          });
        }
      }

      #[test]
      fn wide_16x9_yields_wide_sixteen_nine() {
        for ar in [CommonAspectRatio::WideSixteenByNine, CommonAspectRatio::Wide] {
          let (start, map) = fake_token("mf_start0000000000000000000000");
          let request = make_request(Some("p"), Some(ar), None, Some(start));
          with_plan(&request, &map, |plan| {
            assert!(matches!(plan.aspect_ratio, Veo2AspectRatio::WideSixteenNine));
          });
        }
      }

      #[test]
      fn tall_9x16_yields_tall_nine_sixteen() {
        for ar in [CommonAspectRatio::TallNineBySixteen, CommonAspectRatio::Tall] {
          let (start, map) = fake_token("mf_start0000000000000000000000");
          let request = make_request(Some("p"), Some(ar), None, Some(start));
          with_plan(&request, &map, |plan| {
            assert!(matches!(plan.aspect_ratio, Veo2AspectRatio::TallNineSixteen));
          });
        }
      }

      #[test]
      fn unsupported_aspect_ratio_falls_back_to_auto() {
        let unsupported = [
          CommonAspectRatio::Square,
          CommonAspectRatio::SquareHd,
          CommonAspectRatio::WideFourByThree,
          CommonAspectRatio::WideFiveByFour,
          CommonAspectRatio::WideThreeByTwo,
          CommonAspectRatio::WideTwentyOneByNine,
          CommonAspectRatio::TallThreeByFour,
          CommonAspectRatio::TallFourByFive,
          CommonAspectRatio::TallTwoByThree,
          CommonAspectRatio::TallNineByTwentyOne,
        ];
        for ar in unsupported {
          let (start, map) = fake_token("mf_start0000000000000000000000");
          let request = make_request(Some("p"), Some(ar), None, Some(start));
          with_plan(&request, &map, |plan| {
            assert!(matches!(plan.aspect_ratio, Veo2AspectRatio::Auto), "expected Auto fallback for {:?}", ar);
          });
        }
      }

      // ── Duration mappings ─────────────────────────────────────────────────

      #[test]
      fn default_duration_is_default() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, Some(start));
        with_plan(&request, &map, |plan| {
          assert!(matches!(plan.duration, Veo2Duration::Default));
        });
      }

      #[test]
      fn duration_5_yields_five_seconds() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, Some(5), Some(start));
        with_plan(&request, &map, |plan| {
          assert!(matches!(plan.duration, Veo2Duration::FiveSeconds));
        });
      }

      #[test]
      fn duration_6_yields_six_seconds() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, Some(6), Some(start));
        with_plan(&request, &map, |plan| {
          assert!(matches!(plan.duration, Veo2Duration::SixSeconds));
        });
      }

      #[test]
      fn duration_7_yields_seven_seconds() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, Some(7), Some(start));
        with_plan(&request, &map, |plan| {
          assert!(matches!(plan.duration, Veo2Duration::SevenSeconds));
        });
      }

      #[test]
      fn duration_8_yields_eight_seconds() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, Some(8), Some(start));
        with_plan(&request, &map, |plan| {
          assert!(matches!(plan.duration, Veo2Duration::EightSeconds));
        });
      }

      #[test]
      fn duration_above_8_clamps_to_eight() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, Some(20), Some(start));
        with_plan(&request, &map, |plan| {
          assert!(matches!(plan.duration, Veo2Duration::EightSeconds));
        });
      }
    }

    mod text {
      // Veo 2 is image-to-video only; there is no text-to-video mode.
      // (start_frame is required and the plan errors without it.)
    }
  }
}
