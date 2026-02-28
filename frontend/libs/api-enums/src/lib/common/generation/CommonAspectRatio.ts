
// NOTE: These are defined in Rust (as the source of truth) and duplicated in the frontend.
// In the future, we should use code gen (protobufs or similar) to keep the two sides in sync.

export enum CommonAspectRatio {
  Auto = "auto",
  Square = "square",
  WideThreeByTwo = "wide_three_by_two",
  WideFourByThree = "wide_four_by_three",
  WideFiveByFour = "wide_five_by_four",
  WideSixteenByNine = "wide_sixteen_by_nine",
  WideTwentyOneByNine = "wide_twenty_one_by_nine",
  TallTwoByThree = "tall_two_by_three",
  TallThreeByFour = "tall_three_by_four",
  TallFourByFive = "tall_four_by_five",
  TallNineBySixteen = "tall_nine_by_sixteen",
  TallNineByTwentyOne = "tall_nine_by_twenty_one",
  Wide = "wide",
  Tall = "tall",
  Auto2k = "auto_2k",
  Auto4k = "auto_4k",
  SquareHd = "square_hd",
}
