//! Tests for omni-gen video against the Veo 2 model.
//!
//! Veo 2 supports both text-to-video and image-to-video (via start_frame).
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

  fn distill_text(request: &OmniGenVideoCostAndGenerateRequest) -> DistilledVideoRequest {
    let empty: HashMap<MediaFileToken, Url> = HashMap::new();
    distill_video_request(request, Some(&empty))
      .expect("distill_video_request should succeed for Veo 2 (text)")
  }

  fn distill_image(
    request: &OmniGenVideoCostAndGenerateRequest,
    hydration: &HashMap<MediaFileToken, Url>,
  ) -> DistilledVideoRequest {
    distill_video_request(request, Some(hydration))
      .expect("distill_video_request should succeed for Veo 2 (image)")
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   COST
  // ────────────────────────────────────────────────────────────────────────────
  mod cost {
    use super::*;

    mod text {
      use super::*;

      fn cost(duration: Option<u16>) -> u64 {
        let request = make_request(Some("p"), None, duration, None);
        distill_text(&request).cost.cost_in_usd_cents.unwrap()
      }

      #[test]
      fn default_duration_costs_250() { assert_eq!(cost(None), 250); }

      #[test]
      fn five_seconds_costs_250() { assert_eq!(cost(Some(5)), 250); }

      #[test]
      fn six_seconds_costs_300() { assert_eq!(cost(Some(6)), 300); }

      #[test]
      fn seven_seconds_costs_350() { assert_eq!(cost(Some(7)), 350); }

      #[test]
      fn eight_seconds_costs_400() { assert_eq!(cost(Some(8)), 400); }

      #[test]
      fn duration_above_8_clamps_to_400() { assert_eq!(cost(Some(15)), 400); }

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
          let request = make_request(Some("p"), ar, None, None);
          assert_eq!(distill_text(&request).cost.cost_in_usd_cents.unwrap(), 250);
        }
      }

      #[test]
      fn cost_metadata_flags_are_default() {
        let d = distill_text(&make_request(Some("p"), None, None, None));
        assert!(!d.cost.is_free);
        assert!(!d.cost.is_unlimited);
        assert!(!d.cost.is_rate_limited);
        assert!(!d.cost.has_watermark);
      }
    }

    mod image {
      use super::*;

      fn cost(duration: Option<u16>) -> u64 {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, duration, Some(start));
        distill_image(&request, &map).cost.cost_in_usd_cents.unwrap()
      }

      #[test]
      fn default_duration_costs_250() { assert_eq!(cost(None), 250); }

      #[test]
      fn five_seconds_costs_250() { assert_eq!(cost(Some(5)), 250); }

      #[test]
      fn six_seconds_costs_300() { assert_eq!(cost(Some(6)), 300); }

      #[test]
      fn seven_seconds_costs_350() { assert_eq!(cost(Some(7)), 350); }

      #[test]
      fn eight_seconds_costs_400() { assert_eq!(cost(Some(8)), 400); }

      #[test]
      fn duration_above_8_clamps_to_400() { assert_eq!(cost(Some(15)), 400); }

      #[test]
      fn image_and_text_cost_match() {
        for dur in [5u16, 6, 7, 8] {
          let text = distill_text(&make_request(Some("p"), None, Some(dur), None))
            .cost.cost_in_usd_cents.unwrap();
          let (start, map) = fake_token("mf_start0000000000000000000000");
          let img = distill_image(
            &make_request(Some("p"), None, Some(dur), Some(start)),
            &map,
          ).cost.cost_in_usd_cents.unwrap();
          assert_eq!(text, img, "text/image cost diverged at dur={}", dur);
        }
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   PLAN
  // ────────────────────────────────────────────────────────────────────────────
  mod plan {
    use super::*;

    use artcraft_router::generate::generate_video::video_generation_plan::VideoGenerationPlan;
    use artcraft_router::generate::generate_video::plan::fal::plan_generate_video_fal_veo_2::{
      FalVeo2Mode, PlanFalVeo2,
    };
    use fal_client::requests::webhook::video::image::enqueue_veo_2_image_to_video_webhook::{
      Veo2AspectRatio, Veo2Duration,
    };

    fn with_text_plan<F: FnOnce(&PlanFalVeo2)>(
      request: &OmniGenVideoCostAndGenerateRequest,
      assertion: F,
    ) {
      let distilled = distill_text(request);
      match distilled.plan() {
        VideoGenerationPlan::FalVeo2(plan) => assertion(plan),
        other => panic!("expected FalVeo2, got {:?}", other),
      }
    }

    fn with_image_plan<F: FnOnce(&PlanFalVeo2)>(
      request: &OmniGenVideoCostAndGenerateRequest,
      hydration: &HashMap<MediaFileToken, Url>,
      assertion: F,
    ) {
      let distilled = distill_image(request, hydration);
      match distilled.plan() {
        VideoGenerationPlan::FalVeo2(plan) => assertion(plan),
        other => panic!("expected FalVeo2, got {:?}", other),
      }
    }

    mod text {
      use super::*;

      // ── Mode detection ────────────────────────────────────────────────────

      #[test]
      fn text_mode_is_text_to_video() {
        with_text_plan(&make_request(Some("p"), None, None, None), |plan| {
          assert!(matches!(plan.mode, FalVeo2Mode::TextToVideo));
        });
      }

      // ── Prompt passthrough ────────────────────────────────────────────────

      #[test]
      fn prompt_is_passed_through() {
        with_text_plan(&make_request(Some("a horse on mars"), None, None, None), |plan| {
          assert_eq!(plan.prompt, "a horse on mars");
        });
      }

      #[test]
      fn missing_prompt_is_empty_string() {
        with_text_plan(&make_request(None, None, None, None), |plan| {
          assert_eq!(plan.prompt, "");
        });
      }

      // ── Aspect ratio mappings ─────────────────────────────────────────────

      #[test]
      fn default_aspect_ratio_is_auto() {
        with_text_plan(&make_request(Some("p"), None, None, None), |plan| {
          assert!(matches!(plan.aspect_ratio, Some(Veo2AspectRatio::Auto)));
        });
      }

      #[test]
      fn auto_yields_auto() {
        for ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, None), |plan| {
            assert!(matches!(plan.aspect_ratio, Some(Veo2AspectRatio::Auto)));
          });
        }
      }

      #[test]
      fn wide_16x9_yields_wide() {
        for ar in [CommonAspectRatio::WideSixteenByNine, CommonAspectRatio::Wide] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, None), |plan| {
            assert!(matches!(plan.aspect_ratio, Some(Veo2AspectRatio::WideSixteenNine)));
          });
        }
      }

      #[test]
      fn tall_9x16_yields_tall() {
        for ar in [CommonAspectRatio::TallNineBySixteen, CommonAspectRatio::Tall] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, None), |plan| {
            assert!(matches!(plan.aspect_ratio, Some(Veo2AspectRatio::TallNineSixteen)));
          });
        }
      }

      #[test]
      fn unsupported_aspect_ratio_falls_back_to_auto() {
        for ar in [
          CommonAspectRatio::Square, CommonAspectRatio::SquareHd,
          CommonAspectRatio::WideFourByThree, CommonAspectRatio::TallThreeByFour,
        ] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, None), |plan| {
            assert!(matches!(plan.aspect_ratio, Some(Veo2AspectRatio::Auto)));
          });
        }
      }

      // ── Duration mappings ─────────────────────────────────────────────────

      #[test]
      fn default_duration_is_default() {
        with_text_plan(&make_request(Some("p"), None, None, None), |plan| {
          assert!(matches!(plan.duration, Veo2Duration::Default));
        });
      }

      #[test]
      fn duration_5_yields_five() {
        with_text_plan(&make_request(Some("p"), None, Some(5), None), |plan| {
          assert!(matches!(plan.duration, Veo2Duration::FiveSeconds));
        });
      }

      #[test]
      fn duration_6_yields_six() {
        with_text_plan(&make_request(Some("p"), None, Some(6), None), |plan| {
          assert!(matches!(plan.duration, Veo2Duration::SixSeconds));
        });
      }

      #[test]
      fn duration_7_yields_seven() {
        with_text_plan(&make_request(Some("p"), None, Some(7), None), |plan| {
          assert!(matches!(plan.duration, Veo2Duration::SevenSeconds));
        });
      }

      #[test]
      fn duration_8_yields_eight() {
        with_text_plan(&make_request(Some("p"), None, Some(8), None), |plan| {
          assert!(matches!(plan.duration, Veo2Duration::EightSeconds));
        });
      }

      #[test]
      fn duration_above_8_clamps_to_eight() {
        with_text_plan(&make_request(Some("p"), None, Some(20), None), |plan| {
          assert!(matches!(plan.duration, Veo2Duration::EightSeconds));
        });
      }
    }

    mod image {
      use super::*;

      // ── Mode detection / start frame hydration ────────────────────────────

      #[test]
      fn start_frame_triggers_image_to_video() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, Some(start));
        with_image_plan(&request, &map, |plan| {
          match &plan.mode {
            FalVeo2Mode::ImageToVideo { image_url } => {
              assert!(image_url.starts_with("https://fake.example.com/"));
            }
            other => panic!("expected ImageToVideo, got {:?}", other),
          }
        });
      }

      #[test]
      fn start_frame_url_matches_hydration_map_exactly() {
        let token = MediaFileToken::new_from_str("mf_myframe0000000000000000000000");
        let expected_url = "https://cdn.example.com/frames/my_frame.png";
        let mut map = HashMap::new();
        map.insert(token.clone(), Url::parse(expected_url).unwrap());

        let request = make_request(Some("p"), None, None, Some(token));
        with_image_plan(&request, &map, |plan| {
          match &plan.mode {
            FalVeo2Mode::ImageToVideo { image_url } => {
              assert_eq!(image_url, expected_url);
            }
            other => panic!("expected ImageToVideo, got {:?}", other),
          }
        });
      }

      // ── Prompt passthrough in image mode ──────────────────────────────────

      #[test]
      fn prompt_is_passed_through_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("a horse on mars"), None, None, Some(start));
        with_image_plan(&request, &map, |plan| {
          assert_eq!(plan.prompt, "a horse on mars");
        });
      }

      // ── Aspect ratio is None in image mode (i2v inherits source AR) ────────

      #[test]
      fn aspect_ratio_is_none_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), Some(CommonAspectRatio::WideSixteenByNine), None, Some(start));
        with_image_plan(&request, &map, |plan| {
          assert!(plan.aspect_ratio.is_none(), "image-to-video should not have aspect_ratio");
        });
      }

      #[test]
      fn aspect_ratio_is_none_in_image_mode_even_with_tall() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), Some(CommonAspectRatio::TallNineBySixteen), None, Some(start));
        with_image_plan(&request, &map, |plan| {
          assert!(plan.aspect_ratio.is_none());
        });
      }

      // ── Duration pass-throughs in image mode ──────────────────────────────

      #[test]
      fn duration_5_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, Some(5), Some(start));
        with_image_plan(&request, &map, |plan| {
          assert!(matches!(plan.duration, Veo2Duration::FiveSeconds));
        });
      }

      #[test]
      fn duration_8_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, Some(8), Some(start));
        with_image_plan(&request, &map, |plan| {
          assert!(matches!(plan.duration, Veo2Duration::EightSeconds));
        });
      }

      #[test]
      fn duration_above_8_clamps_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, Some(20), Some(start));
        with_image_plan(&request, &map, |plan| {
          assert!(matches!(plan.duration, Veo2Duration::EightSeconds));
        });
      }

      #[test]
      fn default_duration_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, Some(start));
        with_image_plan(&request, &map, |plan| {
          assert!(matches!(plan.duration, Veo2Duration::Default));
        });
      }
    }
  }
}
