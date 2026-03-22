use enums_api::by_table::featured_items::featured_item_entity_type::FeaturedItemEntityType as Api;
use enums_db::by_table::featured_items::featured_item_entity_type::FeaturedItemEntityType as Db;

pub fn featured_item_entity_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::MediaFile => Db::MediaFile,
    Api::ModelWeight => Db::ModelWeight,
    Api::User => Db::User,
  }
}

pub fn featured_item_entity_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::MediaFile => Api::MediaFile,
    Db::ModelWeight => Api::ModelWeight,
    Db::User => Api::User,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = featured_item_entity_type_to_db(&api_variant);
      let back = featured_item_entity_type_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = featured_item_entity_type_to_api(&variant);
      let back = featured_item_entity_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
