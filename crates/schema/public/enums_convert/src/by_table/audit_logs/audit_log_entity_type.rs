use enums_api::by_table::audit_logs::audit_log_entity_type::AuditLogEntityType as Api;
use enums_db::by_table::audit_logs::audit_log_entity_type::AuditLogEntityType as Db;

pub fn audit_log_entity_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Comment => Db::Comment,
    Api::MediaFile => Db::MediaFile,
    Api::ModelWeight => Db::ModelWeight,
    Api::User => Db::User,
  }
}

pub fn audit_log_entity_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Comment => Api::Comment,
    Db::MediaFile => Api::MediaFile,
    Db::ModelWeight => Api::ModelWeight,
    Db::User => Api::User,
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
      let db = audit_log_entity_type_to_db(&api_variant);
      let back = audit_log_entity_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = audit_log_entity_type_to_db(&api_variant);
      let back = audit_log_entity_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }
}
