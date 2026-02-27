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
