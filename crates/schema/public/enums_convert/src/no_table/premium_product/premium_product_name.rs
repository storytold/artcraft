use enums_api::no_table::premium_product::premium_product_name::PremiumProductName as Api;
use enums_db::no_table::premium_product::premium_product_name::PremiumProductName as Db;

pub fn premium_product_name_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::FaceAnimator => Db::FaceAnimator,
    Api::FaceMirror => Db::FaceMirror,
    Api::Lipsync => Db::Lipsync,
    Api::VideoStyleTransfer => Db::VideoStyleTransfer,
  }
}

pub fn premium_product_name_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::FaceAnimator => Api::FaceAnimator,
    Db::FaceMirror => Api::FaceMirror,
    Db::Lipsync => Api::Lipsync,
    Db::VideoStyleTransfer => Api::VideoStyleTransfer,
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
      let api = premium_product_name_to_api(&variant);
      let back = premium_product_name_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
