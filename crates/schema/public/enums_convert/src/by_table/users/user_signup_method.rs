use enums_api::by_table::users::user_signup_method::UserSignupMethod as Api;
use enums_db::by_table::users::user_signup_method::UserSignupMethod as Db;

pub fn user_signup_method_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::EmailPassword => Db::EmailPassword,
    Api::GoogleSignIn => Db::GoogleSignIn,
    Api::StripeCheckout => Db::StripeCheckout,
  }
}

pub fn user_signup_method_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::EmailPassword => Api::EmailPassword,
    Db::GoogleSignIn => Api::GoogleSignIn,
    Db::StripeCheckout => Api::StripeCheckout,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = user_signup_method_to_db(&api_variant);
      let back = user_signup_method_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = user_signup_method_to_api(&variant);
      let back = user_signup_method_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
