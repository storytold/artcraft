use enums_api::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory as Api;
use enums_db::by_table::generic_inference_jobs::frontend_failure_category::FrontendFailureCategory as Db;

pub fn frontend_failure_category_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::FaceNotDetected => Db::FaceNotDetected,
    Api::KeepAliveElapsed => Db::KeepAliveElapsed,
    Api::NotYetImplemented => Db::NotYetImplemented,
    Api::RetryableWorkerError => Db::RetryableWorkerError,
    Api::ModelRulesViolation => Db::ModelRulesViolation,
    Api::RuleBansUserImage => Db::RuleBansUserImage,
    Api::RuleBansUserImageWithFaces => Db::RuleBansUserImageWithFaces,
    Api::RuleBansUserTextPrompt => Db::RuleBansUserTextPrompt,
    Api::RuleBansUserContent => Db::RuleBansUserContent,
    Api::RuleBansGeneratedVideo => Db::RuleBansGeneratedVideo,
    Api::RuleBansGeneratedAudio => Db::RuleBansGeneratedAudio,
    Api::RuleBansGeneratedContent => Db::RuleBansGeneratedContent,
    Api::GenerationFailed => Db::GenerationFailed,
  }
}

pub fn frontend_failure_category_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::FaceNotDetected => Api::FaceNotDetected,
    Db::KeepAliveElapsed => Api::KeepAliveElapsed,
    Db::NotYetImplemented => Api::NotYetImplemented,
    Db::RetryableWorkerError => Api::RetryableWorkerError,
    Db::ModelRulesViolation => Api::ModelRulesViolation,
    Db::RuleBansUserImage => Api::RuleBansUserImage,
    Db::RuleBansUserImageWithFaces => Api::RuleBansUserImageWithFaces,
    Db::RuleBansUserTextPrompt => Api::RuleBansUserTextPrompt,
    Db::RuleBansUserContent => Api::RuleBansUserContent,
    Db::RuleBansGeneratedVideo => Api::RuleBansGeneratedVideo,
    Db::RuleBansGeneratedAudio => Api::RuleBansGeneratedAudio,
    Db::RuleBansGeneratedContent => Api::RuleBansGeneratedContent,
    Db::GenerationFailed => Api::GenerationFailed,
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for api_variant in Api::iter() {
      let db = frontend_failure_category_to_db(&api_variant);
      let back = frontend_failure_category_to_api(&db);
      assert_eq!(api_variant, back);
    }
  }

  #[test]
  fn round_trip_db_to_api() {
    use strum::IntoEnumIterator;
    for variant in Db::iter() {
      let api = frontend_failure_category_to_api(&variant);
      let back = frontend_failure_category_to_db(&api);
      assert_eq!(variant, back);
    }
  }
}
