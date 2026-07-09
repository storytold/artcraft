use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `media_files` table in a `VARCHAR(16)` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, ToSchema)]
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

  /// Wavefront OBJ mesh files
  Obj,

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
  
  // ========================= LESS SUPPORT FOR THE FILES BELOW THIS LINE ========================= //

  /// Webp images
  Webp,

  /// Webm videos
  Webm,

  /// QuickTime videos
  Mov,

  /// Opus audio
  Opus,

  /// Ogg audio
  Ogg,

  /// AAC audio
  Aac,

  /// M4a audio
  M4a,

  /// FLAC audio
  Flac,

  /// Generic JSON documents (eg. internal project files).
  /// NB: 3D scene files predate this and use `scene_json` instead.
  Json,
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

  /// Any image format, including the legacy coarse `Image` type.
  pub fn is_image(&self) -> bool {
    matches!(self, Self::Image | Self::Jpg | Self::Png | Self::Gif | Self::Webp)
  }
  
  /// Returns the `MediaFileType` if the mime type matches one of the known types.
  /// This is not exhaustive.
  /// (NB: In general we shouldn't keep much application logic in the `enums` crate,
  /// but this is a good case for it.)
  pub fn try_from_mime_type(mime_type: &str) -> Option<Self> {
    match mime_type {
      "image/jpeg" => Some(Self::Jpg),
      "image/png" => Some(Self::Png),
      "image/gif" => Some(Self::Gif),
      "image/webp" => Some(Self::Webp),
      "video/mp4" => Some(Self::Mp4),
      "video/webm" => Some(Self::Webm),
      "video/quicktime" => Some(Self::Mov),
      "audio/wav" => Some(Self::Wav),
      "audio/x-wav" => Some(Self::Wav),
      "audio/wave" => Some(Self::Wav),
      "audio/mpeg" => Some(Self::Mp3),
      "audio/mp3" => Some(Self::Mp3),
      "audio/opus" => Some(Self::Opus),
      "audio/ogg" => Some(Self::Ogg),
      "audio/aac" => Some(Self::Aac),
      "audio/m4a" => Some(Self::M4a),
      "audio/x-m4a" => Some(Self::M4a),
      "audio/mp4" => Some(Self::M4a),
      "audio/flac" => Some(Self::Flac),
      "audio/x-flac" => Some(Self::Flac),
      "model/gltf-binary" => Some(Self::Glb),
      "model/gltf+json" => Some(Self::Gltf),
      "model/fbx" => Some(Self::Fbx),
      "application/fbx" => Some(Self::Fbx),
      "model/obj" => Some(Self::Obj),
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
      Self::Obj => "obj",
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
      Self::Webp => "webp",
      Self::Webm => "webm",
      Self::Mov => "mov",
      Self::Opus => "opus",
      Self::Ogg => "ogg",
      Self::Aac => "aac",
      Self::M4a => "m4a",
      Self::Flac => "flac",
      Self::Json => "json",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "audio" => Ok(Self::Audio),
      "image" => Ok(Self::Image),
      "video" => Ok(Self::Video),
      "bvh" => Ok(Self::Bvh),
      "fbx" => Ok(Self::Fbx),
      "obj" => Ok(Self::Obj),
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
      "webp" => Ok(Self::Webp),
      "webm" => Ok(Self::Webm),
      "mov" => Ok(Self::Mov),
      "opus" => Ok(Self::Opus),
      "ogg" => Ok(Self::Ogg),
      "aac" => Ok(Self::Aac),
      "m4a" => Ok(Self::M4a),
      "flac" => Ok(Self::Flac),
      "json" => Ok(Self::Json),
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
      Self::Obj,
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
      Self::Webp,
      Self::Webm,
      Self::Mov,
      Self::Opus,
      Self::Ogg,
      Self::Aac,
      Self::M4a,
      Self::Flac,
      Self::Json,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::media_files::media_file_type::MediaFileType;
  use crate::test_helpers::assert_serialization;
  
  mod utility {
    use super::*;
    
    #[test]
    fn test_jpg_or_png() {
      // True
      assert!(MediaFileType::Jpg.is_jpg_or_png());
      assert!(MediaFileType::Png.is_jpg_or_png());
      
      // Assert these image types are false
      assert!(!MediaFileType::Gif.is_jpg_or_png());
      assert!(!MediaFileType::Image.is_jpg_or_png());
      
      // Everything else is false
      for variant in MediaFileType::all_variants() {
        if matches!(variant, MediaFileType::Jpg | MediaFileType::Png) {
          continue;
        }
        assert!(!variant.is_jpg_or_png(), "Expected {:?} to not be jpg or png", variant);
      }
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
      assert_serialization(MediaFileType::Obj, "obj");
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
      assert_serialization(MediaFileType::Webp, "webp");
      assert_serialization(MediaFileType::Webm, "webm");
      assert_serialization(MediaFileType::Mov, "mov");
      assert_serialization(MediaFileType::Opus, "opus");
      assert_serialization(MediaFileType::Ogg, "ogg");
      assert_serialization(MediaFileType::Aac, "aac");
      assert_serialization(MediaFileType::M4a, "m4a");
      assert_serialization(MediaFileType::Flac, "flac");
      assert_serialization(MediaFileType::Json, "json");
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
      assert_eq!(MediaFileType::Webp.to_str(), "webp");
      assert_eq!(MediaFileType::Webm.to_str(), "webm");
      assert_eq!(MediaFileType::Mov.to_str(), "mov");
      assert_eq!(MediaFileType::Opus.to_str(), "opus");
      assert_eq!(MediaFileType::Ogg.to_str(), "ogg");
      assert_eq!(MediaFileType::Aac.to_str(), "aac");
      assert_eq!(MediaFileType::M4a.to_str(), "m4a");
      assert_eq!(MediaFileType::Flac.to_str(), "flac");
      assert_eq!(MediaFileType::Json.to_str(), "json");
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
      assert_eq!(MediaFileType::from_str("webp").unwrap(), MediaFileType::Webp);
      assert_eq!(MediaFileType::from_str("webm").unwrap(), MediaFileType::Webm);
      assert_eq!(MediaFileType::from_str("mov").unwrap(), MediaFileType::Mov);
      assert_eq!(MediaFileType::from_str("opus").unwrap(), MediaFileType::Opus);
      assert_eq!(MediaFileType::from_str("ogg").unwrap(), MediaFileType::Ogg);
      assert_eq!(MediaFileType::from_str("aac").unwrap(), MediaFileType::Aac);
      assert_eq!(MediaFileType::from_str("m4a").unwrap(), MediaFileType::M4a);
      assert_eq!(MediaFileType::from_str("flac").unwrap(), MediaFileType::Flac);
      assert_eq!(MediaFileType::from_str("json").unwrap(), MediaFileType::Json);
      assert!(MediaFileType::from_str("foo").is_err());
    }
  }

  mod manual_variant_checks {
    use super::*;

    #[test]
    fn all_variants() {
      let mut variants = MediaFileType::all_variants();
      assert_eq!(variants.len(), 30);
      assert_eq!(variants.pop_first(), Some(MediaFileType::Audio));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Image));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Video));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Bvh));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Fbx));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Obj));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Glb));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Gltf));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Spz));
      assert_eq!(variants.pop_first(), Some(MediaFileType::SceneRon));
      assert_eq!(variants.pop_first(), Some(MediaFileType::SceneJson));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Pmd));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Vmd));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Pmx));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Csv));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Jpg));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Png));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Gif));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Mp4));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Wav));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Mp3));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Webp));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Webm));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Mov));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Opus));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Ogg));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Aac));
      assert_eq!(variants.pop_first(), Some(MediaFileType::M4a));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Flac));
      assert_eq!(variants.pop_first(), Some(MediaFileType::Json));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(MediaFileType::all_variants().len(), MediaFileType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in MediaFileType::all_variants() {
        assert_eq!(variant, MediaFileType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, MediaFileType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, MediaFileType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 16;
      for variant in MediaFileType::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
