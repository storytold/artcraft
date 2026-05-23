use serde::Serialize;

#[derive(Serialize, Clone, Copy, Debug)]
pub enum AspectRatio {
  #[serde(rename = "2:3")]
  TallTwoByThree,

  #[serde(rename = "3:2")]
  WideThreeByTwo,

  #[serde(rename = "1:1")]
  Square,
}
