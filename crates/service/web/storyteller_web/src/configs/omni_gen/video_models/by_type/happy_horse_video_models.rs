use artcraft_api_defs::omni_gen::models::omni_gen_video_models::OmniGenVideoModelDetails;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::generation::model_creator::ModelCreator;

/// Happy Horse video models.
pub fn happy_horse_video_models() -> Vec<OmniGenVideoModelDetails> {
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

  models
}
