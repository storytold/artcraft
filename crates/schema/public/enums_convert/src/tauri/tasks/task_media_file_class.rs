use enums_api::tauri::tasks::task_media_file_class::TaskMediaFileClass as Api;
use enums_db::tauri::tasks::task_media_file_class::TaskMediaFileClass as Db;

pub fn task_media_file_class_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Audio => Db::Audio,
    Api::Image => Db::Image,
    Api::Video => Db::Video,
    Api::Dimensional => Db::Dimensional,
  }
}

pub fn task_media_file_class_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Audio => Api::Audio,
    Db::Image => Api::Image,
    Db::Video => Api::Video,
    Db::Dimensional => Api::Dimensional,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_db_to_api() {
    for variant in Db::all_variants() {
      let api = task_media_file_class_to_api(&variant);
      let back = task_media_file_class_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
