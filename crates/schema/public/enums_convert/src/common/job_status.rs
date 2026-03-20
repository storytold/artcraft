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

  #[test]
  fn round_trip_db_to_api() {
    for variant in Db::all_variants() {
      let api = job_status_to_api(&variant);
      let back = job_status_to_db(&api);
      assert_eq!(variant, back);
    }
}
}
