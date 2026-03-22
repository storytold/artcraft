use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `media_files` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
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

#[cfg(test)]
mod tests {
  use super::MediaFileSubtype;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
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
    fn test_deserialization() {
      assert_deserialization("deprecated", MediaFileSubtype::Deprecated);
      assert_deserialization("mixamo", MediaFileSubtype::Mixamo);
      assert_deserialization("mocap_net", MediaFileSubtype::MocapNet);
      assert_deserialization("animation_only", MediaFileSubtype::AnimationOnly);
      assert_deserialization("scene_import", MediaFileSubtype::SceneImport);
      assert_deserialization("storyteller_scene", MediaFileSubtype::StorytellerScene);
      assert_deserialization("scene", MediaFileSubtype::Scene);
      assert_deserialization("character", MediaFileSubtype::Character);
      assert_deserialization("animation", MediaFileSubtype::Animation);
      assert_deserialization("object", MediaFileSubtype::Object);
      assert_deserialization("skybox", MediaFileSubtype::Skybox);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(MediaFileSubtype::iter().count(), 11);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in MediaFileSubtype::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: MediaFileSubtype = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
