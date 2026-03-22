use enums_api::by_table::tts_render_tasks::tts_render_status::TtsRenderStatus as Api;
use enums_db::by_table::tts_render_tasks::tts_render_status::TtsRenderStatus as Db;

pub fn tts_render_status_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::New => Db::New,
    Api::Processing => Db::Processing,
    Api::Skipped => Db::Skipped,
    Api::Failed => Db::Failed,
    Api::PermanentlyFailed => Db::PermanentlyFailed,
    Api::Success => Db::Success,
  }
}

pub fn tts_render_status_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::New => Api::New,
    Db::Processing => Api::Processing,
    Db::Skipped => Api::Skipped,
    Db::Failed => Api::Failed,
    Db::PermanentlyFailed => Api::PermanentlyFailed,
    Db::Success => Api::Success,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = tts_render_status_to_db(&api_variant);
      let back = tts_render_status_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = tts_render_status_to_db(&api_variant);
      let back = tts_render_status_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }
}
