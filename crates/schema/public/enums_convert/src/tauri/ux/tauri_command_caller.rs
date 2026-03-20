use enums_api::tauri::ux::tauri_command_caller::TauriCommandCaller as Api;
use enums_db::tauri::ux::tauri_command_caller::TauriCommandCaller as Db;

pub fn tauri_command_caller_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Canvas => Db::Canvas,
    Api::ImageEditor => Db::ImageEditor,
    Api::TextToImage => Db::TextToImage,
    Api::ImageToVideo => Db::ImageToVideo,
    Api::MiniApp => Db::MiniApp,
  }
}

pub fn tauri_command_caller_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Canvas => Api::Canvas,
    Db::ImageEditor => Api::ImageEditor,
    Db::TextToImage => Api::TextToImage,
    Db::ImageToVideo => Api::ImageToVideo,
    Db::MiniApp => Api::MiniApp,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_db_to_api() {
    for variant in Db::all_variants() {
      let api = tauri_command_caller_to_api(&variant);
      let back = tauri_command_caller_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
