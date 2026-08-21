use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `media_files` table in the nullable `maybe_project_type`
/// VARCHAR(32) field.
///
/// Identifies which kind of internal Artcraft project document a media file is.
/// Only set when `media_class = 'project'`. The file format lives in
/// `media_type` (`json` / legacy `scene_json`); the JSON payload carries its
/// own schema version.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum MediaFileProjectType {
  /// 3D editor scene descriptor: objects with locations, skyboxes, animations,
  /// etc. — a full editable 3D scene.
  /// NB: serde's snake_case renames this to "scene3d" (no underscore before
  /// the digit), so the rename must be explicit.
  #[serde(rename = "scene_3d")]
  Scene3d,

  /// Mood board: a collection of images on a lightweight graph.
  MoodBoard,

  /// Graph workflow: a node-graph pipeline of image and video generation steps.
  Workflow,

  /// Video editor project: a nonlinear video editing timeline.
  VideoTimeline,

  /// 2D editor project: a 2D image editing document.
  /// NB: serde's snake_case renames this to "editor2d" (no underscore before
  /// the digit), so the rename must be explicit.
  #[serde(rename = "editor_2d")]
  Editor2d,
}

impl_enum_display_and_debug_using_to_str!(MediaFileProjectType);
impl_mysql_enum_coders!(MediaFileProjectType);
impl_mysql_from_row!(MediaFileProjectType);

impl MediaFileProjectType {
  pub const fn to_str(&self) -> &'static str {
    match self {
      Self::Scene3d => "scene_3d",
      Self::MoodBoard => "mood_board",
      Self::Workflow => "workflow",
      Self::VideoTimeline => "video_timeline",
      Self::Editor2d => "editor_2d",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "scene_3d" => Ok(Self::Scene3d),
      "mood_board" => Ok(Self::MoodBoard),
      "workflow" => Ok(Self::Workflow),
      "video_timeline" => Ok(Self::VideoTimeline),
      "editor_2d" => Ok(Self::Editor2d),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    BTreeSet::from([
      Self::Scene3d,
      Self::MoodBoard,
      Self::Workflow,
      Self::VideoTimeline,
      Self::Editor2d,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::media_files::media_file_project_type::MediaFileProjectType;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(MediaFileProjectType::Scene3d, "scene_3d");
      assert_serialization(MediaFileProjectType::MoodBoard, "mood_board");
      assert_serialization(MediaFileProjectType::Workflow, "workflow");
      assert_serialization(MediaFileProjectType::VideoTimeline, "video_timeline");
      assert_serialization(MediaFileProjectType::Editor2d, "editor_2d");
    }
  }

  mod impl_methods {
    use super::*;

    #[test]
    fn to_str() {
      assert_eq!(MediaFileProjectType::Scene3d.to_str(), "scene_3d");
      assert_eq!(MediaFileProjectType::MoodBoard.to_str(), "mood_board");
      assert_eq!(MediaFileProjectType::Workflow.to_str(), "workflow");
      assert_eq!(MediaFileProjectType::VideoTimeline.to_str(), "video_timeline");
      assert_eq!(MediaFileProjectType::Editor2d.to_str(), "editor_2d");
    }

    #[test]
    fn from_str() {
      assert_eq!(MediaFileProjectType::from_str("scene_3d").unwrap(), MediaFileProjectType::Scene3d);
      assert_eq!(MediaFileProjectType::from_str("mood_board").unwrap(), MediaFileProjectType::MoodBoard);
      assert_eq!(MediaFileProjectType::from_str("workflow").unwrap(), MediaFileProjectType::Workflow);
      assert_eq!(MediaFileProjectType::from_str("video_timeline").unwrap(), MediaFileProjectType::VideoTimeline);
      assert_eq!(MediaFileProjectType::from_str("editor_2d").unwrap(), MediaFileProjectType::Editor2d);
      assert!(MediaFileProjectType::from_str("foo").is_err());
    }
  }

  mod manual_variant_checks {
    use super::*;

    #[test]
    fn all_variants() {
      let mut variants = MediaFileProjectType::all_variants();
      assert_eq!(variants.len(), 5);
      assert_eq!(variants.pop_first(), Some(MediaFileProjectType::Scene3d));
      assert_eq!(variants.pop_first(), Some(MediaFileProjectType::MoodBoard));
      assert_eq!(variants.pop_first(), Some(MediaFileProjectType::Workflow));
      assert_eq!(variants.pop_first(), Some(MediaFileProjectType::VideoTimeline));
      assert_eq!(variants.pop_first(), Some(MediaFileProjectType::Editor2d));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(MediaFileProjectType::all_variants().len(), MediaFileProjectType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in MediaFileProjectType::all_variants() {
        assert_eq!(variant, MediaFileProjectType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, MediaFileProjectType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, MediaFileProjectType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 32;
      for variant in MediaFileProjectType::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
