use artcraft_api_defs::omni_gen::models::omni_gen_video_models::{OmniGenVideoModelDetails, OmniGenVideoModelProviderDetails, OmniGenVideoModelsResponse, OmniGenVideoProviderModelDetails};
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::generation::model_creator::ModelCreator;
use enums::common::generation_provider::GenerationProvider;
use once_cell::sync::Lazy;

pub const OMNI_GEN_VIDEO_MODELS_AND_PROVIDERS: Lazy<OmniGenVideoModelsResponse> = Lazy::new(|| {
  let models = build_omni_gen_video_models();
  let providers= build_omni_gen_video_model_providers();
  OmniGenVideoModelsResponse {
    success: true,
    models,
    providers,
  }
});

fn build_omni_gen_video_models() -> Vec<OmniGenVideoModelDetails> {
  let mut models = Vec::new();

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::HappyHorse1p0,
    model_creator: Some(ModelCreator::Alibaba),
    full_name: Some("Happy Horse 1.0".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    resolution_options: Some(vec![
      CommonResolution::SevenTwentyP,
      CommonResolution::TenEightyP,
    ]),
    resolution_default: Some(CommonResolution::SevenTwentyP),
    batch_size_options: Some(vec![1, 2, 4]),
    batch_size_default: Some(1),
    duration_seconds_min: Some(3),
    duration_seconds_max: Some(15),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::Seedance1p5Pro,
    model_creator: Some(ModelCreator::Bytedance),
    full_name: Some("Seedance 1.5 Pro".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(true),
    show_generate_with_sound_toggle: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::WideTwentyOneByNine,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallNineBySixteen,
      CommonAspectRatio::Auto,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    resolution_options: Some(vec![
      CommonResolution::FourEightyP,
      CommonResolution::SevenTwentyP,
      CommonResolution::TenEightyP,
    ]),
    resolution_default: Some(CommonResolution::TenEightyP),
    duration_seconds_min: Some(4),
    duration_seconds_max: Some(12),
    duration_seconds_default: Some(8),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::Seedance2p0,
    model_creator: Some(ModelCreator::Bytedance),
    full_name: Some("Seedance 2.0".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(true),
    image_references_supported: Some(true),
    image_references_max: Some(9),
    audio_references_supported: Some(true),
    audio_references_max: Some(3),
    audio_references_max_total_duration_seconds: Some(15),
    video_references_supported: Some(true),
    video_references_max: Some(3),
    video_references_max_total_duration_seconds: Some(15),
    character_references_supported: Some(true),
    character_references_max: Some(9),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::WideTwentyOneByNine,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    resolution_options: Some(vec![
      CommonResolution::FourEightyP,
      CommonResolution::SevenTwentyP,
      CommonResolution::TenEightyP,
    ]),
    resolution_default: Some(CommonResolution::SevenTwentyP),
    batch_size_options: Some(vec![1, 2, 4]),
    batch_size_default: Some(1),
    duration_seconds_min: Some(4),
    duration_seconds_max: Some(15),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::Seedance2p0Fast,
    model_creator: Some(ModelCreator::Bytedance),
    full_name: Some("Seedance 2.0 Fast".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(true),
    image_references_supported: Some(true),
    image_references_max: Some(9),
    audio_references_supported: Some(true),
    audio_references_max: Some(3),
    audio_references_max_total_duration_seconds: Some(15),
    video_references_supported: Some(true),
    video_references_max: Some(3),
    video_references_max_total_duration_seconds: Some(15),
    character_references_supported: Some(true),
    character_references_max: Some(9),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::WideTwentyOneByNine,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    resolution_options: Some(vec![
      CommonResolution::FourEightyP,
      CommonResolution::SevenTwentyP,
    ]),
    resolution_default: Some(CommonResolution::SevenTwentyP),
    batch_size_options: Some(vec![1, 2, 4]),
    batch_size_default: Some(1),
    duration_seconds_min: Some(4),
    duration_seconds_max: Some(15),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

//  models.push(OmniGenVideoModelDetails {
//    model: CommonVideoModel::Seedance2p0Global,
//    model_creator: Some(ModelCreator::Bytedance),
//    full_name: Some("Seedance 2.0 (Global)".to_string()),
//    text_prompt_supported: Some(true),
//    starting_keyframe_supported: Some(true),
//    ending_keyframe_supported: Some(true),
//    image_references_supported: Some(true),
//    image_references_max: Some(9),
//    audio_references_supported: Some(true),
//    audio_references_max: Some(3),
//    audio_references_max_total_duration_seconds: Some(15),
//    video_references_supported: Some(true),
//    video_references_max: Some(3),
//    video_references_max_total_duration_seconds: Some(15),
//    character_references_supported: Some(true),
//    character_references_max: Some(9),
//    aspect_ratio_options: Some(vec![
//      CommonAspectRatio::WideTwentyOneByNine,
//      CommonAspectRatio::WideSixteenByNine,
//      CommonAspectRatio::WideFourByThree,
//      CommonAspectRatio::Square,
//      CommonAspectRatio::TallThreeByFour,
//      CommonAspectRatio::TallNineBySixteen,
//    ]),
//    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
//    resolution_options: Some(vec![
//      CommonResolution::FourEightyP,
//      CommonResolution::SevenTwentyP,
//      CommonResolution::TenEightyP,
//    ]),
//    resolution_default: Some(CommonResolution::SevenTwentyP),
//    batch_size_options: Some(vec![1, 2, 4]),
//    batch_size_default: Some(1),
//    duration_seconds_min: Some(4),
//    duration_seconds_max: Some(15),
//    duration_seconds_default: Some(5),
//    ..Default::default()
//  });
//
//  models.push(OmniGenVideoModelDetails {
//    model: CommonVideoModel::Seedance2p0FastGlobal,
//    model_creator: Some(ModelCreator::Bytedance),
//    full_name: Some("Seedance 2.0 Fast (Global)".to_string()),
//    text_prompt_supported: Some(true),
//    starting_keyframe_supported: Some(true),
//    ending_keyframe_supported: Some(true),
//    image_references_supported: Some(true),
//    image_references_max: Some(9),
//    audio_references_supported: Some(true),
//    audio_references_max: Some(3),
//    audio_references_max_total_duration_seconds: Some(15),
//    video_references_supported: Some(true),
//    video_references_max: Some(3),
//    video_references_max_total_duration_seconds: Some(15),
//    character_references_supported: Some(true),
//    character_references_max: Some(9),
//    aspect_ratio_options: Some(vec![
//      CommonAspectRatio::WideTwentyOneByNine,
//      CommonAspectRatio::WideSixteenByNine,
//      CommonAspectRatio::WideFourByThree,
//      CommonAspectRatio::Square,
//      CommonAspectRatio::TallThreeByFour,
//      CommonAspectRatio::TallNineBySixteen,
//    ]),
//    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
//    resolution_options: Some(vec![
//      CommonResolution::FourEightyP,
//      CommonResolution::SevenTwentyP,
//    ]),
//    resolution_default: Some(CommonResolution::SevenTwentyP),
//    batch_size_options: Some(vec![1, 2, 4]),
//    batch_size_default: Some(1),
//    duration_seconds_min: Some(4),
//    duration_seconds_max: Some(15),
//    duration_seconds_default: Some(5),
//    ..Default::default()
//  });

  // TODO(bt,2026-04-10): Veo 2 image-to-video doesn't support aspect ratio
  models.push(OmniGenVideoModelDetails {
    is_disabled: Some(true), // TODO: Temporarily disable
    model: CommonVideoModel::Veo2,
    model_creator: Some(ModelCreator::Google),
    full_name: Some("Veo 2".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    // TODO(bt,2026-04-10): Veo 2 image-to-video doesn't support aspect ratio
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Auto,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    duration_seconds_min: Some(5),
    duration_seconds_max: Some(8),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    is_disabled: Some(true), // TODO: Temporarily disable
    model: CommonVideoModel::Veo3,
    model_creator: Some(ModelCreator::Google),
    full_name: Some("Veo 3".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    show_generate_with_sound_toggle: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::TallNineBySixteen,
      CommonAspectRatio::Auto, // TODO: Only for image-to-video
    ]),
    // TODO: image-to-video aspect ratio options
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    resolution_options: Some(vec![
      CommonResolution::SevenTwentyP,
      CommonResolution::TenEightyP,
    ]),
    resolution_default: Some(CommonResolution::TenEightyP),
    duration_seconds_min: Some(4),
    duration_seconds_max: Some(8),
    duration_seconds_default: Some(8),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::Veo3Fast,
    model_creator: Some(ModelCreator::Google),
    full_name: Some("Veo 3 Fast".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    show_generate_with_sound_toggle: Some(true),
    resolution_options: Some(vec![
      CommonResolution::SevenTwentyP,
      CommonResolution::TenEightyP,
    ]),
    resolution_default: Some(CommonResolution::TenEightyP),
    duration_seconds_min: Some(4),
    duration_seconds_max: Some(8),
    duration_seconds_default: Some(8),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    is_disabled: Some(true), // TODO: Temporarily disable
    model: CommonVideoModel::Veo3p1,
    model_creator: Some(ModelCreator::Google),
    full_name: Some("Veo 3.1".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(true),
    show_generate_with_sound_toggle: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Auto,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    resolution_options: Some(vec![
      CommonResolution::SevenTwentyP,
      CommonResolution::TenEightyP,
    ]),
    resolution_default: Some(CommonResolution::TenEightyP),
    duration_seconds_min: Some(4),
    duration_seconds_max: Some(8),
    duration_seconds_default: Some(8),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    is_disabled: Some(true), // TODO: Temporarily disable
    model: CommonVideoModel::Veo3p1Fast,
    model_creator: Some(ModelCreator::Google),
    full_name: Some("Veo 3.1 Fast".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(true),
    show_generate_with_sound_toggle: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Auto,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    resolution_options: Some(vec![
      CommonResolution::SevenTwentyP,
      CommonResolution::TenEightyP,
    ]),
    resolution_default: Some(CommonResolution::TenEightyP),
    duration_seconds_min: Some(4),
    duration_seconds_max: Some(8),
    duration_seconds_default: Some(8),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    is_disabled: Some(true), // TODO: Temporarily disable
    model: CommonVideoModel::Kling16Pro,
    model_creator: Some(ModelCreator::Kling),
    full_name: Some("Kling 1.6 Pro".to_string()),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Square,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    duration_seconds_options: Some(vec![5, 10]),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    is_disabled: Some(true), // TODO: Temporarily disable
    model: CommonVideoModel::Kling21Pro,
    model_creator: Some(ModelCreator::Kling),
    full_name: Some("Kling 2.1 Pro".to_string()),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Square,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    duration_seconds_options: Some(vec![5, 10]),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    is_disabled: Some(true), // TODO: Temporarily disable
    model: CommonVideoModel::Kling21Master,
    model_creator: Some(ModelCreator::Kling),
    full_name: Some("Kling 2.1 Master".to_string()),
    starting_keyframe_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Square,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    duration_seconds_options: Some(vec![5, 10]),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    is_disabled: Some(true), // TODO: Temporarily disable
    model: CommonVideoModel::Kling2p5TurboPro,
    model_creator: Some(ModelCreator::Kling),
    full_name: Some("Kling 2.5 Turbo Pro".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Square,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    duration_seconds_options: Some(vec![5, 10]),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    is_disabled: Some(true), // TODO: Temporarily disable
    model: CommonVideoModel::Kling2p6Pro,
    model_creator: Some(ModelCreator::Kling),
    full_name: Some("Kling 2.6 Pro".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    show_generate_with_sound_toggle: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Square,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    duration_seconds_options: Some(vec![5, 10]),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    is_disabled: Some(true), // TODO: Temporarily disable
    model: CommonVideoModel::Kling3p0Pro,
    model_creator: Some(ModelCreator::Kling),
    full_name: Some("Kling 3.0 Pro".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(true),
    show_generate_with_sound_toggle: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Square,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    duration_seconds_min: Some(3),
    duration_seconds_max: Some(15),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    is_disabled: Some(true), // TODO: Temporarily disable
    model: CommonVideoModel::Kling3p0Standard,
    model_creator: Some(ModelCreator::Kling),
    full_name: Some("Kling 3.0 Standard".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(true),
    show_generate_with_sound_toggle: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Square,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    duration_seconds_min: Some(3),
    duration_seconds_max: Some(15),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    is_disabled: Some(true), // TODO: Temporarily disable
    model: CommonVideoModel::Seedance10Lite,
    model_creator: Some(ModelCreator::Bytedance),
    full_name: Some("Seedance 1.0 Lite".to_string()),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Auto,
      CommonAspectRatio::WideTwentyOneByNine,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    resolution_options: Some(vec![
      CommonResolution::FourEightyP,
      CommonResolution::SevenTwentyP,
      CommonResolution::TenEightyP,
    ]),
    resolution_default: Some(CommonResolution::SevenTwentyP),
    duration_seconds_options: Some(vec![5, 10]),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    is_disabled: Some(true), // TODO: Temporarily disable
    model: CommonVideoModel::Sora2,
    model_creator: Some(ModelCreator::OpenAi),
    full_name: Some("Sora 2".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    resolution_options: Some(vec![CommonResolution::SevenTwentyP]),
    resolution_default: Some(CommonResolution::SevenTwentyP),
    duration_seconds_options: Some(vec![4, 8, 12]),
    duration_seconds_default: Some(4),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    is_disabled: Some(true), // TODO: Temporarily disable
    model: CommonVideoModel::Sora2Pro,
    model_creator: Some(ModelCreator::OpenAi),
    full_name: Some("Sora 2 Pro".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    resolution_options: Some(vec![
      CommonResolution::SevenTwentyP,
      CommonResolution::TenEightyP,
    ]),
    resolution_default: Some(CommonResolution::TenEightyP),
    duration_seconds_options: Some(vec![4, 8, 12]),
    duration_seconds_default: Some(4),
    ..Default::default()
  });

  models
}

fn build_omni_gen_video_model_providers() -> Vec<OmniGenVideoModelProviderDetails> {
  let mut providers = Vec::new();

  providers.push(OmniGenVideoModelProviderDetails {
    provider: GenerationProvider::Artcraft,
    models: vec![
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Seedance1p5Pro,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Seedance2p0,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Seedance10Lite,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Sora2,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Sora2Pro,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Veo2,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Veo3,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Veo3Fast,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Veo3p1,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Veo3p1Fast,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Kling16Pro,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Kling21Pro,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Kling21Master,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Kling2p5TurboPro,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Kling2p6Pro,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Kling3p0Pro,
        overrides: None,
      },
      OmniGenVideoProviderModelDetails {
        model: CommonVideoModel::Kling3p0Standard,
        overrides: None,
      },
    ],
  });

  providers
}
