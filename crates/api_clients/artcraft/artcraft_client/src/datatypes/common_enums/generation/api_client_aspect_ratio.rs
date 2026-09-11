use serde_derive::{Deserialize, Serialize};

/// Forward-compatible, self-contained API-client copy of the server's `CommonAspectRatio` enum.
///
/// Serialized as a string. Any value this client build does not recognize is preserved
/// verbatim in [`Unknown`], so newer server variants never break deserialization and
/// still round-trip back to the original string.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(from = "String", into = "String")]
pub enum ApiClientAspectRatio {
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
  Auto3k,
  Auto4k,
  SquareHd,
  /// A value not known to this client build (preserved as-is).
  Unknown(String),
}

impl From<String> for ApiClientAspectRatio {
  fn from(value: String) -> Self {
    match value.as_str() {
      "auto" => Self::Auto,
      "square" => Self::Square,
      "wide_three_by_two" => Self::WideThreeByTwo,
      "wide_four_by_three" => Self::WideFourByThree,
      "wide_five_by_four" => Self::WideFiveByFour,
      "wide_sixteen_by_nine" => Self::WideSixteenByNine,
      "wide_twenty_one_by_nine" => Self::WideTwentyOneByNine,
      "tall_two_by_three" => Self::TallTwoByThree,
      "tall_three_by_four" => Self::TallThreeByFour,
      "tall_four_by_five" => Self::TallFourByFive,
      "tall_nine_by_sixteen" => Self::TallNineBySixteen,
      "tall_nine_by_twenty_one" => Self::TallNineByTwentyOne,
      "wide" => Self::Wide,
      "tall" => Self::Tall,
      "auto_2k" => Self::Auto2k,
      "auto_3k" => Self::Auto3k,
      "auto_4k" => Self::Auto4k,
      "square_hd" => Self::SquareHd,
      _ => Self::Unknown(value),
    }
  }
}

impl From<ApiClientAspectRatio> for String {
  fn from(value: ApiClientAspectRatio) -> Self {
    match value {
      ApiClientAspectRatio::Auto => "auto".to_string(),
      ApiClientAspectRatio::Square => "square".to_string(),
      ApiClientAspectRatio::WideThreeByTwo => "wide_three_by_two".to_string(),
      ApiClientAspectRatio::WideFourByThree => "wide_four_by_three".to_string(),
      ApiClientAspectRatio::WideFiveByFour => "wide_five_by_four".to_string(),
      ApiClientAspectRatio::WideSixteenByNine => "wide_sixteen_by_nine".to_string(),
      ApiClientAspectRatio::WideTwentyOneByNine => "wide_twenty_one_by_nine".to_string(),
      ApiClientAspectRatio::TallTwoByThree => "tall_two_by_three".to_string(),
      ApiClientAspectRatio::TallThreeByFour => "tall_three_by_four".to_string(),
      ApiClientAspectRatio::TallFourByFive => "tall_four_by_five".to_string(),
      ApiClientAspectRatio::TallNineBySixteen => "tall_nine_by_sixteen".to_string(),
      ApiClientAspectRatio::TallNineByTwentyOne => "tall_nine_by_twenty_one".to_string(),
      ApiClientAspectRatio::Wide => "wide".to_string(),
      ApiClientAspectRatio::Tall => "tall".to_string(),
      ApiClientAspectRatio::Auto2k => "auto_2k".to_string(),
      ApiClientAspectRatio::Auto3k => "auto_3k".to_string(),
      ApiClientAspectRatio::Auto4k => "auto_4k".to_string(),
      ApiClientAspectRatio::SquareHd => "square_hd".to_string(),
      ApiClientAspectRatio::Unknown(other) => other,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn known_variant_round_trips() {
    let parsed: ApiClientAspectRatio = serde_json::from_str("\"auto\"").unwrap();
    assert_eq!(parsed, ApiClientAspectRatio::Auto);
    assert_eq!(serde_json::to_string(&parsed).unwrap(), "\"auto\"");
  }

  #[test]
  fn unknown_value_is_preserved_and_round_trips() {
    let parsed: ApiClientAspectRatio = serde_json::from_str("\"zzz_not_a_real_value\"").unwrap();
    assert_eq!(parsed, ApiClientAspectRatio::Unknown("zzz_not_a_real_value".to_string()));
    assert_eq!(serde_json::to_string(&parsed).unwrap(), "\"zzz_not_a_real_value\"");
  }

  #[test]
  fn every_known_variant_round_trips() {
    let all = [
      (ApiClientAspectRatio::Auto, "auto"),
      (ApiClientAspectRatio::Square, "square"),
      (ApiClientAspectRatio::WideThreeByTwo, "wide_three_by_two"),
      (ApiClientAspectRatio::WideFourByThree, "wide_four_by_three"),
      (ApiClientAspectRatio::WideFiveByFour, "wide_five_by_four"),
      (ApiClientAspectRatio::WideSixteenByNine, "wide_sixteen_by_nine"),
      (ApiClientAspectRatio::WideTwentyOneByNine, "wide_twenty_one_by_nine"),
      (ApiClientAspectRatio::TallTwoByThree, "tall_two_by_three"),
      (ApiClientAspectRatio::TallThreeByFour, "tall_three_by_four"),
      (ApiClientAspectRatio::TallFourByFive, "tall_four_by_five"),
      (ApiClientAspectRatio::TallNineBySixteen, "tall_nine_by_sixteen"),
      (ApiClientAspectRatio::TallNineByTwentyOne, "tall_nine_by_twenty_one"),
      (ApiClientAspectRatio::Wide, "wide"),
      (ApiClientAspectRatio::Tall, "tall"),
      (ApiClientAspectRatio::Auto2k, "auto_2k"),
      (ApiClientAspectRatio::Auto3k, "auto_3k"),
      (ApiClientAspectRatio::Auto4k, "auto_4k"),
      (ApiClientAspectRatio::SquareHd, "square_hd"),
    ];
    for (variant, s) in all {
      assert_eq!(String::from(variant.clone()), s, "serialize mismatch for {:?}", variant);
      let parsed: ApiClientAspectRatio = serde_json::from_str(&format!("\"{}\"", s)).unwrap();
      assert_eq!(parsed, variant);
    }
  }
}
