use artcraft_api_defs::omni_gen::models::omni_gen_video_models::OmniGenVideoModelDetails;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::generation::model_creator::ModelCreator;

/// Active Kling video models (shown in the list).
pub fn kling_video_models() -> Vec<OmniGenVideoModelDetails> {
  let mut models = Vec::new();

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::Kling16Pro,
    model_creator: Some(ModelCreator::Kling),
    full_name: Some("Kling 1.6 Pro".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(true),
    image_references_supported: Some(true), // NB: 1.6 Elements!
    image_references_max: Some(4), // NB: 1.6 Elements!
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    duration_seconds_options: Some(vec![5, 10]),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  // TODO: Kling 2.5 doesn't let you control aspect ratio for image-to-video
  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::Kling2p5TurboPro,
    model_creator: Some(ModelCreator::Kling),
    full_name: Some("Kling 2.5 Turbo Pro".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    duration_seconds_options: Some(vec![5, 10]),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  // TODO: Kling 2.6 doesn't let you control aspect ratio for image-to-video
  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::Kling2p6Pro,
    model_creator: Some(ModelCreator::Kling),
    full_name: Some("Kling 2.6 Pro".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    duration_seconds_options: Some(vec![5, 10]),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models
}

/// Disabled (coming-soon / hidden) Kling video models.
pub fn kling_disabled_video_models() -> Vec<OmniGenVideoModelDetails> {
  let mut models = Vec::new();

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

  models
}
