use artcraft_api_defs::omni_gen::models::omni_gen_image_models::{OmniGenImageModelDetails, OmniGenImageModelProviderDetails, OmniGenImageModelsResponse, OmniGenImageProviderModelDetails};
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_image_model::CommonImageModel;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation_provider::GenerationProvider;
use once_cell::sync::Lazy;

pub const OMNI_GEN_IMAGE_MODELS_AND_PROVIDERS: Lazy<OmniGenImageModelsResponse> = Lazy::new(|| {
  let models = build_omni_gen_image_models();
  let providers = build_omni_gen_image_model_providers();
  OmniGenImageModelsResponse {
    success: true,
    models,
    providers,
  }
});

fn build_omni_gen_image_models() -> Vec<OmniGenImageModelDetails> {
  let mut models = Vec::new();

  models.push(OmniGenImageModelDetails {
    model: CommonImageModel::Flux1Dev,
    full_name: None,
    text_prompt_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::SquareHd,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallNineBySixteen,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::WideSixteenByNine,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::Square),
    batch_size_min: Some(1),
    batch_size_max: Some(4),
    batch_size_default: Some(4),
    ..Default::default()
  });

  models.push(OmniGenImageModelDetails {
    model: CommonImageModel::Flux1Schnell,
    full_name: None,
    text_prompt_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::SquareHd,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallNineBySixteen,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::WideSixteenByNine,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::Square),
    batch_size_min: Some(1),
    batch_size_max: Some(4),
    batch_size_default: Some(4),
    ..Default::default()
  });

  //  ...

  models.push(OmniGenImageModelDetails {
    model: CommonImageModel::NanaBanana, // NB: currently Gemini25Flash in our system
    full_name: None,
    text_prompt_supported: Some(true),
    image_refs_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Auto,
      CommonAspectRatio::WideTwentyOneByNine,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::WideThreeByTwo,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::WideFiveByFour,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallFourByFive,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallTwoByThree,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::Square),
    aspect_ratio_default_when_editing: Some(CommonAspectRatio::Auto),
    batch_size_min: Some(1),
    batch_size_max: Some(4),
    batch_size_default: Some(4),
    ..Default::default()
  });

  models.push(OmniGenImageModelDetails {
    model: CommonImageModel::NanaBanana2,
    full_name: None,
    text_prompt_supported: Some(true),
    image_refs_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Auto,
      CommonAspectRatio::WideTwentyOneByNine,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::WideThreeByTwo,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::WideFiveByFour,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallFourByFive,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallTwoByThree,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::Square),
    aspect_ratio_default_when_editing: Some(CommonAspectRatio::Auto),
    resolution_options: Some(vec![
      CommonResolution::HalfK,
      CommonResolution::OneK,
      CommonResolution::TwoK,
      CommonResolution::FourK,
    ]),
    resolution_default: Some(CommonResolution::OneK),
    batch_size_min: Some(1),
    batch_size_max: Some(4),
    batch_size_default: Some(4),
    ..Default::default()
  });

  models.push(OmniGenImageModelDetails {
    model: CommonImageModel::NanaBananaPro,
    full_name: None,
    text_prompt_supported: Some(true),
    image_refs_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Auto,
      CommonAspectRatio::WideTwentyOneByNine,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::WideThreeByTwo,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::WideFiveByFour,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallFourByFive,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallTwoByThree,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::Square),
    aspect_ratio_default_when_editing: Some(CommonAspectRatio::Auto),
    resolution_options: Some(vec![
      CommonResolution::OneK,
      CommonResolution::TwoK,
      CommonResolution::FourK,
    ]),
    resolution_default: Some(CommonResolution::OneK),
    batch_size_min: Some(1),
    batch_size_max: Some(4),
    batch_size_default: Some(4),
    ..Default::default()
  });

  models
}

fn build_omni_gen_image_model_providers() -> Vec<OmniGenImageModelProviderDetails> {
  let mut providers = Vec::new();

  providers.push(OmniGenImageModelProviderDetails {
    provider: GenerationProvider::Artcraft,
    models: vec![
      OmniGenImageProviderModelDetails {
        model: CommonImageModel::Flux1Dev,
        overrides: None,
      },
      OmniGenImageProviderModelDetails {
        model: CommonImageModel::Flux1Schnell,
        overrides: None,
      },
      OmniGenImageProviderModelDetails {
        model: CommonImageModel::NanaBanana,
        overrides: None,
      },
      OmniGenImageProviderModelDetails {
        model: CommonImageModel::NanaBanana2,
        overrides: None,
      },
      OmniGenImageProviderModelDetails {
        model: CommonImageModel::NanaBananaPro,
        overrides: None,
      },
    ],
  });

  providers
}
