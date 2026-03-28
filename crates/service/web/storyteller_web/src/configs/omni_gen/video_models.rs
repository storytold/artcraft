use artcraft_api_defs::omni_gen::models::omni_gen_video_models::{OmniGenVideoModelDetails, OmniGenVideoModelProviderDetails, OmniGenVideoModelsResponse, OmniGenVideoProviderModelDetails};
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;
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
    model: CommonVideoModel::Seedance1p5Pro,
    full_name: None,
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
    batch_size_min: Some(1),
    batch_size_max: Some(4),
    batch_size_default: Some(4),
    duration_seconds_min: Some(4),
    duration_seconds_max: Some(12),
    duration_seconds_default: Some(8),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::Seedance2p0,
    full_name: None,
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
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    batch_size_options: Some(vec![1, 2, 4]),
    batch_size_default: Some(1),
    duration_seconds_min: Some(4),
    duration_seconds_max: Some(15),
    duration_seconds_default: Some(5),
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
    ],
  });

  providers
}
