use artcraft_api_defs::omni_gen::models::omni_gen_video_models::OmniGenVideoModelDetails;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::generation::model_creator::ModelCreator;

/// MiniMax (Hailuo) video models.
pub fn minimax_video_models() -> Vec<OmniGenVideoModelDetails> {
  let mut models = Vec::new();

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::MinimaxH3,
    full_name: Some("MiniMax H3".to_string()),
    ..minimax_h3_shared_details()
  });

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::MinimaxH3Turbo,
    full_name: Some("MiniMax H3 Turbo".to_string()),
    ..minimax_h3_shared_details()
  });

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::MinimaxH3Ultra,
    full_name: Some("MiniMax H3 Ultra".to_string()),
    ..minimax_h3_shared_details()
  });

  models
}

/// Capabilities shared by the MiniMax H3 family (Turbo and Ultra are the same
/// underlying model at different priority tiers).
fn minimax_h3_shared_details() -> OmniGenVideoModelDetails {
  OmniGenVideoModelDetails {
    model: CommonVideoModel::MinimaxH3,
    model_creator: Some(ModelCreator::Hailuo),
    text_prompt_supported: Some(true),
    text_prompt_max_length: Some(7000),
    starting_keyframe_supported: Some(true),
    ending_keyframe_supported: Some(true),
    image_references_supported: Some(true),
    image_references_max: Some(9),
    video_references_supported: Some(true),
    video_references_max: Some(3),
    video_references_max_total_duration_seconds: Some(15),
    audio_references_supported: Some(true),
    audio_references_max: Some(3),
    audio_references_max_total_duration_seconds: Some(15),
    aspect_ratio_options: Some(vec![
      CommonAspectRatio::WideTwentyOneByNine,
      CommonAspectRatio::WideSixteenByNine,
      CommonAspectRatio::WideFourByThree,
      CommonAspectRatio::Square,
      CommonAspectRatio::TallThreeByFour,
      CommonAspectRatio::TallNineBySixteen,
    ]),
    aspect_ratio_default: Some(CommonAspectRatio::WideSixteenByNine),
    // The model renders 768P or 2K; 720p and below land on 768P, 1080p and
    // above land on 2K.
    resolution_options: Some(vec![
      CommonResolution::SevenTwentyP,
      CommonResolution::TwoK,
    ]),
    resolution_default: Some(CommonResolution::TwoK),
    duration_seconds_min: Some(5),
    duration_seconds_max: Some(15),
    duration_seconds_default: Some(5),
    ..Default::default()
  }
}
