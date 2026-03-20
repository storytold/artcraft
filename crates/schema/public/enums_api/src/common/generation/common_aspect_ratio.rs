#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Common aspect ratios for video generation.
/// Mirrors artcraft_router::api::common_aspect_ratio::CommonAspectRatio.
#[cfg_attr(test, derive(EnumIter))]
#[derive(Copy, Clone, Debug, PartialEq, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum CommonAspectRatio {
  Auto,
  Square,
  WideThreeByTwo,
  WideFourByThree,
  WideFiveByFour,
  WideSixteenByNine,
  WideTwentyOneByNine,
  TallTwoByThree,
  TallThreeByFour,
  TallFourByFive,
  TallNineBySixteen,
  TallNineByTwentyOne,
  Wide,
  Tall,
  Auto2k,
  Auto4k,
  SquareHd,
}

#[cfg(test)]
mod tests {
  use super::CommonAspectRatio;
  use enums_shared::test_helpers::assert_serialization;

  #[test]
  fn test_serialization() {
    assert_serialization(CommonAspectRatio::Auto, "auto");
    assert_serialization(CommonAspectRatio::Square, "square");
    assert_serialization(CommonAspectRatio::WideThreeByTwo, "wide_three_by_two");
    assert_serialization(CommonAspectRatio::WideFourByThree, "wide_four_by_three");
    assert_serialization(CommonAspectRatio::WideFiveByFour, "wide_five_by_four");
    assert_serialization(CommonAspectRatio::WideSixteenByNine, "wide_sixteen_by_nine");
    assert_serialization(CommonAspectRatio::WideTwentyOneByNine, "wide_twenty_one_by_nine");
    assert_serialization(CommonAspectRatio::TallTwoByThree, "tall_two_by_three");
    assert_serialization(CommonAspectRatio::TallThreeByFour, "tall_three_by_four");
    assert_serialization(CommonAspectRatio::TallFourByFive, "tall_four_by_five");
    assert_serialization(CommonAspectRatio::TallNineBySixteen, "tall_nine_by_sixteen");
    assert_serialization(CommonAspectRatio::TallNineByTwentyOne, "tall_nine_by_twenty_one");
    assert_serialization(CommonAspectRatio::Wide, "wide");
    assert_serialization(CommonAspectRatio::Tall, "tall");
    assert_serialization(CommonAspectRatio::Auto2k, "auto2k");
    assert_serialization(CommonAspectRatio::Auto4k, "auto4k");
    assert_serialization(CommonAspectRatio::SquareHd, "square_hd");
  }

  #[test]
  fn round_trip_json() {
    use strum::IntoEnumIterator;
    for variant in CommonAspectRatio::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: CommonAspectRatio = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
