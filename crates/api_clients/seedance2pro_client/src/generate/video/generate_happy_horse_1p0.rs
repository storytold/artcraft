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
