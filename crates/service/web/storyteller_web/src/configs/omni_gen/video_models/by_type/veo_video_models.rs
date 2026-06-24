use artcraft_api_defs::omni_gen::models::omni_gen_video_models::OmniGenVideoModelDetails;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::generation::model_creator::ModelCreator;

/// Veo (Google) video models.
pub fn veo_video_models() -> Vec<OmniGenVideoModelDetails> {
  let mut models = Vec::new();

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

  models
}
