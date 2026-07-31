use artcraft_api_defs::omni_gen::models::omni_gen_video_models::OmniGenVideoModelDetails;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::generation::model_creator::ModelCreator;

/// The Seedance 2.5 family of video models.
pub fn seedance_2p5_video_models() -> Vec<OmniGenVideoModelDetails> {
  let mut models = Vec::new();

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::Seedance2p5Preview,
    model_creator: Some(ModelCreator::Bytedance),
    full_name: Some("Seedance 2.5 Preview".to_string()),
    extra_info: Some("A preview of Seedance 2.5. Supports videos up to 30 seconds and up to 30 reference images, but only reference mode (no start/end keyframes) and 480p/720p output.".to_string()),
    extra_info_short: Some("Seedance 2.5 preview; up to 30s videos".to_string()),
    text_prompt_supported: Some(true),
    text_prompt_max_length: Some(10_000),
    starting_keyframe_supported: Some(false),
    ending_keyframe_supported: Some(false),
    image_references_supported: Some(true),
    image_references_max: Some(30),
    audio_references_supported: Some(true),
    audio_references_max: Some(10),
    audio_references_max_total_duration_seconds: Some(30),
    video_references_supported: Some(true),
    video_references_max: Some(10),
    video_references_max_total_duration_seconds: Some(30),
    character_references_supported: Some(false),
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
    batch_size_options: Some(vec![1]),
    batch_size_default: Some(1),
    duration_seconds_min: Some(4),
    duration_seconds_max: Some(30),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models
}
