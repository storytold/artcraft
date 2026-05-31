use artcraft_api_defs::prompts::create_prompt::CreatePromptRequest;
use artcraft_router::api::router_aspect_ratio::RouterAspectRatio;
use artcraft_router::api::router_resolution::RouterResolution;
use artcraft_router::api::router_video_model::RouterVideoModel;
use artcraft_router::api::router_provider::RouterProvider;
use artcraft_router::generate::generate_video::generate_video_request_builder::GenerateVideoRequestBuilder;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio as EnumsAspectRatio;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation::common_resolution::CommonResolution as EnumsResolution;
use enums::common::generation_provider::GenerationProvider;
use uuid_utils::uuid::generate_random_uuid;

pub fn router_video_request_to_artcraft_prompt(
  request: &GenerateVideoRequestBuilder,
) -> CreatePromptRequest {
  CreatePromptRequest {
    uuid_idempotency_token: generate_random_uuid(),
    positive_prompt: request.prompt.clone(),
    negative_prompt: request.negative_prompt.clone(),
    model_type: video_model_to_common_model_type(request.model),
    generation_provider: Some(provider_to_generation_provider(request.provider)),
    maybe_generation_mode: Some(determine_video_generation_mode(request)),
    maybe_aspect_ratio: request.aspect_ratio.map(router_aspect_ratio_to_enums),
    maybe_resolution: request.resolution.map(router_resolution_to_enums),
    maybe_batch_count: request.video_batch_count.map(|n| n.min(255) as u8),
    maybe_generate_audio: request.generate_audio,
    maybe_duration_seconds: request.duration_seconds.map(|d| d as u32),
  }
}

// ── Converters ──

fn determine_video_generation_mode(request: &GenerateVideoRequestBuilder) -> CommonGenerationMode {
  let has_keyframes = request.start_frame.is_some() || request.end_frame.is_some();
  let has_references = request.reference_images.is_some()
    || request.reference_videos.is_some()
    || request.reference_audio.is_some();

  if has_keyframes {
    CommonGenerationMode::Keyframe
  } else if has_references {
    CommonGenerationMode::Reference
  } else {
    CommonGenerationMode::Text
  }
}

fn video_model_to_common_model_type(model: RouterVideoModel) -> Option<CommonModelType> {
  match model {
    RouterVideoModel::GrokVideo => Some(CommonModelType::GrokVideo),
    RouterVideoModel::Kling16Pro => Some(CommonModelType::Kling16Pro),
    RouterVideoModel::Kling21Pro => Some(CommonModelType::Kling21Pro),
    RouterVideoModel::Kling21Master => Some(CommonModelType::Kling21Master),
    RouterVideoModel::Kling2p5TurboPro => Some(CommonModelType::Kling2p5TurboPro),
    RouterVideoModel::Kling2p6Pro => Some(CommonModelType::Kling2p6Pro),
    RouterVideoModel::Kling3p0Standard => Some(CommonModelType::Kling3p0Standard),
    RouterVideoModel::Kling3p0Pro => Some(CommonModelType::Kling3p0Pro),
    RouterVideoModel::Seedance10Lite => Some(CommonModelType::Seedance10Lite),
    RouterVideoModel::Seedance1p5Pro => Some(CommonModelType::Seedance1p5Pro),
    RouterVideoModel::Seedance2p0 => Some(CommonModelType::Seedance2p0),
    RouterVideoModel::Seedance2p0Fast => Some(CommonModelType::Seedance2p0Fast),
    RouterVideoModel::HappyHorse1p0 => Some(CommonModelType::HappyHorse1p0),
    RouterVideoModel::Sora2 => Some(CommonModelType::Sora2),
    RouterVideoModel::Sora2Pro => Some(CommonModelType::Sora2Pro),
    RouterVideoModel::Veo2 => Some(CommonModelType::Veo2),
    RouterVideoModel::Veo3 => Some(CommonModelType::Veo3),
    RouterVideoModel::Veo3Fast => Some(CommonModelType::Veo3Fast),
    RouterVideoModel::Veo3p1 => Some(CommonModelType::Veo3p1),
    RouterVideoModel::Veo3p1Fast => Some(CommonModelType::Veo3p1Fast),
    RouterVideoModel::Seedance2p0BytePlus => Some(CommonModelType::Seedance2p0BytePlus),
    RouterVideoModel::Seedance2p0BytePlusFast => Some(CommonModelType::Seedance2p0BytePlusFast),
    RouterVideoModel::Seedance2p0Ultra => Some(CommonModelType::Seedance2p0Ultra),
    RouterVideoModel::Seedance2p0UltraFast => Some(CommonModelType::Seedance2p0UltraFast),
    RouterVideoModel::Seedance2p0BytePlusUltra => Some(CommonModelType::Seedance2p0BytePlusUltra),
    RouterVideoModel::Seedance2p0BytePlusUltraFast => Some(CommonModelType::Seedance2p0BytePlusUltraFast),
    RouterVideoModel::PreviewModel => Some(CommonModelType::PreviewModel),
    RouterVideoModel::PreviewModelFast => Some(CommonModelType::PreviewModelFast),
    RouterVideoModel::GrokImagineVideo => Some(CommonModelType::GrokImagineVideo),
    RouterVideoModel::GrokImagineVideo1p5 => Some(CommonModelType::GrokImagineVideo1p5),
  }
}

fn provider_to_generation_provider(provider: RouterProvider) -> GenerationProvider {
  match provider {
    RouterProvider::Artcraft => GenerationProvider::Artcraft,
    RouterProvider::Fal => GenerationProvider::Fal,
    // Unused providers -> ArtCraft
    RouterProvider::Seedance2Pro => GenerationProvider::Artcraft ,
    RouterProvider::GmiCloud => GenerationProvider::Artcraft,
    RouterProvider::GrokApi => GenerationProvider::Artcraft,
  }
}

fn router_aspect_ratio_to_enums(ar: RouterAspectRatio) -> EnumsAspectRatio {
  match ar {
    RouterAspectRatio::Auto => EnumsAspectRatio::Auto,
    RouterAspectRatio::Square => EnumsAspectRatio::Square,
    RouterAspectRatio::WideThreeByTwo => EnumsAspectRatio::WideThreeByTwo,
    RouterAspectRatio::WideFourByThree => EnumsAspectRatio::WideFourByThree,
    RouterAspectRatio::WideFiveByFour => EnumsAspectRatio::WideFiveByFour,
    RouterAspectRatio::WideSixteenByNine => EnumsAspectRatio::WideSixteenByNine,
    RouterAspectRatio::WideTwentyOneByNine => EnumsAspectRatio::WideTwentyOneByNine,
    RouterAspectRatio::TallTwoByThree => EnumsAspectRatio::TallTwoByThree,
    RouterAspectRatio::TallThreeByFour => EnumsAspectRatio::TallThreeByFour,
    RouterAspectRatio::TallFourByFive => EnumsAspectRatio::TallFourByFive,
    RouterAspectRatio::TallNineBySixteen => EnumsAspectRatio::TallNineBySixteen,
    RouterAspectRatio::TallNineByTwentyOne => EnumsAspectRatio::TallNineByTwentyOne,
    RouterAspectRatio::Wide => EnumsAspectRatio::Wide,
    RouterAspectRatio::Tall => EnumsAspectRatio::Tall,
    RouterAspectRatio::Auto2k => EnumsAspectRatio::Auto2k,
    RouterAspectRatio::Auto3k => EnumsAspectRatio::Auto3k,
    RouterAspectRatio::Auto4k => EnumsAspectRatio::Auto4k,
    RouterAspectRatio::SquareHd => EnumsAspectRatio::SquareHd,
  }
}

fn router_resolution_to_enums(res: RouterResolution) -> EnumsResolution {
  match res {
    RouterResolution::OneK => EnumsResolution::OneK,
    RouterResolution::TwoK => EnumsResolution::TwoK,
    RouterResolution::ThreeK => EnumsResolution::ThreeK,
    RouterResolution::FourK => EnumsResolution::FourK,
    RouterResolution::HalfK => EnumsResolution::HalfK,
    RouterResolution::FourEightyP => EnumsResolution::FourEightyP,
    RouterResolution::SevenTwentyP => EnumsResolution::SevenTwentyP,
    RouterResolution::TenEightyP => EnumsResolution::TenEightyP,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn base_builder() -> GenerateVideoRequestBuilder {
    GenerateVideoRequestBuilder {
      model: RouterVideoModel::Kling3p0Standard,
      provider: RouterProvider::Fal,
      prompt: Some("a dog running on the beach".to_string()),
      negative_prompt: None,
      start_frame: None,
      end_frame: None,
      reference_images: None,
      reference_videos: None,
      reference_audio: None,
      reference_character_tokens: None,
      resolution: None,
      aspect_ratio: None,
      duration_seconds: None,
      video_batch_count: None,
      generate_audio: None,
      request_mismatch_mitigation_strategy:
        artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy::ErrorOut,
      idempotency_token: None,
    }
  }

  #[test]
  fn basic_conversion() {
    let builder = base_builder();
    let prompt = router_video_request_to_artcraft_prompt(&builder);
    assert_eq!(prompt.positive_prompt.as_deref(), Some("a dog running on the beach"));
    assert_eq!(prompt.model_type, Some(CommonModelType::Kling3p0Standard));
    assert_eq!(prompt.generation_provider, Some(GenerationProvider::Fal));
    assert_eq!(prompt.maybe_generation_mode, Some(CommonGenerationMode::Text));
    assert!(prompt.negative_prompt.is_none());
    assert!(prompt.maybe_aspect_ratio.is_none());
    assert!(prompt.maybe_resolution.is_none());
    assert!(prompt.maybe_batch_count.is_none());
    assert!(prompt.maybe_generate_audio.is_none());
    assert!(prompt.maybe_duration_seconds.is_none());
  }

  #[test]
  fn with_video_fields() {
    let builder = GenerateVideoRequestBuilder {
      negative_prompt: Some("blurry".to_string()),
      aspect_ratio: Some(RouterAspectRatio::WideSixteenByNine),
      resolution: Some(RouterResolution::TenEightyP),
      duration_seconds: Some(10),
      video_batch_count: Some(2),
      generate_audio: Some(true),
      ..base_builder()
    };
    let prompt = router_video_request_to_artcraft_prompt(&builder);
    assert_eq!(prompt.negative_prompt.as_deref(), Some("blurry"));
    assert_eq!(prompt.maybe_aspect_ratio, Some(EnumsAspectRatio::WideSixteenByNine));
    assert_eq!(prompt.maybe_resolution, Some(EnumsResolution::TenEightyP));
    assert_eq!(prompt.maybe_duration_seconds, Some(10));
    assert_eq!(prompt.maybe_batch_count, Some(2));
    assert_eq!(prompt.maybe_generate_audio, Some(true));
  }

  #[test]
  fn text_mode_when_no_references() {
    let builder = base_builder();
    let prompt = router_video_request_to_artcraft_prompt(&builder);
    assert_eq!(prompt.maybe_generation_mode, Some(CommonGenerationMode::Text));
  }

  #[test]
  fn keyframe_mode_with_start_frame() {
    use artcraft_router::api::image_ref::ImageRef;
    let builder = GenerateVideoRequestBuilder {
      start_frame: Some(ImageRef::Url("https://example.com/frame.jpg".to_string())),
      ..base_builder()
    };
    let prompt = router_video_request_to_artcraft_prompt(&builder);
    assert_eq!(prompt.maybe_generation_mode, Some(CommonGenerationMode::Keyframe));
  }

  #[test]
  fn keyframe_mode_with_end_frame() {
    use artcraft_router::api::image_ref::ImageRef;
    let builder = GenerateVideoRequestBuilder {
      end_frame: Some(ImageRef::Url("https://example.com/frame.jpg".to_string())),
      ..base_builder()
    };
    let prompt = router_video_request_to_artcraft_prompt(&builder);
    assert_eq!(prompt.maybe_generation_mode, Some(CommonGenerationMode::Keyframe));
  }

  #[test]
  fn reference_mode_with_reference_images() {
    use artcraft_router::api::image_list_ref::ImageListRef;
    let builder = GenerateVideoRequestBuilder {
      reference_images: Some(ImageListRef::Urls(vec!["https://example.com/ref.jpg".to_string()])),
      ..base_builder()
    };
    let prompt = router_video_request_to_artcraft_prompt(&builder);
    assert_eq!(prompt.maybe_generation_mode, Some(CommonGenerationMode::Reference));
  }

  #[test]
  fn keyframe_takes_priority_over_reference() {
    use artcraft_router::api::image_ref::ImageRef;
    use artcraft_router::api::image_list_ref::ImageListRef;
    let builder = GenerateVideoRequestBuilder {
      start_frame: Some(ImageRef::Url("https://example.com/frame.jpg".to_string())),
      reference_images: Some(ImageListRef::Urls(vec!["https://example.com/ref.jpg".to_string()])),
      ..base_builder()
    };
    let prompt = router_video_request_to_artcraft_prompt(&builder);
    assert_eq!(prompt.maybe_generation_mode, Some(CommonGenerationMode::Keyframe));
  }

  #[test]
  fn video_model_mapping() {
    let models = [
      (RouterVideoModel::Kling3p0Standard, CommonModelType::Kling3p0Standard),
      (RouterVideoModel::Veo3, CommonModelType::Veo3),
      (RouterVideoModel::Seedance2p0, CommonModelType::Seedance2p0),
      (RouterVideoModel::Sora2, CommonModelType::Sora2),
    ];
    for (router_model, expected) in models {
      let builder = GenerateVideoRequestBuilder { model: router_model, ..base_builder() };
      let prompt = router_video_request_to_artcraft_prompt(&builder);
      assert_eq!(prompt.model_type, Some(expected));
    }
  }
}
