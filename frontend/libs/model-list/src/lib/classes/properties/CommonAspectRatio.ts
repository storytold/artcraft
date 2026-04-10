
/// Common aspect ratio Tauri API
/// Not all models have each of these aspect ratios, 
/// but Tauri will interpolate if a mistake is sent.
export enum CommonAspectRatio {
  // "Auto"
  // The idea here is that in image editing (not text-to-image), the model will use the source image.
  // This is the semantics used by Nano Banana Pro image editing mode (but not text-to-image).
  Auto = "auto",

  // Square
  Square = "square",

  // Wide
  WideFiveByFour = "wide_five_by_four",
  WideFourByThree = "wide_four_by_three",
  WideThreeByTwo = "wide_three_by_two",
  WideSixteenByNine = "wide_sixteen_by_nine",
  WideTwentyOneByNine = "wide_twenty_one_by_nine",

  // Tall
  TallFourByFive = "tall_four_by_five",
  TallThreeByFour = "tall_three_by_four",
  TallTwoByThree = "tall_two_by_three",
  TallNineBySixteen = "tall_nine_by_sixteen",
  TallNineByTwentyOne = "tall_nine_by_twenty_one",

  // Imprecise semantic values (that probably are mapped to other meanings)
  // Not appropriate for all models to use these values.
  Wide = "wide",
  Tall = "tall",
  
  // Auto values that bake in resolution
  Auto2k = "auto_2k",
  Auto3k = "auto_3k",
  Auto4k = "auto_4k",

  // Defined aspect ratios that bake in resolution
  SquareHd = "square_hd",
}
