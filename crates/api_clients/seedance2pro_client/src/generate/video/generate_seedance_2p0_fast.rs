use crate::creds::seedance2pro_session::Seedance2ProSession;
use crate::error::seedance2pro_error::Seedance2ProError;
use crate::requests::kinovi_host::KinoviHost;
use crate::requests::workflow_run_task::workflow_run_task::{
  workflow_run_task, KinoviAspectRatioRaw, KinoviBatchCountRaw,
  KinoviModelTypeRaw, KinoviOutputResolutionRaw, WorkflowRunTaskArgs,
  WorkflowRunTaskRequest,
};

// ── Args ──

pub struct GenerateSeedance2p0FastArgs<'a> {
  pub request: GenerateSeedance2p0FastRequest,
  pub session: &'a Seedance2ProSession,
  pub host_override: Option<KinoviHost>,
}

// ── Request ──

#[derive(Clone, Debug)]
pub struct GenerateSeedance2p0FastRequest {
  pub prompt: String,
  pub aspect_ratio: Option<KinoviSeedance2p0FastAspectRatio>,
  pub output_resolution: Option<KinoviSeedance2p0FastOutputResolution>,
  pub duration_seconds: u8,
  pub batch_count: Option<KinoviSeedance2p0FastBatchCount>,
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
pub enum KinoviSeedance2p0FastAspectRatio {
  Landscape16x9,
  Portrait9x16,
  Square1x1,
  Standard4x3,
  Portrait3x4,
}

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0FastOutputResolution {
  FourEightyP,
  SevenTwentyP,
}

#[derive(Debug, Clone, Copy)]
pub enum KinoviSeedance2p0FastBatchCount {
  One,
  Two,
  Four,
}

// ── Pricing ──
//
// Seedance 2.0 Fast credit pricing:
//
// | Resolution | Credits/sec |
// |------------|-------------|
// | 480p       |          10 |
// | 720p       |          28 |
//
// Default resolution (None) is 720p.
// Batch count multiplies the total cost.
//
// Credits per dollar:
// - Fast @ 720p (or None): 220.0 (22,000 credits / $99.99)
// - Fast @ 480p: 193.0 (22,000 credits / $114)

impl GenerateSeedance2p0FastRequest {
  /// Estimate the credit cost for this generation request.
  pub fn estimate_credits(&self) -> u32 {
    let credits_per_second: u32 = match self.output_resolution {
      Some(KinoviSeedance2p0FastOutputResolution::FourEightyP) => 10,
      Some(KinoviSeedance2p0FastOutputResolution::SevenTwentyP) | None => 28,
    };

    let per_video = u32::from(self.duration_seconds) * credits_per_second;
    let batch_multiplier: u32 = match self.batch_count {
      None | Some(KinoviSeedance2p0FastBatchCount::One) => 1,
      Some(KinoviSeedance2p0FastBatchCount::Two) => 2,
      Some(KinoviSeedance2p0FastBatchCount::Four) => 4,
    };
    per_video * batch_multiplier
  }

  /// Credits per dollar for billing conversion.
  fn credits_per_dollar(&self) -> f64 {
    match self.output_resolution {
      None | Some(KinoviSeedance2p0FastOutputResolution::SevenTwentyP) => 220.0,
      Some(KinoviSeedance2p0FastOutputResolution::FourEightyP) => 193.0,
    }
  }

  /// Estimate the USD cost in cents for this generation request.
  pub fn estimate_cost_in_usd_cents(&self) -> u64 {
    let credits = self.estimate_credits() as f64;
    let cost = credits / self.credits_per_dollar() * 100.0;
    cost.round() as u64
  }
}

// ── Response ──

pub struct GenerateSeedance2p0FastResponse {
  pub task_id: String,
  pub order_id: String,
  pub task_ids: Option<Vec<String>>,
  pub order_ids: Option<Vec<String>>,
}

// ── Entry point ──

pub async fn generate_seedance_2p0_fast(
  args: GenerateSeedance2p0FastArgs<'_>,
) -> Result<GenerateSeedance2p0FastResponse, Seedance2ProError> {
  let req = args.request;

  let raw_request = WorkflowRunTaskRequest {
    model_type: KinoviModelTypeRaw::Seedance2Fast,
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

  Ok(GenerateSeedance2p0FastResponse {
    task_id: raw_response.task_id,
    order_id: raw_response.order_id,
    task_ids: raw_response.task_ids,
    order_ids: raw_response.order_ids,
  })
}

// ── Mapping helpers ──

fn map_aspect_ratio(ar: Option<KinoviSeedance2p0FastAspectRatio>) -> KinoviAspectRatioRaw {
  match ar {
    Some(KinoviSeedance2p0FastAspectRatio::Landscape16x9) => KinoviAspectRatioRaw::Landscape16x9,
    Some(KinoviSeedance2p0FastAspectRatio::Portrait9x16) => KinoviAspectRatioRaw::Portrait9x16,
    Some(KinoviSeedance2p0FastAspectRatio::Square1x1) => KinoviAspectRatioRaw::Square1x1,
    Some(KinoviSeedance2p0FastAspectRatio::Standard4x3) => KinoviAspectRatioRaw::Landscape4x3,
    Some(KinoviSeedance2p0FastAspectRatio::Portrait3x4) => KinoviAspectRatioRaw::Portrait3x4,
    None => KinoviAspectRatioRaw::Landscape16x9,
  }
}

fn map_output_resolution(res: KinoviSeedance2p0FastOutputResolution) -> KinoviOutputResolutionRaw {
  match res {
    KinoviSeedance2p0FastOutputResolution::FourEightyP => KinoviOutputResolutionRaw::FourEightyP,
    KinoviSeedance2p0FastOutputResolution::SevenTwentyP => KinoviOutputResolutionRaw::SevenTwentyP,
  }
}

fn map_batch_count(bc: Option<KinoviSeedance2p0FastBatchCount>) -> KinoviBatchCountRaw {
  match bc {
    Some(KinoviSeedance2p0FastBatchCount::One) | None => KinoviBatchCountRaw::One,
    Some(KinoviSeedance2p0FastBatchCount::Two) => KinoviBatchCountRaw::Two,
    Some(KinoviSeedance2p0FastBatchCount::Four) => KinoviBatchCountRaw::Four,
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

    fn make_request(
      duration_seconds: u8,
      output_resolution: Option<KinoviSeedance2p0FastOutputResolution>,
      batch_count: Option<KinoviSeedance2p0FastBatchCount>,
    ) -> GenerateSeedance2p0FastRequest {
      GenerateSeedance2p0FastRequest {
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

    fn r480(dur: u8) -> GenerateSeedance2p0FastRequest {
      make_request(dur, Some(KinoviSeedance2p0FastOutputResolution::FourEightyP), None)
    }

    fn r720(dur: u8) -> GenerateSeedance2p0FastRequest {
      make_request(dur, None, None)
    }

    // ── 480p credits (10 credits/sec) ──

    mod credits_480p {
      use super::*;

      #[test]
      fn every_duration() {
        assert_eq!(r480(3).estimate_credits(), 30);
        assert_eq!(r480(4).estimate_credits(), 40);
        assert_eq!(r480(5).estimate_credits(), 50);
        assert_eq!(r480(6).estimate_credits(), 60);
        assert_eq!(r480(7).estimate_credits(), 70);
        assert_eq!(r480(8).estimate_credits(), 80);
        assert_eq!(r480(9).estimate_credits(), 90);
        assert_eq!(r480(10).estimate_credits(), 100);
        assert_eq!(r480(11).estimate_credits(), 110);
        assert_eq!(r480(12).estimate_credits(), 120);
        assert_eq!(r480(13).estimate_credits(), 130);
        assert_eq!(r480(14).estimate_credits(), 140);
        assert_eq!(r480(15).estimate_credits(), 150);
      }
    }

    // ── 720p credits (28 credits/sec) ──

    mod credits_720p {
      use super::*;

      #[test]
      fn every_duration() {
        assert_eq!(r720(3).estimate_credits(), 84);
        assert_eq!(r720(4).estimate_credits(), 112);
        assert_eq!(r720(5).estimate_credits(), 140);
        assert_eq!(r720(6).estimate_credits(), 168);
        assert_eq!(r720(7).estimate_credits(), 196);
        assert_eq!(r720(8).estimate_credits(), 224);
        assert_eq!(r720(9).estimate_credits(), 252);
        assert_eq!(r720(10).estimate_credits(), 280);
        assert_eq!(r720(11).estimate_credits(), 308);
        assert_eq!(r720(12).estimate_credits(), 336);
        assert_eq!(r720(13).estimate_credits(), 364);
        assert_eq!(r720(14).estimate_credits(), 392);
        assert_eq!(r720(15).estimate_credits(), 420);
      }

      #[test]
      fn explicit_720p_same_as_default() {
        let default = r720(5).estimate_credits();
        let explicit = make_request(5, Some(KinoviSeedance2p0FastOutputResolution::SevenTwentyP), None).estimate_credits();
        assert_eq!(default, explicit);
      }
    }

    // ── Batch multiplier ──

    mod batch_tests {
      use super::*;

      #[test]
      fn batch_1_is_base() {
        let base = r720(5).estimate_credits();
        let explicit = make_request(5, None, Some(KinoviSeedance2p0FastBatchCount::One)).estimate_credits();
        assert_eq!(base, explicit);
      }

      #[test]
      fn batch_2_doubles() {
        let base = r720(5).estimate_credits();
        let batch2 = make_request(5, None, Some(KinoviSeedance2p0FastBatchCount::Two)).estimate_credits();
        assert_eq!(batch2, base * 2);
      }

      #[test]
      fn batch_4_quadruples() {
        let base = r720(5).estimate_credits();
        let batch4 = make_request(5, None, Some(KinoviSeedance2p0FastBatchCount::Four)).estimate_credits();
        assert_eq!(batch4, base * 4);
      }

      #[test]
      fn batch_multiplier_applies_to_480p() {
        let base = r480(5).estimate_credits();
        let batch2 = make_request(5, Some(KinoviSeedance2p0FastOutputResolution::FourEightyP), Some(KinoviSeedance2p0FastBatchCount::Two)).estimate_credits();
        let batch4 = make_request(5, Some(KinoviSeedance2p0FastOutputResolution::FourEightyP), Some(KinoviSeedance2p0FastBatchCount::Four)).estimate_credits();
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
          let c480 = make_request(dur, Some(KinoviSeedance2p0FastOutputResolution::FourEightyP), None).estimate_credits();
          let c720 = make_request(dur, None, None).estimate_credits();
          assert!(c480 < c720, "480p should be cheaper than 720p at {}s", dur);
        }
      }
    }

    // ── USD cents ──

    mod usd_cents_tests {
      use super::*;

      #[test]
      fn credits_per_dollar_720p() {
        assert_eq!(r720(5).credits_per_dollar(), 220.0);
      }

      #[test]
      fn credits_per_dollar_480p() {
        assert_eq!(r480(5).credits_per_dollar(), 193.0);
      }

      #[test]
      fn usd_cents_720p_5s() {
        // 140 credits / 220 * 100 = 63.64 → 64¢
        assert_eq!(r720(5).estimate_cost_in_usd_cents(), 64);
      }

      #[test]
      fn usd_cents_480p_5s() {
        // 50 credits / 193 * 100 = 25.91 → 26¢
        assert_eq!(r480(5).estimate_cost_in_usd_cents(), 26);
      }

      #[test]
      fn usd_cents_720p_15s() {
        // 420 credits / 220 * 100 = 190.91 → 191¢
        assert_eq!(r720(15).estimate_cost_in_usd_cents(), 191);
      }

      #[test]
      fn usd_cents_480p_15s() {
        // 150 credits / 193 * 100 = 77.72 → 78¢
        assert_eq!(r480(15).estimate_cost_in_usd_cents(), 78);
      }

      #[test]
      fn batch_multiplies_usd_cents() {
        let base = r720(5).estimate_cost_in_usd_cents();
        let batch2 = make_request(5, None, Some(KinoviSeedance2p0FastBatchCount::Two)).estimate_cost_in_usd_cents();
        assert!(batch2 >= base * 2 - 1 && batch2 <= base * 2 + 1,
          "batch 2 ({}) should be ~2× base ({})", batch2, base);
      }
    }

    // ── Aspect ratio doesn't affect cost ──

    #[test]
    fn aspect_ratio_does_not_affect_credits() {
      let baseline = r720(5).estimate_credits();

      let ratios = [
        KinoviSeedance2p0FastAspectRatio::Landscape16x9,
        KinoviSeedance2p0FastAspectRatio::Portrait9x16,
        KinoviSeedance2p0FastAspectRatio::Square1x1,
        KinoviSeedance2p0FastAspectRatio::Standard4x3,
        KinoviSeedance2p0FastAspectRatio::Portrait3x4,
      ];

      for ar in &ratios {
        let req = GenerateSeedance2p0FastRequest {
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

  mod text_to_video {
    use super::*;

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_default() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
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
      println!("t2v fast default — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert!(!result.order_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }

    #[tokio::test]
    #[ignore]
    async fn test_text_to_video_480p() -> AnyhowResult<()> {
      setup_test_logging(LevelFilter::Trace);
      let session = test_session()?;
      let result = generate_seedance_2p0_fast(GenerateSeedance2p0FastArgs {
        session: &session,
        host_override: None,
        request: GenerateSeedance2p0FastRequest {
          prompt: "A golden retriever running through a field of sunflowers".to_string(),
          aspect_ratio: Some(KinoviSeedance2p0FastAspectRatio::Landscape16x9),
          output_resolution: Some(KinoviSeedance2p0FastOutputResolution::FourEightyP),
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
      println!("t2v fast 480p — task_id={}, order_id={}", result.task_id, result.order_id);
      assert!(!result.task_id.is_empty());
      assert_eq!(1, 2);
      Ok(())
    }
  }

  fn test_session() -> AnyhowResult<Seedance2ProSession> {
    let cookies = get_test_cookies()?;
    Ok(Seedance2ProSession::from_cookies_string(cookies))
  }
}
