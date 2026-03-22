use enums_api::common::sqlite::awaitable_job_status::AwaitableJobStatus as Api;
use enums_db::common::sqlite::awaitable_job_status::AwaitableJobStatus as Db;

pub fn awaitable_job_status_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::NotReady => Db::NotReady,
    Api::ReadyWaiting => Db::ReadyWaiting,
    Api::Processing => Db::Processing,
    Api::RetryablyFailed => Db::RetryablyFailed,
    Api::PermanentlyFailed => Db::PermanentlyFailed,
    Api::Skipped => Db::Skipped,
    Api::Done => Db::Done,
  }
}

pub fn awaitable_job_status_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::NotReady => Api::NotReady,
    Db::ReadyWaiting => Api::ReadyWaiting,
    Db::Processing => Api::Processing,
    Db::RetryablyFailed => Api::RetryablyFailed,
    Db::PermanentlyFailed => Api::PermanentlyFailed,
    Db::Skipped => Api::Skipped,
    Db::Done => Api::Done,
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = awaitable_job_status_to_db(&api_variant);
      let back = awaitable_job_status_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }
}
