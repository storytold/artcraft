use serde_derive::{Deserialize, Serialize};

/// This is a comprehensive list of common aspect ratios you can specify when enqueuing a generation.
/// Not every model will support every aspect ratio.
/// In the case a model doesn't support the aspect ratio, gracefully pick the nearest option.
#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CommonAspectRatio {
  // Auto (eg. for image editing to use the source; used by Nano Banana Pro edit image, but not text-to-image)
  Auto,

  // Square
  Square,

  // Wide
  WideThreeByTwo,
  WideFourByThree,
  WideFiveByFour,
  WideSixteenByNine,
  WideTwentyOneByNine,

  // Tall
  TallTwoByThree,
  TallThreeByFour,
  TallFourByFive,
  TallNineBySixteen,
  TallNineByTwentyOne,

  // Imprecise semantic values that we probably remap to other meanings
  // on a model-by-model basis.
  Wide,
  Tall,

  // Auto values that bake in resolution
  // These are from the Seedream models
  Auto2k,
  Auto4k,

  // Defined aspect ratios that bake in resolution
  // These are from the Seedream models
  SquareHd,
}

/// Test-only: the number of `CommonAspectRatio` variants, as enforced by `variant_index`.
#[cfg(test)]
pub(crate) const COMMON_ASPECT_RATIO_VARIANT_COUNT: usize = 17;

/// Test-only: maps every variant to a unique index.
/// The match is deliberately exhaustive (no wildcard arm) so that adding a new variant to
/// `CommonAspectRatio` fails to compile here and forces the author to revisit the converter tests.
#[cfg(test)]
fn variant_index(ratio: CommonAspectRatio) -> usize {
  match ratio {
    CommonAspectRatio::Auto => 0,
    CommonAspectRatio::Square => 1,
    CommonAspectRatio::WideThreeByTwo => 2,
    CommonAspectRatio::WideFourByThree => 3,
    CommonAspectRatio::WideFiveByFour => 4,
    CommonAspectRatio::WideSixteenByNine => 5,
    CommonAspectRatio::WideTwentyOneByNine => 6,
    CommonAspectRatio::TallTwoByThree => 7,
    CommonAspectRatio::TallThreeByFour => 8,
    CommonAspectRatio::TallFourByFive => 9,
    CommonAspectRatio::TallNineBySixteen => 10,
    CommonAspectRatio::TallNineByTwentyOne => 11,
    CommonAspectRatio::Wide => 12,
    CommonAspectRatio::Tall => 13,
    CommonAspectRatio::Auto2k => 14,
    CommonAspectRatio::Auto4k => 15,
    CommonAspectRatio::SquareHd => 16,
  }
}

/// Test-only: every `CommonAspectRatio` variant, for exhaustive property tests in the converter modules.
#[cfg(test)]
pub(crate) fn all_common_aspect_ratios() -> Vec<CommonAspectRatio> {
  vec![
    CommonAspectRatio::Auto,
    CommonAspectRatio::Square,
    CommonAspectRatio::WideThreeByTwo,
    CommonAspectRatio::WideFourByThree,
    CommonAspectRatio::WideFiveByFour,
    CommonAspectRatio::WideSixteenByNine,
    CommonAspectRatio::WideTwentyOneByNine,
    CommonAspectRatio::TallTwoByThree,
    CommonAspectRatio::TallThreeByFour,
    CommonAspectRatio::TallFourByFive,
    CommonAspectRatio::TallNineBySixteen,
    CommonAspectRatio::TallNineByTwentyOne,
    CommonAspectRatio::Wide,
    CommonAspectRatio::Tall,
    CommonAspectRatio::Auto2k,
    CommonAspectRatio::Auto4k,
    CommonAspectRatio::SquareHd,
  ]
}

/// Test-only: the subset of ratios that are wider than tall (width / height > 1).
#[cfg(test)]
pub(crate) fn wide_common_aspect_ratios() -> Vec<CommonAspectRatio> {
  vec![
    CommonAspectRatio::WideThreeByTwo,
    CommonAspectRatio::WideFourByThree,
    CommonAspectRatio::WideFiveByFour,
    CommonAspectRatio::WideSixteenByNine,
    CommonAspectRatio::WideTwentyOneByNine,
    CommonAspectRatio::Wide,
  ]
}

/// Test-only: the subset of ratios that are taller than wide (width / height < 1).
#[cfg(test)]
pub(crate) fn tall_common_aspect_ratios() -> Vec<CommonAspectRatio> {
  vec![
    CommonAspectRatio::TallTwoByThree,
    CommonAspectRatio::TallThreeByFour,
    CommonAspectRatio::TallFourByFive,
    CommonAspectRatio::TallNineBySixteen,
    CommonAspectRatio::TallNineByTwentyOne,
    CommonAspectRatio::Tall,
  ]
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::collections::BTreeSet;

  /// Serializes a ratio to its bare wire string (without the JSON quotes).
  fn wire(ratio: CommonAspectRatio) -> String {
    // serde_json turns a unit variant into a JSON string value, e.g. "square_hd".
    serde_json::to_value(ratio).unwrap().as_str().unwrap().to_string()
  }

  #[test]
  fn helper_list_covers_every_variant_exactly_once() {
    // Collect the unique index of each listed variant.
    let indexes: BTreeSet<usize> = all_common_aspect_ratios().into_iter().map(variant_index).collect();
    // The list has no duplicates and no missing variants.
    assert_eq!(all_common_aspect_ratios().len(), COMMON_ASPECT_RATIO_VARIANT_COUNT);
    assert_eq!(indexes.len(), COMMON_ASPECT_RATIO_VARIANT_COUNT);
    // Indexes are the contiguous range 0..N.
    assert_eq!(indexes.into_iter().collect::<Vec<_>>(), (0..COMMON_ASPECT_RATIO_VARIANT_COUNT).collect::<Vec<_>>());
  }

  #[test]
  fn wide_and_tall_subsets_are_disjoint_and_contained_in_all() {
    // Index sets for the full list and both subsets.
    let all: BTreeSet<usize> = all_common_aspect_ratios().into_iter().map(variant_index).collect();
    let wide: BTreeSet<usize> = wide_common_aspect_ratios().into_iter().map(variant_index).collect();
    let tall: BTreeSet<usize> = tall_common_aspect_ratios().into_iter().map(variant_index).collect();
    // A ratio cannot be both wide and tall.
    assert!(wide.is_disjoint(&tall));
    // Both subsets are real variants.
    assert!(wide.is_subset(&all));
    assert!(tall.is_subset(&all));
  }

  #[test]
  fn serializes_to_snake_case_wire_strings() {
    // These strings cross the Tauri boundary from the frontend, so they must not drift.
    assert_eq!(wire(CommonAspectRatio::Auto), "auto");
    assert_eq!(wire(CommonAspectRatio::Square), "square");
    assert_eq!(wire(CommonAspectRatio::WideThreeByTwo), "wide_three_by_two");
    assert_eq!(wire(CommonAspectRatio::WideTwentyOneByNine), "wide_twenty_one_by_nine");
    assert_eq!(wire(CommonAspectRatio::TallNineByTwentyOne), "tall_nine_by_twenty_one");
    assert_eq!(wire(CommonAspectRatio::Auto2k), "auto2k");
    assert_eq!(wire(CommonAspectRatio::Auto4k), "auto4k");
    assert_eq!(wire(CommonAspectRatio::SquareHd), "square_hd");
  }

  #[test]
  fn every_variant_round_trips_through_json() {
    for ratio in all_common_aspect_ratios() {
      // Serialize then deserialize; the result must serialize back to the same string.
      let json = serde_json::to_string(&ratio).unwrap();
      let back: CommonAspectRatio = serde_json::from_str(&json).unwrap();
      assert_eq!(wire(back), wire(ratio));
    }
  }

  #[test]
  fn wire_strings_are_unique() {
    // Two variants sharing a wire string would make deserialization ambiguous.
    let strings: BTreeSet<String> = all_common_aspect_ratios().into_iter().map(wire).collect();
    assert_eq!(strings.len(), COMMON_ASPECT_RATIO_VARIANT_COUNT);
  }

  #[test]
  fn unknown_and_wrongly_cased_strings_fail_to_deserialize() {
    // Unknown value.
    assert!(serde_json::from_str::<CommonAspectRatio>("\"cinema\"").is_err());
    // PascalCase is not accepted; only snake_case is.
    assert!(serde_json::from_str::<CommonAspectRatio>("\"SquareHd\"").is_err());
    // A bare number is not a ratio.
    assert!(serde_json::from_str::<CommonAspectRatio>("1").is_err());
  }
}
