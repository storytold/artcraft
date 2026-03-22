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

  #[test]
  fn round_trip_db_to_api() {
    for variant in Db::all_variants() {
      let api = task_type_to_api(&variant);
      let back = task_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
