
use strum::EnumIter;
use utoipa::ToSchema;

#[derive(Clone, Debug, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, EnumIter, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]

pub enum TaskType {
  ImageGeneration,
  ImageInpaintEdit,
  VideoGeneration,
  ObjectGeneration,
  GaussianGeneration,
  BackgroundRemoval,
}

#[cfg(test)]
mod tests {
  use super::TaskType;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

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
    fn test_deserialization() {
      assert_deserialization("image_generation", TaskType::ImageGeneration);
      assert_deserialization("image_inpaint_edit", TaskType::ImageInpaintEdit);
      assert_deserialization("video_generation", TaskType::VideoGeneration);
      assert_deserialization("object_generation", TaskType::ObjectGeneration);
      assert_deserialization("gaussian_generation", TaskType::GaussianGeneration);
      assert_deserialization("background_removal", TaskType::BackgroundRemoval);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(TaskType::iter().count(), 6);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in TaskType::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: TaskType = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
