
#[derive(Clone, Copy)]
pub enum DownloadExtension {
  Png,
  Mp4,
}

impl DownloadExtension {
  pub fn as_extension_without_period(&self) -> &'static str {
    match self {
      DownloadExtension::Png => "png",
      DownloadExtension::Mp4 => "mp4",
    }
  }
}
