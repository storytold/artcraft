use fal_client::requests::api::video::elements::kling_1p6_pro_elements_to_video::api::{
  Kling1p6ProElementsToVideoAspectRatio, Kling1p6ProElementsToVideoDuration,
  Kling1p6ProElementsToVideoRequest,
};
use fal_client::requests::api::video::image::kling_1p6_pro_image_to_video::api::{
  Kling1p6ProImageToVideoAspectRatio, Kling1p6ProImageToVideoDuration,
  Kling1p6ProImageToVideoRequest,
};
use fal_client::requests::api::video::text::kling_1p6_pro_text_to_video::api::{
  Kling1p6ProTextToVideoAspectRatio, Kling1p6ProTextToVideoDuration,
  Kling1p6ProTextToVideoRequest,
};

use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::fal::kling_1_6_pro::request::{
  FalKling16ProMode, FalKling16ProRequestState,
};
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

#[derive(Debug, Clone, Copy)]
pub(crate) enum PlanAspectRatio {
  Square,
  SixteenByNine,
  NineBySixteen,
}

#[derive(Debug, Clone, Copy)]
pub(crate) enum PlanDuration {
  Five,
  Ten,
}

pub fn build_fal_kling_1_6_pro(
  builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio, strategy)?;
  let duration = plan_duration(builder.duration_seconds, strategy)?;
  let prompt = builder.prompt.clone().unwrap_or_default();
  let negative_prompt = builder.negative_prompt.clone();

  let reference_image_urls = resolve_reference_image_urls(builder.reference_images.clone())?;
  let start_image_url = optional_url(builder.start_frame.clone())?;
  let end_image_url = optional_url(builder.end_frame.clone())?;

  // Dispatch: reference_images → elements; start_frame → image; else → text.
  // Elements-to-video has no concept of start/end frame, so passing both with
  // reference_images is rejected unless the strategy is lenient.
  let mode = if !reference_image_urls.is_empty() {
    if (start_image_url.is_some() || end_image_url.is_some())
      && matches!(strategy, RequestMismatchMitigationStrategy::ErrorOut)
    {
      return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "reference_images",
        value: "Kling 1.6 Pro elements-to-video cannot also accept start_frame or end_frame".to_string(),
      }));
    }
    FalKling16ProMode::ElementsToVideo(Kling1p6ProElementsToVideoRequest {
      prompt,
      input_image_urls: reference_image_urls,
      negative_prompt,
      duration: duration.map(to_elements_duration),
      aspect_ratio: aspect_ratio.map(to_elements_aspect_ratio),
    })
  } else if let Some(image_url) = start_image_url {
    FalKling16ProMode::ImageToVideo(Kling1p6ProImageToVideoRequest {
      prompt,
      image_url,
      end_image_url,
      negative_prompt,
      duration: duration.map(to_i2v_duration),
      aspect_ratio: aspect_ratio.map(to_i2v_aspect_ratio),
      cfg_scale: None,
    })
  } else {
    if end_image_url.is_some() {
      return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "end_frame",
        value: "Kling 1.6 Pro requires a start_frame when end_frame is provided".to_string(),
      }));
    }
    FalKling16ProMode::TextToVideo(Kling1p6ProTextToVideoRequest {
      prompt,
      negative_prompt,
      duration: duration.map(to_t2v_duration),
      aspect_ratio: aspect_ratio.map(to_t2v_aspect_ratio),
      cfg_scale: None,
    })
  };

  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling16Pro(
    FalKling16ProRequestState { mode },
  )))
}

// ── Shared URL helpers ──
//
// `optional_url` is also imported by other Kling router modules (e.g.
// kling_3p0_pro) to avoid copy/paste. Preserve the signature.

pub(crate) fn require_url(
  image_ref: Option<ImageRef>,
  field: &'static str,
  reason: &str,
) -> Result<String, ArtcraftRouterError> {
  match image_ref {
    Some(ImageRef::Url(url)) => Ok(url),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
    None => Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field,
      value: reason.to_string(),
    })),
  }
}

pub(crate) fn optional_url(image_ref: Option<ImageRef>) -> Result<Option<String>, ArtcraftRouterError> {
  match image_ref {
    None => Ok(None),
    Some(ImageRef::Url(url)) => Ok(Some(url)),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

fn resolve_reference_image_urls(
  reference_images: Option<ImageListRef>,
) -> Result<Vec<String>, ArtcraftRouterError> {
  match reference_images {
    None => Ok(vec![]),
    Some(ImageListRef::Urls(urls)) => Ok(urls),
    Some(ImageListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
    }
  }
}

// ── Plan helpers ──

fn plan_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanAspectRatio>, ArtcraftRouterError> {
  use PlanAspectRatio as Ar;
  match aspect_ratio {
    None => Ok(None),

    Some(RouterAspectRatio::Square) | Some(RouterAspectRatio::SquareHd) => Ok(Some(Ar::Square)),
    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => Ok(Some(Ar::SixteenByNine)),
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => Ok(Some(Ar::NineBySixteen)),

    Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto4k) => Ok(Some(Ar::SixteenByNine)),

    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "aspect_ratio",
          value: format!("{:?}", other),
        }))
      }
      _ => Ok(Some(Ar::SixteenByNine)),
    },
  }
}

fn plan_duration(
  duration_seconds: Option<u16>,
  strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<PlanDuration>, ArtcraftRouterError> {
  match duration_seconds {
    None => Ok(None),
    Some(5) => Ok(Some(PlanDuration::Five)),
    Some(10) => Ok(Some(PlanDuration::Ten)),
    Some(other) => match strategy {
      RequestMismatchMitigationStrategy::ErrorOut => {
        Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
          field: "duration_seconds",
          value: format!("{}", other),
        }))
      }
      RequestMismatchMitigationStrategy::PayMoreUpgrade => Ok(Some(PlanDuration::Ten)),
      RequestMismatchMitigationStrategy::PayLessDowngrade => Ok(Some(PlanDuration::Five)),
    },
  }
}

fn to_t2v_aspect_ratio(a: PlanAspectRatio) -> Kling1p6ProTextToVideoAspectRatio {
  match a {
    PlanAspectRatio::Square => Kling1p6ProTextToVideoAspectRatio::Square,
    PlanAspectRatio::SixteenByNine => Kling1p6ProTextToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => Kling1p6ProTextToVideoAspectRatio::NineBySixteen,
  }
}

fn to_t2v_duration(d: PlanDuration) -> Kling1p6ProTextToVideoDuration {
  match d {
    PlanDuration::Five => Kling1p6ProTextToVideoDuration::FiveSeconds,
    PlanDuration::Ten => Kling1p6ProTextToVideoDuration::TenSeconds,
  }
}

fn to_i2v_aspect_ratio(a: PlanAspectRatio) -> Kling1p6ProImageToVideoAspectRatio {
  match a {
    PlanAspectRatio::Square => Kling1p6ProImageToVideoAspectRatio::Square,
    PlanAspectRatio::SixteenByNine => Kling1p6ProImageToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => Kling1p6ProImageToVideoAspectRatio::NineBySixteen,
  }
}

fn to_i2v_duration(d: PlanDuration) -> Kling1p6ProImageToVideoDuration {
  match d {
    PlanDuration::Five => Kling1p6ProImageToVideoDuration::FiveSeconds,
    PlanDuration::Ten => Kling1p6ProImageToVideoDuration::TenSeconds,
  }
}

fn to_elements_aspect_ratio(a: PlanAspectRatio) -> Kling1p6ProElementsToVideoAspectRatio {
  match a {
    PlanAspectRatio::Square => Kling1p6ProElementsToVideoAspectRatio::Square,
    PlanAspectRatio::SixteenByNine => Kling1p6ProElementsToVideoAspectRatio::SixteenByNine,
    PlanAspectRatio::NineBySixteen => Kling1p6ProElementsToVideoAspectRatio::NineBySixteen,
  }
}

fn to_elements_duration(d: PlanDuration) -> Kling1p6ProElementsToVideoDuration {
  match d {
    PlanDuration::Five => Kling1p6ProElementsToVideoDuration::FiveSeconds,
    PlanDuration::Ten => Kling1p6ProElementsToVideoDuration::TenSeconds,
  }
}

#[cfg(test)]
mod tests {
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::router_provider::RouterProvider;

  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Kling16Pro,
      provider: RouterProvider::Fal,
      prompt: Some("test".to_string()),
      ..Default::default()
    }
  }

  // ── Mode dispatch ──

  mod mode_dispatch {
    use super::*;

    #[test]
    fn no_frames_picks_t2v() {
      let result = build_fal_kling_1_6_pro(base_builder()).expect("build");
      let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling16Pro(s)) = result else {
        panic!("expected FalKling16Pro");
      };
      assert!(matches!(s.mode, FalKling16ProMode::TextToVideo(_)));
    }

    #[test]
    fn start_frame_picks_i2v() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
      let result = build_fal_kling_1_6_pro(b).expect("build");
      let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling16Pro(s)) = result else {
        panic!("expected FalKling16Pro");
      };
      assert!(matches!(s.mode, FalKling16ProMode::ImageToVideo(_)));
    }

    #[test]
    fn reference_images_picks_elements() {
      let mut b = base_builder();
      b.reference_images = Some(ImageListRef::Urls(vec!["https://example.com/r.png".to_string()]));
      let result = build_fal_kling_1_6_pro(b).expect("build");
      let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling16Pro(s)) = result else {
        panic!("expected FalKling16Pro");
      };
      assert!(matches!(s.mode, FalKling16ProMode::ElementsToVideo(_)));
    }

    #[test]
    fn elements_with_start_frame_errors_in_strict_mode() {
      let mut b = base_builder();
      b.reference_images = Some(ImageListRef::Urls(vec!["https://example.com/r.png".to_string()]));
      b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      assert!(build_fal_kling_1_6_pro(b).is_err());
    }

    #[test]
    fn elements_with_start_frame_drops_frame_in_lenient_mode() {
      let mut b = base_builder();
      b.reference_images = Some(ImageListRef::Urls(vec!["https://example.com/r.png".to_string()]));
      b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayLessDowngrade;
      let result = build_fal_kling_1_6_pro(b).expect("build");
      let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling16Pro(s)) = result else {
        panic!("expected FalKling16Pro");
      };
      assert!(matches!(s.mode, FalKling16ProMode::ElementsToVideo(_)));
    }

    #[test]
    fn end_frame_without_start_frame_errors() {
      let mut b = base_builder();
      b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
      assert!(build_fal_kling_1_6_pro(b).is_err());
    }
  }

  // ── Field passthrough ──

  mod field_passthrough {
    use super::*;

    #[test]
    fn t2v_prompt_and_aspect_propagate() {
      let mut b = base_builder();
      b.prompt = Some("custom prompt".to_string());
      b.aspect_ratio = Some(RouterAspectRatio::TallNineBySixteen);
      b.duration_seconds = Some(10);
      let result = build_fal_kling_1_6_pro(b).expect("build");
      let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling16Pro(s)) = result else {
        panic!("expected FalKling16Pro");
      };
      let FalKling16ProMode::TextToVideo(req) = s.mode else {
        panic!("expected TextToVideo");
      };
      assert_eq!(req.prompt, "custom prompt");
      assert!(matches!(req.aspect_ratio, Some(Kling1p6ProTextToVideoAspectRatio::NineBySixteen)));
      assert!(matches!(req.duration, Some(Kling1p6ProTextToVideoDuration::TenSeconds)));
    }

    #[test]
    fn i2v_start_and_end_frames_propagate() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::Url("https://example.com/start.png".to_string()));
      b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
      let result = build_fal_kling_1_6_pro(b).expect("build");
      let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling16Pro(s)) = result else {
        panic!("expected FalKling16Pro");
      };
      let FalKling16ProMode::ImageToVideo(req) = s.mode else {
        panic!("expected ImageToVideo");
      };
      assert_eq!(req.image_url, "https://example.com/start.png");
      assert_eq!(req.end_image_url.as_deref(), Some("https://example.com/end.png"));
    }

    #[test]
    fn elements_input_image_urls_propagate() {
      let mut b = base_builder();
      b.reference_images = Some(ImageListRef::Urls(vec![
        "https://example.com/a.png".to_string(),
        "https://example.com/b.png".to_string(),
      ]));
      let result = build_fal_kling_1_6_pro(b).expect("build");
      let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling16Pro(s)) = result else {
        panic!("expected FalKling16Pro");
      };
      let FalKling16ProMode::ElementsToVideo(req) = s.mode else {
        panic!("expected ElementsToVideo");
      };
      assert_eq!(req.input_image_urls.len(), 2);
    }
  }

  // ── Validation ──

  mod validation {
    use super::*;

    #[test]
    fn media_file_token_rejected_for_start_frame() {
      let mut b = base_builder();
      b.start_frame = Some(ImageRef::MediaFileToken(
        tokens::tokens::media_files::MediaFileToken::new_from_str("mf_xxx"),
      ));
      assert!(matches!(
        build_fal_kling_1_6_pro(b),
        Err(ArtcraftRouterError::Client(ClientError::FalOnlySupportsUrls))
      ));
    }

    #[test]
    fn duration_out_of_range_errors_in_strict_mode() {
      let mut b = base_builder();
      b.duration_seconds = Some(7);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::ErrorOut;
      assert!(build_fal_kling_1_6_pro(b).is_err());
    }

    #[test]
    fn duration_out_of_range_upgrades() {
      let mut b = base_builder();
      b.duration_seconds = Some(7);
      b.request_mismatch_mitigation_strategy = RequestMismatchMitigationStrategy::PayMoreUpgrade;
      let result = build_fal_kling_1_6_pro(b).expect("build");
      let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::FalKling16Pro(s)) = result else {
        panic!("expected FalKling16Pro");
      };
      let FalKling16ProMode::TextToVideo(req) = s.mode else {
        panic!("expected TextToVideo");
      };
      assert!(matches!(req.duration, Some(Kling1p6ProTextToVideoDuration::TenSeconds)));
    }

    #[test]
    fn full_combinatorial_pass() {
      let aspect_ratios = [None, Some(RouterAspectRatio::Square), Some(RouterAspectRatio::WideSixteenByNine), Some(RouterAspectRatio::TallNineBySixteen), Some(RouterAspectRatio::Auto)];
      let durations = [None, Some(5u16), Some(10)];
      let mut combos = 0;
      for &aspect_ratio in &aspect_ratios {
        for &duration in &durations {
          for include_end in [false, true] {
            let mut b = base_builder();
            b.start_frame = Some(ImageRef::Url("https://example.com/a.png".to_string()));
            b.aspect_ratio = aspect_ratio;
            b.duration_seconds = duration;
            if include_end {
              b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
            }
            assert!(build_fal_kling_1_6_pro(b).is_ok());
            combos += 1;
          }
        }
      }
      assert_eq!(combos, 5 * 3 * 2);
    }
  }
}
