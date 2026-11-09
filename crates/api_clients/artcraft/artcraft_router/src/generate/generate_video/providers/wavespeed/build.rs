use wavespeed_client::{GenerateVideoRequest as GenerateVideoRequestWaveSpeed, VideoModel, VideoMode};
use crate::api::image_list_ref::ImageListRef;
use crate::api::video_list_ref::VideoListRef;
use crate::api::audio_list_ref::AudioListRef;

use crate::api::image_ref::ImageRef;
use crate::api::router_aspect_ratio::RouterAspectRatio;
use crate::api::router_resolution::RouterResolution;
use crate::api::router_video_model::RouterVideoModel;
use crate::errors::artcraft_router_error::ArtcraftRouterError;
use crate::errors::client_error::ClientError;
use crate::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use crate::generate::generate_video::providers::wavespeed::request::WaveSpeedVideoRequest;
use crate::generate::generate_video::video_generation_draft_or_request::VideoGenerationDraftOrRequest;
use crate::generate::generate_video::video_generation_request::VideoGenerationRequest;

pub fn build_wavespeed_video(builder: GenerateVideoRequestBuilder) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  let has_references = builder.reference_images.is_some() || builder.reference_videos.is_some() || builder.reference_audio.is_some();
  build_wavespeed_video_mode(builder, if has_references { VideoMode::Reference } else { VideoMode::Generate })
}

pub fn build_wavespeed_video_mode(builder: GenerateVideoRequestBuilder, mode: VideoMode) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  if mode != VideoMode::Generate {
    return build_advanced(builder, mode);
  }
  let model = map_model(builder.model)?;
  let prompt = builder.prompt.filter(|prompt| !prompt.trim().is_empty()).ok_or_else(|| ArtcraftRouterError::InvalidInput("WaveSpeed requires a video prompt".into()))?;
  let max_prompt_length = match model {
    VideoModel::MinimaxH3 => 7000,
    VideoModel::Seedance10Lite => 2000,
    VideoModel::Kling16Pro | VideoModel::Kling21Pro | VideoModel::Kling21Master | VideoModel::Kling2p5TurboPro => 2500,
    _ => usize::MAX,
  };
  if prompt.chars().count() > max_prompt_length {
    return Err(unsupported("prompt", "Prompt exceeds this WaveSpeed model's maximum length"));
  }
  if builder.video_batch_count.unwrap_or(1) != 1 {
    return Err(unsupported("video_batch_count", "WaveSpeed video endpoints accept one video per request"));
  }
  if builder.reference_images.is_some() || builder.reference_videos.is_some() || builder.reference_audio.is_some() || builder.reference_character_tokens.is_some() {
    return Err(unsupported("references", "Use starting and ending frames for WaveSpeed video generation"));
  }
  if builder.bitrate.is_some() {
    return Err(unsupported("bitrate", "WaveSpeed bitrate overrides are not supported"));
  }
  let maybe_image = image_url(builder.start_frame)?;
  let maybe_end = image_url(builder.end_frame)?;
  let editing = maybe_image.is_some();
  if model.endpoint(editing).is_none() {
    return Err(unsupported("start_frame", "This WaveSpeed model requires a starting image"));
  }
  if maybe_end.is_some() && (!editing || !model.supports_end_frame()) {
    return Err(unsupported("end_frame", "This WaveSpeed endpoint does not support an ending frame without a supported starting frame"));
  }
  let duration = builder.duration_seconds.unwrap_or(model.default_duration());
  if !model.durations().contains(&duration) {
    return Err(unsupported("duration_seconds", &format!("Unsupported duration {duration} for {model:?}")));
  }
  let mut request = GenerateVideoRequestWaveSpeed { prompt, duration, maybe_image, ..Default::default() };
  request.maybe_last_image = maybe_end;
  let resolution = resolution(model, builder.resolution)?;
  let ratio = aspect_ratio(model, builder.aspect_ratio, editing)?;
  match model {
    VideoModel::Sora2 | VideoModel::Sora2Pro => {
      if !editing {
        let portrait = ratio.as_deref() == Some("9:16");
        let high_resolution = resolution.as_deref() == Some("1080p");
        request.maybe_size = Some(
          match (portrait, high_resolution) {
            (false, false) => "1280*720",
            (true, false) => "720*1280",
            (false, true) => "1920*1080",
            (true, true) => "1080*1920",
          }
          .into(),
        );
      } else if model == VideoModel::Sora2Pro {
        request.maybe_resolution = resolution;
      }
    },
    VideoModel::Kling16Pro | VideoModel::Kling21Pro | VideoModel::Kling21Master | VideoModel::Kling2p5TurboPro | VideoModel::Kling2p6Pro | VideoModel::Kling3p0Standard | VideoModel::Kling3p0Pro => {
      if !editing {
        request.maybe_aspect_ratio = ratio;
      }
    },
    VideoModel::Seedance10Lite => {
      request.maybe_aspect_ratio = ratio;
    },
    VideoModel::Seedance2p5 | VideoModel::MinimaxH3 => {
      if !editing {
        request.maybe_aspect_ratio = ratio;
      }
      request.maybe_resolution = resolution;
    },
    _ => {
      if matches!(model, VideoModel::Veo3 | VideoModel::Veo3Fast | VideoModel::Veo3p1 | VideoModel::Veo3p1Fast) && resolution.as_deref() != Some("720p") && duration != 8 {
        return Err(unsupported("duration_seconds", "High resolution Veo videos require an 8 second duration"));
      }
      request.maybe_aspect_ratio = ratio;
      request.maybe_resolution = resolution;
    },
  }
  if let Some(negative_prompt) = builder.negative_prompt.filter(|prompt| !prompt.is_empty()) {
    if matches!(model, VideoModel::Seedance10Lite | VideoModel::Seedance1p5Pro | VideoModel::Seedance2p0 | VideoModel::Seedance2p0Fast | VideoModel::Seedance2p5 | VideoModel::MinimaxH3 | VideoModel::Sora2 | VideoModel::Sora2Pro) {
      return Err(unsupported("negative_prompt", "This WaveSpeed endpoint does not support negative prompts"));
    }
    request.maybe_negative_prompt = Some(negative_prompt);
  }
  if model.supports_audio_toggle() {
    let requires_silent_end_frame = model == VideoModel::Kling2p6Pro && request.maybe_last_image.is_some();
    let generate_audio = builder.generate_audio.unwrap_or(!requires_silent_end_frame);
    if requires_silent_end_frame && generate_audio {
      return Err(unsupported("generate_audio", "WaveSpeed Kling 2.6 requires sound to be disabled when using an ending frame"));
    }
    if matches!(model, VideoModel::Kling2p6Pro | VideoModel::Kling3p0Standard | VideoModel::Kling3p0Pro) {
      request.maybe_sound = Some(generate_audio);
    } else {
      request.maybe_generate_audio = Some(generate_audio);
    }
  } else if let Some(generate_audio) = builder.generate_audio {
    let fixed_audio = matches!(model, VideoModel::Sora2 | VideoModel::Sora2Pro);
    if generate_audio != fixed_audio {
      return Err(unsupported("generate_audio", "This WaveSpeed endpoint cannot change its audio setting"));
    }
  }
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::WaveSpeed(WaveSpeedVideoRequest { model, request })))
}

fn build_advanced(mut builder: GenerateVideoRequestBuilder, mode: VideoMode) -> Result<VideoGenerationDraftOrRequest, ArtcraftRouterError> {
  if !matches!(builder.model, RouterVideoModel::Seedance2p0) || builder.reference_character_tokens.is_some() || builder.start_frame.is_some() || builder.negative_prompt.is_some() {
    return Err(unsupported("mode", "WaveSpeed reference, edit, and extend modes currently require Seedance 2.0 without starting frames, characters, or negative prompts"));
  }
  let images = match builder.reference_images.take() {
    None => vec![],
    Some(ImageListRef::Urls(urls)) => urls,
    _ => return Err(unsupported("references", "Resolve image tokens to URLs first")),
  };
  let mut videos = match builder.reference_videos.take() {
    None => vec![],
    Some(VideoListRef::Urls(urls)) => urls,
    _ => return Err(unsupported("references", "Resolve video tokens to URLs first")),
  };
  let audios = match builder.reference_audio.take() {
    None => vec![],
    Some(AudioListRef::Urls(urls)) => urls,
    _ => return Err(unsupported("references", "Resolve audio tokens to URLs first")),
  };
  if images.len() > 9 || videos.len() > 3 || audios.len() > 3 {
    return Err(unsupported("references", "Seedance 2.0 accepts up to 9 images, 3 videos, and 3 audio clips"));
  }
  if mode == VideoMode::Reference && builder.end_frame.is_some() {
    return Err(unsupported("end_frame", "Reference mode cannot mix keyframes with references"));
  }
  if matches!(mode, VideoMode::Edit | VideoMode::Extend) && videos.len() != 1 {
    return Err(unsupported("video", "Edit and extend require exactly one input video"));
  }
  if mode == VideoMode::Edit && builder.end_frame.is_some() || mode == VideoMode::Extend && (!images.is_empty() || !audios.is_empty()) {
    return Err(unsupported("references", "This input combination is not supported by the selected WaveSpeed mode"));
  }
  let maybe_end = builder.end_frame.take();
  let planned = build_wavespeed_video_mode(builder, VideoMode::Generate)?;
  let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::WaveSpeed(mut planned)) = planned else {
    unreachable!()
  };
  planned.request.mode = mode;
  planned.request.reference_images = images;
  planned.request.reference_audios = audios;
  if mode == VideoMode::Reference {
    planned.request.reference_videos = videos;
  } else {
    planned.request.maybe_video = videos.pop();
  }
  if mode == VideoMode::Extend {
    planned.request.maybe_aspect_ratio = None;
    planned.request.maybe_last_image = image_url(maybe_end)?;
  }
  Ok(VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::WaveSpeed(planned)))
}

fn map_model(model: RouterVideoModel) -> Result<VideoModel, ArtcraftRouterError> {
  Ok(match model {
    RouterVideoModel::Kling16Pro => VideoModel::Kling16Pro,
    RouterVideoModel::Kling21Pro => VideoModel::Kling21Pro,
    RouterVideoModel::Kling21Master => VideoModel::Kling21Master,
    RouterVideoModel::Kling2p5TurboPro => VideoModel::Kling2p5TurboPro,
    RouterVideoModel::Kling2p6Pro => VideoModel::Kling2p6Pro,
    RouterVideoModel::Kling3p0Standard => VideoModel::Kling3p0Standard,
    RouterVideoModel::Kling3p0Pro => VideoModel::Kling3p0Pro,
    RouterVideoModel::Seedance10Lite => VideoModel::Seedance10Lite,
    RouterVideoModel::Seedance1p5Pro => VideoModel::Seedance1p5Pro,
    RouterVideoModel::Seedance2p0 => VideoModel::Seedance2p0,
    RouterVideoModel::Seedance2p0Fast => VideoModel::Seedance2p0Fast,
    RouterVideoModel::Seedance2p5 => VideoModel::Seedance2p5,
    RouterVideoModel::MinimaxH3 => VideoModel::MinimaxH3,
    RouterVideoModel::Sora2 => VideoModel::Sora2,
    RouterVideoModel::Sora2Pro => VideoModel::Sora2Pro,
    RouterVideoModel::Veo3 => VideoModel::Veo3,
    RouterVideoModel::Veo3Fast => VideoModel::Veo3Fast,
    RouterVideoModel::Veo3p1 => VideoModel::Veo3p1,
    RouterVideoModel::Veo3p1Fast => VideoModel::Veo3p1Fast,
    _ => return Err(ArtcraftRouterError::UnsupportedModel(format!("{model:?}"))),
  })
}

fn image_url(maybe_image: Option<ImageRef>) -> Result<Option<String>, ArtcraftRouterError> {
  match maybe_image {
    None => Ok(None),
    Some(ImageRef::Url(url)) => Ok(Some(url)),
    _ => Err(unsupported("image", "Resolve media tokens to URLs before calling WaveSpeed")),
  }
}

fn resolution(model: VideoModel, maybe_resolution: Option<RouterResolution>) -> Result<Option<String>, ArtcraftRouterError> {
  let default_resolution = if model == VideoModel::MinimaxH3 { RouterResolution::TwoK } else { RouterResolution::SevenTwentyP };
  let value = match maybe_resolution.unwrap_or(default_resolution) {
    RouterResolution::FourEightyP => "480p",
    RouterResolution::SevenTwentyP => "720p",
    RouterResolution::TenEightyP => "1080p",
    RouterResolution::FourK => "4k",
    RouterResolution::TwoK => "2k",
    _ => return Err(unsupported("resolution", "Unsupported WaveSpeed video resolution")),
  };
  let allowed: &[&str] = match model {
    VideoModel::Seedance1p5Pro => &["480p", "720p", "1080p"],
    VideoModel::Seedance2p0 | VideoModel::Seedance2p0Fast | VideoModel::Seedance2p5 => &["480p", "720p", "1080p", "4k"],
    VideoModel::MinimaxH3 => &["2k"],
    VideoModel::Veo3p1 | VideoModel::Veo3p1Fast => &["720p", "1080p", "4k"],
    VideoModel::Veo3 | VideoModel::Veo3Fast | VideoModel::Sora2Pro => &["720p", "1080p"],
    _ => &["720p"],
  };
  if !allowed.contains(&value) {
    return Err(unsupported("resolution", value));
  }
  Ok(Some(value.into()))
}

fn aspect_ratio(model: VideoModel, maybe_ratio: Option<RouterAspectRatio>, editing: bool) -> Result<Option<String>, ArtcraftRouterError> {
  use RouterAspectRatio as Ratio;
  let value = match maybe_ratio {
    None | Some(Ratio::Auto) if editing => return Ok(None),
    None | Some(Ratio::Auto | Ratio::Wide | Ratio::WideSixteenByNine) => "16:9",
    Some(Ratio::Tall | Ratio::TallNineBySixteen) => "9:16",
    Some(Ratio::Square) => "1:1",
    Some(Ratio::WideFourByThree) => "4:3",
    Some(Ratio::TallThreeByFour) => "3:4",
    Some(Ratio::WideTwentyOneByNine) => "21:9",
    _ => return Err(unsupported("aspect_ratio", "Unsupported WaveSpeed video aspect ratio")),
  };
  let allowed: &[&str] = match model {
    VideoModel::Seedance10Lite | VideoModel::Seedance1p5Pro | VideoModel::Seedance2p0 | VideoModel::Seedance2p0Fast | VideoModel::Seedance2p5 | VideoModel::MinimaxH3 => &["16:9", "9:16", "4:3", "3:4", "1:1", "21:9"],
    VideoModel::Sora2 | VideoModel::Sora2Pro | VideoModel::Veo3 | VideoModel::Veo3Fast | VideoModel::Veo3p1 | VideoModel::Veo3p1Fast => &["16:9", "9:16"],
    _ => &["16:9", "9:16", "1:1"],
  };
  if !allowed.contains(&value) {
    return Err(unsupported("aspect_ratio", value));
  }
  Ok(Some(value.into()))
}

fn unsupported(field: &'static str, message: &str) -> ArtcraftRouterError {
  ClientError::ModelDoesNotSupportOption { field, value: message.into() }.into()
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::api::router_provider::RouterProvider;
  use crate::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;

  #[test]
  fn builds_documented_seedance_reference_edit_and_extend_payloads() {
    for mode in [VideoMode::Reference, VideoMode::Edit, VideoMode::Extend] {
      let builder = GenerateVideoRequestBuilder { model: RouterVideoModel::Seedance2p0, reference_videos: Some(VideoListRef::Urls(vec!["https://example.com/source.mp4".into()])), ..base_builder() };
      let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::WaveSpeed(planned)) = build_wavespeed_video_mode(builder, mode).unwrap() else {
        panic!("expected WaveSpeed request")
      };
      assert_eq!(planned.request.mode, mode);
      if mode == VideoMode::Reference {
        assert_eq!(planned.request.reference_videos.len(), 1);
        assert!(planned.request.maybe_video.is_none());
      } else {
        assert_eq!(planned.request.maybe_video.as_deref(), Some("https://example.com/source.mp4"));
        assert!(planned.request.reference_videos.is_empty());
      }
      if mode == VideoMode::Extend {
        assert!(planned.request.maybe_aspect_ratio.is_none());
      }
    }
    assert!(build_wavespeed_video_mode(GenerateVideoRequestBuilder { model: RouterVideoModel::Seedance2p0, ..base_builder() }, VideoMode::Edit).is_err());
    assert!(build_wavespeed_video_mode(GenerateVideoRequestBuilder { model: RouterVideoModel::Seedance2p0Fast, ..base_builder() }, VideoMode::Reference).is_err());
    assert!(build_wavespeed_video_mode(GenerateVideoRequestBuilder { model: RouterVideoModel::Seedance2p0, reference_images: Some(ImageListRef::Urls(vec!["url".into(); 10])), ..base_builder() }, VideoMode::Reference).is_err());
  }

  const MODELS: &[RouterVideoModel] = &[RouterVideoModel::Kling16Pro, RouterVideoModel::Kling21Pro, RouterVideoModel::Kling21Master, RouterVideoModel::Kling2p5TurboPro, RouterVideoModel::Kling2p6Pro, RouterVideoModel::Kling3p0Standard, RouterVideoModel::Kling3p0Pro, RouterVideoModel::Seedance10Lite, RouterVideoModel::Seedance1p5Pro, RouterVideoModel::Seedance2p0, RouterVideoModel::Seedance2p0Fast, RouterVideoModel::Seedance2p5, RouterVideoModel::MinimaxH3, RouterVideoModel::Sora2, RouterVideoModel::Sora2Pro, RouterVideoModel::Veo3, RouterVideoModel::Veo3Fast, RouterVideoModel::Veo3p1, RouterVideoModel::Veo3p1Fast];

  #[test]
  fn routes_all_video_models_in_both_supported_modes() {
    for &model in MODELS {
      let mapped = map_model(model).unwrap();
      let image = build(GenerateVideoRequestBuilder { model, start_frame: Some(ImageRef::Url("https://example.com/start.png".into())), ..base_builder() });
      assert!(image.model.endpoint(true).is_some(), "{model:?}");
      assert!(image.request.maybe_image.is_some());
      let text = GenerateVideoRequestBuilder { model, ..base_builder() }.build2();
      assert_eq!(text.is_ok(), mapped.endpoint(false).is_some(), "{model:?}");
    }
  }

  #[test]
  fn maps_minimax_h3_to_official_2k_endpoints() {
    let request = build(GenerateVideoRequestBuilder { model: RouterVideoModel::MinimaxH3, duration_seconds: Some(15), ..base_builder() });
    assert_eq!(request.model.endpoint(false), Some("minimax/h3/text-to-video"));
    assert_eq!(request.request.maybe_resolution.as_deref(), Some("2k"));
    assert_eq!(request.request.duration, 15);
    assert!(request.request.maybe_generate_audio.is_none());
  }

  #[test]
  fn seedance_2p5_supports_thirty_seconds_4k_and_an_ending_frame() {
    let request = build(GenerateVideoRequestBuilder { model: RouterVideoModel::Seedance2p5, duration_seconds: Some(30), resolution: Some(RouterResolution::FourK), start_frame: Some(ImageRef::Url("https://example.com/start.png".into())), end_frame: Some(ImageRef::Url("https://example.com/end.png".into())), generate_audio: Some(false), ..base_builder() });
    assert_eq!(request.model.endpoint(true), Some("bytedance/seedance-2.5/image-to-video"));
    let json = serde_json::to_value(&request.request).unwrap();
    assert_eq!(json["duration"], 30);
    assert_eq!(json["resolution"], "4k");
    assert_eq!(json["generate_audio"], false);
    assert_eq!(json["last_image"], "https://example.com/end.png");
    assert!(json.get("aspect_ratio").is_none());
    assert!(json.get("sound").is_none());
  }

  #[test]
  fn serializes_endpoint_specific_frame_and_audio_fields() {
    for (model, audio_field) in [(RouterVideoModel::Kling16Pro, None), (RouterVideoModel::Kling2p6Pro, Some("sound")), (RouterVideoModel::Seedance1p5Pro, Some("generate_audio")), (RouterVideoModel::Veo3p1Fast, Some("generate_audio"))] {
      let request = build(GenerateVideoRequestBuilder { model, start_frame: Some(ImageRef::Url("https://example.com/start.png".into())), end_frame: Some(ImageRef::Url("https://example.com/end.png".into())), ..base_builder() });
      let json = serde_json::to_value(&request.request).unwrap();
      assert_eq!(json["last_image"], "https://example.com/end.png");
      assert!(json.get("end_image").is_none());
      if let Some(audio_field) = audio_field {
        assert_eq!(json[audio_field], !matches!(model, RouterVideoModel::Kling2p6Pro));
      } else {
        assert!(json.get("generate_audio").is_none());
        assert!(json.get("sound").is_none());
      }
    }
  }

  #[test]
  fn kling_2p6_ending_frames_require_silent_audio() {
    for generate_audio in [None, Some(false), Some(true)] {
      let builder = GenerateVideoRequestBuilder { model: RouterVideoModel::Kling2p6Pro, start_frame: Some(ImageRef::Url("https://example.com/start.png".into())), end_frame: Some(ImageRef::Url("https://example.com/end.png".into())), generate_audio, ..base_builder() };
      if generate_audio == Some(true) {
        assert!(builder.build2().is_err());
      } else {
        assert_eq!(build(builder).request.maybe_sound, Some(false));
      }
    }
    let request = build(GenerateVideoRequestBuilder { model: RouterVideoModel::Kling2p6Pro, ..base_builder() });
    assert_eq!(request.request.maybe_sound, Some(true));
  }

  #[test]
  fn sora_text_uses_size_and_image_mode_does_not_send_it() {
    let text = build(GenerateVideoRequestBuilder { model: RouterVideoModel::Sora2Pro, aspect_ratio: Some(RouterAspectRatio::TallNineBySixteen), resolution: Some(RouterResolution::TenEightyP), ..base_builder() });
    assert_eq!(text.request.maybe_size.as_deref(), Some("1080*1920"));
    assert!(text.request.maybe_resolution.is_none());
    let image = build(GenerateVideoRequestBuilder { model: RouterVideoModel::Sora2Pro, start_frame: Some(ImageRef::Url("https://example.com/start.png".into())), resolution: Some(RouterResolution::TenEightyP), ..base_builder() });
    assert!(image.request.maybe_size.is_none());
    assert_eq!(image.request.maybe_resolution.as_deref(), Some("1080p"));
  }

  #[test]
  fn rejects_unsupported_video_parameters_before_submission() {
    for builder in [GenerateVideoRequestBuilder { video_batch_count: Some(2), ..base_builder() }, GenerateVideoRequestBuilder { duration_seconds: Some(3), ..base_builder() }, GenerateVideoRequestBuilder { model: RouterVideoModel::Seedance2p5, duration_seconds: Some(31), ..base_builder() }, GenerateVideoRequestBuilder { prompt: None, ..base_builder() }, GenerateVideoRequestBuilder { model: RouterVideoModel::Veo2, ..base_builder() }, GenerateVideoRequestBuilder { end_frame: Some(ImageRef::Url("https://example.com/end.png".into())), ..base_builder() }, GenerateVideoRequestBuilder { model: RouterVideoModel::Veo3p1, duration_seconds: Some(4), resolution: Some(RouterResolution::FourK), ..base_builder() }, GenerateVideoRequestBuilder { model: RouterVideoModel::MinimaxH3, resolution: Some(RouterResolution::SevenTwentyP), ..base_builder() }] {
      assert!(builder.build2().is_err());
    }
  }

  fn build(builder: GenerateVideoRequestBuilder) -> WaveSpeedVideoRequest {
    let VideoGenerationDraftOrRequest::Request(VideoGenerationRequest::WaveSpeed(request)) = builder.build2().unwrap() else {
      panic!("expected WaveSpeed video request")
    };
    request
  }

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder { provider: RouterProvider::WaveSpeed, model: RouterVideoModel::Seedance1p5Pro, prompt: Some("ocean waves".into()), request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut, ..Default::default() }
  }
}
