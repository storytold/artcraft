use strum::EnumIter;
use utoipa::ToSchema;

/// Common aspect ratios for video generation.
/// Mirrors artcraft_router::api::common_aspect_ratio::CommonAspectRatio.
#[derive(Copy, Clone, Debug, PartialEq, Serialize, Deserialize, ToSchema, EnumIter)]
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
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

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
    fn test_deserialization() {
      assert_deserialization("auto", CommonAspectRatio::Auto);
      assert_deserialization("square", CommonAspectRatio::Square);
      assert_deserialization("wide_three_by_two", CommonAspectRatio::WideThreeByTwo);
      assert_deserialization("wide_four_by_three", CommonAspectRatio::WideFourByThree);
      assert_deserialization("wide_five_by_four", CommonAspectRatio::WideFiveByFour);
      assert_deserialization("wide_sixteen_by_nine", CommonAspectRatio::WideSixteenByNine);
      assert_deserialization("wide_twenty_one_by_nine", CommonAspectRatio::WideTwentyOneByNine);
      assert_deserialization("tall_two_by_three", CommonAspectRatio::TallTwoByThree);
      assert_deserialization("tall_three_by_four", CommonAspectRatio::TallThreeByFour);
      assert_deserialization("tall_four_by_five", CommonAspectRatio::TallFourByFive);
      assert_deserialization("tall_nine_by_sixteen", CommonAspectRatio::TallNineBySixteen);
      assert_deserialization("tall_nine_by_twenty_one", CommonAspectRatio::TallNineByTwentyOne);
      assert_deserialization("wide", CommonAspectRatio::Wide);
      assert_deserialization("tall", CommonAspectRatio::Tall);
      assert_deserialization("auto2k", CommonAspectRatio::Auto2k);
      assert_deserialization("auto4k", CommonAspectRatio::Auto4k);
      assert_deserialization("square_hd", CommonAspectRatio::SquareHd);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(CommonAspectRatio::iter().count(), 17);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in CommonAspectRatio::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: CommonAspectRatio = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
