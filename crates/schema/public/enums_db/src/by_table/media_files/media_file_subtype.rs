use strum::EnumCount;
use strum::EnumIter;

/// Used in the `media_files` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
#[serde(rename_all = "snake_case")]
#[deprecated(note = "This was primarily for Bevy")]
pub enum MediaFileSubtype {
  /// NB: MediaFileSubtype is deprecated.
  /// This should signal that the field / enum is fully deprecated.
  Deprecated,

  // TODO(bt,2024-04-22): Deprecated (migrate)
  /// Animation file from Mixamo
  /// Primarily used for FBX and GLB.
  Mixamo,

  // TODO(bt,2024-04-22): Deprecated (migrate)
  /// Animation file from MocapNet
  /// Primarily used for BVH.
  MocapNet,

  // TODO(bt,2024-04-22): Deprecated
  /// Generic animation case
  /// Used for BVH files, but can also pertain to animation-only files of other types.
  AnimationOnly,

  // TODO(bt,2024-04-22): Deprecated
  /// Generic 3D scene file.
  /// Can pertain to glTF, glB, FBX, etc.
  SceneImport,

  // TODO(bt,2024-04-22): Deprecated
  /// Native Storyteller scene format.
  /// Typically stored in a `.scn.ron` file.
  StorytellerScene,

  /// A 3D scene full of objects, characters, animations, etc.
  Scene,

  /// A 3D character model.
  Character,

  /// A 3D animation.
  Animation,

  /// A 3D object that doesn't fit with the other types.
  Object,

  /// A 3D skybox.
  Skybox,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(MediaFileSubtype);
impl_mysql_enum_coders!(MediaFileSubtype);
impl_mysql_from_row!(MediaFileSubtype);

/// NB: Legacy API for older code.
impl MediaFileSubtype {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Deprecated => "deprecated",
      Self::Mixamo => "mixamo",
      Self::MocapNet => "mocap_net",
      Self::AnimationOnly => "animation_only",
      Self::SceneImport => "scene_import",
      Self::StorytellerScene => "storyteller_scene",
      Self::Scene => "scene",
      Self::Character => "character",
      Self::Animation => "animation",
      Self::Object => "object",
      Self::Skybox => "skybox",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "deprecated" => Ok(Self::Deprecated),
      "mixamo" => Ok(Self::Mixamo),
      "mocap_net" => Ok(Self::MocapNet),
      "animation_only" => Ok(Self::AnimationOnly),
      "scene_import" => Ok(Self::SceneImport),
      "storyteller_scene" => Ok(Self::StorytellerScene),
      "scene" => Ok(Self::Scene),
      "character" => Ok(Self::Character),
      "animation" => Ok(Self::Animation),
      "object" => Ok(Self::Object),
      "skybox" => Ok(Self::Skybox),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

}

#[cfg(test)]
mod tests {
  use super::super::media_file_subtype::MediaFileSubtype;
  use enums_shared::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(MediaFileSubtype::Deprecated, "deprecated");
      assert_serialization(MediaFileSubtype::Mixamo, "mixamo");
      assert_serialization(MediaFileSubtype::MocapNet, "mocap_net");
      assert_serialization(MediaFileSubtype::AnimationOnly, "animation_only");
      assert_serialization(MediaFileSubtype::SceneImport, "scene_import");
      assert_serialization(MediaFileSubtype::StorytellerScene, "storyteller_scene");
      assert_serialization(MediaFileSubtype::Scene, "scene");
      assert_serialization(MediaFileSubtype::Character, "character");
      assert_serialization(MediaFileSubtype::Animation, "animation");
      assert_serialization(MediaFileSubtype::Object, "object");
      assert_serialization(MediaFileSubtype::Skybox, "skybox");
    }

    #[test]
    fn test_to_str() {
      assert_eq!(MediaFileSubtype::Deprecated.to_str(), "deprecated");
      assert_eq!(MediaFileSubtype::Mixamo.to_str(), "mixamo");
      assert_eq!(MediaFileSubtype::MocapNet.to_str(), "mocap_net");
      assert_eq!(MediaFileSubtype::AnimationOnly.to_str(), "animation_only");
      assert_eq!(MediaFileSubtype::SceneImport.to_str(), "scene_import");
      assert_eq!(MediaFileSubtype::StorytellerScene.to_str(), "storyteller_scene");
      assert_eq!(MediaFileSubtype::Scene.to_str(), "scene");
      assert_eq!(MediaFileSubtype::Character.to_str(), "character");
      assert_eq!(MediaFileSubtype::Animation.to_str(), "animation");
      assert_eq!(MediaFileSubtype::Object.to_str(), "object");
      assert_eq!(MediaFileSubtype::Skybox.to_str(), "skybox");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(MediaFileSubtype::from_str("deprecated").unwrap(), MediaFileSubtype::Deprecated);
      assert_eq!(MediaFileSubtype::from_str("mixamo").unwrap(), MediaFileSubtype::Mixamo);
      assert_eq!(MediaFileSubtype::from_str("mocap_net").unwrap(), MediaFileSubtype::MocapNet);
      assert_eq!(MediaFileSubtype::from_str("animation_only").unwrap(), MediaFileSubtype::AnimationOnly);
      assert_eq!(MediaFileSubtype::from_str("scene_import").unwrap(), MediaFileSubtype::SceneImport);
      assert_eq!(MediaFileSubtype::from_str("storyteller_scene").unwrap(), MediaFileSubtype::StorytellerScene);
      assert_eq!(MediaFileSubtype::from_str("scene").unwrap(), MediaFileSubtype::Scene);
      assert_eq!(MediaFileSubtype::from_str("character").unwrap(), MediaFileSubtype::Character);
      assert_eq!(MediaFileSubtype::from_str("animation").unwrap(), MediaFileSubtype::Animation);
      assert_eq!(MediaFileSubtype::from_str("object").unwrap(), MediaFileSubtype::Object);
      assert_eq!(MediaFileSubtype::from_str("skybox").unwrap(), MediaFileSubtype::Skybox);
      assert!(MediaFileSubtype::from_str("foo").is_err());
    }

  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in MediaFileSubtype::iter() {
        assert_eq!(variant, MediaFileSubtype::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, MediaFileSubtype::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, MediaFileSubtype::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      use strum::IntoEnumIterator;
      const MAX_LENGTH : usize = 32;
      for variant in MediaFileSubtype::iter() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
