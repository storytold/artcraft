use enums_api::common::job_status::JobStatus as Api;
use enums_db::common::job_status::JobStatus as Db;

pub fn job_status_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Pending => Db::Pending,
    Api::Started => Db::Started,
    Api::CompleteSuccess => Db::CompleteSuccess,
    Api::CompleteFailure => Db::CompleteFailure,
    Api::AttemptFailed => Db::AttemptFailed,
    Api::Dead => Db::Dead,
  }
}

pub fn job_status_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Pending => Api::Pending,
    Db::Started => Api::Started,
    Db::CompleteSuccess => Api::CompleteSuccess,
    Db::CompleteFailure => Api::CompleteFailure,
    Db::AttemptFailed => Api::AttemptFailed,
    Db::Dead => Api::Dead,
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
      let api = job_status_to_api(&variant);
      let back = job_status_to_db(&api);
      assert_eq!(variant, back);
    }
  }

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for variant in Api::iter() {
      let db = job_status_to_db(&variant);
      let back = job_status_to_api(&db);
      assert_eq!(variant, back);
    }
  }
}
