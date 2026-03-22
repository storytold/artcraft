use strum::EnumCount;
use strum::EnumIter;

/// Used in the `media_files` table in a `VARCHAR(16)` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, EnumIter, EnumCount)]
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

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(MediaFileType);
impl_mysql_enum_coders!(MediaFileType);
impl_mysql_from_row!(MediaFileType);

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

}

#[cfg(test)]
mod tests {
  use super::super::media_file_type::MediaFileType;
  use enums_shared::test_helpers::assert_serialization;
  
  mod utility {
    use super::*;
    
    #[test]
    fn test_jpg_or_png() {
      use strum::IntoEnumIterator;
      // True
      assert!(MediaFileType::Jpg.is_jpg_or_png());
      assert!(MediaFileType::Png.is_jpg_or_png());
      
      // Assert these image types are false
      assert!(!MediaFileType::Gif.is_jpg_or_png());
      assert!(!MediaFileType::Image.is_jpg_or_png());
      
      // Everything else is false
      for variant in MediaFileType::iter() {
        if matches!(variant, MediaFileType::Jpg | MediaFileType::Png) {
          continue;
        }
        assert!(!variant.is_jpg_or_png(), "Expected {:?} to not be jpg or png", variant);
      }
    }
  }

  mod test_is_jpg_or_png_or_legacy_image {
    use super::*;
    use strum::IntoEnumIterator;

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

  mod serde {
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
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(MediaFileType::Audio.to_str(), "audio");
      assert_eq!(MediaFileType::Image.to_str(), "image");
      assert_eq!(MediaFileType::Video.to_str(), "video");
      assert_eq!(MediaFileType::Bvh.to_str(), "bvh");
      assert_eq!(MediaFileType::Fbx.to_str(), "fbx");
      assert_eq!(MediaFileType::Glb.to_str(), "glb");
      assert_eq!(MediaFileType::Gltf.to_str(), "gltf");
      assert_eq!(MediaFileType::Spz.to_str(), "spz");
      assert_eq!(MediaFileType::SceneRon.to_str(), "scene_ron");
      assert_eq!(MediaFileType::SceneJson.to_str(), "scene_json");
      assert_eq!(MediaFileType::Pmd.to_str(), "pmd");
      assert_eq!(MediaFileType::Vmd.to_str(), "vmd");
      assert_eq!(MediaFileType::Pmx.to_str(), "pmx");
      assert_eq!(MediaFileType::Csv.to_str(), "csv");
      assert_eq!(MediaFileType::Jpg.to_str(), "jpg");
      assert_eq!(MediaFileType::Png.to_str(), "png");
      assert_eq!(MediaFileType::Gif.to_str(), "gif");
      assert_eq!(MediaFileType::Mp4.to_str(), "mp4");
      assert_eq!(MediaFileType::Wav.to_str(), "wav");
      assert_eq!(MediaFileType::Mp3.to_str(), "mp3");
    }

    #[test]
    fn from_str() {
      assert_eq!(MediaFileType::from_str("audio").unwrap(), MediaFileType::Audio);
      assert_eq!(MediaFileType::from_str("image").unwrap(), MediaFileType::Image);
      assert_eq!(MediaFileType::from_str("video").unwrap(), MediaFileType::Video);
      assert_eq!(MediaFileType::from_str("bvh").unwrap(), MediaFileType::Bvh);
      assert_eq!(MediaFileType::from_str("fbx").unwrap(), MediaFileType::Fbx);
      assert_eq!(MediaFileType::from_str("glb").unwrap(), MediaFileType::Glb);
      assert_eq!(MediaFileType::from_str("gltf").unwrap(), MediaFileType::Gltf);
      assert_eq!(MediaFileType::from_str("spz").unwrap(), MediaFileType::Spz);
      assert_eq!(MediaFileType::from_str("scene_ron").unwrap(), MediaFileType::SceneRon);
      assert_eq!(MediaFileType::from_str("scene_json").unwrap(), MediaFileType::SceneJson);
      assert_eq!(MediaFileType::from_str("pmd").unwrap(), MediaFileType::Pmd);
      assert_eq!(MediaFileType::from_str("vmd").unwrap(), MediaFileType::Vmd);
      assert_eq!(MediaFileType::from_str("pmx").unwrap(), MediaFileType::Pmx);
      assert_eq!(MediaFileType::from_str("csv").unwrap(), MediaFileType::Csv);
      assert_eq!(MediaFileType::from_str("jpg").unwrap(), MediaFileType::Jpg);
      assert_eq!(MediaFileType::from_str("png").unwrap(), MediaFileType::Png);
      assert_eq!(MediaFileType::from_str("gif").unwrap(), MediaFileType::Gif);
      assert_eq!(MediaFileType::from_str("mp4").unwrap(), MediaFileType::Mp4);
      assert_eq!(MediaFileType::from_str("wav").unwrap(), MediaFileType::Wav);
      assert_eq!(MediaFileType::from_str("mp3").unwrap(), MediaFileType::Mp3);
      assert!(MediaFileType::from_str("foo").is_err());
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in MediaFileType::iter() {
        assert_eq!(variant, MediaFileType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, MediaFileType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, MediaFileType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      use strum::IntoEnumIterator;
      const MAX_LENGTH : usize = 16;
      for variant in MediaFileType::iter() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
