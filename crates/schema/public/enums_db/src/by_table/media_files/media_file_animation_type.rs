use strum::EnumCount;
use strum::EnumIter;

/// Used in the `media_files` table in a `VARCHAR` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
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

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(MediaFileAnimationType);
impl_mysql_enum_coders!(MediaFileAnimationType);
impl_mysql_from_row!(MediaFileAnimationType);

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

}

#[cfg(test)]
mod tests {
  use super::super::media_file_animation_type::MediaFileAnimationType;
  use enums_shared::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(MediaFileAnimationType::ArKit, "ar_kit");
      assert_serialization(MediaFileAnimationType::MikuMikuDance, "miku_miku_dance");
      assert_serialization(MediaFileAnimationType::MikuMikuDanceArKit, "miku_miku_dance_ar_kit");
      assert_serialization(MediaFileAnimationType::Mixamo, "mixamo");
      assert_serialization(MediaFileAnimationType::MixamoArKit, "mixamo_ar_kit");
      assert_serialization(MediaFileAnimationType::MocapNet, "mocap_net");
      assert_serialization(MediaFileAnimationType::MocapNetArKit, "mocap_net_ar_kit");
      assert_serialization(MediaFileAnimationType::MoveAi, "move_ai");
      assert_serialization(MediaFileAnimationType::MoveAiArKit, "move_ai_ar_kit");
      assert_serialization(MediaFileAnimationType::Rigify, "rigify");
      assert_serialization(MediaFileAnimationType::RigifyArKit, "rigify_ar_kit");
      assert_serialization(MediaFileAnimationType::Rokoko, "rokoko");
      assert_serialization(MediaFileAnimationType::RokokoArKit, "rokoko_ar_kit");
    }

    #[test]
    fn test_to_str() {
      assert_eq!(MediaFileAnimationType::ArKit.to_str(), "ar_kit");
      assert_eq!(MediaFileAnimationType::MikuMikuDance.to_str(), "miku_miku_dance");
      assert_eq!(MediaFileAnimationType::MikuMikuDanceArKit.to_str(), "miku_miku_dance_ar_kit");
      assert_eq!(MediaFileAnimationType::Mixamo.to_str(), "mixamo");
      assert_eq!(MediaFileAnimationType::MixamoArKit.to_str(), "mixamo_ar_kit");
      assert_eq!(MediaFileAnimationType::MocapNet.to_str(), "mocap_net");
      assert_eq!(MediaFileAnimationType::MocapNetArKit.to_str(), "mocap_net_ar_kit");
      assert_eq!(MediaFileAnimationType::MoveAi.to_str(), "move_ai");
      assert_eq!(MediaFileAnimationType::MoveAiArKit.to_str(), "move_ai_ar_kit");
      assert_eq!(MediaFileAnimationType::Rigify.to_str(), "rigify");
      assert_eq!(MediaFileAnimationType::RigifyArKit.to_str(), "rigify_ar_kit");
      assert_eq!(MediaFileAnimationType::Rokoko.to_str(), "rokoko");
      assert_eq!(MediaFileAnimationType::RokokoArKit.to_str(), "rokoko_ar_kit");
    }

    #[test]
    fn test_from_str() {
      assert_eq!(MediaFileAnimationType::from_str("ar_kit").unwrap(), MediaFileAnimationType::ArKit);
      assert_eq!(MediaFileAnimationType::from_str("miku_miku_dance").unwrap(), MediaFileAnimationType::MikuMikuDance);
      assert_eq!(MediaFileAnimationType::from_str("miku_miku_dance_ar_kit").unwrap(), MediaFileAnimationType::MikuMikuDanceArKit);
      assert_eq!(MediaFileAnimationType::from_str("mixamo").unwrap(), MediaFileAnimationType::Mixamo);
      assert_eq!(MediaFileAnimationType::from_str("mixamo_ar_kit").unwrap(), MediaFileAnimationType::MixamoArKit);
      assert_eq!(MediaFileAnimationType::from_str("mocap_net").unwrap(), MediaFileAnimationType::MocapNet);
      assert_eq!(MediaFileAnimationType::from_str("mocap_net_ar_kit").unwrap(), MediaFileAnimationType::MocapNetArKit);
      assert_eq!(MediaFileAnimationType::from_str("move_ai").unwrap(), MediaFileAnimationType::MoveAi);
      assert_eq!(MediaFileAnimationType::from_str("move_ai_ar_kit").unwrap(), MediaFileAnimationType::MoveAiArKit);
      assert_eq!(MediaFileAnimationType::from_str("rigify").unwrap(), MediaFileAnimationType::Rigify);
      assert_eq!(MediaFileAnimationType::from_str("rigify_ar_kit").unwrap(), MediaFileAnimationType::RigifyArKit);
      assert_eq!(MediaFileAnimationType::from_str("rokoko").unwrap(), MediaFileAnimationType::Rokoko);
      assert_eq!(MediaFileAnimationType::from_str("rokoko_ar_kit").unwrap(), MediaFileAnimationType::RokokoArKit);
      assert!(MediaFileAnimationType::from_str("foo").is_err());
    }

  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip() {
      use strum::IntoEnumIterator;
      for variant in MediaFileAnimationType::iter() {
        assert_eq!(variant, MediaFileAnimationType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, MediaFileAnimationType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, MediaFileAnimationType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      use strum::IntoEnumIterator;
      const MAX_LENGTH : usize = 32;
      for variant in MediaFileAnimationType::iter() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
