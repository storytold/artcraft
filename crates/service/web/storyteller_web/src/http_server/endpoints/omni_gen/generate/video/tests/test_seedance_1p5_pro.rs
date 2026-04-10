//! Tests for omni-gen video against the Seedance 1.5 Pro model.
//!
//! Seedance 1.5 Pro supports both text-to-video and image-to-video (via
//! start_frame / end_frame). Pricing is based on resolution × duration ×
//! audio, computed via a token-based formula (30 FPS, $2.40/M tokens with
//! audio, $1.20/M without). The special case 720p/5s/audio returns a flat 26¢.
//!
//! The execution plan (`FalSeedance1p5Pro`) carries mode (TextToVideo vs
//! ImageToVideo), aspect_ratio, resolution, duration, and generate_audio.

#[cfg(test)]
mod tests {
  use std::collections::HashMap;

  use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
  use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
  use enums::common::generation::common_resolution::CommonResolution;
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
    resolution: Option<CommonResolution>,
    duration_seconds: Option<u16>,
    generate_audio: Option<bool>,
    start_frame_token: Option<MediaFileToken>,
    end_frame_token: Option<MediaFileToken>,
  ) -> OmniGenVideoCostAndGenerateRequest {
    OmniGenVideoCostAndGenerateRequest {
      idempotency_token: Some("11111111-1111-1111-1111-111111111111".to_string()),
      model: Some(CommonVideoModel::Seedance1p5Pro),
      prompt: prompt.map(|s| s.to_string()),
      negative_prompt: None,
      start_frame_image_media_token: start_frame_token,
      end_frame_image_media_token: end_frame_token,
      reference_image_media_tokens: None,
      reference_video_media_tokens: None,
      reference_audio_media_tokens: None,
      reference_character_tokens: None,
      resolution,
      aspect_ratio,
      quality: None,
      duration_seconds,
      video_batch_count: None,
      generate_audio,
    }
  }

  fn fake_token(name: &str) -> (MediaFileToken, HashMap<MediaFileToken, Url>) {
    let token = MediaFileToken::new_from_str(name);
    let url = Url::parse(&format!("https://fake.example.com/{}.png", name)).unwrap();
    let mut map = HashMap::new();
    map.insert(token.clone(), url);
    (token, map)
  }

  fn fake_two_tokens(a: &str, b: &str) -> (MediaFileToken, MediaFileToken, HashMap<MediaFileToken, Url>) {
    let t1 = MediaFileToken::new_from_str(a);
    let t2 = MediaFileToken::new_from_str(b);
    let u1 = Url::parse(&format!("https://fake.example.com/{}.png", a)).unwrap();
    let u2 = Url::parse(&format!("https://fake.example.com/{}.png", b)).unwrap();
    let mut map = HashMap::new();
    map.insert(t1.clone(), u1);
    map.insert(t2.clone(), u2);
    (t1, t2, map)
  }

  fn distill_text(request: &OmniGenVideoCostAndGenerateRequest) -> DistilledVideoRequest {
    let empty: HashMap<MediaFileToken, Url> = HashMap::new();
    distill_video_request(request, Some(&empty))
      .expect("distill_video_request should succeed for Seedance 1.5 Pro (text)")
  }

  fn distill_with_map(
    request: &OmniGenVideoCostAndGenerateRequest,
    hydration: &HashMap<MediaFileToken, Url>,
  ) -> DistilledVideoRequest {
    distill_video_request(request, Some(hydration))
      .expect("distill_video_request should succeed for Seedance 1.5 Pro (image)")
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   COST
  // ────────────────────────────────────────────────────────────────────────────
  //
  // Pricing matches `estimate_video_cost_artcraft_seedance1p5_pro`, which
  // delegates to the fal token-based calculator:
  //   720p/5s/audio = flat 26¢
  //   other combos  = ceil(H×W×30×dur / 1024 × $rate / 1M × 100)
  //
  // Default resolution = 720p, default duration = 5s, default audio = true.
  mod cost {
    use super::*;

    mod text {
      use super::*;

      fn cost(
        duration: Option<u16>,
        resolution: Option<CommonResolution>,
        audio: Option<bool>,
      ) -> u64 {
        let request = make_request(Some("p"), None, resolution, duration, audio, None, None);
        distill_text(&request).cost.cost_in_usd_cents.unwrap()
      }

      // ── Default (720p/5s/audio=true) = 26¢ ───────────────────────────────

      #[test]
      fn default_costs_26_cents() {
        assert_eq!(cost(None, None, None), 26);
      }

      #[test]
      fn explicit_5s_720p_audio_costs_26() {
        assert_eq!(cost(Some(5), Some(CommonResolution::SevenTwentyP), Some(true)), 26);
      }

      // ── Duration scaling at default resolution ────────────────────────────

      #[test]
      fn four_seconds_costs_26() {
        // 4s at 720p uses token calc: ceil(1280*720*30*4/1024 * 2.4/1M * 100) ≈ 26¢
        assert_eq!(cost(Some(4), None, None), 26);
      }

      #[test]
      fn ten_seconds_costs_65() {
        assert_eq!(cost(Some(10), None, None), 65);
      }

      #[test]
      fn twelve_seconds_costs_78() {
        assert_eq!(cost(Some(12), None, None), 78);
      }

      // ── Audio toggle ──────────────────────────────────────────────────────

      #[test]
      fn no_audio_5s_720p_costs_13() {
        assert_eq!(cost(Some(5), Some(CommonResolution::SevenTwentyP), Some(false)), 13);
      }

      #[test]
      fn no_audio_10s_720p() {
        // ceil(1280*720*30*10/1024 * 1.2/1M * 100) ≈ 33
        assert_eq!(cost(Some(10), Some(CommonResolution::SevenTwentyP), Some(false)), 33);
      }

      // ── Resolution changes ────────────────────────────────────────────────

      #[test]
      fn ten_eighty_p_5s_audio() {
        // ceil(1920*1080*30*5/1024 * 2.4/1M * 100) ≈ 73
        assert_eq!(cost(Some(5), Some(CommonResolution::TenEightyP), Some(true)), 73);
      }

      #[test]
      fn four_eighty_p_5s_audio() {
        // ceil(640*480*30*5/1024 * 2.4/1M * 100) ≈ 11
        assert_eq!(cost(Some(5), Some(CommonResolution::FourEightyP), Some(true)), 11);
      }

      // ── Cost is independent of aspect ratio ───────────────────────────────

      #[test]
      fn cost_independent_of_aspect_ratio() {
        let ars = [
          None,
          Some(CommonAspectRatio::Square),
          Some(CommonAspectRatio::WideSixteenByNine),
          Some(CommonAspectRatio::TallNineBySixteen),
          Some(CommonAspectRatio::Auto),
        ];
        for ar in ars {
          let request = make_request(Some("p"), ar, None, None, None, None, None);
          assert_eq!(
            distill_text(&request).cost.cost_in_usd_cents.unwrap(), 26,
            "expected 26¢ regardless of aspect ratio {:?}", ar,
          );
        }
      }

      // ── Metadata flags ────────────────────────────────────────────────────

      #[test]
      fn cost_metadata_flags_are_default() {
        let d = distill_text(&make_request(Some("p"), None, None, None, None, None, None));
        assert!(!d.cost.is_free);
        assert!(!d.cost.is_unlimited);
        assert!(!d.cost.is_rate_limited);
        assert!(!d.cost.has_watermark);
      }
    }

    mod image {
      use super::*;

      // ── Image-to-video has the same pricing as text-to-video ──────────────

      #[test]
      fn image_to_video_default_costs_26() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, None, None, Some(start), None);
        assert_eq!(distill_with_map(&request, &map).cost.cost_in_usd_cents.unwrap(), 26);
      }

      #[test]
      fn image_to_video_matches_text_to_video_cost() {
        let text = distill_text(&make_request(Some("p"), None, None, Some(10), Some(true), None, None))
          .cost.cost_in_usd_cents.unwrap();
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let img = distill_with_map(
          &make_request(Some("p"), None, None, Some(10), Some(true), Some(start), None),
          &map,
        ).cost.cost_in_usd_cents.unwrap();
        assert_eq!(text, img);
      }

      #[test]
      fn image_to_video_no_audio_costs_13() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, None, Some(false), Some(start), None);
        assert_eq!(distill_with_map(&request, &map).cost.cost_in_usd_cents.unwrap(), 13);
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   PLAN
  // ────────────────────────────────────────────────────────────────────────────
  mod plan {
    use super::*;

    use artcraft_router::generate::generate_video::video_generation_plan::VideoGenerationPlan;
    use artcraft_router::generate::generate_video::plan::fal::plan_generate_video_fal_seedance_1p5_pro::{
      FalSeedance1p5ProAspectRatio, FalSeedance1p5ProDuration, FalSeedance1p5ProMode,
      FalSeedance1p5ProResolution, PlanFalSeedance1p5Pro,
    };

    fn with_plan<F: FnOnce(&PlanFalSeedance1p5Pro)>(
      request: &OmniGenVideoCostAndGenerateRequest,
      hydration: &HashMap<MediaFileToken, Url>,
      assertion: F,
    ) {
      let distilled = distill_with_map(request, hydration);
      match distilled.plan() {
        VideoGenerationPlan::FalSeedance1p5Pro(plan) => assertion(plan),
        other => panic!("expected FalSeedance1p5Pro, got {:?}", other),
      }
    }

    fn with_text_plan<F: FnOnce(&PlanFalSeedance1p5Pro)>(
      request: &OmniGenVideoCostAndGenerateRequest,
      assertion: F,
    ) {
      let empty = HashMap::new();
      with_plan(request, &empty, assertion);
    }

    mod text {
      use super::*;

      // ── Mode detection ────────────────────────────────────────────────────

      #[test]
      fn text_mode_is_text_to_video() {
        with_text_plan(&make_request(Some("p"), None, None, None, None, None, None), |plan| {
          assert!(matches!(plan.mode, FalSeedance1p5ProMode::TextToVideo));
        });
      }

      // ── Prompt passthrough ────────────────────────────────────────────────

      #[test]
      fn prompt_is_passed_through() {
        with_text_plan(&make_request(Some("a horse on mars"), None, None, None, None, None, None), |plan| {
          assert_eq!(plan.prompt, "a horse on mars");
        });
      }

      #[test]
      fn missing_prompt_is_empty_string() {
        with_text_plan(&make_request(None, None, None, None, None, None, None), |plan| {
          assert_eq!(plan.prompt, "");
        });
      }

      // ── Aspect ratio mappings ─────────────────────────────────────────────

      #[test]
      fn default_aspect_ratio_is_none() {
        with_text_plan(&make_request(Some("p"), None, None, None, None, None, None), |plan| {
          assert!(plan.aspect_ratio.is_none());
        });
      }

      #[test]
      fn auto_yields_auto() {
        for ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, None, None, None, None), |plan| {
            assert!(matches!(plan.aspect_ratio, Some(FalSeedance1p5ProAspectRatio::Auto)), "expected Auto for {:?}", ar);
          });
        }
      }

      #[test]
      fn square_yields_square() {
        for ar in [CommonAspectRatio::Square, CommonAspectRatio::SquareHd] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, None, None, None, None), |plan| {
            assert!(matches!(plan.aspect_ratio, Some(FalSeedance1p5ProAspectRatio::Square)));
          });
        }
      }

      #[test]
      fn wide_16x9_yields_sixteen_by_nine() {
        for ar in [CommonAspectRatio::WideSixteenByNine, CommonAspectRatio::Wide] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, None, None, None, None), |plan| {
            assert!(matches!(plan.aspect_ratio, Some(FalSeedance1p5ProAspectRatio::SixteenByNine)));
          });
        }
      }

      #[test]
      fn wide_4x3_yields_four_by_three() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::WideFourByThree), None, None, None, None, None), |plan| {
          assert!(matches!(plan.aspect_ratio, Some(FalSeedance1p5ProAspectRatio::FourByThree)));
        });
      }

      #[test]
      fn wide_21x9_yields_twenty_one_by_nine() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::WideTwentyOneByNine), None, None, None, None, None), |plan| {
          assert!(matches!(plan.aspect_ratio, Some(FalSeedance1p5ProAspectRatio::TwentyOneByNine)));
        });
      }

      #[test]
      fn tall_9x16_yields_nine_by_sixteen() {
        for ar in [CommonAspectRatio::TallNineBySixteen, CommonAspectRatio::Tall] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, None, None, None, None), |plan| {
            assert!(matches!(plan.aspect_ratio, Some(FalSeedance1p5ProAspectRatio::NineBySixteen)));
          });
        }
      }

      #[test]
      fn tall_3x4_yields_three_by_four() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::TallThreeByFour), None, None, None, None, None), |plan| {
          assert!(matches!(plan.aspect_ratio, Some(FalSeedance1p5ProAspectRatio::ThreeByFour)));
        });
      }

      // ── Unsupported aspect ratios fall back to nearest under PayMoreUpgrade

      #[test]
      fn wide_5x4_falls_back_to_four_by_three() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::WideFiveByFour), None, None, None, None, None), |plan| {
          assert!(matches!(plan.aspect_ratio, Some(FalSeedance1p5ProAspectRatio::FourByThree)));
        });
      }

      #[test]
      fn wide_3x2_falls_back_to_four_by_three() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::WideThreeByTwo), None, None, None, None, None), |plan| {
          assert!(matches!(plan.aspect_ratio, Some(FalSeedance1p5ProAspectRatio::FourByThree)));
        });
      }

      #[test]
      fn tall_4x5_falls_back_to_three_by_four() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::TallFourByFive), None, None, None, None, None), |plan| {
          assert!(matches!(plan.aspect_ratio, Some(FalSeedance1p5ProAspectRatio::ThreeByFour)));
        });
      }

      #[test]
      fn tall_2x3_falls_back_to_three_by_four() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::TallTwoByThree), None, None, None, None, None), |plan| {
          assert!(matches!(plan.aspect_ratio, Some(FalSeedance1p5ProAspectRatio::ThreeByFour)));
        });
      }

      #[test]
      fn tall_9x21_falls_back_to_nine_by_sixteen() {
        with_text_plan(&make_request(Some("p"), Some(CommonAspectRatio::TallNineByTwentyOne), None, None, None, None, None), |plan| {
          assert!(matches!(plan.aspect_ratio, Some(FalSeedance1p5ProAspectRatio::NineBySixteen)));
        });
      }

      // ── Duration mapping ──────────────────────────────────────────────────

      #[test]
      fn default_duration_is_none() {
        with_text_plan(&make_request(Some("p"), None, None, None, None, None, None), |plan| {
          assert!(plan.duration.is_none());
        });
      }

      #[test]
      fn duration_4_yields_four() {
        with_text_plan(&make_request(Some("p"), None, None, Some(4), None, None, None), |plan| {
          assert!(matches!(plan.duration, Some(FalSeedance1p5ProDuration::Four)));
        });
      }

      #[test]
      fn duration_5_yields_five() {
        with_text_plan(&make_request(Some("p"), None, None, Some(5), None, None, None), |plan| {
          assert!(matches!(plan.duration, Some(FalSeedance1p5ProDuration::Five)));
        });
      }

      #[test]
      fn duration_6_yields_six() {
        with_text_plan(&make_request(Some("p"), None, None, Some(6), None, None, None), |plan| {
          assert!(matches!(plan.duration, Some(FalSeedance1p5ProDuration::Six)));
        });
      }

      #[test]
      fn duration_7_yields_seven() {
        with_text_plan(&make_request(Some("p"), None, None, Some(7), None, None, None), |plan| {
          assert!(matches!(plan.duration, Some(FalSeedance1p5ProDuration::Seven)));
        });
      }

      #[test]
      fn duration_8_yields_eight() {
        with_text_plan(&make_request(Some("p"), None, None, Some(8), None, None, None), |plan| {
          assert!(matches!(plan.duration, Some(FalSeedance1p5ProDuration::Eight)));
        });
      }

      #[test]
      fn duration_9_yields_nine() {
        with_text_plan(&make_request(Some("p"), None, None, Some(9), None, None, None), |plan| {
          assert!(matches!(plan.duration, Some(FalSeedance1p5ProDuration::Nine)));
        });
      }

      #[test]
      fn duration_10_yields_ten() {
        with_text_plan(&make_request(Some("p"), None, None, Some(10), None, None, None), |plan| {
          assert!(matches!(plan.duration, Some(FalSeedance1p5ProDuration::Ten)));
        });
      }

      #[test]
      fn duration_11_yields_eleven() {
        with_text_plan(&make_request(Some("p"), None, None, Some(11), None, None, None), |plan| {
          assert!(matches!(plan.duration, Some(FalSeedance1p5ProDuration::Eleven)));
        });
      }

      #[test]
      fn duration_12_yields_twelve() {
        with_text_plan(&make_request(Some("p"), None, None, Some(12), None, None, None), |plan| {
          assert!(matches!(plan.duration, Some(FalSeedance1p5ProDuration::Twelve)));
        });
      }

      #[test]
      fn duration_above_12_clamps_to_twelve() {
        with_text_plan(&make_request(Some("p"), None, None, Some(20), None, None, None), |plan| {
          assert!(matches!(plan.duration, Some(FalSeedance1p5ProDuration::Twelve)));
        });
      }

      // ── Resolution mapping ────────────────────────────────────────────────

      #[test]
      fn default_resolution_is_none() {
        with_text_plan(&make_request(Some("p"), None, None, None, None, None, None), |plan| {
          assert!(plan.resolution.is_none());
        });
      }

      #[test]
      fn four_eighty_p_yields_four_eighty_p() {
        with_text_plan(&make_request(Some("p"), None, Some(CommonResolution::FourEightyP), None, None, None, None), |plan| {
          assert!(matches!(plan.resolution, Some(FalSeedance1p5ProResolution::FourEightyP)));
        });
      }

      #[test]
      fn seven_twenty_p_yields_seven_twenty_p() {
        with_text_plan(&make_request(Some("p"), None, Some(CommonResolution::SevenTwentyP), None, None, None, None), |plan| {
          assert!(matches!(plan.resolution, Some(FalSeedance1p5ProResolution::SevenTwentyP)));
        });
      }

      #[test]
      fn ten_eighty_p_yields_ten_eighty_p() {
        with_text_plan(&make_request(Some("p"), None, Some(CommonResolution::TenEightyP), None, None, None, None), |plan| {
          assert!(matches!(plan.resolution, Some(FalSeedance1p5ProResolution::TenEightyP)));
        });
      }

      // ── Generate audio passthrough ────────────────────────────────────────

      #[test]
      fn default_audio_is_none() {
        with_text_plan(&make_request(Some("p"), None, None, None, None, None, None), |plan| {
          assert!(plan.generate_audio.is_none());
        });
      }

      #[test]
      fn audio_true_passes_through() {
        with_text_plan(&make_request(Some("p"), None, None, None, Some(true), None, None), |plan| {
          assert_eq!(plan.generate_audio, Some(true));
        });
      }

      #[test]
      fn audio_false_passes_through() {
        with_text_plan(&make_request(Some("p"), None, None, None, Some(false), None, None), |plan| {
          assert_eq!(plan.generate_audio, Some(false));
        });
      }
    }

    mod image {
      use super::*;

      // ── Mode detection ────────────────────────────────────────────────────

      #[test]
      fn start_frame_triggers_image_to_video() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, None, None, Some(start), None);
        with_plan(&request, &map, |plan| {
          match &plan.mode {
            FalSeedance1p5ProMode::ImageToVideo { image_url, end_image_url } => {
              assert!(image_url.starts_with("https://fake.example.com/"));
              assert!(end_image_url.is_none());
            }
            other => panic!("expected ImageToVideo, got {:?}", other),
          }
        });
      }

      #[test]
      fn start_and_end_frame_both_hydrated() {
        let (start, end, map) = fake_two_tokens(
          "mf_start0000000000000000000000",
          "mf_end00000000000000000000000000",
        );
        let request = make_request(Some("p"), None, None, None, None, Some(start), Some(end));
        with_plan(&request, &map, |plan| {
          match &plan.mode {
            FalSeedance1p5ProMode::ImageToVideo { image_url, end_image_url } => {
              assert!(image_url.contains("mf_start"));
              assert!(end_image_url.as_ref().unwrap().contains("mf_end"));
            }
            other => panic!("expected ImageToVideo, got {:?}", other),
          }
        });
      }

      // ── Prompt passthrough in image mode ──────────────────────────────────

      #[test]
      fn prompt_is_passed_through_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("a horse on mars"), None, None, None, None, Some(start), None);
        with_plan(&request, &map, |plan| {
          assert_eq!(plan.prompt, "a horse on mars");
        });
      }

      // ── Aspect ratio in image mode ────────────────────────────────────────

      #[test]
      fn aspect_ratio_passes_through_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), Some(CommonAspectRatio::WideSixteenByNine), None, None, None, Some(start), None);
        with_plan(&request, &map, |plan| {
          assert!(matches!(plan.aspect_ratio, Some(FalSeedance1p5ProAspectRatio::SixteenByNine)));
        });
      }

      // ── Duration pass-throughs in image mode ────────────────────────────────

      #[test]
      fn duration_4_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, Some(4), None, Some(start), None);
        with_plan(&request, &map, |plan| {
          assert!(matches!(plan.duration, Some(FalSeedance1p5ProDuration::Four)));
        });
      }

      #[test]
      fn duration_5_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, Some(5), None, Some(start), None);
        with_plan(&request, &map, |plan| {
          assert!(matches!(plan.duration, Some(FalSeedance1p5ProDuration::Five)));
        });
      }

      #[test]
      fn duration_8_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, Some(8), None, Some(start), None);
        with_plan(&request, &map, |plan| {
          assert!(matches!(plan.duration, Some(FalSeedance1p5ProDuration::Eight)));
        });
      }

      #[test]
      fn duration_12_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, Some(12), None, Some(start), None);
        with_plan(&request, &map, |plan| {
          assert!(matches!(plan.duration, Some(FalSeedance1p5ProDuration::Twelve)));
        });
      }

      #[test]
      fn duration_above_12_clamps_to_twelve_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, Some(30), None, Some(start), None);
        with_plan(&request, &map, |plan| {
          assert!(matches!(plan.duration, Some(FalSeedance1p5ProDuration::Twelve)));
        });
      }

      #[test]
      fn default_duration_is_none_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, None, None, Some(start), None);
        with_plan(&request, &map, |plan| {
          assert!(plan.duration.is_none());
        });
      }

      // ── Resolution in image mode ──────────────────────────────────────────

      #[test]
      fn resolution_passes_through_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, Some(CommonResolution::TenEightyP), None, None, Some(start), None);
        with_plan(&request, &map, |plan| {
          assert!(matches!(plan.resolution, Some(FalSeedance1p5ProResolution::TenEightyP)));
        });
      }

      // ── Audio in image mode ───────────────────────────────────────────────

      #[test]
      fn audio_passes_through_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, None, Some(false), Some(start), None);
        with_plan(&request, &map, |plan| {
          assert_eq!(plan.generate_audio, Some(false));
        });
      }

      // ── Media file mapping: exact 1:1 token→URL verification ──────────────

      #[test]
      fn start_frame_url_matches_hydration_map_exactly() {
        let token = MediaFileToken::new_from_str("mf_abc00000000000000000000000000");
        let expected_url = "https://cdn.example.com/images/abc123.png";
        let mut map = HashMap::new();
        map.insert(token.clone(), Url::parse(expected_url).unwrap());

        let request = make_request(Some("p"), None, None, None, None, Some(token), None);
        with_plan(&request, &map, |plan| {
          match &plan.mode {
            FalSeedance1p5ProMode::ImageToVideo { image_url, .. } => {
              assert_eq!(image_url, expected_url);
            }
            other => panic!("expected ImageToVideo, got {:?}", other),
          }
        });
      }

      #[test]
      fn start_and_end_frame_urls_match_hydration_map_exactly() {
        let start_token = MediaFileToken::new_from_str("mf_start0000000000000000000000");
        let end_token = MediaFileToken::new_from_str("mf_end00000000000000000000000000");
        let start_url = "https://cdn.example.com/images/start_frame.png";
        let end_url = "https://cdn.example.com/images/end_frame.png";

        let mut map = HashMap::new();
        map.insert(start_token.clone(), Url::parse(start_url).unwrap());
        map.insert(end_token.clone(), Url::parse(end_url).unwrap());

        let request = make_request(Some("p"), None, None, None, None, Some(start_token), Some(end_token));
        with_plan(&request, &map, |plan| {
          match &plan.mode {
            FalSeedance1p5ProMode::ImageToVideo { image_url, end_image_url } => {
              assert_eq!(image_url, start_url);
              assert_eq!(end_image_url.as_deref().unwrap(), end_url);
            }
            other => panic!("expected ImageToVideo, got {:?}", other),
          }
        });
      }

      #[test]
      fn hydration_map_with_extra_tokens_still_resolves_correctly() {
        // Map has 4 tokens but only start_frame + end_frame are used by
        // the request. The extras are ignored.
        let start_token = MediaFileToken::new_from_str("mf_start0000000000000000000000");
        let end_token = MediaFileToken::new_from_str("mf_end00000000000000000000000000");
        let extra1 = MediaFileToken::new_from_str("mf_extra1000000000000000000000000");
        let extra2 = MediaFileToken::new_from_str("mf_extra2000000000000000000000000");

        let start_url = "https://cdn.example.com/start.png";
        let end_url = "https://cdn.example.com/end.png";

        let mut map = HashMap::new();
        map.insert(start_token.clone(), Url::parse(start_url).unwrap());
        map.insert(end_token.clone(), Url::parse(end_url).unwrap());
        map.insert(extra1, Url::parse("https://cdn.example.com/extra1.png").unwrap());
        map.insert(extra2, Url::parse("https://cdn.example.com/extra2.png").unwrap());

        let request = make_request(Some("p"), None, None, None, None, Some(start_token), Some(end_token));
        with_plan(&request, &map, |plan| {
          match &plan.mode {
            FalSeedance1p5ProMode::ImageToVideo { image_url, end_image_url } => {
              assert_eq!(image_url, start_url);
              assert_eq!(end_image_url.as_deref().unwrap(), end_url);
            }
            other => panic!("expected ImageToVideo, got {:?}", other),
          }
        });
      }

      #[test]
      fn start_frame_only_with_larger_hydration_map() {
        // Map has 3 tokens, request only uses start_frame.
        let start_token = MediaFileToken::new_from_str("mf_start0000000000000000000000");
        let other1 = MediaFileToken::new_from_str("mf_other1000000000000000000000000");
        let other2 = MediaFileToken::new_from_str("mf_other2000000000000000000000000");

        let start_url = "https://cdn.example.com/keyframe.jpg";

        let mut map = HashMap::new();
        map.insert(start_token.clone(), Url::parse(start_url).unwrap());
        map.insert(other1, Url::parse("https://cdn.example.com/other1.jpg").unwrap());
        map.insert(other2, Url::parse("https://cdn.example.com/other2.jpg").unwrap());

        let request = make_request(Some("p"), None, None, None, None, Some(start_token), None);
        with_plan(&request, &map, |plan| {
          match &plan.mode {
            FalSeedance1p5ProMode::ImageToVideo { image_url, end_image_url } => {
              assert_eq!(image_url, start_url);
              assert!(end_image_url.is_none());
            }
            other => panic!("expected ImageToVideo, got {:?}", other),
          }
        });
      }
    }
  }
}
