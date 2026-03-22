use enums_api::by_table::audit_logs::audit_log_entity_action::AuditLogEntityAction as Api;
use enums_db::by_table::audit_logs::audit_log_entity_action::AuditLogEntityAction as Db;

pub fn audit_log_entity_action_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Create => Db::Create,
    Api::Edit => Db::Edit,
    Api::EditFeatures => Db::EditFeatures,
    Api::Delete => Db::Delete,
    Api::FeaturedItemCreate => Db::FeaturedItemCreate,
    Api::FeaturedItemDelete => Db::FeaturedItemDelete,
  }
}

pub fn audit_log_entity_action_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Create => Api::Create,
    Db::Edit => Api::Edit,
    Db::EditFeatures => Api::EditFeatures,
    Db::Delete => Api::Delete,
    Db::FeaturedItemCreate => Api::FeaturedItemCreate,
    Db::FeaturedItemDelete => Api::FeaturedItemDelete,
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
      let db = audit_log_entity_action_to_db(&api_variant);
      let back = audit_log_entity_action_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = audit_log_entity_action_to_db(&api_variant);
      let back = audit_log_entity_action_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }
}
