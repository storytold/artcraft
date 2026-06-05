use artcraft_router::api::router_aspect_ratio::RouterAspectRatio;
use artcraft_router::api::router_quality::RouterQuality;
use artcraft_router::api::router_resolution::RouterResolution;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio as EnumsAspectRatio;
use enums::common::generation::common_quality::CommonQuality as EnumsQuality;
use enums::common::generation::common_resolution::CommonResolution as EnumsResolution;

pub fn convert_aspect_ratio(value: EnumsAspectRatio) -> RouterAspectRatio {
  match value {
    EnumsAspectRatio::Auto => RouterAspectRatio::Auto,
    EnumsAspectRatio::Square => RouterAspectRatio::Square,
    EnumsAspectRatio::WideThreeByTwo => RouterAspectRatio::WideThreeByTwo,
    EnumsAspectRatio::WideFourByThree => RouterAspectRatio::WideFourByThree,
    EnumsAspectRatio::WideFiveByFour => RouterAspectRatio::WideFiveByFour,
    EnumsAspectRatio::WideSixteenByNine => RouterAspectRatio::WideSixteenByNine,
    EnumsAspectRatio::WideTwentyOneByNine => RouterAspectRatio::WideTwentyOneByNine,
    EnumsAspectRatio::TallTwoByThree => RouterAspectRatio::TallTwoByThree,
    EnumsAspectRatio::TallThreeByFour => RouterAspectRatio::TallThreeByFour,
    EnumsAspectRatio::TallFourByFive => RouterAspectRatio::TallFourByFive,
    EnumsAspectRatio::TallNineBySixteen => RouterAspectRatio::TallNineBySixteen,
    EnumsAspectRatio::TallNineByTwentyOne => RouterAspectRatio::TallNineByTwentyOne,
    EnumsAspectRatio::Wide => RouterAspectRatio::Wide,
    EnumsAspectRatio::Tall => RouterAspectRatio::Tall,
    EnumsAspectRatio::Auto2k => RouterAspectRatio::Auto2k,
    EnumsAspectRatio::Auto3k => RouterAspectRatio::Auto3k,
    EnumsAspectRatio::Auto4k => RouterAspectRatio::Auto4k,
    EnumsAspectRatio::SquareHd => RouterAspectRatio::SquareHd,
  }
}

pub fn convert_quality(value: EnumsQuality) -> RouterQuality {
  match value {
    EnumsQuality::High => RouterQuality::High,
    EnumsQuality::Medium => RouterQuality::Medium,
    EnumsQuality::Low => RouterQuality::Low,
  }
}

pub fn convert_resolution(value: EnumsResolution) -> RouterResolution {
  match value {
    EnumsResolution::OneK => RouterResolution::OneK,
    EnumsResolution::TwoK => RouterResolution::TwoK,
    EnumsResolution::ThreeK => RouterResolution::ThreeK,
    EnumsResolution::FourK => RouterResolution::FourK,
    EnumsResolution::HalfK => RouterResolution::HalfK,
    EnumsResolution::FourEightyP => RouterResolution::FourEightyP,
    EnumsResolution::SevenTwentyP => RouterResolution::SevenTwentyP,
    EnumsResolution::TenEightyP => RouterResolution::TenEightyP,
  }
}
