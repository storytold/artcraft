
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
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in TaskType::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: TaskType = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
