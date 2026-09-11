
/// This is a constrained set of file extensions that:
///  1. we care about
///  2. we can detect with magic bytes
///  3. are not text formats / are binary formats
#[derive(Copy, Clone, Debug, Eq, PartialEq, Hash, Ord, PartialOrd)]
pub enum FileExtension {
  Aac,
  Fbx,
  Flac,
  Gif,
  Glb,
  Jpg,
  Mov,
  Mp3,
  Mp4,
  Obj,
  Ogg,
  Opus,
  Ply,
  Png,
  Wav,
  Webm,
  Webp,
}

impl FileExtension {
  pub fn from_mimetype(mimetype: &str) -> Option<Self> {
    match mimetype {
      "audio/aac" => Some(FileExtension::Aac),
      "model/fbx" => Some(FileExtension::Fbx),
      "application/fbx" => Some(FileExtension::Fbx),
      "audio/flac" => Some(FileExtension::Flac),
      "image/gif" => Some(FileExtension::Gif),
      "model/gltf-binary" => Some(FileExtension::Glb),
      "image/jpeg" => Some(FileExtension::Jpg),
      "video/quicktime" => Some(FileExtension::Mov),
      "audio/mpeg" => Some(FileExtension::Mp3),
      "video/mp4" => Some(FileExtension::Mp4),
      "model/obj" => Some(FileExtension::Obj),
      "model/ply" => Some(FileExtension::Ply),
      "audio/ogg" => Some(FileExtension::Ogg),
      "audio/opus" => Some(FileExtension::Opus),
      "image/png" => Some(FileExtension::Png),
      "audio/wav" => Some(FileExtension::Wav),
      "video/webm" => Some(FileExtension::Webm),
      "image/webp" => Some(FileExtension::Webp),
      _ => None,
    }
  }

  pub fn extension_with_period(&self) -> &'static str {
    self.with_and_without_period().0
  }

  pub fn extension_without_period(&self) -> &'static str {
    self.with_and_without_period().1
  }

  fn with_and_without_period(&self) -> (&'static str, &'static str) {
    match self {
      FileExtension::Aac => (".aac", "aac"),
      FileExtension::Fbx => (".fbx", "fbx"),
      FileExtension::Flac => (".flac", "flac"),
      FileExtension::Gif => (".gif", "gif"),
      FileExtension::Glb => (".glb", "glb"),
      FileExtension::Jpg => (".jpg", "jpg"),
      FileExtension::Mov => (".mov", "mov"),
      FileExtension::Mp3 => (".mp3", "mp3"),
      FileExtension::Mp4 => (".mp4", "mp4"),
      FileExtension::Obj => (".obj", "obj"),
      FileExtension::Ogg => (".ogg", "ogg"),
      FileExtension::Opus => (".opus", "opus"),
      FileExtension::Ply => (".ply", "ply"),
      FileExtension::Png => (".png", "png"),
      FileExtension::Wav => (".wav", "wav"),
      FileExtension::Webm => (".webm", "webm"),
      FileExtension::Webp => (".webp", "webp"),
    }
  }
}
