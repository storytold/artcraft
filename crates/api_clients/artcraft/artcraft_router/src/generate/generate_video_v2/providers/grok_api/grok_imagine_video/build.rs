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
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::grok_api::grok_imagine_video::request::GrokApiGrokImagineVideoRequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

/// Builds a Grok Imagine Video request from the generic GenerateVideoRequestBuilder.
///
/// xAI's grok-imagine-video accepts:
/// - `image` (single source image, image-to-video mode) OR `reference_images` (multi-image reference-to-video).
/// - These two are mutually exclusive per xAI's API; supplying both returns a BadRequest.
///
/// This binding rejects `end_frame`, `reference_videos`, and `reference_audio` since
/// xAI doesn't support them.
pub fn build_grok_api_grok_imagine_video(
  mut builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // Plan the simple/scalar fields first.
  let prompt = builder.prompt.take().unwrap_or_default();
  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio.take(), strategy)?;
  let resolution = plan_resolution(builder.resolution.take(), strategy)?;
  let duration = builder.duration_seconds.take().map(|d| (d as u32).clamp(1, 15));

  // start_frame → image-to-video; end_frame isn't supported.
  let image = resolve_url_to_image_source(builder.start_frame.take())?;
  if let Some(end_frame) = builder.end_frame.take() {
    let _ = end_frame; // referenced for the error message below.
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "end_frame",
      value: "Grok Imagine Video does not support end-frame keyframes".to_string(),
    }));
  }

  // reference_images → reference-to-video. Mutually exclusive with `image`.
  let reference_images = resolve_url_list_to_image_sources(builder.reference_images.take())?;
  if image.is_some() && reference_images.as_ref().is_some_and(|v| !v.is_empty()) {
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "start_frame + reference_images",
      value: "Grok Imagine Video accepts either `start_frame` (image-to-video) OR \
              `reference_images` (reference-to-video), not both".to_string(),
    }));
  }

  // Grok doesn't ingest video or audio references.
  if let Some(videos) = builder.reference_videos.take() {
    let _ = videos;
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "reference_videos",
      value: "Grok Imagine Video does not accept reference videos".to_string(),
    }));
  }
  if let Some(audio) = builder.reference_audio.take() {
    let _ = audio;
    return Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
      field: "reference_audio",
      value: "Grok Imagine Video does not accept reference audio".to_string(),
    }));
  }

  let request = GrokVideoGenerationRequest {
    prompt,
    model: None,                   // defaults to grok-imagine-video in the client
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
) -> Result<Option<GrokAspectRatio>, ArtcraftRouterError> {
  // xAI supports exactly: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3.
  // Auto / unsupported ratios fall back to the closest match (or None → xAI default 16:9).
  match aspect_ratio {
    None
    | Some(CommonAspectRatio::Auto)
    | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto3k)
    | Some(CommonAspectRatio::Auto4k) => Ok(None),

    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => {
      Ok(Some(GrokAspectRatio::Square))
    }

    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => {
      Ok(Some(GrokAspectRatio::Landscape16x9))
    }
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => {
      Ok(Some(GrokAspectRatio::Portrait9x16))
    }

    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(GrokAspectRatio::Landscape4x3)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(GrokAspectRatio::Portrait3x4)),

    Some(CommonAspectRatio::WideThreeByTwo) => Ok(Some(GrokAspectRatio::Landscape3x2)),
    Some(CommonAspectRatio::TallTwoByThree) => Ok(Some(GrokAspectRatio::Portrait2x3)),

    // No exact xAI match — pick the closest cardinal direction. Mild
    // information loss, but better than failing the request.
    Some(CommonAspectRatio::WideFiveByFour)
    | Some(CommonAspectRatio::WideTwentyOneByNine) => Ok(Some(GrokAspectRatio::Landscape16x9)),
    Some(CommonAspectRatio::TallFourByFive)
    | Some(CommonAspectRatio::TallNineByTwentyOne) => Ok(Some(GrokAspectRatio::Portrait9x16)),
  }
}

fn plan_resolution(
  resolution: Option<CommonResolution>,
  _strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<GrokResolution>, ArtcraftRouterError> {
  // Grok supports 480p and 720p only (1080p is downsized to 720p per xAI docs).
  match resolution {
    None => Ok(None),
    Some(CommonResolution::FourEightyP) => Ok(Some(GrokResolution::FourEightyP)),
    Some(CommonResolution::SevenTwentyP) => Ok(Some(GrokResolution::SevenTwentyP)),
    // Higher-than-720p requests get clamped to 720p (Grok's cap).
    Some(CommonResolution::TenEightyP)
    | Some(CommonResolution::TwoK)
    | Some(CommonResolution::ThreeK)
    | Some(CommonResolution::FourK) => Ok(Some(GrokResolution::SevenTwentyP)),
    // Lower-than-480p requests get bumped to 480p (Grok's floor).
    Some(CommonResolution::HalfK) | Some(CommonResolution::OneK) => {
      Ok(Some(GrokResolution::FourEightyP))
    }
  }
}

// ── Image source resolvers ──

fn resolve_url_to_image_source(
  image_ref: Option<ImageRef>,
) -> Result<Option<GrokVideoImageSource>, ArtcraftRouterError> {
  match image_ref {
    None => Ok(None),
    Some(ImageRef::Url(url)) => Ok(Some(GrokVideoImageSource::Url(url))),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "start_frame",
        value: "Grok Imagine Video only accepts image URLs, not media file tokens".to_string(),
      }))
    }
  }
}

fn resolve_url_list_to_image_sources(
  list_ref: Option<ImageListRef>,
) -> Result<Option<Vec<GrokVideoImageSource>>, ArtcraftRouterError> {
  match list_ref {
    None => Ok(None),
    Some(ImageListRef::Urls(urls)) => {
      Ok(Some(urls.into_iter().map(GrokVideoImageSource::Url).collect()))
    }
    Some(ImageListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "reference_images",
        value: "Grok Imagine Video only accepts image URLs, not media file tokens".to_string(),
      }))
    }
  }
}

// `reference_videos` and `reference_audio` resolvers exist only to consume
// the values for a clean error message; both reject any non-None input.
#[allow(dead_code)]
fn reject_video_refs(_refs: Option<VideoListRef>) -> Result<(), ArtcraftRouterError> {
  Ok(())
}
#[allow(dead_code)]
fn reject_audio_refs(_refs: Option<AudioListRef>) -> Result<(), ArtcraftRouterError> {
  Ok(())
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

  // ── Image source plumbing ──

  mod image_tests {
    use super::*;

    #[test]
    fn start_frame_url_becomes_image() {
      let req = unwrap_request(make_builder(|b| {
        b.start_frame = Some(ImageRef::Url("https://example.com/start.png".to_string()));
      }));
      match req.request.image {
        Some(GrokVideoImageSource::Url(u)) => assert_eq!(u, "https://example.com/start.png"),
        other => panic!("expected Url variant, got {:?}", other),
      }
      assert!(req.request.reference_images.is_none());
    }

    #[test]
    fn start_frame_media_file_token_rejected() {
      let result = build_grok_api_grok_imagine_video(GenerateVideoRequestBuilder {
        start_frame: Some(ImageRef::MediaFileToken(MediaFileToken::new("mf_test".to_string()))),
        ..base_builder()
      });
      assert!(result.is_err());
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
    fn reference_image_tokens_rejected() {
      let result = build_grok_api_grok_imagine_video(GenerateVideoRequestBuilder {
        reference_images: Some(ImageListRef::MediaFileTokens(vec![MediaFileToken::new("mf_a".to_string())])),
        ..base_builder()
      });
      assert!(result.is_err());
    }

    #[test]
    fn start_frame_and_reference_images_together_rejected() {
      let result = build_grok_api_grok_imagine_video(GenerateVideoRequestBuilder {
        start_frame: Some(ImageRef::Url("u".to_string())),
        reference_images: Some(ImageListRef::Urls(vec!["v".to_string()])),
        ..base_builder()
      });
      assert!(result.is_err(), "expected rejection of mutually-exclusive image + reference_images");
    }
  }

  // ── Unsupported features ──

  mod unsupported_features {
    use super::*;

    #[test]
    fn end_frame_rejected() {
      let result = build_grok_api_grok_imagine_video(GenerateVideoRequestBuilder {
        end_frame: Some(ImageRef::Url("u".to_string())),
        ..base_builder()
      });
      assert!(result.is_err());
    }

    #[test]
    fn reference_videos_rejected() {
      let result = build_grok_api_grok_imagine_video(GenerateVideoRequestBuilder {
        reference_videos: Some(VideoListRef::Urls(vec!["v".to_string()])),
        ..base_builder()
      });
      assert!(result.is_err());
    }

    #[test]
    fn reference_audio_rejected() {
      let result = build_grok_api_grok_imagine_video(GenerateVideoRequestBuilder {
        reference_audio: Some(AudioListRef::Urls(vec!["a.wav".to_string()])),
        ..base_builder()
      });
      assert!(result.is_err());
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
