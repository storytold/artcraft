use gmicloud_client::requests::api::video::seedance_2_0_260128::api::{
  Seedance20Ratio, Seedance20Request, Seedance20Resolution,
};

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
use crate::generate::generate_video_v2::providers::gmicloud::seedance_2p0_g::request::GmiCloudSeedance2p0GRequestState;
use crate::generate::generate_video_v2::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video_v2::video_generation_request::VideoGenerationRequest;

pub fn build_gmicloud_seedance_2p0_g(
  mut builder: GenerateVideoRequestBuilder,
) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let strategy = builder.request_mismatch_mitigation_strategy;

  let ratio = plan_ratio(builder.aspect_ratio.take(), strategy)?;
  let resolution = plan_resolution(builder.resolution.take(), strategy)?;
  let duration = builder.duration_seconds.take().map(|d| (d as u8).clamp(4, 15));
  let prompt = builder.prompt.take().unwrap_or_default();

  let first_frame = resolve_url(builder.start_frame.take())?;
  let last_frame = resolve_url(builder.end_frame.take())?;
  let reference_images = resolve_url_list_from_images(builder.reference_images.take())?;
  let reference_videos = resolve_url_list_from_videos(builder.reference_videos.take())?;
  let reference_audios = resolve_url_list_from_audios(builder.reference_audio.take())?;

  let request = Seedance20Request {
    prompt,
    duration,
    resolution,
    ratio,
    seed: None,
    watermark: Some(false),
    generate_audio: Some(true),
    web_search: None,
    first_frame,
    last_frame,
    reference_images,
    reference_videos,
    reference_audios,
    reference_asset_ids: None,
  };

  let state = GmiCloudSeedance2p0GRequestState { request };
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::GmiCloudSeedance2p0G(state)))
}

fn plan_ratio(
  aspect_ratio: Option<CommonAspectRatio>,
  _strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Seedance20Ratio>, ArtcraftRouterError> {
  match aspect_ratio {
    None | Some(CommonAspectRatio::Auto) | Some(CommonAspectRatio::Auto2k)
    | Some(CommonAspectRatio::Auto3k) | Some(CommonAspectRatio::Auto4k) => Ok(None),
    Some(CommonAspectRatio::WideSixteenByNine) | Some(CommonAspectRatio::Wide) => Ok(Some(Seedance20Ratio::Landscape16x9)),
    Some(CommonAspectRatio::TallNineBySixteen) | Some(CommonAspectRatio::Tall) => Ok(Some(Seedance20Ratio::Portrait9x16)),
    Some(CommonAspectRatio::Square) | Some(CommonAspectRatio::SquareHd) => Ok(Some(Seedance20Ratio::Square)),
    Some(CommonAspectRatio::WideFourByThree) => Ok(Some(Seedance20Ratio::Standard4x3)),
    Some(CommonAspectRatio::TallThreeByFour) => Ok(Some(Seedance20Ratio::Portrait3x4)),
    Some(CommonAspectRatio::WideTwentyOneByNine) | Some(CommonAspectRatio::TallNineByTwentyOne) => {
      Ok(Some(Seedance20Ratio::UltraWide21x9))
    }
    Some(CommonAspectRatio::WideThreeByTwo) | Some(CommonAspectRatio::WideFiveByFour)
    | Some(CommonAspectRatio::TallFourByFive) | Some(CommonAspectRatio::TallTwoByThree) => {
      Ok(Some(Seedance20Ratio::Adaptive))
    }
  }
}

fn plan_resolution(
  resolution: Option<CommonResolution>,
  _strategy: RequestMismatchMitigationStrategy,
) -> Result<Option<Seedance20Resolution>, ArtcraftRouterError> {
  match resolution {
    None => Ok(None),
    Some(CommonResolution::FourEightyP) => Ok(Some(Seedance20Resolution::FourEightyP)),
    Some(CommonResolution::SevenTwentyP) => Ok(Some(Seedance20Resolution::SevenTwentyP)),
    Some(CommonResolution::TenEightyP) => Ok(Some(Seedance20Resolution::TenEightyP)),
    Some(CommonResolution::HalfK) | Some(CommonResolution::OneK) => Ok(Some(Seedance20Resolution::FourEightyP)),
    Some(CommonResolution::TwoK) | Some(CommonResolution::ThreeK) | Some(CommonResolution::FourK) => {
      Ok(Some(Seedance20Resolution::TenEightyP))
    }
  }
}

fn resolve_url(image_ref: Option<ImageRef>) -> Result<Option<String>, ArtcraftRouterError> {
  match image_ref {
    None => Ok(None),
    Some(ImageRef::Url(url)) => Ok(Some(url)),
    Some(ImageRef::MediaFileToken(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "start_frame/end_frame",
        value: "GmiCloud only supports image URLs, not media file tokens".to_string(),
      }))
    }
  }
}

fn resolve_url_list_from_images(
  list_ref: Option<ImageListRef>,
) -> Result<Option<Vec<String>>, ArtcraftRouterError> {
  match list_ref {
    None => Ok(None),
    Some(ImageListRef::Urls(urls)) => Ok(Some(urls)),
    Some(ImageListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "reference_images",
        value: "GmiCloud only supports image URLs, not media file tokens".to_string(),
      }))
    }
  }
}

fn resolve_url_list_from_videos(
  list_ref: Option<VideoListRef>,
) -> Result<Option<Vec<String>>, ArtcraftRouterError> {
  match list_ref {
    None => Ok(None),
    Some(VideoListRef::Urls(urls)) => Ok(Some(urls)),
    Some(VideoListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "reference_videos",
        value: "GmiCloud only supports video URLs, not media file tokens".to_string(),
      }))
    }
  }
}

#[cfg(test)]
mod tests {
  use gmicloud_client::requests::api::video::seedance_2_0_260128::api::{
    Seedance20Ratio, Seedance20Resolution,
  };
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

  use super::*;

  mod field_conversions {
    use super::*;

    #[test]
    fn prompt_passed_through() {
      let req = unwrap_request(make_builder(|b| { b.prompt = Some("test prompt".to_string()); }));
      assert_eq!(req.request.prompt, "test prompt");
    }

    #[test]
    fn duration_passed_through() {
      let req = unwrap_request(make_builder(|b| { b.duration_seconds = Some(10); }));
      assert_eq!(req.request.duration, Some(10));
    }

    #[test]
    fn duration_clamped_to_min() {
      let req = unwrap_request(make_builder(|b| { b.duration_seconds = Some(1); }));
      assert_eq!(req.request.duration, Some(4));
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

  mod aspect_ratio_tests {
    use super::*;

    #[test]
    fn landscape_16x9() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(CommonAspectRatio::WideSixteenByNine); }));
      assert_eq!(req.request.ratio, Some(Seedance20Ratio::Landscape16x9));
    }

    #[test]
    fn portrait_9x16() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(CommonAspectRatio::TallNineBySixteen); }));
      assert_eq!(req.request.ratio, Some(Seedance20Ratio::Portrait9x16));
    }

    #[test]
    fn square() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(CommonAspectRatio::Square); }));
      assert_eq!(req.request.ratio, Some(Seedance20Ratio::Square));
    }

    #[test]
    fn four_by_three() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(CommonAspectRatio::WideFourByThree); }));
      assert_eq!(req.request.ratio, Some(Seedance20Ratio::Standard4x3));
    }

    #[test]
    fn unsupported_maps_to_adaptive() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(CommonAspectRatio::WideThreeByTwo); }));
      assert_eq!(req.request.ratio, Some(Seedance20Ratio::Adaptive));
    }

    #[test]
    fn auto_maps_to_none() {
      let req = unwrap_request(make_builder(|b| { b.aspect_ratio = Some(CommonAspectRatio::Auto); }));
      assert_eq!(req.request.ratio, None);
    }
  }

  mod resolution_tests {
    use super::*;

    #[test]
    fn res_480p() {
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(CommonResolution::FourEightyP); }));
      assert_eq!(req.request.resolution, Some(Seedance20Resolution::FourEightyP));
    }

    #[test]
    fn res_720p() {
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(CommonResolution::SevenTwentyP); }));
      assert_eq!(req.request.resolution, Some(Seedance20Resolution::SevenTwentyP));
    }

    #[test]
    fn res_1080p() {
      let req = unwrap_request(make_builder(|b| { b.resolution = Some(CommonResolution::TenEightyP); }));
      assert_eq!(req.request.resolution, Some(Seedance20Resolution::TenEightyP));
    }

    #[test]
    fn none_stays_none() {
      let req = unwrap_request(make_builder(|_| {}));
      assert!(req.request.resolution.is_none());
    }
  }

  mod media_url_tests {
    use super::*;

    #[test]
    fn start_frame_url_passed_through() {
      let req = unwrap_request(make_builder(|b| {
        b.start_frame = Some(ImageRef::Url("https://example.com/start.png".to_string()));
      }));
      assert_eq!(req.request.first_frame, Some("https://example.com/start.png".to_string()));
    }

    #[test]
    fn media_file_token_rejected_for_start_frame() {
      let result = build_gmicloud_seedance_2p0_g(GenerateVideoRequestBuilder {
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
      assert_eq!(req.request.reference_images, Some(urls));
    }

    #[test]
    fn reference_image_tokens_rejected() {
      let result = build_gmicloud_seedance_2p0_g(GenerateVideoRequestBuilder {
        reference_images: Some(ImageListRef::MediaFileTokens(vec![MediaFileToken::new("mf_a".to_string())])),
        ..base_builder()
      });
      assert!(result.is_err());
    }

    #[test]
    fn reference_video_urls_passed_through() {
      let urls = vec!["https://example.com/v.mp4".to_string()];
      let req = unwrap_request(make_builder(|b| {
        b.reference_videos = Some(VideoListRef::Urls(urls.clone()));
      }));
      assert_eq!(req.request.reference_videos, Some(urls));
    }

    #[test]
    fn reference_audio_urls_passed_through() {
      let urls = vec!["https://example.com/a.wav".to_string()];
      let req = unwrap_request(make_builder(|b| {
        b.reference_audio = Some(AudioListRef::Urls(urls.clone()));
      }));
      assert_eq!(req.request.reference_audios, Some(urls));
    }
  }

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: CommonVideoModel::Seedance2p0Global,
      provider: Provider::GmiCloud,
      duration_seconds: Some(5),
      video_batch_count: Some(1),
      ..Default::default()
    }
  }

  fn make_builder(f: impl FnOnce(&mut GenerateVideoRequestBuilder)) -> GenerateVideoRequestBuilder {
    let mut builder = base_builder();
    f(&mut builder);
    builder
  }

  fn unwrap_request(builder: GenerateVideoRequestBuilder) -> GmiCloudSeedance2p0GRequestState {
    let result = build_gmicloud_seedance_2p0_g(builder).expect("build should succeed");
    match result {
      VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::GmiCloudSeedance2p0G(state)) => state,
      _ => panic!("expected GmiCloudSeedance2p0G request"),
    }
  }
}

fn resolve_url_list_from_audios(
  list_ref: Option<AudioListRef>,
) -> Result<Option<Vec<String>>, ArtcraftRouterError> {
  match list_ref {
    None => Ok(None),
    Some(AudioListRef::Urls(urls)) => Ok(Some(urls)),
    Some(AudioListRef::MediaFileTokens(_)) => {
      Err(ArtcraftRouterError::Client(ClientError::ModelDoesNotSupportOption {
        field: "reference_audios",
        value: "GmiCloud only supports audio URLs, not media file tokens".to_string(),
      }))
    }
  }
}
