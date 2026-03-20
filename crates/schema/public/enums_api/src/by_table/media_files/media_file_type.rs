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
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

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
