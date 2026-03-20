use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `media_files` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, EnumIter, Debug)]
#[serde(rename_all = "snake_case")]

pub enum MediaFileAnimationType {
  /// Body: No body animation or rig.
  /// Face: Rig supporting ARKit face blendshapes, or ARKit data
  ArKit,

  /// Body: Animation or rig for MikuMikuDance (MMD).
  /// Face: No face animation.
  MikuMikuDance,

  /// Body: Animation or rig for MikuMikuDance (MMD).
  /// Face: Animation blendshapes for ARKit.
  MikuMikuDanceArKit,

  /// Body: Animation or rig for Mixamo
  /// Face: No face animation.
  Mixamo,

  /// Body: Animation or rig for Mixamo
  /// Face: Animation blendshapes for ARKit.
  MixamoArKit,

  /// Body: Animation or rig by MocapNet
  /// Face: No face animation.
  MocapNet,

  /// Body: Animation or rig for MocapNet
  /// Face: Animation blendshapes for ARKit.
  MocapNetArKit,

  /// Body: Animation or rig by Move.ai
  /// Face: No face animation.
  MoveAi,

  /// Body: Animation or rig for Move.ai
  /// Face: Animation blendshapes for ARKit.
  MoveAiArKit,

  /// Body: Animation or rig for Rigify.
  /// Face: No face animation.
  Rigify,

  /// Body: Animation or rig for Rigify.
  /// Face: Animation blendshapes for ARKit.
  RigifyArKit,

  /// Body: Animation or rig for Rokoko.
  /// Face: No face animation.
  Rokoko,

  /// Body: Animation or rig for Rokoko.
  /// Face: Animation blendshapes for ARKit.
  RokokoArKit,
}

#[cfg(test)]
mod tests {
  use super::MediaFileAnimationType;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(MediaFileAnimationType::iter().count(), 13);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in MediaFileAnimationType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: MediaFileAnimationType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
