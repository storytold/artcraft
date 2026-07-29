use artcraft_api_defs::omni_gen::models::omni_gen_video_models::OmniGenVideoModelDetails;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::generation::model_creator::ModelCreator;

/// Sora (OpenAI) video models.
pub fn sora_video_models() -> Vec<OmniGenVideoModelDetails> {
  let mut models = Vec::new();

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
