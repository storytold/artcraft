use crate::api::requests::videos::video_generation::video_generation::VideoGenerationRequest;
use crate::api::traits::grok_request_cost_calculator_trait::{GrokRequestCostCalculator, UsdMills};
use crate::api::types::video_types::video_resolution::VideoResolution;

// xAI pricing per <https://docs.x.ai/developers/pricing>:
//
//   grok-imagine-video
//     Output:  480p $0.05/sec, 720p $0.07/sec
//     Input:   $0.01/sec (source video) + $0.002/img (source images)
//
// In mills (1¢ = 10 mills):
//
//   Output:  480p 50 mills/sec, 720p 70 mills/sec
//   Input:   10 mills/sec (video), 2 mills/img (per source image)
//
// video_generation has NO input video — only optional input images. xAI
// defaults: `duration` = 8 seconds, `resolution` = "480p".

/// xAI default duration for video_generation when `duration` is omitted.
pub(crate) const DEFAULT_VIDEO_DURATION_SECONDS: u32 = 8;

/// Per-source-image input rate for video endpoints, in mills.
pub(crate) const INPUT_MILLS_PER_IMAGE: UsdMills = 2;

/// Per-source-second input rate (when a source video is supplied) for video
/// endpoints, in mills. Not used by `video_generation` (which has no source
/// video) but referenced by `video_edit` and `video_extension`.
pub(crate) const INPUT_MILLS_PER_SECOND_OF_SOURCE_VIDEO: UsdMills = 10;

impl GrokRequestCostCalculator for VideoGenerationRequest {
  fn calculate_cost_in_mills(&self) -> UsdMills {
    let duration = self.duration.unwrap_or(DEFAULT_VIDEO_DURATION_SECONDS) as u64;
    let resolution = self.resolution.unwrap_or(VideoResolution::SevenTwentyP);

    let output_mills = output_mills_per_second(resolution) * duration;

    // Source image count = `image` (image-to-video) + len(`reference_images`)
    // (reference-to-video). These are mutually exclusive at call time but the
    // cost math doesn't need to enforce that — it just counts.
    let source_image_count: u64 =
      (self.image.is_some() as u64)
      + (self.reference_images.as_ref().map(|v| v.len() as u64).unwrap_or(0));

    let input_mills = INPUT_MILLS_PER_IMAGE * source_image_count;

    output_mills + input_mills
  }
}

/// Output rate in mills per second of generated video, by resolution.
pub(crate) fn output_mills_per_second(resolution: VideoResolution) -> UsdMills {
  match resolution {
    VideoResolution::FourEightyP  => 50,
    VideoResolution::SevenTwentyP => 70,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::requests::videos::video_generation::video_generation::VideoImageSource;
  use crate::api::types::video_types::video_aspect_ratio::VideoAspectRatio;
  use crate::api::types::video_types::video_model::VideoModel;

  fn make_request(
    duration: Option<u32>,
    resolution: Option<VideoResolution>,
    image: Option<VideoImageSource>,
    reference_images: Option<Vec<VideoImageSource>>,
  ) -> VideoGenerationRequest {
    VideoGenerationRequest {
      prompt: "test".to_string(),
      model: None,
      image,
      reference_images,
      aspect_ratio: None,
      duration,
      resolution,
      user: None,
    }
  }

  fn url_source() -> VideoImageSource {
    VideoImageSource::Url("https://example.com/img.png".to_string())
  }

  // ── Output rate sanity ──

  mod output_rate {
    use super::*;

    #[test]
    fn rate_480p_is_50_mills_per_sec() {
      assert_eq!(output_mills_per_second(VideoResolution::FourEightyP), 50);
    }

    #[test]
    fn rate_720p_is_70_mills_per_sec() {
      assert_eq!(output_mills_per_second(VideoResolution::SevenTwentyP), 70);
    }
  }

  // ── Pure text-to-video (no input images) ──

  mod text_to_video {
    use super::*;

    #[test]
    fn fully_default_is_8s_720p() {
      // Default duration 8s, default resolution 720p (per our defaults in cost.rs).
      // 70 × 8 = 560 mills = 56¢
      let req = make_request(None, None, None, None);
      assert_eq!(req.calculate_cost_in_mills(), 560);
      assert_eq!(req.calculate_cost_in_cents(), 56);
    }

    #[test]
    fn five_seconds_480p() {
      // 50 × 5 = 250 mills = 25¢
      let req = make_request(Some(5), Some(VideoResolution::FourEightyP), None, None);
      assert_eq!(req.calculate_cost_in_mills(), 250);
      assert_eq!(req.calculate_cost_in_cents(), 25);
    }

    #[test]
    fn five_seconds_720p() {
      // 70 × 5 = 350 mills = 35¢
      let req = make_request(Some(5), Some(VideoResolution::SevenTwentyP), None, None);
      assert_eq!(req.calculate_cost_in_mills(), 350);
      assert_eq!(req.calculate_cost_in_cents(), 35);
    }

    #[test]
    fn fifteen_seconds_720p_is_max_duration() {
      // 70 × 15 = 1050 mills = $1.05
      let req = make_request(Some(15), Some(VideoResolution::SevenTwentyP), None, None);
      assert_eq!(req.calculate_cost_in_mills(), 1050);
      assert_eq!(req.calculate_cost_in_cents(), 105);
    }
  }

  // ── Image-to-video (single source image) ──

  mod image_to_video {
    use super::*;

    #[test]
    fn five_seconds_480p_one_source_image() {
      // 50 × 5 + 2 × 1 = 252 mills = 26¢ (ceil)
      let req = make_request(Some(5), Some(VideoResolution::FourEightyP), Some(url_source()), None);
      assert_eq!(req.calculate_cost_in_mills(), 252);
      assert_eq!(req.calculate_cost_in_cents(), 26);
    }

    #[test]
    fn five_seconds_720p_one_source_image() {
      // 70 × 5 + 2 = 352 mills = 36¢ (ceil)
      let req = make_request(Some(5), Some(VideoResolution::SevenTwentyP), Some(url_source()), None);
      assert_eq!(req.calculate_cost_in_mills(), 352);
      assert_eq!(req.calculate_cost_in_cents(), 36);
    }
  }

  // ── Reference-to-video (multiple source images) ──

  mod reference_to_video {
    use super::*;

    #[test]
    fn five_seconds_720p_two_reference_images() {
      // 70 × 5 + 2 × 2 = 354 mills = 36¢ (ceil)
      let req = make_request(Some(5), Some(VideoResolution::SevenTwentyP), None, Some(vec![url_source(), url_source()]));
      assert_eq!(req.calculate_cost_in_mills(), 354);
      assert_eq!(req.calculate_cost_in_cents(), 36);
    }

    #[test]
    fn five_seconds_720p_three_reference_images() {
      // 70 × 5 + 2 × 3 = 356 mills
      let req = make_request(
        Some(5), Some(VideoResolution::SevenTwentyP),
        None, Some(vec![url_source(), url_source(), url_source()]),
      );
      assert_eq!(req.calculate_cost_in_mills(), 356);
    }

    #[test]
    fn input_image_count_scales_linearly() {
      let base = make_request(Some(5), Some(VideoResolution::SevenTwentyP), None, None).calculate_cost_in_mills();
      for n in 1usize..=5 {
        let imgs: Vec<_> = (0..n).map(|_| url_source()).collect();
        let req = make_request(Some(5), Some(VideoResolution::SevenTwentyP), None, Some(imgs));
        assert_eq!(req.calculate_cost_in_mills(), base + INPUT_MILLS_PER_IMAGE * n as u64, "n={n}");
      }
    }
  }

  // ── Defaults ──

  mod defaults {
    use super::*;

    #[test]
    fn default_duration_is_8_seconds() {
      let r1 = make_request(None, Some(VideoResolution::FourEightyP), None, None);
      let r2 = make_request(Some(8), Some(VideoResolution::FourEightyP), None, None);
      assert_eq!(r1.calculate_cost_in_mills(), r2.calculate_cost_in_mills());
    }

    #[test]
    fn default_resolution_is_720p() {
      let r1 = make_request(Some(5), None, None, None);
      let r2 = make_request(Some(5), Some(VideoResolution::SevenTwentyP), None, None);
      assert_eq!(r1.calculate_cost_in_mills(), r2.calculate_cost_in_mills());
    }
  }

  // ── Independence from non-pricing fields ──

  mod independence {
    use super::*;

    #[test]
    fn cost_is_independent_of_aspect_ratio() {
      let mut base = make_request(Some(5), Some(VideoResolution::FourEightyP), None, None);
      let base_cost = base.calculate_cost_in_mills();
      for ar in [
        VideoAspectRatio::Square,
        VideoAspectRatio::Landscape16x9,
        VideoAspectRatio::Portrait9x16,
        VideoAspectRatio::Portrait2x3,
      ] {
        base.aspect_ratio = Some(ar);
        assert_eq!(base.calculate_cost_in_mills(), base_cost, "{ar:?}");
      }
    }

    #[test]
    fn cost_is_independent_of_model_variant() {
      // All `model` enum variants map to the same pricing (only one video model).
      let mut base = make_request(Some(5), Some(VideoResolution::FourEightyP), None, None);
      let base_cost = base.calculate_cost_in_mills();
      for m in [
        VideoModel::GrokImagineVideo,
        VideoModel::Custom("grok-imagine-video-future".to_string()),
      ] {
        base.model = Some(m.clone());
        assert_eq!(base.calculate_cost_in_mills(), base_cost, "{:?}", m.as_str());
      }
    }
  }

  // ── Exhaustive matrix ──

  mod exhaustive_matrix {
    use super::*;

    // (duration_s, resolution, image_to_video_source, reference_image_count, expected_mills)
    const CASES: &[(u32, VideoResolution, bool, usize, u64)] = &[
      // 480p, no input images
      ( 1, VideoResolution::FourEightyP,  false, 0,   50),
      ( 5, VideoResolution::FourEightyP,  false, 0,  250),
      ( 8, VideoResolution::FourEightyP,  false, 0,  400),
      (15, VideoResolution::FourEightyP,  false, 0,  750),
      // 720p, no input images
      ( 1, VideoResolution::SevenTwentyP, false, 0,   70),
      ( 5, VideoResolution::SevenTwentyP, false, 0,  350),
      ( 8, VideoResolution::SevenTwentyP, false, 0,  560),
      (15, VideoResolution::SevenTwentyP, false, 0, 1050),
      // 480p with image-to-video source (1 input image)
      ( 5, VideoResolution::FourEightyP,  true,  0,  252),
      (10, VideoResolution::FourEightyP,  true,  0,  502),
      // 720p with image-to-video source (1 input image)
      ( 5, VideoResolution::SevenTwentyP, true,  0,  352),
      (10, VideoResolution::SevenTwentyP, true,  0,  702),
      // 480p with reference_images (no image-to-video)
      ( 5, VideoResolution::FourEightyP,  false, 1,  252),
      ( 5, VideoResolution::FourEightyP,  false, 2,  254),
      ( 5, VideoResolution::FourEightyP,  false, 3,  256),
      // 720p with reference_images
      ( 5, VideoResolution::SevenTwentyP, false, 1,  352),
      ( 5, VideoResolution::SevenTwentyP, false, 2,  354),
      ( 5, VideoResolution::SevenTwentyP, false, 3,  356),
    ];

    #[test]
    fn all_matrix_cases() {
      for &(duration, res, has_image, ref_count, expected) in CASES {
        let image = if has_image { Some(url_source()) } else { None };
        let refs = if ref_count > 0 {
          Some((0..ref_count).map(|_| url_source()).collect())
        } else { None };
        let req = make_request(Some(duration), Some(res), image, refs);
        assert_eq!(
          req.calculate_cost_in_mills(), expected,
          "duration={duration} res={res:?} has_image={has_image} ref_count={ref_count}",
        );
      }
    }
  }

  // ── Monotonicity ──

  mod monotonicity {
    use super::*;

    #[test]
    fn longer_duration_costs_more() {
      let short = make_request(Some(1), Some(VideoResolution::FourEightyP), None, None).calculate_cost_in_mills();
      let long  = make_request(Some(15), Some(VideoResolution::FourEightyP), None, None).calculate_cost_in_mills();
      assert!(short < long);
    }

    #[test]
    fn higher_resolution_costs_more() {
      let p480 = make_request(Some(8), Some(VideoResolution::FourEightyP), None, None).calculate_cost_in_mills();
      let p720 = make_request(Some(8), Some(VideoResolution::SevenTwentyP), None, None).calculate_cost_in_mills();
      assert!(p480 < p720);
    }

    #[test]
    fn more_reference_images_cost_more() {
      let zero  = make_request(Some(5), Some(VideoResolution::SevenTwentyP), None, None).calculate_cost_in_mills();
      let three = make_request(Some(5), Some(VideoResolution::SevenTwentyP), None,
        Some(vec![url_source(), url_source(), url_source()])).calculate_cost_in_mills();
      assert!(zero < three);
    }
  }
}
