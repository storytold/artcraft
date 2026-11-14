
/// When downloading a remote file, it makes sense to try to match the same file extension (with reasonable safeguards).
#[deprecated(note = "Use `Extension` in `url_utils::extension::extension` instead")]
#[derive(Debug, Copy, Clone, Eq, PartialEq)]
pub enum DownloadExtension {
  // Image
  Jpg,
  Png,
  // Video
  Mp4,
  Webm,
  // Audio
  Mp3,
  Wav,
  // Text
  Json,
  Txt,
}

impl DownloadExtension {
  pub fn as_extension_without_period(&self) -> &'static str {
    match self {
      // Image
      Self::Jpg => "jpg",
      Self::Png => "png",
      // Video
      Self::Mp4 => "mp4",
      Self::Webm => "webm",
      // Audio
      Self::Mp3 => "mp3",
      Self::Wav => "wav",
      // Text
      Self::Json => "json",
      Self::Txt => "txt",
    }
  }

  pub fn as_extension_with_period(&self) -> &'static str {
    match self {
      // Image
      Self::Jpg => ".jpg",
      Self::Png => ".png",
      // Video
      Self::Mp4 => ".mp4",
      Self::Webm => ".webm",
      // Audio
      Self::Mp3 => ".mp3",
      Self::Wav => ".wav",
      // Text
      Self::Json => ".json",
      Self::Txt => ".txt",
    }
  }

  pub fn try_from_str(extension: &str) -> Option<Self> {
    match extension.to_lowercase().as_str() {
      // Image
      "jpg" | "jpeg" => Some(Self::Jpg),
      "png" => Some(Self::Png),
      // Video
      "mp4" => Some(Self::Mp4),
      "webm" => Some(Self::Webm),
      // Audio
      "mp3" => Some(Self::Mp3),
      "wav" => Some(Self::Wav),
      // Text
      "json" => Some(Self::Json),
      "txt" => Some(Self::Txt),
      _ => None,
    }
  }
}
