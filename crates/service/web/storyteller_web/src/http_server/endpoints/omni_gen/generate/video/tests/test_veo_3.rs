//! Tests for omni-gen video against the Veo 3 model.
//!
//! Veo 3 supports both text-to-video and image-to-video (via start_frame).
//!
//! Pricing: $0.20/sec (audio off) or $0.40/sec (audio on).
//! Default: 8s, audio off (artcraft legacy) → 160¢.
//!   4s no-audio → 80¢, 6s no-audio → 120¢, 8s no-audio → 160¢
//!   4s audio    → 160¢, 6s audio   → 240¢, 8s audio    → 320¢
//!
//! Supported aspect ratios (text mode only): Default, 16:9, 9:16, Square.
//! Image-to-video inherits the source frame's aspect ratio.
//!
//! Supported resolutions: 720p, 1080p.
//! Supported durations: 4s, 6s, 8s. Over-max clamps to 8s (PayMoreUpgrade).

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
  ) -> OmniGenVideoCostAndGenerateRequest {
    OmniGenVideoCostAndGenerateRequest {
      idempotency_token: Some("11111111-1111-1111-1111-111111111111".to_string()),
      model: Some(CommonVideoModel::Veo3),
      prompt: prompt.map(|s| s.to_string()),
      negative_prompt: None,
      start_frame_image_media_token: start_frame_token,
      end_frame_image_media_token: None,
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

  fn distill_text(request: &OmniGenVideoCostAndGenerateRequest) -> DistilledVideoRequest {
    let empty: HashMap<MediaFileToken, Url> = HashMap::new();
    distill_video_request(request, Some(&empty))
      .expect("distill should succeed for Veo 3 (text)")
  }

  fn distill_image(
    request: &OmniGenVideoCostAndGenerateRequest,
    hydration: &HashMap<MediaFileToken, Url>,
  ) -> DistilledVideoRequest {
    distill_video_request(request, Some(hydration))
      .expect("distill should succeed for Veo 3 (image)")
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   COST
  // ────────────────────────────────────────────────────────────────────────────
  //
  // Artcraft cost path: always 8s (legacy). $0.20/sec no-audio, $0.40/sec audio.
  // Default audio = false (artcraft legacy).
  mod cost {
    use super::*;

    mod text {
      use super::*;

      fn cost(duration: Option<u16>, audio: Option<bool>) -> u64 {
        let request = make_request(Some("p"), None, None, duration, audio, None);
        distill_text(&request).cost.cost_in_usd_cents.unwrap()
      }

      // ── No audio: $0.20/sec ──────────────────────────────────────────────

      #[test]
      fn default_no_audio_costs_160() { assert_eq!(cost(None, None), 160); } // 8s × 20¢

      #[test]
      fn four_seconds_no_audio_costs_80() { assert_eq!(cost(Some(4), Some(false)), 80); }

      #[test]
      fn six_seconds_no_audio_costs_120() { assert_eq!(cost(Some(6), Some(false)), 120); }

      #[test]
      fn eight_seconds_no_audio_costs_160() { assert_eq!(cost(Some(8), Some(false)), 160); }

      // ── Audio on: $0.40/sec ───────────────────────────────────────────────

      #[test]
      fn four_seconds_audio_on_costs_160() { assert_eq!(cost(Some(4), Some(true)), 160); }

      #[test]
      fn six_seconds_audio_on_costs_240() { assert_eq!(cost(Some(6), Some(true)), 240); }

      #[test]
      fn eight_seconds_audio_on_costs_320() { assert_eq!(cost(Some(8), Some(true)), 320); }

      #[test]
      fn default_duration_audio_on_costs_320() { assert_eq!(cost(None, Some(true)), 320); }

      // ── Over-max clamps to 8s ─────────────────────────────────────────────

      #[test]
      fn duration_above_8_clamps_to_160_no_audio() { assert_eq!(cost(Some(20), Some(false)), 160); }

      #[test]
      fn duration_above_8_clamps_to_320_audio() { assert_eq!(cost(Some(20), Some(true)), 320); }

      // ── Cost is independent of aspect ratio ───────────────────────────────

      #[test]
      fn cost_independent_of_aspect_ratio() {
        for ar in [None, Some(CommonAspectRatio::Auto), Some(CommonAspectRatio::WideSixteenByNine), Some(CommonAspectRatio::TallNineBySixteen)] {
          let request = make_request(Some("p"), ar, None, None, None, None);
          assert_eq!(distill_text(&request).cost.cost_in_usd_cents.unwrap(), 160);
        }
      }

      // ── Cost is independent of resolution ─────────────────────────────────

      #[test]
      fn cost_independent_of_resolution() {
        for res in [None, Some(CommonResolution::SevenTwentyP), Some(CommonResolution::TenEightyP)] {
          let request = make_request(Some("p"), None, res, None, None, None);
          assert_eq!(distill_text(&request).cost.cost_in_usd_cents.unwrap(), 160);
        }
      }

      // ── Metadata flags ────────────────────────────────────────────────────

      #[test]
      fn cost_metadata_flags_are_default() {
        let d = distill_text(&make_request(Some("p"), None, None, None, None, None));
        assert!(!d.cost.is_free);
        assert!(!d.cost.is_unlimited);
        assert!(!d.cost.is_rate_limited);
        assert!(!d.cost.has_watermark);
      }
    }

    mod image {
      use super::*;

      fn cost_img(duration: Option<u16>, audio: Option<bool>) -> u64 {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, duration, audio, Some(start));
        distill_image(&request, &map).cost.cost_in_usd_cents.unwrap()
      }

      #[test]
      fn default_costs_160() { assert_eq!(cost_img(None, None), 160); }

      #[test]
      fn four_seconds_no_audio_costs_80() { assert_eq!(cost_img(Some(4), Some(false)), 80); }

      #[test]
      fn six_seconds_audio_on_costs_240() { assert_eq!(cost_img(Some(6), Some(true)), 240); }

      #[test]
      fn eight_seconds_audio_on_costs_320() { assert_eq!(cost_img(Some(8), Some(true)), 320); }

      #[test]
      fn image_and_text_cost_match() {
        let text = distill_text(&make_request(Some("p"), None, None, None, None, None))
          .cost.cost_in_usd_cents.unwrap();
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let img = distill_image(
          &make_request(Some("p"), None, None, None, None, Some(start)),
          &map,
        ).cost.cost_in_usd_cents.unwrap();
        assert_eq!(text, img);
      }
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  //   PLAN
  // ────────────────────────────────────────────────────────────────────────────
  mod plan {
    use super::*;

    use artcraft_router::generate::generate_video::video_generation_plan::VideoGenerationPlan;
    use artcraft_router::generate::generate_video::plan::fal::plan_generate_video_fal_veo_3::{
      FalVeo3Duration, FalVeo3I2vAspectRatio, FalVeo3Mode, FalVeo3Resolution,
      FalVeo3T2vAspectRatio, PlanFalVeo3,
    };

    fn with_text_plan<F: FnOnce(&PlanFalVeo3)>(
      request: &OmniGenVideoCostAndGenerateRequest,
      assertion: F,
    ) {
      let distilled = distill_text(request);
      match distilled.plan() {
        VideoGenerationPlan::FalVeo3(plan) => assertion(plan),
        other => panic!("expected FalVeo3, got {:?}", other),
      }
    }

    fn with_image_plan<F: FnOnce(&PlanFalVeo3)>(
      request: &OmniGenVideoCostAndGenerateRequest,
      hydration: &HashMap<MediaFileToken, Url>,
      assertion: F,
    ) {
      let distilled = distill_image(request, hydration);
      match distilled.plan() {
        VideoGenerationPlan::FalVeo3(plan) => assertion(plan),
        other => panic!("expected FalVeo3, got {:?}", other),
      }
    }

    mod text {
      use super::*;

      // ── Mode detection ────────────────────────────────────────────────────

      #[test]
      fn text_mode_is_text_to_video() {
        with_text_plan(&make_request(Some("p"), None, None, None, None, None), |plan| {
          assert!(matches!(plan.mode, FalVeo3Mode::TextToVideo));
        });
      }

      // ── Prompt passthrough ────────────────────────────────────────────────

      #[test]
      fn prompt_is_passed_through() {
        with_text_plan(&make_request(Some("a horse on mars"), None, None, None, None, None), |plan| {
          assert_eq!(plan.prompt, "a horse on mars");
        });
      }

      #[test]
      fn missing_prompt_is_empty_string() {
        with_text_plan(&make_request(None, None, None, None, None, None), |plan| {
          assert_eq!(plan.prompt, "");
        });
      }

      // ── Aspect ratio mappings (text mode only) ────────────────────────────

      #[test]
      fn default_aspect_ratio_is_default() {
        with_text_plan(&make_request(Some("p"), None, None, None, None, None), |plan| {
          assert!(matches!(plan.t2v_aspect_ratio, Some(FalVeo3T2vAspectRatio::Default)));
        });
      }

      #[test]
      fn wide_16x9_yields_wide() {
        for ar in [CommonAspectRatio::WideSixteenByNine, CommonAspectRatio::Wide] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, None, None, None), |plan| {
            assert!(matches!(plan.t2v_aspect_ratio, Some(FalVeo3T2vAspectRatio::WideSixteenNine)));
          });
        }
      }

      #[test]
      fn tall_9x16_yields_tall() {
        for ar in [CommonAspectRatio::TallNineBySixteen, CommonAspectRatio::Tall] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, None, None, None), |plan| {
            assert!(matches!(plan.t2v_aspect_ratio, Some(FalVeo3T2vAspectRatio::TallNineSixteen)));
          });
        }
      }

      #[test]
      fn square_falls_back_to_default() {
        // Veo 3 t2v has no Square — falls back to Default (16:9).
        for ar in [CommonAspectRatio::Square, CommonAspectRatio::SquareHd] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, None, None, None), |plan| {
            assert!(matches!(plan.t2v_aspect_ratio, Some(FalVeo3T2vAspectRatio::Default)));
          });
        }
      }

      #[test]
      fn auto_falls_back_to_default() {
        // Veo 3 t2v has no Auto — falls back to Default (16:9).
        for ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, None, None, None), |plan| {
            assert!(matches!(plan.t2v_aspect_ratio, Some(FalVeo3T2vAspectRatio::Default)));
          });
        }
      }

      #[test]
      fn unsupported_aspect_ratio_falls_back_to_default() {
        for ar in [CommonAspectRatio::WideFourByThree, CommonAspectRatio::TallThreeByFour, CommonAspectRatio::WideFiveByFour] {
          with_text_plan(&make_request(Some("p"), Some(ar), None, None, None, None), |plan| {
            assert!(matches!(plan.t2v_aspect_ratio, Some(FalVeo3T2vAspectRatio::Default)));
          });
        }
      }

      // ── Duration mappings ─────────────────────────────────────────────────

      #[test]
      fn default_duration_is_default() {
        with_text_plan(&make_request(Some("p"), None, None, None, None, None), |plan| {
          assert!(matches!(plan.duration, FalVeo3Duration::Default));
        });
      }

      #[test]
      fn duration_4_yields_four() {
        with_text_plan(&make_request(Some("p"), None, None, Some(4), None, None), |plan| {
          assert!(matches!(plan.duration, FalVeo3Duration::FourSeconds));
        });
      }

      #[test]
      fn duration_6_yields_six() {
        with_text_plan(&make_request(Some("p"), None, None, Some(6), None, None), |plan| {
          assert!(matches!(plan.duration, FalVeo3Duration::SixSeconds));
        });
      }

      #[test]
      fn duration_8_yields_eight() {
        with_text_plan(&make_request(Some("p"), None, None, Some(8), None, None), |plan| {
          assert!(matches!(plan.duration, FalVeo3Duration::EightSeconds));
        });
      }

      #[test]
      fn duration_above_8_clamps_to_eight() {
        with_text_plan(&make_request(Some("p"), None, None, Some(20), None, None), |plan| {
          assert!(matches!(plan.duration, FalVeo3Duration::EightSeconds));
        });
      }

      // ── Resolution mappings ───────────────────────────────────────────────

      #[test]
      fn default_resolution_is_default() {
        with_text_plan(&make_request(Some("p"), None, None, None, None, None), |plan| {
          assert!(matches!(plan.resolution, FalVeo3Resolution::Default));
        });
      }

      #[test]
      fn seven_twenty_p_yields_seven_twenty_p() {
        with_text_plan(&make_request(Some("p"), None, Some(CommonResolution::SevenTwentyP), None, None, None), |plan| {
          assert!(matches!(plan.resolution, FalVeo3Resolution::SevenTwentyP));
        });
      }

      #[test]
      fn ten_eighty_p_yields_ten_eighty_p() {
        with_text_plan(&make_request(Some("p"), None, Some(CommonResolution::TenEightyP), None, None, None), |plan| {
          assert!(matches!(plan.resolution, FalVeo3Resolution::TenEightyP));
        });
      }

      // ── Generate audio passthrough ────────────────────────────────────────

      #[test]
      fn default_audio_is_true() {
        // Fal plan defaults generate_audio to true.
        with_text_plan(&make_request(Some("p"), None, None, None, None, None), |plan| {
          assert!(plan.generate_audio);
        });
      }

      #[test]
      fn audio_true_passes_through() {
        with_text_plan(&make_request(Some("p"), None, None, None, Some(true), None), |plan| {
          assert!(plan.generate_audio);
        });
      }

      #[test]
      fn audio_false_passes_through() {
        with_text_plan(&make_request(Some("p"), None, None, None, Some(false), None), |plan| {
          assert!(!plan.generate_audio);
        });
      }
    }

    mod image {
      use super::*;

      // ── Mode detection / start frame hydration ────────────────────────────

      #[test]
      fn start_frame_triggers_image_to_video() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, None, None, Some(start));
        with_image_plan(&request, &map, |plan| {
          match &plan.mode {
            FalVeo3Mode::ImageToVideo { image_url } => {
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

        let request = make_request(Some("p"), None, None, None, None, Some(token));
        with_image_plan(&request, &map, |plan| {
          match &plan.mode {
            FalVeo3Mode::ImageToVideo { image_url } => {
              assert_eq!(image_url, expected_url);
            }
            other => panic!("expected ImageToVideo, got {:?}", other),
          }
        });
      }

      // ── Aspect ratio is None in image mode ────────────────────────────────

      // ── Aspect ratio in image mode: uses i2v (has Auto, no Square) ─────────

      #[test]
      fn t2v_aspect_ratio_is_none_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), Some(CommonAspectRatio::WideSixteenByNine), None, None, None, Some(start));
        with_image_plan(&request, &map, |plan| {
          assert!(plan.t2v_aspect_ratio.is_none());
        });
      }

      #[test]
      fn i2v_default_aspect_ratio_is_auto() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, None, None, Some(start));
        with_image_plan(&request, &map, |plan| {
          assert!(matches!(plan.i2v_aspect_ratio, Some(FalVeo3I2vAspectRatio::Auto)));
        });
      }

      #[test]
      fn i2v_wide_16x9_yields_wide() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), Some(CommonAspectRatio::WideSixteenByNine), None, None, None, Some(start));
        with_image_plan(&request, &map, |plan| {
          assert!(matches!(plan.i2v_aspect_ratio, Some(FalVeo3I2vAspectRatio::WideSixteenNine)));
        });
      }

      #[test]
      fn i2v_tall_9x16_yields_tall() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), Some(CommonAspectRatio::TallNineBySixteen), None, None, None, Some(start));
        with_image_plan(&request, &map, |plan| {
          assert!(matches!(plan.i2v_aspect_ratio, Some(FalVeo3I2vAspectRatio::TallNineSixteen)));
        });
      }

      #[test]
      fn i2v_auto_yields_auto() {
        for ar in [CommonAspectRatio::Auto, CommonAspectRatio::Auto2k, CommonAspectRatio::Auto4k] {
          let (start, map) = fake_token("mf_start0000000000000000000000");
          let request = make_request(Some("p"), Some(ar), None, None, None, Some(start));
          with_image_plan(&request, &map, |plan| {
            assert!(matches!(plan.i2v_aspect_ratio, Some(FalVeo3I2vAspectRatio::Auto)));
          });
        }
      }

      #[test]
      fn i2v_square_falls_back_to_auto() {
        for ar in [CommonAspectRatio::Square, CommonAspectRatio::SquareHd] {
          let (start, map) = fake_token("mf_start0000000000000000000000");
          let request = make_request(Some("p"), Some(ar), None, None, None, Some(start));
          with_image_plan(&request, &map, |plan| {
            assert!(matches!(plan.i2v_aspect_ratio, Some(FalVeo3I2vAspectRatio::Auto)));
          });
        }
      }

      #[test]
      fn i2v_unsupported_falls_back_to_auto() {
        for ar in [CommonAspectRatio::WideFourByThree, CommonAspectRatio::TallThreeByFour] {
          let (start, map) = fake_token("mf_start0000000000000000000000");
          let request = make_request(Some("p"), Some(ar), None, None, None, Some(start));
          with_image_plan(&request, &map, |plan| {
            assert!(matches!(plan.i2v_aspect_ratio, Some(FalVeo3I2vAspectRatio::Auto)));
          });
        }
      }

      // ── Prompt passthrough in image mode ──────────────────────────────────

      #[test]
      fn prompt_is_passed_through_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("a horse on mars"), None, None, None, None, Some(start));
        with_image_plan(&request, &map, |plan| {
          assert_eq!(plan.prompt, "a horse on mars");
        });
      }

      // ── Duration pass-throughs in image mode ──────────────────────────────

      #[test]
      fn duration_4_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, Some(4), None, Some(start));
        with_image_plan(&request, &map, |plan| {
          assert!(matches!(plan.duration, FalVeo3Duration::FourSeconds));
        });
      }

      #[test]
      fn duration_8_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, Some(8), None, Some(start));
        with_image_plan(&request, &map, |plan| {
          assert!(matches!(plan.duration, FalVeo3Duration::EightSeconds));
        });
      }

      #[test]
      fn default_duration_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, None, None, Some(start));
        with_image_plan(&request, &map, |plan| {
          assert!(matches!(plan.duration, FalVeo3Duration::Default));
        });
      }

      // ── Resolution in image mode ──────────────────────────────────────────

      #[test]
      fn resolution_passes_through_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, Some(CommonResolution::TenEightyP), None, None, Some(start));
        with_image_plan(&request, &map, |plan| {
          assert!(matches!(plan.resolution, FalVeo3Resolution::TenEightyP));
        });
      }

      // ── Audio in image mode ───────────────────────────────────────────────

      #[test]
      fn audio_passes_through_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, None, Some(false), Some(start));
        with_image_plan(&request, &map, |plan| {
          assert!(!plan.generate_audio);
        });
      }

      #[test]
      fn default_audio_is_true_in_image_mode() {
        let (start, map) = fake_token("mf_start0000000000000000000000");
        let request = make_request(Some("p"), None, None, None, None, Some(start));
        with_image_plan(&request, &map, |plan| {
          assert!(plan.generate_audio);
        });
      }
    }
  }
}
