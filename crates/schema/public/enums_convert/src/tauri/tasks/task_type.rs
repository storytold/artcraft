use enums_api::tauri::tasks::task_type::TaskType as Api;
use enums_db::tauri::tasks::task_type::TaskType as Db;

pub fn task_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::ImageGeneration => Db::ImageGeneration,
    Api::ImageInpaintEdit => Db::ImageInpaintEdit,
    Api::VideoGeneration => Db::VideoGeneration,
    Api::ObjectGeneration => Db::ObjectGeneration,
    Api::GaussianGeneration => Db::GaussianGeneration,
    Api::BackgroundRemoval => Db::BackgroundRemoval,
  }
}

pub fn task_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::ImageGeneration => Api::ImageGeneration,
    Db::ImageInpaintEdit => Api::ImageInpaintEdit,
    Db::VideoGeneration => Api::VideoGeneration,
    Db::ObjectGeneration => Api::ObjectGeneration,
    Db::GaussianGeneration => Api::GaussianGeneration,
    Db::BackgroundRemoval => Api::BackgroundRemoval,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = task_type_to_api(&variant);
      let back = task_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for variant in Api::iter() {
      let db = task_type_to_db(&variant);
      let back = task_type_to_api(&db);
      assert_eq!(variant, back);
    }
  }
}
