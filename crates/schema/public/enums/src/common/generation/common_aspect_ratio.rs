use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

use crate::error::enum_error::EnumError;

/// Maximum serialized string length for database storage.
pub const MAX_LENGTH: usize = 24;

/// Common aspect ratios for image and video generation.
///
/// NB: Keep the max serialized length to 24 characters.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
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
  #[serde(rename = "auto_2k")]
  Auto2k,
  #[serde(rename = "auto_4k")]
  Auto4k,
  SquareHd,
}

impl_enum_display_and_debug_using_to_str!(CommonAspectRatio);
impl_mysql_enum_coders!(CommonAspectRatio);
impl_mysql_from_row!(CommonAspectRatio);

impl CommonAspectRatio {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Auto => "auto",
      Self::Square => "square",
      Self::WideThreeByTwo => "wide_three_by_two",
      Self::WideFourByThree => "wide_four_by_three",
      Self::WideFiveByFour => "wide_five_by_four",
      Self::WideSixteenByNine => "wide_sixteen_by_nine",
      Self::WideTwentyOneByNine => "wide_twenty_one_by_nine",
      Self::TallTwoByThree => "tall_two_by_three",
      Self::TallThreeByFour => "tall_three_by_four",
      Self::TallFourByFive => "tall_four_by_five",
      Self::TallNineBySixteen => "tall_nine_by_sixteen",
      Self::TallNineByTwentyOne => "tall_nine_by_twenty_one",
      Self::Wide => "wide",
      Self::Tall => "tall",
      Self::Auto2k => "auto_2k",
      Self::Auto4k => "auto_4k",
      Self::SquareHd => "square_hd",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, EnumError> {
    match value {
      "auto" => Ok(Self::Auto),
      "square" => Ok(Self::Square),
      "wide_three_by_two" => Ok(Self::WideThreeByTwo),
      "wide_four_by_three" => Ok(Self::WideFourByThree),
      "wide_five_by_four" => Ok(Self::WideFiveByFour),
      "wide_sixteen_by_nine" => Ok(Self::WideSixteenByNine),
      "wide_twenty_one_by_nine" => Ok(Self::WideTwentyOneByNine),
      "tall_two_by_three" => Ok(Self::TallTwoByThree),
      "tall_three_by_four" => Ok(Self::TallThreeByFour),
      "tall_four_by_five" => Ok(Self::TallFourByFive),
      "tall_nine_by_sixteen" => Ok(Self::TallNineBySixteen),
      "tall_nine_by_twenty_one" => Ok(Self::TallNineByTwentyOne),
      "wide" => Ok(Self::Wide),
      "tall" => Ok(Self::Tall),
      "auto_2k" => Ok(Self::Auto2k),
      "auto_4k" => Ok(Self::Auto4k),
      "square_hd" => Ok(Self::SquareHd),
      _ => Err(EnumError::CouldNotConvertFromString(value.to_string())),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::Auto,
      Self::Square,
      Self::WideThreeByTwo,
      Self::WideFourByThree,
      Self::WideFiveByFour,
      Self::WideSixteenByNine,
      Self::WideTwentyOneByNine,
      Self::TallTwoByThree,
      Self::TallThreeByFour,
      Self::TallFourByFive,
      Self::TallNineBySixteen,
      Self::TallNineByTwentyOne,
      Self::Wide,
      Self::Tall,
      Self::Auto2k,
      Self::Auto4k,
      Self::SquareHd,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::common::generation::common_aspect_ratio::CommonAspectRatio;
  use crate::common::generation::common_aspect_ratio::MAX_LENGTH;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;
    use crate::error::enum_error::EnumError;

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
      assert_serialization(CommonAspectRatio::Auto2k, "auto_2k");
      assert_serialization(CommonAspectRatio::Auto4k, "auto_4k");
      assert_serialization(CommonAspectRatio::SquareHd, "square_hd");
    }

    #[test]
    fn to_str() {
      assert_eq!(CommonAspectRatio::Auto.to_str(), "auto");
      assert_eq!(CommonAspectRatio::Square.to_str(), "square");
      assert_eq!(CommonAspectRatio::WideThreeByTwo.to_str(), "wide_three_by_two");
      assert_eq!(CommonAspectRatio::WideFourByThree.to_str(), "wide_four_by_three");
      assert_eq!(CommonAspectRatio::WideFiveByFour.to_str(), "wide_five_by_four");
      assert_eq!(CommonAspectRatio::WideSixteenByNine.to_str(), "wide_sixteen_by_nine");
      assert_eq!(CommonAspectRatio::WideTwentyOneByNine.to_str(), "wide_twenty_one_by_nine");
      assert_eq!(CommonAspectRatio::TallTwoByThree.to_str(), "tall_two_by_three");
      assert_eq!(CommonAspectRatio::TallThreeByFour.to_str(), "tall_three_by_four");
      assert_eq!(CommonAspectRatio::TallFourByFive.to_str(), "tall_four_by_five");
      assert_eq!(CommonAspectRatio::TallNineBySixteen.to_str(), "tall_nine_by_sixteen");
      assert_eq!(CommonAspectRatio::TallNineByTwentyOne.to_str(), "tall_nine_by_twenty_one");
      assert_eq!(CommonAspectRatio::Wide.to_str(), "wide");
      assert_eq!(CommonAspectRatio::Tall.to_str(), "tall");
      assert_eq!(CommonAspectRatio::Auto2k.to_str(), "auto_2k");
      assert_eq!(CommonAspectRatio::Auto4k.to_str(), "auto_4k");
      assert_eq!(CommonAspectRatio::SquareHd.to_str(), "square_hd");
    }

    #[test]
    fn from_str() {
      assert_eq!(CommonAspectRatio::from_str("auto").unwrap(), CommonAspectRatio::Auto);
      assert_eq!(CommonAspectRatio::from_str("square").unwrap(), CommonAspectRatio::Square);
      assert_eq!(CommonAspectRatio::from_str("wide_three_by_two").unwrap(), CommonAspectRatio::WideThreeByTwo);
      assert_eq!(CommonAspectRatio::from_str("wide_four_by_three").unwrap(), CommonAspectRatio::WideFourByThree);
      assert_eq!(CommonAspectRatio::from_str("wide_five_by_four").unwrap(), CommonAspectRatio::WideFiveByFour);
      assert_eq!(CommonAspectRatio::from_str("wide_sixteen_by_nine").unwrap(), CommonAspectRatio::WideSixteenByNine);
      assert_eq!(CommonAspectRatio::from_str("wide_twenty_one_by_nine").unwrap(), CommonAspectRatio::WideTwentyOneByNine);
      assert_eq!(CommonAspectRatio::from_str("tall_two_by_three").unwrap(), CommonAspectRatio::TallTwoByThree);
      assert_eq!(CommonAspectRatio::from_str("tall_three_by_four").unwrap(), CommonAspectRatio::TallThreeByFour);
      assert_eq!(CommonAspectRatio::from_str("tall_four_by_five").unwrap(), CommonAspectRatio::TallFourByFive);
      assert_eq!(CommonAspectRatio::from_str("tall_nine_by_sixteen").unwrap(), CommonAspectRatio::TallNineBySixteen);
      assert_eq!(CommonAspectRatio::from_str("tall_nine_by_twenty_one").unwrap(), CommonAspectRatio::TallNineByTwentyOne);
      assert_eq!(CommonAspectRatio::from_str("wide").unwrap(), CommonAspectRatio::Wide);
      assert_eq!(CommonAspectRatio::from_str("tall").unwrap(), CommonAspectRatio::Tall);
      assert_eq!(CommonAspectRatio::from_str("auto_2k").unwrap(), CommonAspectRatio::Auto2k);
      assert_eq!(CommonAspectRatio::from_str("auto_4k").unwrap(), CommonAspectRatio::Auto4k);
      assert_eq!(CommonAspectRatio::from_str("square_hd").unwrap(), CommonAspectRatio::SquareHd);
    }

    #[test]
    fn from_str_err() {
      let result = CommonAspectRatio::from_str("invalid");
      assert!(result.is_err());
      if let Err(EnumError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "invalid");
      } else {
        panic!("Expected EnumError::CouldNotConvertFromString");
      }
    }

    #[test]
    fn all_variants() {
      let variants = CommonAspectRatio::all_variants();
      assert_eq!(variants.len(), 17);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(CommonAspectRatio::all_variants().len(), CommonAspectRatio::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in CommonAspectRatio::all_variants() {
        assert_eq!(variant, CommonAspectRatio::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, CommonAspectRatio::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, CommonAspectRatio::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      for variant in CommonAspectRatio::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long via to_str()", variant);
      }
      for variant in CommonAspectRatio::all_variants() {
        let json = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(json.len() <= MAX_LENGTH, "variant {:?} is too long via JSON: {:?}", variant, json);
      }
    }

    #[test]
    fn serialized_names_must_not_contain_dots() {
      for variant in CommonAspectRatio::all_variants() {
        let to_str_value = variant.to_str();
        assert!(!to_str_value.contains('.'), "to_str() for {:?} contains a dot: {:?}", variant, to_str_value);

        let json_value = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(!json_value.contains('.'), "JSON serialization for {:?} contains a dot: {:?}", variant, json_value);
      }
    }

    #[test]
    fn serialized_names_must_only_contain_lowercase_alphanumeric_and_underscore() {
      let valid_pattern = regex::Regex::new(r"^[a-z0-9_]+$").unwrap();

      for variant in CommonAspectRatio::all_variants() {
        let to_str_value = variant.to_str();
        assert!(valid_pattern.is_match(to_str_value),
          "to_str() for {:?} contains invalid characters: {:?} (only a-z, 0-9, _ allowed)", variant, to_str_value);

        let json_value = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(valid_pattern.is_match(&json_value),
          "JSON serialization for {:?} contains invalid characters: {:?} (only a-z, 0-9, _ allowed)", variant, json_value);
      }
    }
  }
}
