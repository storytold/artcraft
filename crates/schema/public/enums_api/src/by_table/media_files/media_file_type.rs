use std::collections::BTreeSet;

use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `media_files` table in a `VARCHAR(16)` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
#[serde(rename_all = "snake_case")]
pub enum MediaFileType {
  // TODO(bt): Deprecate and split into audio mime types; use media_class to represent broadly
  /// Audio files: wav, mp3, etc.
  #[deprecated]
  Audio,

  // TODO(bt): Deprecate and split into image mime types; use media_class to represent broadly
  /// Image files: png, jpeg, etc.
  #[deprecated]
  Image,

  // TODO(bt): Deprecate and split into video mime types; use media_class to represent broadly
  /// Video files: mp4, etc.
  #[deprecated]
  Video,

  /// BVH files (for Bevy)
  /// NB: This is the new type to migrate to.
  Bvh,

  /// FBX files (for Bevy)
  Fbx,

  /// glTF binary files (for Bevy)
  Glb,

  /// glTF files (for Bevy)
  Gltf,

  /// Spz Gaussian splats
  /// This is a standard file format for Gaussian Splats, used by World Labs.
  /// The mime type is application/gzip.
  Spz,

  /// Bevy's scene files (in RON; Rusty Object Notation)
  /// This will be replaced with another format in future versions of Bevy
  SceneRon,

  /// Alternate scene files.
  SceneJson,

  /// "Polygon Model Data", character data for MikuMikuDance
  /// See: https://mikumikudance.fandom.com/wiki/MMD:Polygon_Model_Data
  Pmd,

  /// "Vocaloid Motion Data", animation data for MikuMikuDance
  /// See: https://mikumikudance.fandom.com/wiki/VMD_file_format
  Vmd,

  /// "Polygon Model eXtend", character data from MikuMikuDance
  /// NB: this is often associated with external files for textures, which
  /// we'll store in the same bucket path.
  /// See: https://mikumikudance.fandom.com/wiki/MMD:Polygon_Model_eXtend
  Pmx,

  /// CSV format. (We use these for ArKit)
  Csv,

  /// Jpeg images
  Jpg,

  /// Png images
  Png,

  /// Gif images
  Gif,

  /// Mp4 videos
  Mp4,

  /// Wav audio
  Wav,

  /// Mp3 audio
  Mp3,
}

/// NB: Legacy API for older code.
impl MediaFileType {
  
  /// Jpeg and Png are the most widely supported static image formats for AI inference.
  /// Webp, Webm, and Gif aren't as widely supported, so we don't include them here.
  pub fn is_jpg_or_png(&self) -> bool {
    matches!(self, Self::Jpg | Self::Png)
  }

  /// A little bit less strict than `is_jpg_or_png`, this includes the legacy `Image` type.
  pub fn is_jpg_or_png_or_legacy_image(&self) -> bool {
    matches!(self, Self::Jpg | Self::Png | Self::Image)
  }
  
  /// Returns the `MediaFileType` if the mime type matches one of the known types.
  /// This is not exhaustive.
  /// (NB: In general we shouldn't keep much application logic in the `enums` crate,
  /// but this is a good case for it.)
  pub fn try_from_mime_type(mime_type: &str) -> Option<Self> {
    match mime_type {
      "image/jpeg" => Some(Self::Jpg),
      "image/png" => Some(Self::Png),
      "video/mp4" => Some(Self::Mp4),
      "model/gltf-binary" => Some(Self::Glb),
      //"audio/wav" => Some(Self::Wav), // NB: Not sure if this is correct
      //"audio/mpeg" => Some(Self::Mp3), // NB: Not sure if this is correct
      //"image/gif" => Some(Self::Gif), // NB: Not sure if this is correct
      //"model/gltf+json" => Some(Self::Gltf), // NB: Not sure if this is correct
      _ => None,
    }
  }
  
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Audio => "audio",
      Self::Image => "image",
      Self::Video => "video",
      Self::Bvh => "bvh",
      Self::Fbx => "fbx",
      Self::Glb => "glb",
      Self::Gltf => "gltf",
      Self::Spz => "spz",
      Self::SceneRon => "scene_ron",
      Self::SceneJson => "scene_json",
      Self::Pmd => "pmd",
      Self::Vmd => "vmd",
      Self::Pmx => "pmx",
      Self::Csv => "csv",
      Self::Jpg => "jpg",
      Self::Png => "png",
      Self::Gif => "gif",
      Self::Mp4 => "mp4",
      Self::Wav => "wav",
      Self::Mp3 => "mp3",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "audio" => Ok(Self::Audio),
      "image" => Ok(Self::Image),
      "video" => Ok(Self::Video),
      "bvh" => Ok(Self::Bvh),
      "fbx" => Ok(Self::Fbx),
      "glb" => Ok(Self::Glb),
      "gltf" => Ok(Self::Gltf),
      "spz" => Ok(Self::Spz),
      "scene_ron" => Ok(Self::SceneRon),
      "scene_json" => Ok(Self::SceneJson),
      "pmd" => Ok(Self::Pmd),
      "vmd" => Ok(Self::Vmd),
      "pmx" => Ok(Self::Pmx),
      "csv" => Ok(Self::Csv),
      "jpg" => Ok(Self::Jpg),
      "png" => Ok(Self::Png),
      "gif" => Ok(Self::Gif),
      "mp4" => Ok(Self::Mp4),
      "wav" => Ok(Self::Wav),
      "mp3" => Ok(Self::Mp3),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Audio,
      Self::Image,
      Self::Video,
      Self::Bvh,
      Self::Fbx,
      Self::Glb,
      Self::Gltf,
      Self::Spz,
      Self::SceneRon,
      Self::SceneJson,
      Self::Pmd,
      Self::Vmd,
      Self::Pmx,
      Self::Csv,
      Self::Jpg,
      Self::Png,
      Self::Gif,
      Self::Mp4,
      Self::Wav,
      Self::Mp3,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::MediaFileType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in MediaFileType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: MediaFileType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
