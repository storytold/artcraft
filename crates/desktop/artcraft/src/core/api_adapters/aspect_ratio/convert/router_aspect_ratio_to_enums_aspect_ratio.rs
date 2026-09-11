use artcraft_router::api::router_aspect_ratio::RouterAspectRatio;
use enums::common::generation::common_aspect_ratio::CommonAspectRatio as EnumsCommonAspectRatio;

/// Map from the router's CommonAspectRatio to the enums crate's CommonAspectRatio.
pub fn router_aspect_ratio_to_enums_aspect_ratio(ratio: RouterAspectRatio) -> EnumsCommonAspectRatio {
  match ratio {
    RouterAspectRatio::Auto => EnumsCommonAspectRatio::Auto,
    RouterAspectRatio::Square => EnumsCommonAspectRatio::Square,
    RouterAspectRatio::WideThreeByTwo => EnumsCommonAspectRatio::WideThreeByTwo,
    RouterAspectRatio::WideFourByThree => EnumsCommonAspectRatio::WideFourByThree,
    RouterAspectRatio::WideFiveByFour => EnumsCommonAspectRatio::WideFiveByFour,
    RouterAspectRatio::WideSixteenByNine => EnumsCommonAspectRatio::WideSixteenByNine,
    RouterAspectRatio::WideTwentyOneByNine => EnumsCommonAspectRatio::WideTwentyOneByNine,
    RouterAspectRatio::TallTwoByThree => EnumsCommonAspectRatio::TallTwoByThree,
    RouterAspectRatio::TallThreeByFour => EnumsCommonAspectRatio::TallThreeByFour,
    RouterAspectRatio::TallFourByFive => EnumsCommonAspectRatio::TallFourByFive,
    RouterAspectRatio::TallNineBySixteen => EnumsCommonAspectRatio::TallNineBySixteen,
    RouterAspectRatio::TallNineByTwentyOne => EnumsCommonAspectRatio::TallNineByTwentyOne,
    RouterAspectRatio::Wide => EnumsCommonAspectRatio::Wide,
    RouterAspectRatio::Tall => EnumsCommonAspectRatio::Tall,
    RouterAspectRatio::Auto2k => EnumsCommonAspectRatio::Auto2k,
    RouterAspectRatio::Auto3k => EnumsCommonAspectRatio::Auto3k,
    RouterAspectRatio::Auto4k => EnumsCommonAspectRatio::Auto4k,
    RouterAspectRatio::SquareHd => EnumsCommonAspectRatio::SquareHd,
  }
}
