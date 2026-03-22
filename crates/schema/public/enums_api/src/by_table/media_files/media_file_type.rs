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
  pub fn try_from_mime_type(mime_type: &str) -> Option<Self> {
    match mime_type {
      "image/jpeg" => Some(Self::Jpg),
      "image/png" => Some(Self::Png),
      "video/mp4" => Some(Self::Mp4),
      "model/gltf-binary" => Some(Self::Glb),
      _ => None,
    }
  }
}

#[cfg(test)]
mod tests {
  use super::MediaFileType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(MediaFileType::Audio, "audio");
      assert_serialization(MediaFileType::Image, "image");
      assert_serialization(MediaFileType::Video, "video");
      assert_serialization(MediaFileType::Bvh, "bvh");
      assert_serialization(MediaFileType::Fbx, "fbx");
      assert_serialization(MediaFileType::Glb, "glb");
      assert_serialization(MediaFileType::Gltf, "gltf");
      assert_serialization(MediaFileType::Spz, "spz");
      assert_serialization(MediaFileType::SceneRon, "scene_ron");
      assert_serialization(MediaFileType::SceneJson, "scene_json");
      assert_serialization(MediaFileType::Pmd, "pmd");
      assert_serialization(MediaFileType::Vmd, "vmd");
      assert_serialization(MediaFileType::Pmx, "pmx");
      assert_serialization(MediaFileType::Csv, "csv");
      assert_serialization(MediaFileType::Jpg, "jpg");
      assert_serialization(MediaFileType::Png, "png");
      assert_serialization(MediaFileType::Gif, "gif");
      assert_serialization(MediaFileType::Mp4, "mp4");
      assert_serialization(MediaFileType::Wav, "wav");
      assert_serialization(MediaFileType::Mp3, "mp3");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("audio", MediaFileType::Audio);
      assert_deserialization("image", MediaFileType::Image);
      assert_deserialization("video", MediaFileType::Video);
      assert_deserialization("bvh", MediaFileType::Bvh);
      assert_deserialization("fbx", MediaFileType::Fbx);
      assert_deserialization("glb", MediaFileType::Glb);
      assert_deserialization("gltf", MediaFileType::Gltf);
      assert_deserialization("spz", MediaFileType::Spz);
      assert_deserialization("scene_ron", MediaFileType::SceneRon);
      assert_deserialization("scene_json", MediaFileType::SceneJson);
      assert_deserialization("pmd", MediaFileType::Pmd);
      assert_deserialization("vmd", MediaFileType::Vmd);
      assert_deserialization("pmx", MediaFileType::Pmx);
      assert_deserialization("csv", MediaFileType::Csv);
      assert_deserialization("jpg", MediaFileType::Jpg);
      assert_deserialization("png", MediaFileType::Png);
      assert_deserialization("gif", MediaFileType::Gif);
      assert_deserialization("mp4", MediaFileType::Mp4);
      assert_deserialization("wav", MediaFileType::Wav);
      assert_deserialization("mp3", MediaFileType::Mp3);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(MediaFileType::iter().count(), 20);
    }
  }

  mod test_is_jpg_or_png {
    use super::*;

    #[test]
    fn true_for_jpg_and_png() {
      assert!(MediaFileType::Jpg.is_jpg_or_png());
      assert!(MediaFileType::Png.is_jpg_or_png());
    }

    #[test]
    fn false_for_everything_else() {
      for variant in MediaFileType::iter() {
        if matches!(variant, MediaFileType::Jpg | MediaFileType::Png) {
          continue;
        }
        assert!(!variant.is_jpg_or_png(), "Expected {:?} to be false", variant);
      }
    }
  }

  mod test_is_jpg_or_png_or_legacy_image {
    use super::*;

    #[test]
    fn true_for_jpg_png_image() {
      assert!(MediaFileType::Jpg.is_jpg_or_png_or_legacy_image());
      assert!(MediaFileType::Png.is_jpg_or_png_or_legacy_image());
      assert!(MediaFileType::Image.is_jpg_or_png_or_legacy_image());
    }

    #[test]
    fn false_for_everything_else() {
      for variant in MediaFileType::iter() {
        if matches!(variant, MediaFileType::Jpg | MediaFileType::Png | MediaFileType::Image) {
          continue;
        }
        assert!(!variant.is_jpg_or_png_or_legacy_image(), "Expected {:?} to be false", variant);
      }
    }
  }

  mod test_try_from_mime_type {
    use super::*;

    #[test]
    fn known_mime_types() {
      assert_eq!(MediaFileType::try_from_mime_type("image/jpeg"), Some(MediaFileType::Jpg));
      assert_eq!(MediaFileType::try_from_mime_type("image/png"), Some(MediaFileType::Png));
      assert_eq!(MediaFileType::try_from_mime_type("video/mp4"), Some(MediaFileType::Mp4));
      assert_eq!(MediaFileType::try_from_mime_type("model/gltf-binary"), Some(MediaFileType::Glb));
    }

    #[test]
    fn unknown_mime_types_return_none() {
      assert_eq!(MediaFileType::try_from_mime_type("audio/wav"), None);
      assert_eq!(MediaFileType::try_from_mime_type("image/gif"), None);
      assert_eq!(MediaFileType::try_from_mime_type("text/plain"), None);
      assert_eq!(MediaFileType::try_from_mime_type(""), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in MediaFileType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: MediaFileType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
