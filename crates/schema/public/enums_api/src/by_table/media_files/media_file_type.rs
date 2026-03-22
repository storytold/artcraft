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
