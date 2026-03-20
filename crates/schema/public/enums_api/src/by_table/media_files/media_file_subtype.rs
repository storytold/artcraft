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
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

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
