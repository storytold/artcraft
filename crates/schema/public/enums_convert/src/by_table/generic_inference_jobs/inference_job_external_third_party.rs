use enums_api::by_table::generic_inference_jobs::inference_job_external_third_party::InferenceJobExternalThirdParty as Api;
use enums_db::by_table::generic_inference_jobs::inference_job_external_third_party::InferenceJobExternalThirdParty as Db;

pub fn inference_job_external_third_party_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Fal => Db::Fal,
    Api::Seedance2Pro => Db::Seedance2Pro,
    Api::Worldlabs => Db::Worldlabs,
  }
}

pub fn inference_job_external_third_party_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Fal => Api::Fal,
    Db::Seedance2Pro => Api::Seedance2Pro,
    Db::Worldlabs => Api::Worldlabs,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = inference_job_external_third_party_to_db(&api_variant);
      let back = inference_job_external_third_party_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = inference_job_external_third_party_to_api(&variant);
      let back = inference_job_external_third_party_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
