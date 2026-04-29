use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::requests::kinovi_host::KinoviHost;
use crate::requests::workflow_run_task::workflow_run_task::{
  workflow_run_task, KinoviAspectRatioRaw, KinoviBatchCountRaw,
  KinoviModelTypeRaw, KinoviOutputResolutionRaw, WorkflowRunTaskArgs,
  WorkflowRunTaskRequest,
};

// ── Args ──

pub struct GenerateSeedance2p0Args<'a> {
  pub request: GenerateSeedance2p0Request,
  pub session: &'a Seedance2ProSession,
  pub host_override: Option<KinoviHost>,
}

// ── Request ──

#[derive(Clone, Debug)]
pub struct GenerateSeedance2p0Request {
  pub prompt: String,
  pub aspect_ratio: Option<KinoviSeedance2p0AspectRatio>,
  pub output_resolution: Option<KinoviSeedance2p0OutputResolution>,
  pub duration_seconds: u8,
  pub batch_count: Option<KinoviSeedance2p0BatchCount>,
  pub start_frame_url: Option<String>,
  pub end_frame_url: Option<String>,
  pub reference_image_urls: Option<Vec<String>>,
  pub reference_video_urls: Option<Vec<String>>,
  pub reference_audio_urls: Option<Vec<String>>,
  pub character_ids: Option<Vec<String>>,
  pub use_face_blur_hack: Option<bool>,
}

// ── Enums ──

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0AspectRatio {
  Landscape16x9,
  Portrait9x16,
  Square1x1,
  Standard4x3,
  Portrait3x4,
}

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0OutputResolution {
  FourEightyP,
  SevenTwentyP,
  TenEightyP,
}

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0BatchCount {
  One,
  Two,
  Four,
}

// ── Pricing ──
//
// Seedance 2.0 Pro credit pricing:
//
// | Resolution | Credits/sec |
// |------------|-------------|
// | 480p       |          15 |
// | 720p       |          40 |
// | 1080p      |          90 |
//
// Default resolution (None) is 720p.
// Batch count multiplies the total cost.
// Credit package: 22,000 credits for $114 (~192.98 credits/$1, rounded to 193).

impl GenerateSeedance2p0Request {
  /// Estimate the credit cost for this generation request.
  pub fn estimate_credits(&self) -> u32 {
    let credits_per_second: u32 = match self.output_resolution {
      Some(KinoviSeedance2p0OutputResolution::FourEightyP) => 15,
      Some(KinoviSeedance2p0OutputResolution::SevenTwentyP) | None => 40,
      Some(KinoviSeedance2p0OutputResolution::TenEightyP) => 90,
    };

    let per_video = u32::from(self.duration_seconds) * credits_per_second;
    let batch_multiplier: u32 = match self.batch_count {
      None | Some(KinoviSeedance2p0BatchCount::One) => 1,
      Some(KinoviSeedance2p0BatchCount::Two) => 2,
      Some(KinoviSeedance2p0BatchCount::Four) => 4,
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

pub struct GenerateSeedance2p0Response {
  pub task_id: String,
  pub order_id: String,
  pub task_ids: Option<Vec<String>>,
  pub order_ids: Option<Vec<String>>,
}

// ── Entry point ──

pub async fn generate_seedance_2p0(
  args: GenerateSeedance2p0Args<'_>,
) -> Result<GenerateSeedance2p0Response, Seedance2ProError> {
  let req = args.request;

  let raw_request = WorkflowRunTaskRequest {
    model_type: KinoviModelTypeRaw::Seedance2Pro,
    prompt: req.prompt,
    aspect_ratio: map_aspect_ratio(req.aspect_ratio),
    output_resolution: req.output_resolution.map(map_output_resolution),
    batch_count: map_batch_count(req.batch_count),
    duration_seconds: req.duration_seconds,
    start_frame_url: req.start_frame_url,
    end_frame_url: req.end_frame_url,
    reference_image_urls: req.reference_image_urls,
    reference_video_urls: req.reference_video_urls,
    reference_audio_urls: req.reference_audio_urls,
    character_ids: req.character_ids,
    use_face_blur_hack: req.use_face_blur_hack,
  };

  let raw_response = workflow_run_task(WorkflowRunTaskArgs {
    request: raw_request,
    session: args.session,
    host_override: args.host_override,
  }).await?;

  Ok(GenerateSeedance2p0Response {
    task_id: raw_response.task_id,
    order_id: raw_response.order_id,
    task_ids: raw_response.task_ids,
    order_ids: raw_response.order_ids,
  })
}

// ── Mapping helpers ──

fn map_aspect_ratio(ar: Option<KinoviSeedance2p0AspectRatio>) -> KinoviAspectRatioRaw {
  match ar {
    Some(KinoviSeedance2p0AspectRatio::Landscape16x9) => KinoviAspectRatioRaw::Landscape16x9,
    Some(KinoviSeedance2p0AspectRatio::Portrait9x16) => KinoviAspectRatioRaw::Portrait9x16,
    Some(KinoviSeedance2p0AspectRatio::Square1x1) => KinoviAspectRatioRaw::Square1x1,
    Some(KinoviSeedance2p0AspectRatio::Standard4x3) => KinoviAspectRatioRaw::Landscape4x3,
    Some(KinoviSeedance2p0AspectRatio::Portrait3x4) => KinoviAspectRatioRaw::Portrait3x4,
    None => KinoviAspectRatioRaw::Landscape16x9,
  }
}

fn map_output_resolution(res: KinoviSeedance2p0OutputResolution) -> KinoviOutputResolutionRaw {
  match res {
    KinoviSeedance2p0OutputResolution::FourEightyP => KinoviOutputResolutionRaw::FourEightyP,
    KinoviSeedance2p0OutputResolution::SevenTwentyP => KinoviOutputResolutionRaw::SevenTwentyP,
    KinoviSeedance2p0OutputResolution::TenEightyP => KinoviOutputResolutionRaw::TenEightyP,
  }
}

fn map_batch_count(bc: Option<KinoviSeedance2p0BatchCount>) -> KinoviBatchCountRaw {
  match bc {
    Some(KinoviSeedance2p0BatchCount::One) | None => KinoviBatchCountRaw::One,
    Some(KinoviSeedance2p0BatchCount::Two) => KinoviBatchCountRaw::Two,
    Some(KinoviSeedance2p0BatchCount::Four) => KinoviBatchCountRaw::Four,
  }
}

// ── Tests ──

#[cfg(test)]
mod tests {
  use super::*;
  use crate::creds::seedance2pro_session::Seedance2ProSession;
  use crate::test_utils::get_test_cookies::get_test_cookies;
  use crate::test_utils::setup_test_logging::setup_test_logging;
  use errors::AnyhowResult;
  use log::LevelFilter;

  mod pricing_tests {
    use super::*;

    fn build_request(
      duration_seconds: u8,
      output_resolution: Option<KinoviSeedance2p0OutputResolution>,
      batch_count: Option<KinoviSeedance2p0BatchCount>,
    ) -> GenerateSeedance2p0Request {
      GenerateSeedance2p0Request {
        prompt: String::new(),
        aspect_ratio: None,
        output_resolution,
        batch_count,
        duration_seconds,
        start_frame_url: None,
        end_frame_url: None,
        reference_image_urls: None,
        reference_video_urls: None,
        reference_audio_urls: None,
        character_ids: None,
        use_face_blur_hack: None,
      }
    }

    fn r480(dur: u8) -> GenerateSeedance2p0Request {
      build_request(dur, Some(KinoviSeedance2p0OutputResolution::FourEightyP), None)
    }

    fn r720(dur: u8) -> GenerateSeedance2p0Request {
      build_request(dur, None, None)
    }

    fn r1080(dur: u8) -> GenerateSeedance2p0Request {
      build_request(dur, Some(KinoviSeedance2p0OutputResolution::TenEightyP), None)
    }

    // ── 480p credits (15 credits/sec) ──

    mod credits_480p {
      use super::*;

      #[test]
      fn every_duration() {
        assert_eq!(r480(3).estimate_credits(), 45);
        assert_eq!(r480(4).estimate_credits(), 60);
        assert_eq!(r480(5).estimate_credits(), 75);
        assert_eq!(r480(6).estimate_credits(), 90);
        assert_eq!(r480(7).estimate_credits(), 105);
        assert_eq!(r480(8).estimate_credits(), 120);
        assert_eq!(r480(9).estimate_credits(), 135);
        assert_eq!(r480(10).estimate_credits(), 150);
        assert_eq!(r480(11).estimate_credits(), 165);
        assert_eq!(r480(12).estimate_credits(), 180);
        assert_eq!(r480(13).estimate_credits(), 195);
        assert_eq!(r480(14).estimate_credits(), 210);
        assert_eq!(r480(15).estimate_credits(), 225);
      }
    }

    // ── 720p credits (40 credits/sec) ──

    mod credits_720p {
      use super::*;

      #[test]
      fn every_duration() {
        assert_eq!(r720(3).estimate_credits(), 120);
        assert_eq!(r720(4).estimate_credits(), 160);
        assert_eq!(r720(5).estimate_credits(), 200);
        assert_eq!(r720(6).estimate_credits(), 240);
        assert_eq!(r720(7).estimate_credits(), 280);
        assert_eq!(r720(8).estimate_credits(), 320);
        assert_eq!(r720(9).estimate_credits(), 360);
        assert_eq!(r720(10).estimate_credits(), 400);
        assert_eq!(r720(11).estimate_credits(), 440);
        assert_eq!(r720(12).estimate_credits(), 480);
        assert_eq!(r720(13).estimate_credits(), 520);
        assert_eq!(r720(14).estimate_credits(), 560);
        assert_eq!(r720(15).estimate_credits(), 600);
      }

      #[test]
      fn explicit_720p_same_as_default() {
        let default = r720(5).estimate_credits();
        let explicit = build_request(5, Some(KinoviSeedance2p0OutputResolution::SevenTwentyP), None).estimate_credits();
        assert_eq!(default, explicit);
      }
    }

    // ── 1080p credits (90 credits/sec) ──

    mod credits_1080p {
      use super::*;

      #[test]
      fn every_duration() {
        assert_eq!(r1080(3).estimate_credits(), 270);
        assert_eq!(r1080(4).estimate_credits(), 360);
        assert_eq!(r1080(5).estimate_credits(), 450);
        assert_eq!(r1080(6).estimate_credits(), 540);
        assert_eq!(r1080(7).estimate_credits(), 630);
        assert_eq!(r1080(8).estimate_credits(), 720);
        assert_eq!(r1080(9).estimate_credits(), 810);
        assert_eq!(r1080(10).estimate_credits(), 900);
        assert_eq!(r1080(11).estimate_credits(), 990);
        assert_eq!(r1080(12).estimate_credits(), 1080);
        assert_eq!(r1080(13).estimate_credits(), 1170);
        assert_eq!(r1080(14).estimate_credits(), 1260);
        assert_eq!(r1080(15).estimate_credits(), 1350);
      }
    }

    // ── Batch multiplier ──

    mod batch_tests {
      use super::*;

      #[test]
      fn batch_1_is_base() {
        let base = r720(5).estimate_credits();
        let explicit = build_request(5, None, Some(KinoviSeedance2p0BatchCount::One)).estimate_credits();
        assert_eq!(base, explicit);
      }

      #[test]
      fn batch_2_doubles() {
        let base = r720(5).estimate_credits();
        let batch2 = build_request(5, None, Some(KinoviSeedance2p0BatchCount::Two)).estimate_credits();
        assert_eq!(batch2, base * 2);
      }

      #[test]
      fn batch_4_quadruples() {
        let base = r720(5).estimate_credits();
        let batch4 = build_request(5, None, Some(KinoviSeedance2p0BatchCount::Four)).estimate_credits();
        assert_eq!(batch4, base * 4);
      }

      #[test]
      fn batch_multiplier_applies_to_1080p() {
        let base = r1080(5).estimate_credits();
        let batch2 = build_request(5, Some(KinoviSeedance2p0OutputResolution::TenEightyP), Some(KinoviSeedance2p0BatchCount::Two)).estimate_credits();
        let batch4 = build_request(5, Some(KinoviSeedance2p0OutputResolution::TenEightyP), Some(KinoviSeedance2p0BatchCount::Four)).estimate_credits();
        assert_eq!(batch2, base * 2);
        assert_eq!(batch4, base * 4);
      }

      #[test]
      fn batch_multiplier_applies_to_480p() {
        let base = r480(5).estimate_credits();
        let batch2 = build_request(5, Some(KinoviSeedance2p0OutputResolution::FourEightyP), Some(KinoviSeedance2p0BatchCount::Two)).estimate_credits();
        let batch4 = build_request(5, Some(KinoviSeedance2p0OutputResolution::FourEightyP), Some(KinoviSeedance2p0BatchCount::Four)).estimate_credits();
        assert_eq!(batch2, base * 2);
        assert_eq!(batch4, base * 4);
      }
    }

    // ── Relative pricing ──

    mod relative_tests {
      use super::*;

      #[test]
      fn cost_scales_with_duration() {
        let c3 = r720(3).estimate_credits();
        let c10 = r720(10).estimate_credits();
        let c15 = r720(15).estimate_credits();
        assert!(c3 < c10);
        assert!(c10 < c15);
      }

      #[test]
      fn resolution_ordering() {
        for dur in 3..=15u8 {
          let c480 = build_request(dur, Some(KinoviSeedance2p0OutputResolution::FourEightyP), None).estimate_credits();
          let c720 = build_request(dur, None, None).estimate_credits();
          let c1080 = build_request(dur, Some(KinoviSeedance2p0OutputResolution::TenEightyP), None).estimate_credits();
          assert!(c480 < c720, "480p should be cheaper than 720p at {}s", dur);
          assert!(c720 < c1080, "720p should be cheaper than 1080p at {}s", dur);
        }
      }
    }

    // ── USD cents ──

    mod usd_cents_tests {
      use super::*;

      #[test]
      fn credits_per_dollar_is_193() {
        assert_eq!(GenerateSeedance2p0Request::credits_per_dollar(), 193.0);
      }

      #[test]
      fn usd_cents_720p_5s() {
        // 200 credits / 193 * 100 = 103.63 → 104¢
        assert_eq!(r720(5).estimate_cost_in_usd_cents(), 104);
      }

      #[test]
      fn usd_cents_480p_5s() {
        // 75 credits / 193 * 100 = 38.86 → 39¢
        assert_eq!(r480(5).estimate_cost_in_usd_cents(), 39);
      }

      #[test]
      fn usd_cents_1080p_5s() {
        // 450 credits / 193 * 100 = 233.16 → 233¢
        assert_eq!(r1080(5).estimate_cost_in_usd_cents(), 233);
      }

      #[test]
      fn usd_cents_720p_15s() {
        // 600 credits / 193 * 100 = 310.88 → 311¢
        assert_eq!(r720(15).estimate_cost_in_usd_cents(), 311);
      }

      #[test]
      fn usd_cents_1080p_15s() {
        // 1350 credits / 193 * 100 = 699.48 → 699¢
        assert_eq!(r1080(15).estimate_cost_in_usd_cents(), 699);
      }

      #[test]
      fn batch_multiplies_usd_cents() {
        let base = r720(5).estimate_cost_in_usd_cents();
        let batch2 = build_request(5, None, Some(KinoviSeedance2p0BatchCount::Two)).estimate_cost_in_usd_cents();
        assert!(batch2 >= base * 2 - 1 && batch2 <= base * 2 + 1,
          "batch 2 ({}) should be ~2× base ({})", batch2, base);
      }
    }

    // ── Aspect ratio doesn't affect cost ──

    #[test]
    fn aspect_ratio_does_not_affect_credits() {
      let baseline = r720(5).estimate_credits();

      let ratios = [
        KinoviSeedance2p0AspectRatio::Landscape16x9,
        KinoviSeedance2p0AspectRatio::Portrait9x16,
        KinoviSeedance2p0AspectRatio::Square1x1,
        KinoviSeedance2p0AspectRatio::Standard4x3,
        KinoviSeedance2p0AspectRatio::Portrait3x4,
      ];

      for ar in &ratios {
        let req = GenerateSeedance2p0Request {
          prompt: String::new(),
          aspect_ratio: Some(*ar),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
        };
        assert_eq!(
          req.estimate_credits(), baseline,
          "Aspect ratio {:?} should not change credits from baseline {}", ar, baseline,
        );
      }
    }
  }

  use crate::requests::prepare_file_upload::prepare_file_upload::{prepare_file_upload, PrepareFileUploadArgs};
  use crate::requests::upload_file::upload_file::{upload_file, UploadFileArgs};

  const STEAMPUNK_CLOWN_ID: &str = "char_1775176566518_sik0te";
  const MOCHI_ID: &str = "char_1775177718294_g2pitx";

  mod text_to_video {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_default() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p0(GenerateSeedance2p0Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0Request {
          prompt: "A corgi and a shiba are playing chess against one another".to_string(),
          aspect_ratio: None,
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
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
    async fn test_text_to_video_1080p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p0(GenerateSeedance2p0Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0Request {
          prompt: "A dragon soaring over a medieval castle at sunset".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0AspectRatio::Landscape16x9),
          output_resolution: Some(KinoviSeedance2p0OutputResolution::TenEightyP),
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("t2v 1080p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  mod keyframe {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_keyframe_start_frame() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let start_frame_url = upload_test_image(&session, test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL).await?;

      let result = generate_seedance_2p0(GenerateSeedance2p0Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0Request {
          prompt: "The corgi dog watches the lake as the sun sets.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0AspectRatio::Landscape16x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: Some(start_frame_url),
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("keyframe — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_keyframe_start_and_end_frame() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let start_frame_url = upload_test_image(&session, test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL).await?;
      let end_frame_url = upload_test_image(&session, test_data::web::image_urls::FOREST_BACKDROP_IMAGE_URL).await?;

      let result = generate_seedance_2p0(GenerateSeedance2p0Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0Request {
          prompt: "The dog walks from the lake toward the camera.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0AspectRatio::Landscape16x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: Some(start_frame_url),
          end_frame_url: Some(end_frame_url),
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("keyframe start+end — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  mod image_reference {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_image_references() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let img1 = upload_test_image(&session, test_data::web::image_urls::JUNO_AT_LAKE_IMAGE_URL).await?;
      let img2 = upload_test_image(&session, test_data::web::image_urls::WHITE_HOUSE_SUNSET_IMAGE_URL).await?;

      let result = generate_seedance_2p0(GenerateSeedance2p0Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0Request {
          prompt: "The dog in @1 runs through the scenery in @2.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0AspectRatio::Landscape16x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: Some(vec![img1, img2]),
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("image ref — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  mod video_reference {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_video_reference() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;

      let result = generate_seedance_2p0(GenerateSeedance2p0Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0Request {
          prompt: "Change @video1 to a nighttime scene with moonlight.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0AspectRatio::Landscape16x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: Some(vec![
            "https://static.seedance2-pro.com/materials/20260315/1773594284659-3a46d231.mp4".to_string(),
          ]),
          reference_audio_urls: None,
          character_ids: None,
          use_face_blur_hack: None,
        },
      }).await?;
      println!("video ref — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  mod character_reference {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_single_character() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;

      let result = generate_seedance_2p0(GenerateSeedance2p0Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0Request {
          prompt: "@Steampunk Clown is juggling flaming torches in a circus tent.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0AspectRatio::Landscape16x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: Some(vec![STEAMPUNK_CLOWN_ID.to_string()]),
          use_face_blur_hack: None,
        },
      }).await?;
      println!("character ref — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_two_characters() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;

      let result = generate_seedance_2p0(GenerateSeedance2p0Args {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0Request {
          prompt: "@Steampunk Clown and @Mochi are playing fetch in a sunny park.".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0AspectRatio::Landscape16x9),
          output_resolution: None,
          batch_count: None,
          duration_seconds: 5,
          start_frame_url: None,
          end_frame_url: None,
          reference_image_urls: None,
          reference_video_urls: None,
          reference_audio_urls: None,
          character_ids: Some(vec![STEAMPUNK_CLOWN_ID.to_string(), MOCHI_ID.to_string()]),
          use_face_blur_hack: None,
        },
      }).await?;
      println!("two characters — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  fn test_session() -> AnyhowResult<Seedance2ProSession> {
    let cookies = get_test_cookies()?;
    Ok(Seedance2ProSession::from_cookies_string(cookies))
  }

  async fn upload_test_image(session: &Seedance2ProSession, image_url: &str) -> AnyhowResult<String> {
    let image_bytes = crate::test_utils::http_download::http_download_to_bytes(
      image_url,
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
