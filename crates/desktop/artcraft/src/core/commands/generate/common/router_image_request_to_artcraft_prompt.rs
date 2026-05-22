use artcraft_api_defs::prompts::create_prompt::CreatePromptRequest;
use artcraft_router::api::common_aspect_ratio::CommonAspectRatio as RouterAspectRatio;
use artcraft_router::api::common_image_model::CommonImageModel;
use artcraft_router::api::common_resolution::CommonResolution as RouterResolution;
use artcraft_router::api::provider::Provider;
use artcraft_router::generate::generate_image::generate_image_request_builder::GenerateImageRequestBuilder;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio as EnumsAspectRatio;
use enums::common::generation::common_generation_mode::CommonGenerationMode;
use enums::common::generation::common_model_type::CommonModelType;
use enums::common::generation::common_resolution::CommonResolution as EnumsResolution;
use enums::common::generation_provider::GenerationProvider;
use uuid_utils::uuid::generate_random_uuid;

pub fn router_image_request_to_artcraft_prompt(
  request: &GenerateImageRequestBuilder,
) -> CreatePromptRequest {
  CreatePromptRequest {
    uuid_idempotency_token: generate_random_uuid(),
    positive_prompt: request.prompt.clone(),
    negative_prompt: None,
    model_type: image_model_to_common_model_type(request.model),
    generation_provider: Some(provider_to_generation_provider(request.provider)),
    maybe_generation_mode: Some(determine_image_generation_mode(request)),
    maybe_aspect_ratio: request.aspect_ratio.map(router_aspect_ratio_to_enums),
    maybe_resolution: request.resolution.map(router_resolution_to_enums),
    maybe_batch_count: request.image_batch_count.map(|n| n.min(255) as u8),
    maybe_generate_audio: None,
    maybe_duration_seconds: None,
  }
}

// ── Converters ──

fn determine_image_generation_mode(request: &GenerateImageRequestBuilder) -> CommonGenerationMode {
  if request.image_inputs.is_some() {
    CommonGenerationMode::Edit
  } else {
    CommonGenerationMode::Text
  }
}

fn image_model_to_common_model_type(model: CommonImageModel) -> Option<CommonModelType> {
  match model {
    CommonImageModel::Flux1Dev => Some(CommonModelType::Flux1Dev),
    CommonImageModel::Flux1Schnell => Some(CommonModelType::Flux1Schnell),
    CommonImageModel::FluxPro11 => Some(CommonModelType::FluxPro11),
    CommonImageModel::FluxPro11Ultra => Some(CommonModelType::FluxPro11Ultra),
    CommonImageModel::GptImage1 => Some(CommonModelType::GptImage1),
    CommonImageModel::GptImage1p5 => Some(CommonModelType::GptImage1p5),
    CommonImageModel::GptImage2 => Some(CommonModelType::GptImage2),
    CommonImageModel::NanoBanana => Some(CommonModelType::NanoBanana),
    CommonImageModel::NanoBanana2 => Some(CommonModelType::NanoBanana2),
    CommonImageModel::NanoBananaPro => Some(CommonModelType::NanoBananaPro),
    CommonImageModel::Seedream4 => Some(CommonModelType::Seedream4),
    CommonImageModel::Seedream4p5 => Some(CommonModelType::Seedream4p5),
    CommonImageModel::Seedream5Lite => Some(CommonModelType::Seedream5Lite),
    CommonImageModel::QwenEdit2511Angles => Some(CommonModelType::QwenEdit2511Angles),
    CommonImageModel::Flux2LoraAngles => Some(CommonModelType::Flux2LoraAngles),
  }
}

fn provider_to_generation_provider(provider: Provider) -> GenerationProvider {
  match provider {
    Provider::Artcraft => GenerationProvider::Artcraft,
    Provider::Fal => GenerationProvider::Fal,
    // Unused providers -> ArtCraft
    Provider::Muapi => GenerationProvider::Artcraft,
    Provider::Seedance2Pro => GenerationProvider::Artcraft ,
    Provider::GmiCloud => GenerationProvider::Artcraft,
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
  use artcraft_router::client::request_mismatch_mitigation_strategy::RequestMismatchMitigationStrategy;

  fn base_builder() -> GenerateImageRequestBuilder {
    GenerateImageRequestBuilder {
      model: CommonImageModel::NanoBananaPro,
      provider: Provider::Fal,
      prompt: Some("a cat in space".to_string()),
      image_inputs: None,
      resolution: None,
      aspect_ratio: None,
      quality: None,
      image_batch_count: None,
      horizontal_angle: None,
      vertical_angle: None,
      zoom: None,
      request_mismatch_mitigation_strategy: RequestMismatchMitigationStrategy::ErrorOut,
      generation_mode_mismatch_strategy: None,
      idempotency_token: None,
    }
  }

  #[test]
  fn basic_conversion() {
    let builder = base_builder();
    let prompt = router_image_request_to_artcraft_prompt(&builder);
    assert_eq!(prompt.positive_prompt.as_deref(), Some("a cat in space"));
    assert_eq!(prompt.model_type, Some(CommonModelType::NanoBananaPro));
    assert_eq!(prompt.generation_provider, Some(GenerationProvider::Fal));
    assert_eq!(prompt.maybe_generation_mode, Some(CommonGenerationMode::Text));
    assert!(prompt.negative_prompt.is_none());
    assert!(prompt.maybe_aspect_ratio.is_none());
    assert!(prompt.maybe_resolution.is_none());
    assert!(prompt.maybe_batch_count.is_none());
    assert!(!prompt.uuid_idempotency_token.is_empty());
  }

  #[test]
  fn text_mode_when_no_images() {
    let builder = base_builder();
    let prompt = router_image_request_to_artcraft_prompt(&builder);
    assert_eq!(prompt.maybe_generation_mode, Some(CommonGenerationMode::Text));
  }

  #[test]
  fn edit_mode_when_images_present() {
    use artcraft_router::api::image_list_ref::ImageListRef;
    let builder = GenerateImageRequestBuilder {
      image_inputs: Some(ImageListRef::Urls(vec!["https://example.com/img.jpg".to_string()])),
      ..base_builder()
    };
    let prompt = router_image_request_to_artcraft_prompt(&builder);
    assert_eq!(prompt.maybe_generation_mode, Some(CommonGenerationMode::Edit));
  }

  #[test]
  fn with_aspect_ratio_and_resolution() {
    let builder = GenerateImageRequestBuilder {
      aspect_ratio: Some(RouterAspectRatio::WideSixteenByNine),
      resolution: Some(RouterResolution::TwoK),
      image_batch_count: Some(3),
      ..base_builder()
    };
    let prompt = router_image_request_to_artcraft_prompt(&builder);
    assert_eq!(prompt.maybe_aspect_ratio, Some(EnumsAspectRatio::WideSixteenByNine));
    assert_eq!(prompt.maybe_resolution, Some(EnumsResolution::TwoK));
    assert_eq!(prompt.maybe_batch_count, Some(3));
  }

  #[test]
  fn no_prompt() {
    let builder = GenerateImageRequestBuilder {
      prompt: None,
      ..base_builder()
    };
    let prompt = router_image_request_to_artcraft_prompt(&builder);
    assert!(prompt.positive_prompt.is_none());
  }

  #[test]
  fn all_image_models_map() {
    let models = [
      (CommonImageModel::Flux1Dev, CommonModelType::Flux1Dev),
      (CommonImageModel::Flux1Schnell, CommonModelType::Flux1Schnell),
      (CommonImageModel::NanoBananaPro, CommonModelType::NanoBananaPro),
      (CommonImageModel::GptImage1, CommonModelType::GptImage1),
      (CommonImageModel::Seedream4, CommonModelType::Seedream4),
    ];
    for (router_model, expected) in models {
      let builder = GenerateImageRequestBuilder { model: router_model, ..base_builder() };
      let prompt = router_image_request_to_artcraft_prompt(&builder);
      assert_eq!(prompt.model_type, Some(expected));
    }
  }

  #[test]
  fn provider_mapping() {
    let builder = GenerateImageRequestBuilder { provider: Provider::Artcraft, ..base_builder() };
    let prompt = router_image_request_to_artcraft_prompt(&builder);
    assert_eq!(prompt.generation_provider, Some(GenerationProvider::Artcraft));
  }
}
