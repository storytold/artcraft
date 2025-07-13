use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum TaskType {
  ImageGeneration,
  VideoGeneration,
  ObjectGeneration,
  BackgroundRemoval,
}

impl_enum_display_and_debug_using_to_str!(TaskType);
//impl_mysql_enum_coders!(TaskType);
//impl_mysql_from_row!(TaskType);

// NB: We can derive `sqlx::Type` instead of using `impl_mysql_enum_coders`

impl TaskType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::ImageGeneration => "image_generation",
      Self::VideoGeneration => "video_generation",
      Self::ObjectGeneration => "object_generation",
      Self::BackgroundRemoval => "background_removal",
    }
  }

  pub fn from_str(job_status: &str) -> Result<Self, String> {
    match job_status {
      "image_generation" => Ok(Self::ImageGeneration),
      "video_generation" => Ok(Self::VideoGeneration),
      "object_generation" => Ok(Self::ObjectGeneration),
      "background_removal" => Ok(Self::BackgroundRemoval),
      _ => Err(format!("invalid task_state: {:?}", job_status)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::ImageGeneration,
      Self::VideoGeneration,
      Self::ObjectGeneration,
      Self::BackgroundRemoval,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::test_helpers::assert_serialization;
  use crate::tauri::tasks::task_type::TaskType;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(TaskType::ImageGeneration, "image_generation");
      assert_serialization(TaskType::VideoGeneration, "video_generation");
      assert_serialization(TaskType::ObjectGeneration, "object_generation");
      assert_serialization(TaskType::BackgroundRemoval, "background_removal");
    }

    #[test]
    fn to_str() {
      assert_eq!(TaskType::ImageGeneration.to_str(), "image_generation");
      assert_eq!(TaskType::VideoGeneration.to_str(), "video_generation");
      assert_eq!(TaskType::ObjectGeneration.to_str(), "object_generation");
      assert_eq!(TaskType::BackgroundRemoval.to_str(), "background_removal");
    }

    #[test]
    fn from_str() {
      assert_eq!(TaskType::from_str("image_generation").unwrap(), TaskType::ImageGeneration);
      assert_eq!(TaskType::from_str("video_generation").unwrap(), TaskType::VideoGeneration);
      assert_eq!(TaskType::from_str("object_generation").unwrap(), TaskType::ObjectGeneration);
      assert_eq!(TaskType::from_str("background_removal").unwrap(), TaskType::BackgroundRemoval);
    }

    #[test]
    fn all_variants() {
      let mut variants = TaskType::all_variants();
      assert_eq!(variants.len(), 4);
      assert_eq!(variants.pop_first(), Some(TaskType::ImageGeneration));
      assert_eq!(variants.pop_first(), Some(TaskType::VideoGeneration));
      assert_eq!(variants.pop_first(), Some(TaskType::ObjectGeneration));
      assert_eq!(variants.pop_first(), Some(TaskType::BackgroundRemoval));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(TaskType::all_variants().len(), TaskType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in TaskType::all_variants() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, TaskType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, TaskType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, TaskType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }
  }
}
