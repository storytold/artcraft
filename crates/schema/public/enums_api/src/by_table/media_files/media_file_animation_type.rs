use std::collections::BTreeSet;

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

/// NB: Legacy API for older code.
impl MediaFileAnimationType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::ArKit => "ar_kit",
      Self::MikuMikuDance => "miku_miku_dance",
      Self::MikuMikuDanceArKit => "miku_miku_dance_ar_kit",
      Self::Mixamo => "mixamo",
      Self::MixamoArKit => "mixamo_ar_kit",
      Self::MocapNet => "mocap_net",
      Self::MocapNetArKit => "mocap_net_ar_kit",
      Self::MoveAi => "move_ai",
      Self::MoveAiArKit => "move_ai_ar_kit",
      Self::Rigify => "rigify",
      Self::RigifyArKit => "rigify_ar_kit",
      Self::Rokoko => "rokoko",
      Self::RokokoArKit => "rokoko_ar_kit",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "ar_kit" => Ok(Self::ArKit),
      "miku_miku_dance" => Ok(Self::MikuMikuDance),
      "miku_miku_dance_ar_kit" => Ok(Self::MikuMikuDanceArKit),
      "mixamo" => Ok(Self::Mixamo),
      "mixamo_ar_kit" => Ok(Self::MixamoArKit),
      "mocap_net" => Ok(Self::MocapNet),
      "mocap_net_ar_kit" => Ok(Self::MocapNetArKit),
      "move_ai" => Ok(Self::MoveAi),
      "move_ai_ar_kit" => Ok(Self::MoveAiArKit),
      "rigify" => Ok(Self::Rigify),
      "rigify_ar_kit" => Ok(Self::RigifyArKit),
      "rokoko" => Ok(Self::Rokoko),
      "rokoko_ar_kit" => Ok(Self::RokokoArKit),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::ArKit,
      Self::MikuMikuDance,
      Self::MikuMikuDanceArKit,
      Self::Mixamo,
      Self::MixamoArKit,
      Self::MocapNet,
      Self::MocapNetArKit,
      Self::MoveAi,
      Self::MoveAiArKit,
      Self::Rigify,
      Self::RigifyArKit,
      Self::Rokoko,
      Self::RokokoArKit,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::MediaFileAnimationType;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in MediaFileAnimationType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: MediaFileAnimationType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
