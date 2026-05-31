use log::info;

use grok_api_client::api::requests::videos::video_generation::video_generation::{
  VideoGenerationRequest as GrokVideoGenerationRequest,
  VideoImageSource as GrokVideoImageSource,
};
use grok_api_client::api::types::video_types::video_aspect_ratio::VideoAspectRatio as GrokAspectRatio;
use grok_api_client::api::types::video_types::video_model::VideoModel as GrokVideoModel;
use grok_api_client::api::types::video_types::video_resolution::VideoResolution as GrokResolution;

use crate::api::audio_list_ref::AudioListRef;
use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_resolution::RouterResolution;
use crate::api::image_list_ref::ImageListRef;
use crate::api::image_ref::ImageRef;
use crate::api::video_list_ref::VideoListRef;
use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video_v2::providers::grok_api::grok_imagine_video_1p5::request::GrokApiGrokImagineVideo1p5RequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

/// Builds a Grok Imagine Video 1.5 preview request from the generic
/// GenerateVideoRequestBuilder. Mirrors the v1 builder's capabilities and
/// graceful-drop policy (the 1.5 model accepts the same wire shape as v1);
/// the only material differences are the `model` identifier on the wire and
/// the steeper pricing in the cost calculator (see `cost.rs`).
///
/// xAI's grok-imagine-video-1.5-preview accepts:
/// - `image` (single source image, image-to-video mode) OR `reference_images`
///   (multi-image reference-to-video). These two are mutually exclusive per
///   xAI's API.
/// - Aspect ratio, resolution (480p/720p), duration (1–15s), prompt.
///
/// Fields that Grok DOESN'T accept (`end_frame`, `reference_videos`,
/// `reference_audio`, and `MediaFileToken`-style image refs) are silently
/// dropped with an info-level log.
pub fn build_grok_api_grok_imagine_video_1p5(
  mut builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  // Scalar fields.
  let prompt = builder.prompt.take().unwrap_or_default();
  let aspect_ratio = plan_aspect_ratio(builder.aspect_ratio.take(), strategy);
  let resolution = plan_resolution(builder.resolution.take(), strategy);
  let duration = builder.duration_seconds.take().map(|d| (d as u32).clamp(1, 15));

  log_and_drop_end_frame(builder.end_frame.take());
  log_and_drop_reference_videos(builder.reference_videos.take());
  log_and_drop_reference_audio(builder.reference_audio.take());

  let start_frame = resolve_url_to_image_source(builder.start_frame.take());
  let reference_images_supplied = builder.reference_images.take();

  // xAI's v1.5 model explicitly does NOT accept `reference_images` (it only
  // supports text-to-video and single-image-to-video). If the caller supplies
  // reference images and no start_frame, promote the first reference image
  // into `image` (image-to-video) and drop the rest.
  let (image, reference_images) = match (start_frame, reference_images_supplied) {
    (Some(img), Some(refs)) => {
      info!(
        "grok_imagine_video_1p5: both start_frame and reference_images supplied — \
         preferring start_frame (image-to-video). Dropping {} reference image(s).",
        count_image_list_ref(&refs),
      );
      (Some(img), None)
    }
    (Some(img), None) => (Some(img), None),
    (None, Some(refs)) => promote_first_reference_to_image(refs),
    (None, None) => (None, None),
  };

  let request = GrokVideoGenerationRequest {
    prompt,
    // Pin to the 1.5 preview identifier so the grok_api_client cost
    // calculator picks the v1.5 pricing tier (see VideoModel::pricing_tier).
    model: Some(GrokVideoModel::GrokImagineVideo1p5Preview),
    image,
    reference_images,
    aspect_ratio,
    duration,
    resolution,
    user: None,
  };

  let state = GrokApiGrokImagineVideo1p5RequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(
    VideoGenerationRequest::GrokApiGrokImagineVideo1p5(state),
  ))
}

// ── Field planners ──

fn plan_aspect_ratio(
  aspect_ratio: Option<RouterAspectRatio>,
  _strategy: RequestMismatchMitigationStrategy,
) -> Option<GrokAspectRatio> {
  match aspect_ratio {
    None
    | Some(RouterAspectRatio::Auto)
    | Some(RouterAspectRatio::Auto2k)
    | Some(RouterAspectRatio::Auto3k)
    | Some(RouterAspectRatio::Auto4k) => None,

    Some(RouterAspectRatio::Square) | Some(RouterAspectRatio::SquareHd) => {
      Some(GrokAspectRatio::Square)
    }

    Some(RouterAspectRatio::WideSixteenByNine) | Some(RouterAspectRatio::Wide) => {
      Some(GrokAspectRatio::Landscape16x9)
    }
    Some(RouterAspectRatio::TallNineBySixteen) | Some(RouterAspectRatio::Tall) => {
      Some(GrokAspectRatio::Portrait9x16)
    }

    Some(RouterAspectRatio::WideFourByThree) => Some(GrokAspectRatio::Landscape4x3),
    Some(RouterAspectRatio::TallThreeByFour) => Some(GrokAspectRatio::Portrait3x4),

    Some(RouterAspectRatio::WideThreeByTwo) => Some(GrokAspectRatio::Landscape3x2),
    Some(RouterAspectRatio::TallTwoByThree) => Some(GrokAspectRatio::Portrait2x3),

    Some(RouterAspectRatio::WideFiveByFour)
    | Some(RouterAspectRatio::WideTwentyOneByNine) => Some(GrokAspectRatio::Landscape16x9),
    Some(RouterAspectRatio::TallFourByFive)
    | Some(RouterAspectRatio::TallNineByTwentyOne) => Some(GrokAspectRatio::Portrait9x16),
  }
}

fn plan_resolution(
  resolution: Option<RouterResolution>,
  _strategy: RequestMismatchMitigationStrategy,
) -> Option<GrokResolution> {
  match resolution {
    None => None,
    Some(RouterResolution::FourEightyP) => Some(GrokResolution::FourEightyP),
    Some(RouterResolution::SevenTwentyP) => Some(GrokResolution::SevenTwentyP),
    Some(RouterResolution::TenEightyP)
    | Some(RouterResolution::TwoK)
    | Some(RouterResolution::ThreeK)
    | Some(RouterResolution::FourK) => Some(GrokResolution::SevenTwentyP),
    Some(RouterResolution::HalfK) | Some(RouterResolution::OneK) => {
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
        "grok_imagine_video_1p5: dropping MediaFileToken {:?} for start_frame — \
         Grok only accepts public URLs. Resolve the token to a URL upstream if needed.",
        token,
      );
      None
    }
  }
}

/// xAI's v1.5 model rejects `reference_images` entirely. When a caller has
/// only supplied reference images (no start_frame), promote the first one
/// to `image` so they at least get image-to-video, and drop the remainder
/// with a log so it's visible in operator traces.
fn promote_first_reference_to_image(
  list_ref: ImageListRef,
) -> (Option<GrokVideoImageSource>, Option<Vec<GrokVideoImageSource>>) {
  match list_ref {
    ImageListRef::Urls(urls) if urls.is_empty() => (None, None),
    ImageListRef::Urls(mut urls) => {
      let first_url = urls.remove(0);
      let dropped = urls.len();
      if dropped > 0 {
        info!(
          "grok_imagine_video_1p5: v1.5 doesn't accept reference_images; promoting \
           the first reference image to start_frame (image-to-video). Dropping {} \
           additional reference image(s).",
          dropped,
        );
      } else {
        info!(
          "grok_imagine_video_1p5: v1.5 doesn't accept reference_images; promoting \
           the single reference image to start_frame (image-to-video).",
        );
      }
      (Some(GrokVideoImageSource::Url(first_url)), None)
    }
    ImageListRef::MediaFileTokens(tokens) => {
      info!(
        "grok_imagine_video_1p5: dropping {} MediaFileToken reference image(s) — \
         Grok only accepts public URLs. Resolve tokens to URLs upstream if needed.",
        tokens.len(),
      );
      (None, None)
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
    info!("grok_imagine_video_1p5: dropping end_frame — Grok doesn't support end-frame keyframes.");
  }
}

fn log_and_drop_reference_videos(refs: Option<VideoListRef>) {
  if let Some(refs) = refs {
    let count = match refs {
      VideoListRef::Urls(v) => v.len(),
      VideoListRef::MediaFileTokens(v) => v.len(),
    };
    info!(
      "grok_imagine_video_1p5: dropping {} reference video(s) — Grok doesn't accept reference videos.",
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
      "grok_imagine_video_1p5: dropping {} reference audio clip(s) — Grok doesn't accept reference audio.",
      count,
    );
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use tokens::tokens::media_files::MediaFileToken;

  use crate::api::router_aspect_ratio::RouterAspectRatio;
  use crate::api::router_resolution::RouterResolution;
  use crate::api::router_video_model::RouterVideoModel;
  use crate::api::image_list_ref::ImageListRef;
  use crate::api::image_ref::ImageRef;
  use crate::api::router_provider::RouterProvider;
  use crate::api::video_list_ref::VideoListRef;
  use crate::api::audio_list_ref::AudioListRef;
  use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
  use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
  use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

  // ── Wire-shape: the built request always carries the 1.5 preview model id ──

  mod model_id {
    use super::*;

    #[test]
    fn built_request_pins_grok_imagine_video_1p5_preview() {
      let req = unwrap_request(make_builder(|_| {}));
      assert_eq!(
        req.request.model,
        Some(GrokVideoModel::GrokImagineVideo1p5Preview),
      );
    }

    #[test]
    fn built_request_serializes_canonical_wire_name() {
      // The on-wire model string is the canonical name; the v1.5 cost
      // calculator in grok_api_client keys off this string.
      let req = unwrap_request(make_builder(|_| {}));
      let model = req.request.model.as_ref().expect("model should be set");
      assert_eq!(model.as_str(), "grok-imagine-video-1.5-preview");
    }
  }

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
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(RouterAspectRatio::Square); }));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Square));
    }

    #[test]
    fn landscape_16x9() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(RouterAspectRatio::WideSixteenByNine); }));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Landscape16x9));
    }

    #[test]
    fn portrait_9x16() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(RouterAspectRatio::TallNineBySixteen); }));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Portrait9x16));
    }

    #[test]
    fn landscape_4x3() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(RouterAspectRatio::WideFourByThree); }));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Landscape4x3));
    }

    #[test]
    fn portrait_3x4() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(RouterAspectRatio::TallThreeByFour); }));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Portrait3x4));
    }

    #[test]
    fn landscape_3x2() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(RouterAspectRatio::WideThreeByTwo); }));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Landscape3x2));
    }

    #[test]
    fn portrait_2x3() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(RouterAspectRatio::TallTwoByThree); }));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Portrait2x3));
    }

    #[test]
    fn auto_maps_to_none() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(RouterAspectRatio::Auto); }));
      assert_eq!(req.request.aspect_ratio, None);
    }

    #[test]
    fn unsupported_wide_falls_back_to_16x9() {
      let req = unwrap_request(make_builder(|b| {
        b.aspect_ratio = Some(RouterAspectRatio::WideTwentyOneByNine);
      }));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Landscape16x9));
    }

    #[test]
    fn unsupported_tall_falls_back_to_9x16() {
      let req = unwrap_request(make_builder(|b| {
        b.aspect_ratio = Some(RouterAspectRatio::TallNineByTwentyOne);
      }));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Portrait9x16));
    }
  }

  // ── Resolution ──

  mod resolution_tests {
    use super::*;

    #[test]
    fn res_480p() {
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(RouterResolution::FourEightyP); }));
      assert_eq!(req.request.resolution, Some(GrokResolution::FourEightyP));
    }

    #[test]
    fn res_720p() {
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(RouterResolution::SevenTwentyP); }));
      assert_eq!(req.request.resolution, Some(GrokResolution::SevenTwentyP));
    }

    #[test]
    fn res_1080p_clamps_to_720p() {
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(RouterResolution::TenEightyP); }));
      assert_eq!(req.request.resolution, Some(GrokResolution::SevenTwentyP));
    }

    #[test]
    fn res_4k_clamps_to_720p() {
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(RouterResolution::FourK); }));
      assert_eq!(req.request.resolution, Some(GrokResolution::SevenTwentyP));
    }

    #[test]
    fn res_1k_bumps_to_480p() {
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(RouterResolution::OneK); }));
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
      assert!(req.request.image.is_none());
      assert!(req.request.reference_images.is_none());
    }

    #[test]
    fn multiple_reference_image_urls_promote_first_and_drop_rest() {
      // xAI's v1.5 model rejects `reference_images`. The builder promotes the
      // first reference to `image` and drops the remainder.
      let urls = vec![
        "https://example.com/a.png".to_string(),
        "https://example.com/b.png".to_string(),
        "https://example.com/c.png".to_string(),
      ];
      let req = unwrap_request(make_builder(|b| {
        b.reference_images = Some(ImageListRef::Urls(urls.clone()));
      }));
      assert!(
        req.request.reference_images.is_none(),
        "reference_images must be None (xAI v1.5 rejects them)",
      );
      match &req.request.image {
        Some(GrokVideoImageSource::Url(u)) => assert_eq!(u, "https://example.com/a.png"),
        other => panic!("expected first reference image promoted to `image`, got {:?}", other),
      }
    }

    #[test]
    fn single_reference_image_url_promotes_to_image() {
      let req = unwrap_request(make_builder(|b| {
        b.reference_images = Some(ImageListRef::Urls(vec![
          "https://example.com/only.png".to_string(),
        ]));
      }));
      assert!(req.request.reference_images.is_none());
      match &req.request.image {
        Some(GrokVideoImageSource::Url(u)) => assert_eq!(u, "https://example.com/only.png"),
        other => panic!("expected single reference promoted to `image`, got {:?}", other),
      }
    }

    /// Replicates the production failure from 2026-05-31: storyteller-web
    /// received `reference_image_media_tokens: [..., ...]` and routed it to
    /// the v1.5 model, which rejected the request with
    /// `reference_images is not supported for this model`. After the
    /// promote-first fix, the resolved URLs go into `image` instead.
    #[test]
    fn reproduces_2026_05_31_two_ref_image_urls_no_start_frame() {
      let req = unwrap_request(make_builder(|b| {
        // Two URLs (the storyteller-web pipeline resolves media tokens to URLs
        // before calling build2() on the GrokApi provider).
        b.reference_images = Some(ImageListRef::Urls(vec![
          "https://pub.example.com/media/a.png".to_string(),
          "https://pub.example.com/media/b.png".to_string(),
        ]));
        b.start_frame = None;
        b.resolution = Some(RouterResolution::SevenTwentyP);
        b.aspect_ratio = Some(RouterAspectRatio::WideSixteenByNine);
        b.duration_seconds = Some(5);
      }));
      // The fix: no `reference_images` ever reach xAI for v1.5.
      assert!(
        req.request.reference_images.is_none(),
        "v1.5 must never send reference_images to xAI",
      );
      // The first reference is preserved as image-to-video so the user still
      // gets a sensible result.
      assert!(matches!(req.request.image, Some(GrokVideoImageSource::Url(_))));
      assert_eq!(req.request.resolution, Some(GrokResolution::SevenTwentyP));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Landscape16x9));
      assert_eq!(req.request.duration, Some(5));
      assert_eq!(req.request.model, Some(GrokVideoModel::GrokImagineVideo1p5Preview));
    }

    #[test]
    fn reference_image_tokens_silently_dropped() {
      let req = unwrap_request(make_builder(|b| {
        b.reference_images = Some(ImageListRef::MediaFileTokens(vec![
          MediaFileToken::new("mf_a".to_string()),
          MediaFileToken::new("mf_b".to_string()),
        ]));
      }));
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
      assert!(req.request.reference_images.is_none());
    }

    #[test]
    fn kitchen_sink_with_every_unsupported_field_still_succeeds() {
      let req = unwrap_request(make_builder(|b| {
        b.prompt = Some("kitchen sink".to_string());
        b.start_frame = Some(ImageRef::Url("https://example.com/start.png".to_string()));
        b.end_frame = Some(ImageRef::Url("https://example.com/end.png".to_string()));
        b.reference_images = Some(ImageListRef::Urls(vec![
          "https://example.com/ref.png".to_string(),
        ]));
        b.reference_videos = Some(VideoListRef::Urls(vec!["https://example.com/v.mp4".to_string()]));
        b.reference_audio = Some(AudioListRef::Urls(vec!["https://example.com/a.wav".to_string()]));
        b.resolution = Some(RouterResolution::SevenTwentyP);
        b.aspect_ratio = Some(RouterAspectRatio::WideSixteenByNine);
        b.duration_seconds = Some(8);
      }));
      assert_eq!(req.request.prompt, "kitchen sink");
      assert!(matches!(
        req.request.image,
        Some(GrokVideoImageSource::Url(_))
      ));
      assert!(req.request.reference_images.is_none());
      assert_eq!(req.request.resolution, Some(GrokResolution::SevenTwentyP));
      assert_eq!(req.request.aspect_ratio, Some(GrokAspectRatio::Landscape16x9));
      assert_eq!(req.request.duration, Some(8));
      // Still pinned to the 1.5 model regardless of kitchen-sink inputs.
      assert_eq!(req.request.model, Some(GrokVideoModel::GrokImagineVideo1p5Preview));
    }
  }

  // ── Helpers ──

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::GrokImagineVideo1p5,
      provider: RouterProvider::GrokApi,
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

  fn unwrap_request(builder: GenerateVideoRequestBuilder) -> GrokApiGrokImagineVideo1p5RequestState {
    let result = build_grok_api_grok_imagine_video_1p5(builder).expect("build should succeed");
    match result {
      VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::GrokApiGrokImagineVideo1p5(s)) => s,
      _ => panic!("expected GrokApiGrokImagineVideo1p5 request"),
    }
  }
}
