

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum ArtcraftUsageType {
  TextToResult,
  ImageToResult,
  Other,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum ArtcraftUsagePage {
  ImagePage,
  VideoPage,
  EditPage,
  StagePage,
  ObjectPage,
  OtherPage,
}
