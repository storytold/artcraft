use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `media_files` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
#[serde(rename_all = "snake_case")]

pub enum MediaFileEngineCategory {
  /// A 3D scene full of objects, characters, animations, etc.
  Scene,

  /// A 3D character model.
  Character,

  /// A 3D non-humanoid model, e.g. dragon, wolf, slime creature, etc.
  /// These may or may not have a skeleton that can be animated with IK/FK.
  Creature,

  /// A 3D skeletal animation sequence that can be applied to a character,
  /// creature, etc. Typically, these use Mixamo or Move.ai.
  Animation,

  /// A facial blend shape / shape key animation. Currently, these
  /// are 100% ARKit.
  Expression,

  /// A large 3D object that can be used as a backdrop for a scene,
  /// a.k.a. "set", "stage", etc. These are typically self-contained
  /// locations, buildings, or environments.
  Location,

  /// All items used to add atmosphere to a scene, e.g. furniture, plants,
  /// vehicles, radios, and certain props. (We'll reserve the word props for
  /// "hand props" later.)
  SetDressing,

  /// A 3D object that doesn't fit with the other types.
  Object,

  /// A 3D skybox.
  Skybox,

  /// An Image Plane (texture that spawns as an object)
  ImagePlane,

  /// A Video Plane (texture that spawns as an object)
  VideoPlane,
}

#[cfg(test)]
mod tests {
  use super::MediaFileEngineCategory;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(MediaFileEngineCategory::iter().count(), 11);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in MediaFileEngineCategory::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: MediaFileEngineCategory = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
