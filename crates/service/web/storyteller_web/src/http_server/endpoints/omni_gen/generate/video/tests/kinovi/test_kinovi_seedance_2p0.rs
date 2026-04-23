//! Tests for omni-gen video against the Seedance 2.0 model (Kinovi/Seedance2Pro provider).
//!
//! Seedance 2.0 is special: it uses the Seedance2Pro/Kinovi provider for execution
//! instead of Fal. The cost estimation uses Artcraft provider with media-token-form
//! references, while the execution plan uses URL-form references.
//!
//! Pricing: 16¢ per second × batch count.
//!   - 4s/batch 1 = 64¢, 5s/batch 1 = 80¢, 15s/batch 1 = 240¢
//!   - Batch 2 = 2×, Batch 4 = 4×

#[cfg(test)]
mod tests {
  use std::collections::HashMap;

  use artcraft_api_defs::omni_gen::cost_and_generate_requests::omni_gen_video_cost_and_generate_request::OmniGenVideoCostAndGenerateRequest;
  use artcraft_router::api::provider::Provider;
  use artcraft_router::generate::generate_video::video_generation_plan::VideoGenerationPlan;
  use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
  use enums::common::generation::common_video_model::CommonVideoModel;
  use tokens::tokens::media_files::MediaFileToken;
  use url::Url;

  use crate::http_server::endpoints::omni_gen::generate::video::pipeline_v1::distill_video_request::{
    distill_video_request, DistilledVideoRequest,
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  fn make_request(
    prompt: Option<&str>,
    aspect_ratio: Option<CommonAspectRatio>,
    duration_seconds: Option<u16>,
    video_batch_count: Option<u16>,
    start_frame_token: Option<MediaFileToken>,
    end_frame_token: Option<MediaFileToken>,
    reference_image_tokens: Option<Vec<MediaFileToken>>,
    reference_video_tokens: Option<Vec<MediaFileToken>>,
    reference_audio_tokens: Option<Vec<MediaFileToken>>,
  ) -> OmniGenVideoCostAndGenerateRequest {
    OmniGenVideoCostAndGenerateRequest {
      idempotency_token: Some("11111111-1111-1111-1111-111111111111".to_string()),
      model: Some(CommonVideoModel::Seedance2p0),
      prompt: prompt.map(|s| s.to_string()),
      negative_prompt: None,
      start_frame_image_media_token: start_frame_token,
      end_frame_image_media_token: end_frame_token,
      reference_image_media_tokens: reference_image_tokens,
      reference_video_media_tokens: reference_video_tokens,
      reference_audio_media_tokens: reference_audio_tokens,
      reference_character_tokens: None,
      resolution: None,
      aspect_ratio,
      quality: None,
      duration_seconds,
      video_batch_count,
      generate_audio: None,
    }
  }

  fn text_only_request(
    duration_seconds: Option<u16>,
    video_batch_count: Option<u16>,
  ) -> OmniGenVideoCostAndGenerateRequest {
    make_request(
      Some("a cat dancing"),
      None,
      duration_seconds,
      video_batch_count,
      None, None, None, None, None,
    )
  }

  fn fake_token(name: &str) -> MediaFileToken {
    MediaFileToken::new_from_str(name)
  }

  fn build_hydration_map(tokens: &[&MediaFileToken]) -> HashMap<MediaFileToken, Url> {
    tokens.iter().enumerate().map(|(i, t)| {
      let url = Url::parse(&format!("https://cdn.example.com/media/{}.png", i)).unwrap();
      ((*t).clone(), url)
    }).collect()
  }

  fn distill_text(request: &OmniGenVideoCostAndGenerateRequest) -> DistilledVideoRequest {
    let empty: HashMap<MediaFileToken, Url> = HashMap::new();
    distill_video_request(request, Some(&empty), Provider::Seedance2Pro)
      .expect("distill should succeed for Seedance 2.0 (text)")
  }

  fn distill_with_map(
    request: &OmniGenVideoCostAndGenerateRequest,
    hydration: &HashMap<MediaFileToken, Url>,
  ) -> DistilledVideoRequest {
    distill_video_request(request, Some(hydration), Provider::Seedance2Pro)
      .expect("distill should succeed for Seedance 2.0 (with media)")
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //   COST TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  mod cost_tests {
    use super::*;

    #[test]
    fn cost_is_present() {
      let d = distill_text(&text_only_request(Some(5), None));
      assert!(d.cost.cost_in_credits.is_some());
      assert!(d.cost.cost_in_usd_cents.is_some());
    }

    #[test]
    fn cost_is_not_free() {
      let d = distill_text(&text_only_request(Some(5), None));
      assert!(!d.cost.is_free);
    }

    // Pricing: 16¢/sec × batch_count

    #[test]
    fn cost_4s_batch_1() {
      let d = distill_text(&text_only_request(Some(4), Some(1)));
      assert_eq!(d.cost.cost_in_usd_cents, Some(64));
    }

    #[test]
    fn cost_5s_batch_1() {
      let d = distill_text(&text_only_request(Some(5), Some(1)));
      assert_eq!(d.cost.cost_in_usd_cents, Some(80));
    }

    #[test]
    fn cost_6s_batch_1() {
      let d = distill_text(&text_only_request(Some(6), Some(1)));
      assert_eq!(d.cost.cost_in_usd_cents, Some(96));
    }

    #[test]
    fn cost_10s_batch_1() {
      let d = distill_text(&text_only_request(Some(10), Some(1)));
      assert_eq!(d.cost.cost_in_usd_cents, Some(160));
    }

    #[test]
    fn cost_15s_batch_1() {
      let d = distill_text(&text_only_request(Some(15), Some(1)));
      assert_eq!(d.cost.cost_in_usd_cents, Some(240));
    }

    #[test]
    fn cost_5s_batch_2() {
      let d = distill_text(&text_only_request(Some(5), Some(2)));
      assert_eq!(d.cost.cost_in_usd_cents, Some(160));
    }

    #[test]
    fn cost_5s_batch_4() {
      let d = distill_text(&text_only_request(Some(5), Some(4)));
      assert_eq!(d.cost.cost_in_usd_cents, Some(320));
    }

    #[test]
    fn cost_15s_batch_4() {
      let d = distill_text(&text_only_request(Some(15), Some(4)));
      assert_eq!(d.cost.cost_in_usd_cents, Some(960));
    }

    #[test]
    fn cost_same_with_or_without_start_frame() {
      // Cost should not change based on media presence — it's duration × batch.
      let text_d = distill_text(&text_only_request(Some(5), Some(1)));

      let start_token = fake_token("start_frame");
      let map = build_hydration_map(&[&start_token]);
      let req = make_request(
        Some("a cat"), None, Some(5), Some(1),
        Some(start_token), None, None, None, None,
      );
      let frame_d = distill_with_map(&req, &map);

      assert_eq!(text_d.cost.cost_in_usd_cents, frame_d.cost.cost_in_usd_cents);
    }

    #[test]
    fn cost_estimation_uses_media_tokens_not_urls() {
      // The Artcraft cost plan should use token-form references.
      // If it used URLs, the Artcraft plan builder would reject them.
      // This test passes if distillation succeeds at all — the Artcraft
      // builder would error out on URL-form refs.
      let start_token = fake_token("start_frame");
      let ref_img = fake_token("ref_img_1");
      let ref_vid = fake_token("ref_vid_1");
      let ref_aud = fake_token("ref_aud_1");

      let map = build_hydration_map(&[&start_token, &ref_img, &ref_vid, &ref_aud]);

      let req = make_request(
        Some("test"), None, Some(5), Some(1),
        Some(start_token), None,
        Some(vec![ref_img]),
        Some(vec![ref_vid]),
        Some(vec![ref_aud]),
      );

      // If this succeeds, the Artcraft cost path handled tokens correctly.
      let d = distill_with_map(&req, &map);
      assert!(d.cost.cost_in_credits.is_some());
    }

    #[test]
    fn default_duration_produces_valid_cost() {
      // When duration_seconds is None, the model should use a default.
      let d = distill_text(&text_only_request(None, None));
      assert!(d.cost.cost_in_usd_cents.unwrap_or(0) > 0);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //   GENERATION PLAN TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  mod generation_plan_tests {
    use super::*;

    #[test]
    fn provider_is_seedance2pro() {
      let d = distill_text(&text_only_request(Some(5), None));
      assert!(
        matches!(d.execution_provider, Provider::Seedance2Pro),
        "expected Seedance2Pro provider, got {:?}", d.execution_provider
      );
    }

    #[test]
    fn plan_is_seedance2pro_variant() {
      let d = distill_text(&text_only_request(Some(5), None));
      assert!(
        matches!(d.plan(), VideoGenerationPlan::Seedance2proSeedance2p0(_)),
        "expected Seedance2proSeedance2p0 plan variant, got {:?}", d.plan()
      );
    }

    #[test]
    fn text_only_has_no_media_urls() {
      let d = distill_text(&text_only_request(Some(5), None));
      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        assert!(plan.request.start_frame_url.is_none());
        assert!(plan.request.end_frame_url.is_none());
        assert!(plan.request.reference_image_urls.is_none());
        assert!(plan.request.reference_video_urls.is_none());
        assert!(plan.request.reference_audio_urls.is_none());
      } else {
        panic!("wrong plan variant");
      }
    }

    #[test]
    fn text_only_prompt_is_passed_through() {
      let d = distill_text(&text_only_request(Some(5), None));
      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        assert_eq!(plan.request.prompt, "a cat dancing");
      } else {
        panic!("wrong plan variant");
      }
    }

    #[test]
    fn start_frame_uses_url_not_token() {
      let start_token = fake_token("start_frame");
      let map = build_hydration_map(&[&start_token]);

      let req = make_request(
        Some("test"), None, Some(5), None,
        Some(start_token), None, None, None, None,
      );
      let d = distill_with_map(&req, &map);

      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        let url = plan.request.start_frame_url.as_ref().expect("start_frame_url should be set");
        assert!(url.starts_with("https://"), "expected URL, got: {}", url);
        assert!(!url.contains("m_"), "URL should not look like a media token");
      } else {
        panic!("wrong plan variant");
      }
    }

    #[test]
    fn end_frame_uses_url_not_token() {
      let end_token = fake_token("end_frame");
      let map = build_hydration_map(&[&end_token]);

      let req = make_request(
        Some("test"), None, Some(5), None,
        None, Some(end_token), None, None, None,
      );
      let d = distill_with_map(&req, &map);

      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        let url = plan.request.end_frame_url.as_ref().expect("end_frame_url should be set");
        assert!(url.starts_with("https://"), "expected URL, got: {}", url);
      } else {
        panic!("wrong plan variant");
      }
    }

    #[test]
    fn start_and_end_frame_both_resolved() {
      let start = fake_token("sf");
      let end = fake_token("ef");
      let map = build_hydration_map(&[&start, &end]);

      let req = make_request(
        Some("test"), None, Some(5), None,
        Some(start), Some(end), None, None, None,
      );
      let d = distill_with_map(&req, &map);

      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        assert!(plan.request.start_frame_url.is_some());
        assert!(plan.request.end_frame_url.is_some());
      } else {
        panic!("wrong plan variant");
      }
    }

    #[test]
    fn reference_images_use_urls() {
      let img1 = fake_token("img1");
      let img2 = fake_token("img2");
      let map = build_hydration_map(&[&img1, &img2]);

      let req = make_request(
        Some("test"), None, Some(5), None,
        None, None,
        Some(vec![img1, img2]),
        None, None,
      );
      let d = distill_with_map(&req, &map);

      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        let urls = plan.request.reference_image_urls.as_ref().expect("reference_image_urls should be set");
        assert_eq!(urls.len(), 2);
        for url in urls {
          assert!(url.starts_with("https://"), "expected URL, got: {}", url);
        }
      } else {
        panic!("wrong plan variant");
      }
    }

    #[test]
    fn reference_videos_use_urls() {
      let vid1 = fake_token("vid1");
      let map = build_hydration_map(&[&vid1]);

      let req = make_request(
        Some("test"), None, Some(5), None,
        None, None, None,
        Some(vec![vid1]),
        None,
      );
      let d = distill_with_map(&req, &map);

      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        let urls = plan.request.reference_video_urls.as_ref().expect("reference_video_urls should be set");
        assert_eq!(urls.len(), 1);
        assert!(urls[0].starts_with("https://"));
      } else {
        panic!("wrong plan variant");
      }
    }

    #[test]
    fn reference_audio_use_urls() {
      let aud1 = fake_token("aud1");
      let map = build_hydration_map(&[&aud1]);

      let req = make_request(
        Some("test"), None, Some(5), None,
        None, None, None, None,
        Some(vec![aud1]),
      );
      let d = distill_with_map(&req, &map);

      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        let urls = plan.request.reference_audio_urls.as_ref().expect("reference_audio_urls should be set");
        assert_eq!(urls.len(), 1);
        assert!(urls[0].starts_with("https://"));
      } else {
        panic!("wrong plan variant");
      }
    }

    #[test]
    fn all_reference_types_together() {
      let sf = fake_token("sf");
      let ef = fake_token("ef");
      let img = fake_token("img");
      let vid = fake_token("vid");
      let aud = fake_token("aud");
      let map = build_hydration_map(&[&sf, &ef, &img, &vid, &aud]);

      let req = make_request(
        Some("full test"), None, Some(8), Some(2),
        Some(sf), Some(ef),
        Some(vec![img]),
        Some(vec![vid]),
        Some(vec![aud]),
      );
      let d = distill_with_map(&req, &map);

      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        assert!(plan.request.start_frame_url.is_some());
        assert!(plan.request.end_frame_url.is_some());
        assert_eq!(plan.request.reference_image_urls.as_ref().map(|v| v.len()), Some(1));
        assert_eq!(plan.request.reference_video_urls.as_ref().map(|v| v.len()), Some(1));
        assert_eq!(plan.request.reference_audio_urls.as_ref().map(|v| v.len()), Some(1));
        assert_eq!(plan.request.prompt, "full test");
      } else {
        panic!("wrong plan variant");
      }
    }

    #[test]
    fn duration_is_clamped_to_valid_range() {
      // Duration below 4 should clamp to 4.
      let d = distill_text(&text_only_request(Some(1), None));
      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        assert!(plan.request.duration_seconds >= 4, "expected >= 4, got {}", plan.request.duration_seconds);
      } else {
        panic!("wrong plan variant");
      }

      // Duration above 15 should clamp to 15.
      let d = distill_text(&text_only_request(Some(99), None));
      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        assert!(plan.request.duration_seconds <= 15, "expected <= 15, got {}", plan.request.duration_seconds);
      } else {
        panic!("wrong plan variant");
      }
    }

    #[test]
    fn missing_prompt_defaults_to_empty() {
      let req = make_request(
        None, None, Some(5), None,
        None, None, None, None, None,
      );
      let d = distill_text(&req);
      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        // Prompt should be None or empty string.
        assert!(plan.request.prompt.is_empty());
      } else {
        panic!("wrong plan variant");
      }
    }

    // -- Aspect ratio tests --

    #[test]
    fn aspect_ratio_wide_16x9() {
      use seedance2pro_client::requests::generate_video::generate_video::KinoviAspectRatio;
      let req = make_request(
        Some("test"), Some(CommonAspectRatio::WideSixteenByNine), Some(5), None,
        None, None, None, None, None,
      );
      let d = distill_text(&req);
      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        assert!(matches!(plan.request.aspect_ratio, KinoviAspectRatio::Landscape16x9));
      } else { panic!("wrong plan variant"); }
    }

    #[test]
    fn aspect_ratio_tall_9x16() {
      use seedance2pro_client::requests::generate_video::generate_video::KinoviAspectRatio;
      let req = make_request(
        Some("test"), Some(CommonAspectRatio::TallNineBySixteen), Some(5), None,
        None, None, None, None, None,
      );
      let d = distill_text(&req);
      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        assert!(matches!(plan.request.aspect_ratio, KinoviAspectRatio::Portrait9x16));
      } else { panic!("wrong plan variant"); }
    }

    #[test]
    fn aspect_ratio_square() {
      use seedance2pro_client::requests::generate_video::generate_video::KinoviAspectRatio;
      let req = make_request(
        Some("test"), Some(CommonAspectRatio::Square), Some(5), None,
        None, None, None, None, None,
      );
      let d = distill_text(&req);
      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        assert!(matches!(plan.request.aspect_ratio, KinoviAspectRatio::Square1x1));
      } else { panic!("wrong plan variant"); }
    }

    #[test]
    fn aspect_ratio_4x3() {
      use seedance2pro_client::requests::generate_video::generate_video::KinoviAspectRatio;
      let req = make_request(
        Some("test"), Some(CommonAspectRatio::WideFourByThree), Some(5), None,
        None, None, None, None, None,
      );
      let d = distill_text(&req);
      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        assert!(matches!(plan.request.aspect_ratio, KinoviAspectRatio::Standard4x3));
      } else { panic!("wrong plan variant"); }
    }

    #[test]
    fn aspect_ratio_3x4() {
      use seedance2pro_client::requests::generate_video::generate_video::KinoviAspectRatio;
      let req = make_request(
        Some("test"), Some(CommonAspectRatio::TallThreeByFour), Some(5), None,
        None, None, None, None, None,
      );
      let d = distill_text(&req);
      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        assert!(matches!(plan.request.aspect_ratio, KinoviAspectRatio::Portrait3x4));
      } else { panic!("wrong plan variant"); }
    }

    #[test]
    fn aspect_ratio_none_defaults_to_landscape() {
      use seedance2pro_client::requests::generate_video::generate_video::KinoviAspectRatio;
      let req = make_request(
        Some("test"), None, Some(5), None,
        None, None, None, None, None,
      );
      let d = distill_text(&req);
      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        assert!(matches!(plan.request.aspect_ratio, KinoviAspectRatio::Landscape16x9));
      } else { panic!("wrong plan variant"); }
    }

    #[test]
    fn aspect_ratio_auto_defaults_to_landscape() {
      use seedance2pro_client::requests::generate_video::generate_video::KinoviAspectRatio;
      let req = make_request(
        Some("test"), Some(CommonAspectRatio::Auto), Some(5), None,
        None, None, None, None, None,
      );
      let d = distill_text(&req);
      if let VideoGenerationPlan::Seedance2proSeedance2p0(plan) = d.plan() {
        assert!(matches!(plan.request.aspect_ratio, KinoviAspectRatio::Landscape16x9));
      } else { panic!("wrong plan variant"); }
    }
  }
}
