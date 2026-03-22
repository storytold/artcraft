use std::collections::BTreeSet;

use enums_shared::error::enums_error::EnumsError;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;

#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskType {
  ImageGeneration,
  ImageInpaintEdit,
  VideoGeneration,
  ObjectGeneration,
  GaussianGeneration,
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
      Self::ImageInpaintEdit => "image_inpaint_edit",
      Self::VideoGeneration => "video_generation",
      Self::ObjectGeneration => "object_generation",
      Self::GaussianGeneration => "gaussian_generation",
      Self::BackgroundRemoval => "background_removal",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, EnumsError> {
    match value {
      "image_generation" => Ok(Self::ImageGeneration),
      "image_inpaint_edit" => Ok(Self::ImageInpaintEdit),
      "video_generation" => Ok(Self::VideoGeneration),
      "object_generation" => Ok(Self::ObjectGeneration),
      "gaussian_generation" => Ok(Self::GaussianGeneration),
      "background_removal" => Ok(Self::BackgroundRemoval),
      _ => Err(EnumsError::CouldNotConvertFromString(value.to_string())),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::ImageGeneration,
      Self::ImageInpaintEdit,
      Self::VideoGeneration,
      Self::ObjectGeneration,
      Self::GaussianGeneration,
      Self::BackgroundRemoval,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::TaskType;
  use enums_shared::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;
    use enums_shared::error::enums_error::EnumsError;

    #[test]
    fn test_serialization() {
      assert_serialization(TaskType::ImageGeneration, "image_generation");
      assert_serialization(TaskType::ImageInpaintEdit, "image_inpaint_edit");
      assert_serialization(TaskType::VideoGeneration, "video_generation");
      assert_serialization(TaskType::ObjectGeneration, "object_generation");
      assert_serialization(TaskType::GaussianGeneration, "gaussian_generation");
      assert_serialization(TaskType::BackgroundRemoval, "background_removal");
    }

    #[test]
    fn to_str() {
      assert_eq!(TaskType::ImageGeneration.to_str(), "image_generation");
      assert_eq!(TaskType::ImageInpaintEdit.to_str(), "image_inpaint_edit");
      assert_eq!(TaskType::VideoGeneration.to_str(), "video_generation");
      assert_eq!(TaskType::ObjectGeneration.to_str(), "object_generation");
      assert_eq!(TaskType::GaussianGeneration.to_str(), "gaussian_generation");
      assert_eq!(TaskType::BackgroundRemoval.to_str(), "background_removal");
    }

    #[test]
    fn from_str() {
      assert_eq!(TaskType::from_str("image_generation").unwrap(), TaskType::ImageGeneration);
      assert_eq!(TaskType::from_str("image_inpaint_edit").unwrap(), TaskType::ImageInpaintEdit);
      assert_eq!(TaskType::from_str("video_generation").unwrap(), TaskType::VideoGeneration);
      assert_eq!(TaskType::from_str("object_generation").unwrap(), TaskType::ObjectGeneration);
      assert_eq!(TaskType::from_str("gaussian_generation").unwrap(), TaskType::GaussianGeneration);
      assert_eq!(TaskType::from_str("background_removal").unwrap(), TaskType::BackgroundRemoval);
    }
    
    #[test]
    fn from_str_err() {
      let result = TaskType::from_str("asdf");
      assert!(result.is_err());
      if let Err(EnumsError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "asdf");
      } else {
        panic!("Expected EnumsError::CouldNotConvertFromString");
      }
    }

    #[test]
    fn all_variants() {
      let mut variants = TaskType::all_variants();
      assert_eq!(variants.len(), 6);
      assert_eq!(variants.pop_first(), Some(TaskType::ImageGeneration));
      assert_eq!(variants.pop_first(), Some(TaskType::ImageInpaintEdit));
      assert_eq!(variants.pop_first(), Some(TaskType::VideoGeneration));
      assert_eq!(variants.pop_first(), Some(TaskType::ObjectGeneration));
      assert_eq!(variants.pop_first(), Some(TaskType::GaussianGeneration));
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
