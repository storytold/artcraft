use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::requests::kinovi_host::KinoviHost;
use crate::requests::workflow_run_task::workflow_run_task::{
  workflow_run_task, KinoviAspectRatioRaw, KinoviBatchCountRaw,
  KinoviModelTypeRaw, KinoviOutputResolutionRaw, WorkflowRunTaskArgs
  , WorkflowRunTaskRequest,
};

// ── Args ──

pub struct GenerateHappyHorse1p0Args<'a> {
  pub request: GenerateHappyHorse1p0Request,
  pub session: &'a Seedance2ProSession,
  pub host_override: Option<KinoviHost>,
}

// ── Request ──

#[derive(Clone, Debug)]
pub struct GenerateHappyHorse1p0Request {
  pub prompt: String,
  pub aspect_ratio: Option<KinoviHappyHorse1p0AspectRatio>,
  pub output_resolution: Option<KinoviHappyHorse1p0OutputResolution>,
  pub batch_count: Option<KinoviHappyHorse1p0BatchCount>,
  pub duration_seconds: u8,
  pub start_frame_url: Option<String>,
}

// ── Enums ──

#[derive(Debug, Clone, Copy)]
pub enum KinoviHappyHorse1p0AspectRatio {
  Portrait9x16,
  Portrait3x4,
  Square1x1,
  Landscape4x3,
  Landscape16x9,
}

#[derive(Debug, Clone, Copy)]
pub enum KinoviHappyHorse1p0OutputResolution {
  SevenTwentyP,
  TenEightyP,
}

#[derive(Debug, Clone, Copy)]
pub enum KinoviHappyHorse1p0BatchCount {
  One,
  Two,
  Four,
}

// ── Pricing ──
//
// Happy Horse 1.0 credit pricing:
//
// | Resolution | Credits/sec |
// |------------|-------------|
// | 720p       |          33 |
// | 1080p      |          66 |
//
// Default resolution (None) is 720p.
// Batch count multiplies the total cost.
// Credit package: 22,000 credits for $114 (~192.98 credits/$1, rounded to 193).

impl GenerateHappyHorse1p0Request {
  /// Estimate the credit cost for this generation request.
  pub fn estimate_credits(&self) -> u32 {
    let credits_per_second: u32 = match self.output_resolution {
      Some(KinoviHappyHorse1p0OutputResolution::TenEightyP) => 66,
      Some(KinoviHappyHorse1p0OutputResolution::SevenTwentyP) | None => 33,
    };

    let per_video = u32::from(self.duration_seconds) * credits_per_second;
    let batch_multiplier: u32 = match self.batch_count {
      None | Some(KinoviHappyHorse1p0BatchCount::One) => 1,
      Some(KinoviHappyHorse1p0BatchCount::Two) => 2,
      Some(KinoviHappyHorse1p0BatchCount::Four) => 4,
    };
    per_video * batch_multiplier
  }

  /// Credits per dollar for billing conversion.
  /// 22,000 credits / $114 ≈ 192.98, rounded to 193.
  fn credits_per_dollar() -> f64 {
    193.0
  }

  /// Estimate the USD cost in cents for this generation request.
  pub fn estimate_cost_in_usd_cents(&self) -> u64 {
    let credits = self.estimate_credits() as f64;
    let cost = credits / Self::credits_per_dollar() * 100.0;
    cost.round() as u64
  }
}

// ── Response ──

pub struct GenerateHappyHorse1p0Response {
  pub task_id: String,
  pub order_id: String,
  pub task_ids: Option<Vec<String>>,
  pub order_ids: Option<Vec<String>>,
}

// ── Entry point ──

pub async fn generate_happy_horse_1p0(
  args: GenerateHappyHorse1p0Args<'_>,
) -> Result<GenerateHappyHorse1p0Response, Seedance2ProError> {
  let req = args.request;

  let raw_request = WorkflowRunTaskRequest {
    model_type: KinoviModelTypeRaw::HappyHorse1p0,
    prompt: req.prompt,
    aspect_ratio: map_aspect_ratio(req.aspect_ratio),
    output_resolution: req.output_resolution.map(map_output_resolution),
    batch_count: map_batch_count(req.batch_count),
    duration_seconds: req.duration_seconds,
    start_frame_url: req.start_frame_url,
    end_frame_url: None,
    reference_image_urls: None,
    reference_video_urls: None,
    reference_audio_urls: None,
    character_ids: None,
    use_face_blur_hack: Some(false),
  };

  let raw_response = workflow_run_task(WorkflowRunTaskArgs {
    request: raw_request,
    session: args.session,
    host_override: args.host_override,
  }).await?;

  Ok(GenerateHappyHorse1p0Response {
    task_id: raw_response.task_id,
    order_id: raw_response.order_id,
    task_ids: raw_response.task_ids,
    order_ids: raw_response.order_ids,
  })
}

// ── Mapping helpers ──

fn map_aspect_ratio(ar: Option<KinoviHappyHorse1p0AspectRatio>) -> KinoviAspectRatioRaw {
  match ar {
    Some(KinoviHappyHorse1p0AspectRatio::Landscape16x9) => KinoviAspectRatioRaw::Landscape16x9,
    Some(KinoviHappyHorse1p0AspectRatio::Portrait9x16) => KinoviAspectRatioRaw::Portrait9x16,
    Some(KinoviHappyHorse1p0AspectRatio::Square1x1) => KinoviAspectRatioRaw::Square1x1,
    Some(KinoviHappyHorse1p0AspectRatio::Landscape4x3) => KinoviAspectRatioRaw::Landscape4x3,
    Some(KinoviHappyHorse1p0AspectRatio::Portrait3x4) => KinoviAspectRatioRaw::Portrait3x4,
    None => KinoviAspectRatioRaw::Landscape16x9,
  }
}

fn map_output_resolution(res: KinoviHappyHorse1p0OutputResolution) -> KinoviOutputResolutionRaw {
  match res {
    KinoviHappyHorse1p0OutputResolution::SevenTwentyP => KinoviOutputResolutionRaw::SevenTwentyP,
    KinoviHappyHorse1p0OutputResolution::TenEightyP => KinoviOutputResolutionRaw::TenEightyP,
  }
}

fn map_batch_count(bc: Option<KinoviHappyHorse1p0BatchCount>) -> KinoviBatchCountRaw {
  match bc {
    Some(KinoviHappyHorse1p0BatchCount::One) | None => KinoviBatchCountRaw::One,
    Some(KinoviHappyHorse1p0BatchCount::Two) => KinoviBatchCountRaw::Two,
    Some(KinoviHappyHorse1p0BatchCount::Four) => KinoviBatchCountRaw::Four,
  }
}

// ── Tests ──

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::seedance2pro_session::Seedance2ProSession;
  use crate::requests::prepare_file_upload::prepare_file_upload::{prepare_file_upload, PrepareFileUploadArgs};
  use crate::requests::upload_file::upload_file::{upload_file, UploadFileArgs};
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  mod pricing_tests {
    use super::*;

    fn make_request(
      duration_seconds: u8,
      output_resolution: Option<KinoviHappyHorse1p0OutputResolution>,
      batch_count: Option<KinoviHappyHorse1p0BatchCount>,
    ) -> GenerateHappyHorse1p0Request {
      GenerateHappyHorse1p0Request {
        prompt: String::new(),
        aspect_ratio: None,
        output_resolution,
        batch_count,
        duration_seconds,
        start_frame_url: None,
      }
    }

    fn r720(dur: u8) -> GenerateHappyHorse1p0Request {
      make_request(dur, None, None)
    }

    fn r1080(dur: u8) -> GenerateHappyHorse1p0Request {
      make_request(dur, Some(KinoviHappyHorse1p0OutputResolution::TenEightyP), None)
    }

    // ── 720p credits (33 credits/sec) ──

    mod credits_720p {
      use super::*;

      #[test]
      fn every_duration() {
        assert_eq!(r720(3).estimate_credits(), 99);
        assert_eq!(r720(4).estimate_credits(), 132);
        assert_eq!(r720(5).estimate_credits(), 165);
        assert_eq!(r720(6).estimate_credits(), 198);
        assert_eq!(r720(7).estimate_credits(), 231);
        assert_eq!(r720(8).estimate_credits(), 264);
        assert_eq!(r720(9).estimate_credits(), 297);
        assert_eq!(r720(10).estimate_credits(), 330);
        assert_eq!(r720(11).estimate_credits(), 363);
        assert_eq!(r720(12).estimate_credits(), 396);
        assert_eq!(r720(13).estimate_credits(), 429);
        assert_eq!(r720(14).estimate_credits(), 462);
        assert_eq!(r720(15).estimate_credits(), 495);
      }

      #[test]
      fn explicit_720p_same_as_default() {
        let default = r720(5).estimate_credits();
        let explicit = make_request(5, Some(KinoviHappyHorse1p0OutputResolution::SevenTwentyP), None).estimate_credits();
        assert_eq!(default, explicit);
      }
    }

    // ── 1080p credits (66 credits/sec) ──

    mod credits_1080p {
      use super::*;

      #[test]
      fn every_duration() {
        assert_eq!(r1080(3).estimate_credits(), 198);
        assert_eq!(r1080(4).estimate_credits(), 264);
        assert_eq!(r1080(5).estimate_credits(), 330);
        assert_eq!(r1080(6).estimate_credits(), 396);
        assert_eq!(r1080(7).estimate_credits(), 462);
        assert_eq!(r1080(8).estimate_credits(), 528);
        assert_eq!(r1080(9).estimate_credits(), 594);
        assert_eq!(r1080(10).estimate_credits(), 660);
        assert_eq!(r1080(11).estimate_credits(), 726);
        assert_eq!(r1080(12).estimate_credits(), 792);
        assert_eq!(r1080(13).estimate_credits(), 858);
        assert_eq!(r1080(14).estimate_credits(), 924);
        assert_eq!(r1080(15).estimate_credits(), 990);
      }
    }

    // ── Batch multiplier ──

    mod batch_tests {
      use super::*;

      #[test]
      fn batch_1_is_base() {
        let base = r720(5).estimate_credits();
        let explicit = make_request(5, None, Some(KinoviHappyHorse1p0BatchCount::One)).estimate_credits();
        assert_eq!(base, explicit);
      }

      #[test]
      fn batch_2_doubles() {
        let base = r720(5).estimate_credits();
        let batch2 = make_request(5, None, Some(KinoviHappyHorse1p0BatchCount::Two)).estimate_credits();
        assert_eq!(batch2, base * 2);
      }

      #[test]
      fn batch_4_quadruples() {
        let base = r720(5).estimate_credits();
        let batch4 = make_request(5, None, Some(KinoviHappyHorse1p0BatchCount::Four)).estimate_credits();
        assert_eq!(batch4, base * 4);
      }

      #[test]
      fn batch_multiplier_applies_to_1080p() {
        let base = r1080(5).estimate_credits();
        let batch2 = make_request(5, Some(KinoviHappyHorse1p0OutputResolution::TenEightyP), Some(KinoviHappyHorse1p0BatchCount::Two)).estimate_credits();
        let batch4 = make_request(5, Some(KinoviHappyHorse1p0OutputResolution::TenEightyP), Some(KinoviHappyHorse1p0BatchCount::Four)).estimate_credits();
        assert_eq!(batch2, base * 2);
        assert_eq!(batch4, base * 4);
      }
    }

    // ── Relative pricing ──

    mod relative_tests {
      use super::*;

      #[test]
      fn r1080p_is_exactly_double_720p() {
        for dur in 3..=15u8 {
          let c720 = make_request(dur, None, None).estimate_credits();
          let c1080 = make_request(dur, Some(KinoviHappyHorse1p0OutputResolution::TenEightyP), None).estimate_credits();
          assert_eq!(c1080, c720 * 2, "1080p should be 2× 720p at {}s", dur);
        }
      }

      #[test]
      fn cost_scales_with_duration() {
        let c3 = r720(3).estimate_credits();
        let c10 = r720(10).estimate_credits();
        let c15 = r720(15).estimate_credits();
        assert!(c3 < c10);
        assert!(c10 < c15);
      }
    }

    // ── USD cents ──

    mod usd_cents_tests {
      use super::*;

      #[test]
      fn credits_per_dollar_is_193() {
        assert_eq!(GenerateHappyHorse1p0Request::credits_per_dollar(), 193.0);
      }

      #[test]
      fn usd_cents_720p_5s() {
        // 165 credits / 193 * 100 = 85.49 → 85¢
        assert_eq!(r720(5).estimate_cost_in_usd_cents(), 85);
      }

      #[test]
      fn usd_cents_1080p_5s() {
        // 330 credits / 193 * 100 = 170.98 → 171¢
        assert_eq!(r1080(5).estimate_cost_in_usd_cents(), 171);
      }

      #[test]
      fn usd_cents_720p_15s() {
        // 495 credits / 193 * 100 = 256.48 → 256¢
        assert_eq!(r720(15).estimate_cost_in_usd_cents(), 256);
      }

      #[test]
      fn usd_cents_1080p_15s() {
        // 990 credits / 193 * 100 = 512.95 → 513¢
        assert_eq!(r1080(15).estimate_cost_in_usd_cents(), 513);
      }

      #[test]
      fn batch_multiplies_usd_cents() {
        let base = r720(5).estimate_cost_in_usd_cents();
        let batch2 = make_request(5, None, Some(KinoviHappyHorse1p0BatchCount::Two)).estimate_cost_in_usd_cents();
        // Batch 2 should be approximately 2× base (rounding may differ slightly)
        assert!(batch2 >= base * 2 - 1 && batch2 <= base * 2 + 1,
          "batch 2 ({}) should be ~2× base ({})", batch2, base);
      }
    }

    // ── Aspect ratio doesn't affect cost ──

    #[test]
    fn aspect_ratio_does_not_affect_credits() {
      let baseline = r720(5).estimate_credits();

      let ratios = [
        KinoviHappyHorse1p0AspectRatio::Landscape16x9,
        KinoviHappyHorse1p0AspectRatio::Portrait9x16,
        KinoviHappyHorse1p0AspectRatio::Square1x1,
        KinoviHappyHorse1p0AspectRatio::Landscape4x3,
        KinoviHappyHorse1p0AspectRatio::Portrait3x4,
      ];

      for ar in &ratios {
        let req = GenerateHappyHorse1p0Request {
          prompt: String::new(),
          aspect_ratio: Some(*ar),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
        };
        assert_eq!(
          req.estimate_credits(), baseline,
          "Aspect ratio {:?} should not change credits from baseline {}", ar, baseline,
        );
      }
    }
  }

  mod text_to_video {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_default() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_happy_horse_1p0(GenerateHappyHorse1p0Args {
        session: &session,
        host_override: None,
        request: GenerateHappyHorse1p0Request {
          prompt: "A corgi and a shiba are playing chess against one another".to_string(),
          aspect_ratio: None,
          output_resolution: None,
          batch_count: None,
          duration_seconds: 4,
          start_frame_url: None,
        },
      }).await?;
      println!("t2v default — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_720p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_happy_horse_1p0(GenerateHappyHorse1p0Args {
        session: &session,
        host_override: None,
        request: GenerateHappyHorse1p0Request {
          prompt: "A golden retriever running through a field of sunflowers".to_string(),
          aspect_ratio: Some(KinoviHappyHorse1p0AspectRatio::Landscape16x9),
          output_resolution: Some(KinoviHappyHorse1p0OutputResolution::SevenTwentyP),
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
        },
      }).await?;
      println!("t2v 720p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_1080p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_happy_horse_1p0(GenerateHappyHorse1p0Args {
        session: &session,
        host_override: None,
        request: GenerateHappyHorse1p0Request {
          prompt: "A dragon soaring over a medieval castle at sunset".to_string(),
          aspect_ratio: Some(KinoviHappyHorse1p0AspectRatio::Landscape16x9),
          output_resolution: Some(KinoviHappyHorse1p0OutputResolution::TenEightyP),
          batch_count: None,
          duration_seconds: 4,
          start_frame_url: None,
        },
      }).await?;
      println!("t2v 1080p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  mod aspect_ratios {
    use super::*;

    async fn test_aspect_ratio(ar: KinoviHappyHorse1p0AspectRatio, label: &str) -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_happy_horse_1p0(GenerateHappyHorse1p0Args {
        session: &session,
        host_override: None,
        request: GenerateHappyHorse1p0Request {
          prompt: format!("A cat sitting in a sunbeam ({})", label),
          aspect_ratio: Some(ar),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 4,
          start_frame_url: None,
        },
      }).await?;
      println!("{} — task_id={}, order_id={}", label, result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_landscape_16x9() -> AnyhowResult<()> {
      test_aspect_ratio(KinoviHappyHorse1p0AspectRatio::Landscape16x9, "16:9").await
    }

    #[tokio::test]
    #[ignore]
    async fn test_portrait_9x16() -> AnyhowResult<()> {
      test_aspect_ratio(KinoviHappyHorse1p0AspectRatio::Portrait9x16, "9:16").await
    }

    #[tokio::test]
    #[ignore]
    async fn test_square_1x1() -> AnyhowResult<()> {
      test_aspect_ratio(KinoviHappyHorse1p0AspectRatio::Square1x1, "1:1").await
    }

    #[tokio::test]
    #[ignore]
    async fn test_standard_4x3() -> AnyhowResult<()> {
      test_aspect_ratio(KinoviHappyHorse1p0AspectRatio::Landscape4x3, "4:3").await
    }

    #[tokio::test]
    #[ignore]
    async fn test_portrait_3x4() -> AnyhowResult<()> {
      test_aspect_ratio(KinoviHappyHorse1p0AspectRatio::Portrait3x4, "3:4").await
    }
  }

  mod keyframe {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_keyframe_720p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let start_frame_url = upload_test_image(&session).await?;
      println!("Uploaded start frame: {}", start_frame_url);

      let result = generate_happy_horse_1p0(GenerateHappyHorse1p0Args {
        session: &session,
        host_override: None,
        request: GenerateHappyHorse1p0Request {
          prompt: "The corgi dog watches the lake as the sun sets.".to_string(),
          aspect_ratio: Some(KinoviHappyHorse1p0AspectRatio::Portrait9x16),
          output_resolution: Some(KinoviHappyHorse1p0OutputResolution::SevenTwentyP),
          batch_count: None,
          duration_seconds: 8,
          start_frame_url: Some(start_frame_url),
        },
      }).await?;
      println!("keyframe 720p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_keyframe_1080p_square() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let start_frame_url = upload_test_image(&session).await?;
      println!("Uploaded start frame: {}", start_frame_url);

      let result = generate_happy_horse_1p0(GenerateHappyHorse1p0Args {
        session: &session,
        host_override: None,
        request: GenerateHappyHorse1p0Request {
          prompt: "A dragon and a raptor fighting on the beach.".to_string(),
          aspect_ratio: Some(KinoviHappyHorse1p0AspectRatio::Square1x1),
          output_resolution: Some(KinoviHappyHorse1p0OutputResolution::TenEightyP),
          batch_count: None,
          duration_seconds: 15,
          start_frame_url: Some(start_frame_url),
        },
      }).await?;
      println!("keyframe 1080p square — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_keyframe_landscape_default_resolution() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let start_frame_url = upload_test_image(&session).await?;
      println!("Uploaded start frame: {}", start_frame_url);

      let result = generate_happy_horse_1p0(GenerateHappyHorse1p0Args {
        session: &session,
        host_override: None,
        request: GenerateHappyHorse1p0Request {
          prompt: "The dog runs along the shore, kicking up sand.".to_string(),
          aspect_ratio: Some(KinoviHappyHorse1p0AspectRatio::Landscape16x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: Some(start_frame_url),
        },
      }).await?;
      println!("keyframe landscape default res — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  fn test_session() -> AnyhowResult<Seedance2ProSession> {
    let cookies = get_test_cookies()?;
    Ok(Seedance2ProSession::from_cookies_string(cookies))
  }

  async fn upload_test_image(session: &Seedance2ProSession) -> AnyhowResult<String> {
    let image_bytes = crate::test_utils::http_download::http_download_to_bytes(
      test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL,
    ).await?;

    let prepare_result = prepare_file_upload(PrepareFileUploadArgs {
      session,
      extension: "jpg".to_string(),
      host_override: None,
    }).await?;

    let upload_result = upload_file(UploadFileArgs {
      upload_url: prepare_result.upload_url,
      file_bytes: image_bytes,
      host_override: None,
    }).await?;

    Ok(upload_result.public_url)
  }
}
