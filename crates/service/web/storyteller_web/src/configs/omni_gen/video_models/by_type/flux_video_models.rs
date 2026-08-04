use artcraft_api_defs::omni_gen::models::omni_gen_video_models::OmniGenVideoModelDetails;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::generation::model_creator::ModelCreator;

/// Black Forest Labs Flux video models.
///
/// Both variants cover the same five fal modalities: text, image, first-last
/// frame, keyframes (mapped from image references, evenly spaced), and extend
/// (mapped from a single video reference).
pub fn flux_video_models() -> Vec<OmniGenVideoModelDetails> {
  let mut models = Vec::new();

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::Flux3,
    model_creator: Some(ModelCreator::BlackForestLabs),
    full_name: Some("Flux 3".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(true),
    image_references_supported: Some(true),
    image_references_max: Some(10),
    video_references_supported: Some(true),
    video_references_max: Some(1),
    show_generate_with_sound_toggle: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Auto,
      CommonAspectRatio::WideTwentyOneByNine,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::Auto),
    resolution_options: Some(vec![
      CommonResolution::SevenTwentyP,
      CommonResolution::TenEightyP,
    ]),
    resolution_default: Some(CommonResolution::SevenTwentyP),
    duration_seconds_min: Some(5),
    duration_seconds_max: Some(20),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::Flux3Draft,
    model_creator: Some(ModelCreator::BlackForestLabs),
    full_name: Some("Flux 3 Draft".to_string()),
    extra_info_short: Some("Fast low-cost drafts".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(true),
    image_references_supported: Some(true),
    image_references_max: Some(10),
    video_references_supported: Some(true),
    video_references_max: Some(1),
    show_generate_with_sound_toggle: Some(true),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Auto,
      CommonAspectRatio::WideTwentyOneByNine,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::Auto),
    // Drafts always render 720p.
    resolution_options: Some(vec![
      CommonResolution::SevenTwentyP,
    ]),
    resolution_default: Some(CommonResolution::SevenTwentyP),
    duration_seconds_min: Some(5),
    duration_seconds_max: Some(20),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models
}
