use artcraft_api_defs::omni_gen::models::omni_gen_video_models::OmniGenVideoModelDetails;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::generation::model_creator::ModelCreator;

/// Grok Imagine video models.
pub fn grok_video_models() -> Vec<OmniGenVideoModelDetails> {
  let mut models = Vec::new();

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::GrokImagineVideo,
    model_creator: Some(ModelCreator::Grok),
    full_name: Some("Grok Imagine".to_string()),
    text_prompt_supported: Some(true),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(false),
    image_references_supported: Some(true),
    image_references_max: Some(7),
    //video_references_supported: Some(false),
    //video_references_max: Some(3),
    //video_references_max_total_duration_seconds: Some(15),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Auto,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::WideThreeByTwo,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallTwoByThree,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    resolution_options: Some(vec![
      CommonResolution::FourEightyP,
      CommonResolution::SevenTwentyP,
    ]),
    resolution_default: Some(CommonResolution::SevenTwentyP),
    //batch_size_options: Some(vec![1, 2, 4]),
    //batch_size_default: Some(1),
    duration_seconds_min: Some(1),
    duration_seconds_max: Some(15),
    duration_seconds_max_with_image_references: Some(10),
    duration_seconds_default: Some(8),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::GrokImagineVideo1p5,
    model_creator: Some(ModelCreator::Grok),
    full_name: Some("Grok Imagine 1.5 Preview".to_string()),
    extra_info: Some("Fast and high quality".to_string()),
    extra_info_short: Some("Fast and high quality".to_string()),
    text_to_video_supported: Some(false), // NB: This might be temporary
    text_prompt_supported: Some(true),
    text_prompt_max_length: Some(4096),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(false),
    image_references_supported: Some(false),
    //image_references_max: Some(7),
    //video_references_supported: Some(false),
    //video_references_max: Some(3),
    //video_references_max_total_duration_seconds: Some(15),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::Auto,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::WideThreeByTwo,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallTwoByThree,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    resolution_options: Some(vec![
      CommonResolution::FourEightyP,
      CommonResolution::SevenTwentyP,
    ]),
    resolution_default: Some(CommonResolution::SevenTwentyP),
    //batch_size_options: Some(vec![1, 2, 4]),
    //batch_size_default: Some(1),
    duration_seconds_min: Some(1),
    duration_seconds_max: Some(15),
    duration_seconds_max_with_image_references: Some(10),
    duration_seconds_default: Some(8),
    ..Default::default()
  });

  models
}
