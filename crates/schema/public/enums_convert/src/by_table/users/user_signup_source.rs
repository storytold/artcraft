use enums_api::by_table::users::user_signup_source::UserSignupSource as Api;
use enums_db::by_table::users::user_signup_source::UserSignupSource as Db;

pub fn user_signup_source_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::ArtCraft => Db::ArtCraft,
    Api::ArtCraftApp => Db::ArtCraftApp,
    Api::ArtCraftAiWeb => Db::ArtCraftAiWeb,
    Api::ArtCraftAiStripe => Db::ArtCraftAiStripe,
    Api::ArtCraftGetWeb => Db::ArtCraftGetWeb,
    Api::ArtCraftGetStripe => Db::ArtCraftGetStripe,
    Api::FakeYou => Db::FakeYou,
    Api::Storyteller => Db::Storyteller,
  }
}

pub fn user_signup_source_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::ArtCraft => Api::ArtCraft,
    Db::ArtCraftApp => Api::ArtCraftApp,
    Db::ArtCraftAiWeb => Api::ArtCraftAiWeb,
    Db::ArtCraftAiStripe => Api::ArtCraftAiStripe,
    Db::ArtCraftGetWeb => Api::ArtCraftGetWeb,
    Db::ArtCraftGetStripe => Api::ArtCraftGetStripe,
    Db::FakeYou => Api::FakeYou,
    Db::Storyteller => Api::Storyteller,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = user_signup_source_to_db(&api_variant);
      let back = user_signup_source_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = user_signup_source_to_api(&variant);
      let back = user_signup_source_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
