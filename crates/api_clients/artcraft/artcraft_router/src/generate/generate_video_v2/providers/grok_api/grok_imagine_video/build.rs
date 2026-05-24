use log::info;

use grok_api_client::api::requests::videos::video_generation::video_generation::{
  VideoGenerationRequest as GrokVideoGenerationRequest,
  VideoImageSource as GrokVideoImageSource,
};
use grok_api_client::api::types::video_types::video_aspect_ratio::VideoAspectRatio as GrokAspectRatio;
use grok_api_client::api::types::video_types::video_resolution::VideoResolution as GrokResolution;

use crate::api::audio_list_ref::AudioListRef;
use crate::api::common_aspect_ratio::CommonAspectRatio;
use crate::api::common_resolution::CommonResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::video_list_ref::VideoListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::grok_api::grok_imagine_video::request::GrokApiGrokImagineVideoRequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

/// Builds a Grok Imagine Video request from the generic GenerateVideoRequestBuilder.
///
/// xAI's grok-imagine-video accepts:
/// - `image` (single source image, image-to-video mode) OR `reference_images` (multi-image
///   reference-to-video). These two are mutually exclusive per xAI's API.
/// - Aspect ratio, resolution (480p/720p), duration (1–15s), prompt.
///
/// Fields that Grok DOESN'T accept (`end_frame`, `reference_videos`, `reference_audio`,
/// and `MediaFileToken`-style image refs) are silently dropped with an info-level log.
/// Same goes for the `start_frame` + `reference_images` conflict — we prefer
/// `start_frame` (image-to-video) and drop `reference_images`. This keeps the
/// pipeline tolerant when callers fan a single builder out to multiple providers
/// with different capabilities.
pub fn build_grok_api_grok_imagine_video(
  mut builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // Scalar fields.
  let prompt = builder.prompt.take().unwrap_or_default();
  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio.take(), strategy);
  let resolution = plan_resolution(builder.resolution.take(), strategy);
  let duration = builder.duration_seconds.take().map(|d| (d as u32).clamp(1, 15));

  // Wholly-unsupported fields → drop with a log so it shows up in operator traces.
  log_and_drop_end_frame(builder.end_frame.take());
  log_and_drop_reference_videos(builder.reference_videos.take());
  log_and_drop_reference_audio(builder.reference_audio.take());

  // Image sources: prefer start_frame (image-to-video). If both start_frame and
  // reference_images are supplied, drop reference_images (xAI rejects the
  // combination on the wire).
  let start_frame = resolve_url_to_image_source(builder.start_frame.take());
  let reference_images_supplied = builder.reference_images.take();

  let (image, reference_images) = match (start_frame, reference_images_supplied) {
    (Some(img), Some(refs)) => {
      info!(
        "grok_imagine_video: both start_frame and reference_images supplied — \
         preferring start_frame (image-to-video). Dropping {} reference images.",
        count_image_list_ref(&refs),
      );
      (Some(img), None)
    }
    (Some(img), None) => (Some(img), None),
    (None, Some(refs)) => (None, resolve_url_list_to_image_sources(refs)),
    (None, None) => (None, None),
  };

  let request = GrokVideoGenerationRequest {
    prompt,
    model: None, // defaults to grok-imagine-video in the client
    image,
    reference_images,
    aspect_ratio,
    duration,
    resolution,
    user: None,
  };

  let state = GrokApiGrokImagineVideoRequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(
    VideoGenerationRequest::GrokApiGrokImagineVideo(state),
  ))
}

// ── Field planners ──

fn plan_aspect_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  _strategy: RequestMismatchMitigationStrategy,
) -> Option<GrokAspectRatio> {
  // xAI supports exactly: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3.
  // Auto / unsupported ratios fall back to the closest match (or None → xAI default 16:9).
  match aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto3k)
    | Some(CommonAspectRatio::Auto4k) => None,

    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => {
      Some(GrokAspectRatio::Square)
    }

    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => {
      Some(GrokAspectRatio::Landscape16x9)
    }
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => {
      Some(GrokAspectRatio::Portrait9x16)
    }

    Some(CommonAspectRatio::WideFourByThree) => Some(GrokAspectRatio::Landscape4x3),
    Some(CommonAspectRatio::TallThreeByFour) => Some(GrokAspectRatio::Portrait3x4),

    Some(CommonAspectRatio::WideThreeByTwo) => Some(GrokAspectRatio::Landscape3x2),
    Some(CommonAspectRatio::TallTwoByThree) => Some(GrokAspectRatio::Portrait2x3),

    // No exact xAI match — pick the closest cardinal direction.
    Some(CommonAspectRatio::WideFiveByFour)
    | Some(CommonAspectRatio::WideTwentyOneByNine) => Some(GrokAspectRatio::Landscape16x9),
    Some(CommonAspectRatio::TallFourByFive)
    | Some(CommonAspectRatio::TallNineByTwentyOne) => Some(GrokAspectRatio::Portrait9x16),
  }
}

fn plan_resolution(
  resolution: Option<CommonResolution>,
  _strategy: RequestMismatchMitigationStrategy,
) -> Option<GrokResolution> {
  // Grok supports 480p and 720p only (1080p is downsized to 720p per xAI docs).
  match resolution {
    None => None,
    Some(CommonResolution::FourEightyP) => Some(GrokResolution::FourEightyP),
    Some(CommonResolution::SevenTwentyP) => Some(GrokResolution::SevenTwentyP),
    // Higher-than-720p requests get clamped to 720p (Grok's cap).
    Some(CommonResolution::TenEightyP)
    | Some(CommonResolution::TwoK)
    | Some(CommonResolution::ThreeK)
    | Some(CommonResolution::FourK) => Some(GrokResolution::SevenTwentyP),
    // Lower-than-480p requests get bumped to 480p (Grok's floor).
    Some(CommonResolution::HalfK) | Some(CommonResolution::OneK) => {
      Some(GrokResolution::FourEightyP)
    }
  }
}

// ── Image source resolvers (silent drops for unsupported variants) ──

fn resolve_url_to_image_source(image_ref: Option<ImageRef>) -> Option<GrokVideoImageSource> {
  match image_ref {
    None => None,
    Some(ImageRef::Url(url)) => Some(GrokVideoImageSource::Url(url)),
    Some(ImageRef::MediaFileToken(token)) => {
      info!(
        "grok_imagine_video: dropping MediaFileToken {:?} for start_frame — \
         Grok only accepts public URLs. Resolve the token to a URL upstream if needed.",
        token,
      );
      None
    }
  }
}

fn resolve_url_list_to_image_sources(list_ref: ImageListRef) -> Option<Vec<GrokVideoImageSource>> {
  match list_ref {
    ImageListRef::Urls(urls) if urls.is_empty() => None,
    ImageListRef::Urls(urls) => Some(urls.into_iter().map(GrokVideoImageSource::Url).collect()),
    ImageListRef::MediaFileTokens(tokens) => {
      info!(
        "grok_imagine_video: dropping {} MediaFileToken reference image(s) — \
         Grok only accepts public URLs. Resolve tokens to URLs upstream if needed.",
        tokens.len(),
      );
      None
    }
  }
}

fn count_image_list_ref(refs: &ImageListRef) -> usize {
  match refs {
    ImageListRef::Urls(v) => v.len(),
    ImageListRef::MediaFileTokens(v) => v.len(),
  }
}

// ── Drop-with-log helpers for fields Grok doesn't accept at all ──

fn log_and_drop_end_frame(end_frame: Option<ImageRef>) {
  if end_frame.is_some() {
    info!("grok_imagine_video: dropping end_frame — Grok doesn't support end-frame keyframes.");
  }
}

fn log_and_drop_reference_videos(refs: Option<VideoListRef>) {
  if let Some(refs) = refs {
    let count = match refs {
      VideoListRef::Urls(v) => v.len(),
      VideoListRef::MediaFileTokens(v) => v.len(),
    };
    info!(
      "grok_imagine_video: dropping {} reference video(s) — Grok doesn't accept reference videos.",
      count,
    );
  }
}

fn log_and_drop_reference_audio(refs: Option<AudioListRef>) {
  if let Some(refs) = refs {
    let count = match refs {
      AudioListRef::Urls(v) => v.len(),
      AudioListRef::MediaFileTokens(v) => v.len(),
    };
    info!(
      "grok_imagine_video: dropping {} reference audio clip(s) — Grok doesn't accept reference audio.",
      count,
    );
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::common_aspect_ratio::CommonAspectRatio;
  use crate::api::common_resolution::CommonResolution;
  use crate::api::common_video_model::CommonVideoModel;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::provider::Provider;
  use crate::api::video_list_ref::VideoListRef;
  use crate::api::audio_list_ref::AudioListRef;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

  // ── Field passthrough ──

  mod field_conversions {
    use super::*;

    #[test]
    fn prompt_passed_through() {
      let req = unwrap_request(make_builder(|b| { b.prompt = Some("test prompt".to_string()); }));
      assert_eq!(req.request.prompt, "test prompt");
    }

    #[test]
    fn duration_passed_through() {
      let req = unwrap_request(make_builder(|b| { b.duration_seconds = Some(8); }));
      assert_eq!(req.request.duration, Some(8));
    }

    #[test]
    fn duration_clamped_to_min() {
      let req = unwrap_request(make_builder(|b| { b.duration_seconds = Some(0); }));
      assert_eq!(req.request.duration, Some(1));
    }

    #[test]
    fn duration_clamped_to_max() {
      let req = unwrap_request(make_builder(|b| { b.duration_seconds = Some(99); }));
      assert_eq!(req.request.duration, Some(15));
    }

    #[test]
    fn duration_none_stays_none() {
      let req = unwrap_request(make_builder(|b| { b.duration_seconds = None; }));
      assert_eq!(req.request.duration, None);
    }
  }

  // ── Aspect ratio ──

  mod aspect_ratio_tests {
    use super::*;

    #[test]
    fn square() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(CommonAspectRatio::Square); }));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Square));
    }

    #[test]
    fn landscape_16x9() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(CommonAspectRatio::WideSixteenByNine); }));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Landscape16x9));
    }

    #[test]
    fn portrait_9x16() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(CommonAspectRatio::TallNineBySixteen); }));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Portrait9x16));
    }

    #[test]
    fn landscape_4x3() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(CommonAspectRatio::WideFourByThree); }));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Landscape4x3));
    }

    #[test]
    fn portrait_3x4() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(CommonAspectRatio::TallThreeByFour); }));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Portrait3x4));
    }

    #[test]
    fn landscape_3x2() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(CommonAspectRatio::WideThreeByTwo); }));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Landscape3x2));
    }

    #[test]
    fn portrait_2x3() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(CommonAspectRatio::TallTwoByThree); }));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Portrait2x3));
    }

    #[test]
    fn auto_maps_to_none() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(CommonAspectRatio::Auto); }));
      assert_eq!(req.request.aspect_ratio, None);
    }

    #[test]
    fn unsupported_wide_falls_back_to_16x9() {
      let req = unwrap_request(make_builder(|b| {
        b.aspect_ratio = Some(CommonAspectRatio::WideTwentyOneByNine);
      }));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Landscape16x9));
    }

    #[test]
    fn unsupported_tall_falls_back_to_9x16() {
      let req = unwrap_request(make_builder(|b| {
        b.aspect_ratio = Some(CommonAspectRatio::TallNineByTwentyOne);
      }));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Portrait9x16));
    }
  }

  // ── Resolution ──

  mod resolution_tests {
    use super::*;

    #[test]
    fn res_480p() {
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(CommonResolution::FourEightyP); }));
      assert_eq!(req.request.resolution, Some(GrokResolution::FourEightyP));
    }

    #[test]
    fn res_720p() {
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(CommonResolution::SevenTwentyP); }));
      assert_eq!(req.request.resolution, Some(GrokResolution::SevenTwentyP));
    }

    #[test]
    fn res_1080p_clamps_to_720p() {
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(CommonResolution::TenEightyP); }));
      assert_eq!(req.request.resolution, Some(GrokResolution::SevenTwentyP));
    }

    #[test]
    fn res_4k_clamps_to_720p() {
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(CommonResolution::FourK); }));
      assert_eq!(req.request.resolution, Some(GrokResolution::SevenTwentyP));
    }

    #[test]
    fn res_1k_bumps_to_480p() {
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(CommonResolution::OneK); }));
      assert_eq!(req.request.resolution, Some(GrokResolution::FourEightyP));
    }

    #[test]
    fn none_stays_none() {
      let req = unwrap_request(make_builder(|_| {}));
      assert!(req.request.resolution.is_none());
    }
  }

  // ── Image source plumbing (graceful — never errors) ──

  mod image_tests {
    use super::*;

    #[test]
    fn start_frame_url_becomes_image() {
      let req = unwrap_request(make_builder(|b| {
        b.start_frame = Some(ImageRef::Url("https://example.com/start.png".to_string()));
      }));
      match &req.request.image {
        Some(GrokVideoImageSource::Url(u)) => assert_eq!(u, "https://example.com/start.png"),
        other => panic!("expected Url variant, got {:?}", other),
      }
      assert!(req.request.reference_images.is_none());
    }

    #[test]
    fn start_frame_media_file_token_silently_dropped() {
      let req = unwrap_request(make_builder(|b| {
        b.start_frame = Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_test".to_string())));
      }));
      // Dropped, request still builds successfully with no image.
      assert!(req.request.image.is_none());
      assert!(req.request.reference_images.is_none());
    }

    #[test]
    fn reference_image_urls_passed_through() {
      let urls = vec!["https://example.com/a.png".to_string(), "https://example.com/b.png".to_string()];
      let req = unwrap_request(make_builder(|b| {
        b.reference_images = Some(ImageListRef::Urls(urls.clone()));
      }));
      let refs = req.request.reference_images.expect("reference_images should be set");
      assert_eq!(refs.len(), 2);
      assert!(req.request.image.is_none());
    }

    #[test]
    fn reference_image_tokens_silently_dropped() {
      let req = unwrap_request(make_builder(|b| {
        b.reference_images = Some(ImageListRef::MediaFileTokens(vec![
          MediaFileToken::new("mf_a".to_string()),
          MediaFileToken::new("mf_b".to_string()),
        ]));
      }));
      // All tokens dropped; reference_images becomes None.
      assert!(req.request.reference_images.is_none());
      assert!(req.request.image.is_none());
    }

    #[test]
    fn start_frame_and_reference_images_together_prefers_start_frame() {
      let req = unwrap_request(make_builder(|b| {
        b.start_frame = Some(ImageRef::Url("https://example.com/start.png".to_string()));
        b.reference_images = Some(ImageListRef::Urls(vec![
          "https://example.com/ref1.png".to_string(),
          "https://example.com/ref2.png".to_string(),
        ]));
      }));
      // start_frame wins; reference_images dropped (mutually exclusive on the wire).
      match &req.request.image {
        Some(GrokVideoImageSource::Url(u)) => assert_eq!(u, "https://example.com/start.png"),
        other => panic!("expected start_frame URL, got {:?}", other),
      }
      assert!(req.request.reference_images.is_none());
    }

    #[test]
    fn empty_reference_image_url_list_becomes_none() {
      let req = unwrap_request(make_builder(|b| {
        b.reference_images = Some(ImageListRef::Urls(vec![]));
      }));
      assert!(req.request.reference_images.is_none());
    }
  }

  // ── Unsupported fields are silently dropped, not rejected ──

  mod unsupported_fields_graceful {
    use super::*;

    #[test]
    fn end_frame_silently_dropped() {
      let req = unwrap_request(make_builder(|b| {
        b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
      }));
      // Request still builds; Grok's request body has no end_frame field.
      assert!(req.request.image.is_none());
      assert!(req.request.reference_images.is_none());
    }

    #[test]
    fn reference_videos_silently_dropped() {
      let req = unwrap_request(make_builder(|b| {
        b.reference_videos = Some(VideoListRef::Urls(vec!["https://example.com/v.mp4".to_string()]));
      }));
      assert!(req.request.reference_images.is_none());
    }

    #[test]
    fn reference_audio_silently_dropped() {
      let req = unwrap_request(make_builder(|b| {
        b.reference_audio = Some(AudioListRef::Urls(vec!["https://example.com/a.wav".to_string()]));
      }));
      // No audio field on Grok; just gone.
      assert!(req.request.reference_images.is_none());
    }

    #[test]
    fn kitchen_sink_with_every_unsupported_field_still_succeeds() {
      // Worst-case builder fanned out from a multi-provider context. Grok
      // should keep what it can and drop the rest without erroring.
      let req = unwrap_request(make_builder(|b| {
        b.prompt = Some("kitchen sink".to_string());
        b.start_frame = Some(ImageRef::Url("https://example.com/start.png".to_string()));
        b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
        b.reference_images = Some(ImageListRef::Urls(vec![
          "https://example.com/ref.png".to_string(),
        ]));
        b.reference_videos = Some(VideoListRef::Urls(vec!["https://example.com/v.mp4".to_string()]));
        b.reference_audio = Some(AudioListRef::Urls(vec!["https://example.com/a.wav".to_string()]));
        b.resolution = Some(CommonResolution::SevenTwentyP);
        b.aspect_ratio = Some(CommonAspectRatio::WideSixteenByNine);
        b.duration_seconds = Some(8);
      }));
      // Kept: prompt + start_frame + resolution + aspect_ratio + duration.
      assert_eq!(req.request.prompt, "kitchen sink");
      assert!(matches!(
        req.request.image,
        Some(GrokVideoImageSource::Url(_))
      ));
      // Dropped because start_frame won the image-source contest.
      assert!(req.request.reference_images.is_none());
      assert_eq!(req.request.resolution, Some(GrokResolution::SevenTwentyP));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Landscape16x9));
      assert_eq!(req.request.duration, Some(8));
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::GrokImagineVideo,
      provider: Provider::GrokApi,
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      ..Default::default()
    }
  }

  fn make_builder(f: impl FnOnce(&mut GenerateVideoRequestBuilder)) -> GenerateVideoRequestBuilder {
    let mut b = base_builder();
    f(&mut b);
    b
  }

  fn unwrap_request(builder: GenerateVideoRequestBuilder) -> GrokApiGrokImagineVideoRequestState {
    let result = build_grok_api_grok_imagine_video(builder).expect("build should succeed");
    match result {
      VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::GrokApiGrokImagineVideo(s)) => s,
      _ => panic!("expected GrokApiGrokImagineVideo request"),
    }
  }
}
