use artcraft_api_defs::omni_gen::models::omni_gen_image_models::{OmniGenImageModelDetails, OmniGenImageModelProviderDetails, OmniGenImageModelsResponse, OmniGenImageProviderModelDetails};
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_image_model::CommonImageModel;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::model_creator::ModelCreator;
use enums::common::generation_provider::GenerationProvider;
use once_cell::sync::Lazy;
use enums::common::generation::common_quality::CommonQuality;

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
    model_creator: Some(ModelCreator::BlackForestLabs),
    full_name: Some("FLUX.1 [dev]".to_string()),
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
    model_creator: Some(ModelCreator::BlackForestLabs),
    full_name: Some("FLUX.1 [schnell]".to_string()),
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
    model: CommonImageModel::FluxPro11,
    model_creator: Some(ModelCreator::BlackForestLabs),
    full_name: Some("FLUX 1.1 [pro]".to_string()),
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
    batch_size_default: Some(1),
    ..Default::default()
  });

  models.push(OmniGenImageModelDetails {
    model: CommonImageModel::FluxPro11Ultra,
    model_creator: Some(ModelCreator::BlackForestLabs),
    full_name: Some("FLUX 1.1 [pro] ultra".to_string()),
    text_prompt_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Square,
      CommonAspectRatio::WideTwentyOneByNine,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::WideThreeByTwo,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallTwoByThree,
      CommonAspectRatio::TallNineBySixteen,
      CommonAspectRatio::TallNineByTwentyOne,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::Square),
    batch_size_min: Some(1),
    batch_size_max: Some(4),
    batch_size_default: Some(1),
    ..Default::default()
  });

  models.push(OmniGenImageModelDetails {
    model: CommonImageModel::NanoBanana, // NB: currently Gemini25Flash in our system
    model_creator: Some(ModelCreator::ArtCraft),
    full_name: Some("Nano Banana".to_string()),
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
    model: CommonImageModel::NanoBanana2,
    model_creator: Some(ModelCreator::ArtCraft),
    full_name: Some("Nano Banana 2".to_string()),
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
    model: CommonImageModel::NanoBananaPro,
    model_creator: Some(ModelCreator::ArtCraft),
    full_name: Some("Nano Banana Pro".to_string()),
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

  models.push(OmniGenImageModelDetails {
    model: CommonImageModel::GptImage1,
    model_creator: Some(ModelCreator::OpenAi),
    full_name: Some("GPT Image 1".to_string()),
    text_prompt_supported: Some(true),
    image_refs_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Square,
      CommonAspectRatio::WideThreeByTwo,
      CommonAspectRatio::TallTwoByThree,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::Square),
    quality_options: Some(vec![
      CommonQuality::High,
      CommonQuality::Medium,
      CommonQuality::Low,
    ]),
    default_quality: Some(CommonQuality::High),
    batch_size_min: Some(1),
    batch_size_max: Some(4),
    batch_size_default: Some(1),
    ..Default::default()
  });
  
  models.push(OmniGenImageModelDetails {
    model: CommonImageModel::GptImage1p5,
    model_creator: Some(ModelCreator::OpenAi),
    full_name: Some("GPT Image 1.5".to_string()),
    text_prompt_supported: Some(true),
    image_refs_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Square,
      CommonAspectRatio::WideThreeByTwo,
      CommonAspectRatio::TallTwoByThree,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::Square),
    quality_options: Some(vec![
      CommonQuality::High,
      CommonQuality::Medium,
      CommonQuality::Low,
    ]),
    default_quality: Some(CommonQuality::High),
    batch_size_min: Some(1),
    batch_size_max: Some(4),
    batch_size_default: Some(1),
    ..Default::default()
  });

  models.push(OmniGenImageModelDetails {
    model: CommonImageModel::Seedream4,
    model_creator: Some(ModelCreator::Bytedance),
    full_name: Some("Seedream 4".to_string()),
    text_prompt_supported: Some(true),
    image_refs_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Auto,
      CommonAspectRatio::Auto2k,
      CommonAspectRatio::Auto4k,
      CommonAspectRatio::Square,
      CommonAspectRatio::SquareHd,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::Square),
    aspect_ratio_default_when_editing: Some(CommonAspectRatio::Auto),
    batch_size_min: Some(1),
    batch_size_max: Some(4),
    batch_size_default: Some(1),
    ..Default::default()
  });

  models.push(OmniGenImageModelDetails {
    model: CommonImageModel::Seedream4p5,
    model_creator: Some(ModelCreator::Bytedance),
    full_name: Some("Seedream 4.5".to_string()),
    text_prompt_supported: Some(true),
    image_refs_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Auto2k,
      CommonAspectRatio::Auto4k,
      CommonAspectRatio::Square,
      CommonAspectRatio::SquareHd,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::Square),
    aspect_ratio_default_when_editing: Some(CommonAspectRatio::Auto2k),
    batch_size_min: Some(1),
    batch_size_max: Some(4),
    batch_size_default: Some(1),
    ..Default::default()
  });

  models.push(OmniGenImageModelDetails {
    model: CommonImageModel::Seedream5Lite,
    model_creator: Some(ModelCreator::Bytedance),
    full_name: Some("Seedream 5 Lite".to_string()),
    text_prompt_supported: Some(true),
    image_refs_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Auto2k,
      CommonAspectRatio::Auto3k,
      CommonAspectRatio::Square,
      CommonAspectRatio::SquareHd,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::Square),
    aspect_ratio_default_when_editing: Some(CommonAspectRatio::Auto3k),
    batch_size_min: Some(1),
    batch_size_max: Some(4),
    batch_size_default: Some(1),
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
        model: CommonImageModel::FluxPro11,
        overrides: None,
      },
      OmniGenImageProviderModelDetails {
        model: CommonImageModel::FluxPro11Ultra,
        overrides: None,
      },
      OmniGenImageProviderModelDetails {
        model: CommonImageModel::GptImage1p5,
        overrides: None,
      },
      OmniGenImageProviderModelDetails {
        model: CommonImageModel::Seedream4,
        overrides: None,
      },
      OmniGenImageProviderModelDetails {
        model: CommonImageModel::Seedream4p5,
        overrides: None,
      },
      OmniGenImageProviderModelDetails {
        model: CommonImageModel::Seedream5Lite,
        overrides: None,
      },
      OmniGenImageProviderModelDetails {
        model: CommonImageModel::NanoBanana,
        overrides: None,
      },
      OmniGenImageProviderModelDetails {
        model: CommonImageModel::NanoBanana2,
        overrides: None,
      },
      OmniGenImageProviderModelDetails {
        model: CommonImageModel::NanoBananaPro,
        overrides: None,
      },
    ],
  });

  providers
}
