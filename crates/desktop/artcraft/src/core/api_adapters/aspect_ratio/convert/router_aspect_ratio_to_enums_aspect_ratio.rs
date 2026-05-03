use artcraft_router::api::common_aspect_ratio::CommonAspectRatio as RouterCommonAspectRatio;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio as EnumsCommonAspectRatio;

/// Map from the router's CommonAspectRatio to the enums crate's CommonAspectRatio.
pub fn router_aspect_ratio_to_enums_aspect_ratio(ratio: RouterCommonAspectRatio) -> EnumsCommonAspectRatio {
  match ratio {
    RouterCommonAspectRatio::Auto => EnumsCommonAspectRatio::Auto,
    RouterCommonAspectRatio::Square => EnumsCommonAspectRatio::Square,
    RouterCommonAspectRatio::WideThreeByTwo => EnumsCommonAspectRatio::WideThreeByTwo,
    RouterCommonAspectRatio::WideFourByThree => EnumsCommonAspectRatio::WideFourByThree,
    RouterCommonAspectRatio::WideFiveByFour => EnumsCommonAspectRatio::WideFiveByFour,
    RouterCommonAspectRatio::WideSixteenByNine => EnumsCommonAspectRatio::WideSixteenByNine,
    RouterCommonAspectRatio::WideTwentyOneByNine => EnumsCommonAspectRatio::WideTwentyOneByNine,
    RouterCommonAspectRatio::TallTwoByThree => EnumsCommonAspectRatio::TallTwoByThree,
    RouterCommonAspectRatio::TallThreeByFour => EnumsCommonAspectRatio::TallThreeByFour,
    RouterCommonAspectRatio::TallFourByFive => EnumsCommonAspectRatio::TallFourByFive,
    RouterCommonAspectRatio::TallNineBySixteen => EnumsCommonAspectRatio::TallNineBySixteen,
    RouterCommonAspectRatio::TallNineByTwentyOne => EnumsCommonAspectRatio::TallNineByTwentyOne,
    RouterCommonAspectRatio::Wide => EnumsCommonAspectRatio::Wide,
    RouterCommonAspectRatio::Tall => EnumsCommonAspectRatio::Tall,
    RouterCommonAspectRatio::Auto2k => EnumsCommonAspectRatio::Auto2k,
    RouterCommonAspectRatio::Auto3k => EnumsCommonAspectRatio::Auto3k,
    RouterCommonAspectRatio::Auto4k => EnumsCommonAspectRatio::Auto4k,
    RouterCommonAspectRatio::SquareHd => EnumsCommonAspectRatio::SquareHd,
  }
}
