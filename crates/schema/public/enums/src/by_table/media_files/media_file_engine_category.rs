use std::collections::BTreeSet;

use serde::Deserialize;
use serde::Serialize;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `media_files` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema)]
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

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(MediaFileEngineCategory);
impl_mysql_enum_coders!(MediaFileEngineCategory);
impl_mysql_from_row!(MediaFileEngineCategory);

/// NB: Legacy API for older code.
impl MediaFileEngineCategory {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Scene => "scene",
      Self::Character => "character",
      Self::Creature => "creature",
      Self::Animation => "animation",
      Self::Expression => "expression",
      Self::Location => "location",
      Self::SetDressing => "set_dressing",
      Self::Object => "object",
      Self::Skybox => "skybox",
      Self::ImagePlane => "image_plane",
      Self::VideoPlane => "video_plane",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "scene" => Ok(Self::Scene),
      "character" => Ok(Self::Character),
      "creature" => Ok(Self::Creature),
      "animation" => Ok(Self::Animation),
      "expression" => Ok(Self::Expression),
      "location" => Ok(Self::Location),
      "set_dressing" => Ok(Self::SetDressing),
      "object" => Ok(Self::Object),
      "skybox" => Ok(Self::Skybox),
      "image_plane" => Ok(Self::ImagePlane),
      "video_plane" => Ok(Self::VideoPlane),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Scene,
      Self::Character,
      Self::Creature,
      Self::Animation,
      Self::Expression,
      Self::Location,
      Self::SetDressing,
      Self::Object,
      Self::Skybox,
      Self::ImagePlane,
      Self::VideoPlane,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::media_files::media_file_engine_category::MediaFileEngineCategory;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(MediaFileEngineCategory::Scene, "scene");
      assert_serialization(MediaFileEngineCategory::Character, "character");
      assert_serialization(MediaFileEngineCategory::Creature, "creature");
      assert_serialization(MediaFileEngineCategory::Animation, "animation");
      assert_serialization(MediaFileEngineCategory::Expression, "expression");
      assert_serialization(MediaFileEngineCategory::Location, "location");
      assert_serialization(MediaFileEngineCategory::SetDressing, "set_dressing");
      assert_serialization(MediaFileEngineCategory::Object, "object");
      assert_serialization(MediaFileEngineCategory::Skybox, "skybox");
      assert_serialization(MediaFileEngineCategory::ImagePlane, "image_plane");
      assert_serialization(MediaFileEngineCategory::VideoPlane, "video_plane");
    }

    #[test]
    fn test_to_str() {
      assert_eq!(MediaFileEngineCategory::Scene.to_str(), "scene");
      assert_eq!(MediaFileEngineCategory::Character.to_str(), "character");
      assert_eq!(MediaFileEngineCategory::Creature.to_str(), "creature");
      assert_eq!(MediaFileEngineCategory::Animation.to_str(), "animation");
      assert_eq!(MediaFileEngineCategory::Expression.to_str(), "expression");
      assert_eq!(MediaFileEngineCategory::Location.to_str(), "location");
      assert_eq!(MediaFileEngineCategory::SetDressing.to_str(), "set_dressing");
      assert_eq!(MediaFileEngineCategory::Object.to_str(), "object");
      assert_eq!(MediaFileEngineCategory::Skybox.to_str(), "skybox");
      assert_eq!(MediaFileEngineCategory::ImagePlane.to_str(), "image_plane");
      assert_eq!(MediaFileEngineCategory::VideoPlane.to_str(), "video_plane");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(MediaFileEngineCategory::from_str("scene").unwrap(), MediaFileEngineCategory::Scene);
      assert_eq!(MediaFileEngineCategory::from_str("character").unwrap(), MediaFileEngineCategory::Character);
      assert_eq!(MediaFileEngineCategory::from_str("creature").unwrap(), MediaFileEngineCategory::Creature);
      assert_eq!(MediaFileEngineCategory::from_str("animation").unwrap(), MediaFileEngineCategory::Animation);
      assert_eq!(MediaFileEngineCategory::from_str("expression").unwrap(), MediaFileEngineCategory::Expression);
      assert_eq!(MediaFileEngineCategory::from_str("location").unwrap(), MediaFileEngineCategory::Location);
      assert_eq!(MediaFileEngineCategory::from_str("set_dressing").unwrap(), MediaFileEngineCategory::SetDressing);
      assert_eq!(MediaFileEngineCategory::from_str("object").unwrap(), MediaFileEngineCategory::Object);
      assert_eq!(MediaFileEngineCategory::from_str("skybox").unwrap(), MediaFileEngineCategory::Skybox);
      assert_eq!(MediaFileEngineCategory::from_str("image_plane").unwrap(), MediaFileEngineCategory::ImagePlane);
      assert_eq!(MediaFileEngineCategory::from_str("video_plane").unwrap(), MediaFileEngineCategory::VideoPlane);
      assert!(MediaFileEngineCategory::from_str("foo").is_err());
    }

    #[test]
    fn all_variants() {
      let mut variants = MediaFileEngineCategory::all_variants();
      assert_eq!(variants.len(), 11);
      assert_eq!(variants.pop_first(), Some(MediaFileEngineCategory::Scene));
      assert_eq!(variants.pop_first(), Some(MediaFileEngineCategory::Character));
      assert_eq!(variants.pop_first(), Some(MediaFileEngineCategory::Creature));
      assert_eq!(variants.pop_first(), Some(MediaFileEngineCategory::Animation));
      assert_eq!(variants.pop_first(), Some(MediaFileEngineCategory::Expression));
      assert_eq!(variants.pop_first(), Some(MediaFileEngineCategory::Location));
      assert_eq!(variants.pop_first(), Some(MediaFileEngineCategory::SetDressing));
      assert_eq!(variants.pop_first(), Some(MediaFileEngineCategory::Object));
      assert_eq!(variants.pop_first(), Some(MediaFileEngineCategory::Skybox));
      assert_eq!(variants.pop_first(), Some(MediaFileEngineCategory::ImagePlane));
      assert_eq!(variants.pop_first(), Some(MediaFileEngineCategory::VideoPlane));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(MediaFileEngineCategory::all_variants().len(), MediaFileEngineCategory::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in MediaFileEngineCategory::all_variants() {
        assert_eq!(variant, MediaFileEngineCategory::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, MediaFileEngineCategory::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, MediaFileEngineCategory::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 16;
      for variant in MediaFileEngineCategory::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
