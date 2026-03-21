use std::collections::BTreeSet;

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

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Deprecated,
      Self::Mixamo,
      Self::MocapNet,
      Self::AnimationOnly,
      Self::SceneImport,
      Self::StorytellerScene,
      Self::Scene,
      Self::Character,
      Self::Animation,
      Self::Object,
      Self::Skybox,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::MediaFileSubtype;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in MediaFileSubtype::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: MediaFileSubtype = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
