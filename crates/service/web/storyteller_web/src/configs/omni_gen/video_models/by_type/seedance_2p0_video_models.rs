use artcraft_api_defs::omni_gen::models::omni_gen_video_models::OmniGenVideoModelDetails;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio;
use enums::common::generation::common_bitrate::CommonBitrate;
use enums::common::generation::common_resolution::CommonResolution;
use enums::common::generation::common_video_model::CommonVideoModel;
use enums::common::generation::model_creator::ModelCreator;

/// The Seedance 2.0 family of video models, in display order:
/// Seedance 2.0, Seedance 2.0 Fast, Seedance 2.0 BytePlus, Seedance 2.0 BytePlus
/// Fast, Seedance 2.0 BytePlus Ultra, Seedance 2.0 BytePlus Ultra Fast.
pub fn seedance_2p0_video_models() -> Vec<OmniGenVideoModelDetails> {
  let mut models = Vec::new();

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::Seedance2p0,
    model_creator: Some(ModelCreator::Bytedance),
    full_name: Some("Seedance 2.0".to_string()),
    extra_info: Some("The Chinese Volcengine (ByteDance China API platform) version of Seedance 2.0. Checkpoint is from January 2026. This may be better at some characters than the other Seedance models.".to_string()),
    extra_info_short: Some("Original Seedance 2.0".to_string()),
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
    bitrate_options: Some(vec![
      CommonBitrate::Normal,
      CommonBitrate::High,
    ]),
    bitrate_default: Some(CommonBitrate::Normal),
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
    extra_info: Some("The Chinese Volcengine (ByteDance China API platform) version of Seedance 2.0 Fast. Checkpoint is from January 2026. This may be better at some characters than the other Seedance models.".to_string()),
    extra_info_short: Some("Original Seedance 2.0 Fast".to_string()),
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
    bitrate_options: Some(vec![
      CommonBitrate::Normal,
      CommonBitrate::High,
    ]),
    bitrate_default: Some(CommonBitrate::Normal),
    batch_size_options: Some(vec![1, 2, 4]),
    batch_size_default: Some(1),
    duration_seconds_min: Some(4),
    duration_seconds_max: Some(15),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::Seedance2p0BytePlus,
    model_creator: Some(ModelCreator::Bytedance),
    full_name: Some("Seedance 2.0 Plus".to_string()),
    extra_info: Some("The Chinese BytePlus (ByteDance's Western API platform) version of Seedance 2.0. This has fewer restrictions on faces and IP.".to_string()),
    extra_info_short: Some("Seedance 2.0 (BytePlus version)".to_string()),
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
    character_references_supported: Some(false), // TODO
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
    bitrate_options: Some(vec![
      CommonBitrate::Normal,
      CommonBitrate::High,
    ]),
    bitrate_default: Some(CommonBitrate::Normal),
    batch_size_options: Some(vec![1, 2, 4]),
    batch_size_default: Some(1),
    duration_seconds_min: Some(4),
    duration_seconds_max: Some(15),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::Seedance2p0BytePlusFast,
    model_creator: Some(ModelCreator::Bytedance),
    full_name: Some("Seedance 2.0 Plus Fast".to_string()),
    extra_info: Some("The Chinese BytePlus (ByteDance's Western API platform) version of Seedance 2.0 Fast. This has fewer restrictions on faces and IP.".to_string()),
    extra_info_short: Some("Seedance 2.0 Fast (BytePlus version)".to_string()),
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
    character_references_supported: Some(false), // TODO
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
    bitrate_options: Some(vec![
      CommonBitrate::Normal,
      CommonBitrate::High,
    ]),
    bitrate_default: Some(CommonBitrate::Normal),
    batch_size_options: Some(vec![1, 2, 4]),
    batch_size_default: Some(1),
    duration_seconds_min: Some(4),
    duration_seconds_max: Some(15),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::Seedance2p0BytePlusUltra,
    model_creator: Some(ModelCreator::Bytedance),
    full_name: Some("Seedance 2.0 Plus Ultra".to_string()),
    extra_info: Some("This is the same BytePlus version of Seedance 2.0, but with even fewer restrictions around content. Horror movies, action movie violence, and more is possible.".to_string()),
    extra_info_short: Some("Seedance 2.0 (BytePlus version); less filtered".to_string()),
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
    character_references_supported: Some(false), // TODO
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
    bitrate_options: Some(vec![
      CommonBitrate::Normal,
      CommonBitrate::High,
    ]),
    bitrate_default: Some(CommonBitrate::Normal),
    batch_size_options: Some(vec![1, 2, 4]),
    batch_size_default: Some(1),
    duration_seconds_min: Some(4),
    duration_seconds_max: Some(15),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models.push(OmniGenVideoModelDetails {
    model: CommonVideoModel::Seedance2p0BytePlusUltraFast,
    model_creator: Some(ModelCreator::Bytedance),
    full_name: Some("Seedance 2.0 Plus Ultra Fast".to_string()),
    extra_info: Some("This is the same BytePlus version of Seedance 2.0 Fast, but with even fewer restrictions around content. Horror movies, action movie violence, and more is possible.".to_string()),
    extra_info_short: Some("Seedance 2.0 Fast (BytePlus version); less filtered".to_string()),
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
    character_references_supported: Some(false), // TODO
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
    bitrate_options: Some(vec![
      CommonBitrate::Normal,
      CommonBitrate::High,
    ]),
    batch_size_options: Some(vec![1, 2, 4]),
    batch_size_default: Some(1),
    duration_seconds_min: Some(4),
    duration_seconds_max: Some(15),
    duration_seconds_default: Some(5),
    ..Default::default()
  });

  models
}
