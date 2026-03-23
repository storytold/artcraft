use enums_api::api_safe::by_table::generic_inference_jobs::frontend_failure_category_for_api_clients::FrontendFailureCategoryForApiClients;
use enums_api::tauri::tasks::task_failure_type::TaskFailureType as Api;
use enums_db::tauri::tasks::task_failure_type::TaskFailureType as Db;

pub fn task_failure_type_to_db(api_value: &Api) -> Db {
  match api_value {
    Api::Unknown => Db::Unknown,
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

pub fn task_failure_type_to_api(db_value: &Db) -> Api {
  match db_value {
    Db::Unknown => Api::Unknown,
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

/// Convert the API client's `FrontendFailureCategoryForApiClients` to a Tauri-facing `TaskFailureType` (DB).
/// If there isn't a matching variant, return `Unknown`.
pub fn task_failure_type_from_frontend_failure_category_for_api(category: &FrontendFailureCategoryForApiClients) -> Db {
  match category {
    FrontendFailureCategoryForApiClients::ModelRulesViolation => Db::RuleBansUserContent, // NB: Legacy enum value.
    FrontendFailureCategoryForApiClients::RuleBansUserImage => Db::RuleBansUserImage,
    FrontendFailureCategoryForApiClients::RuleBansUserImageWithFaces => Db::RuleBansUserImageWithFaces,
    FrontendFailureCategoryForApiClients::RuleBansUserTextPrompt => Db::RuleBansUserTextPrompt,
    FrontendFailureCategoryForApiClients::RuleBansUserContent => Db::RuleBansUserContent,
    FrontendFailureCategoryForApiClients::RuleBansGeneratedVideo => Db::RuleBansGeneratedVideo,
    FrontendFailureCategoryForApiClients::RuleBansGeneratedAudio => Db::RuleBansGeneratedAudio,
    FrontendFailureCategoryForApiClients::RuleBansGeneratedContent => Db::RuleBansGeneratedContent,
    FrontendFailureCategoryForApiClients::GenerationFailed => Db::GenerationFailed,
    _ => Db::Unknown,
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
      let api = task_failure_type_to_api(&variant);
      let back = task_failure_type_to_db(&api);
      assert_eq!(variant, back);
    }
  }

  mod from_frontend_failure_category_for_api {
    use super::*;

    #[test]
    fn direct_mappings() {
      assert_eq!(task_failure_type_from_frontend_failure_category_for_api(&FrontendFailureCategoryForApiClients::RuleBansUserImage), Db::RuleBansUserImage);
      assert_eq!(task_failure_type_from_frontend_failure_category_for_api(&FrontendFailureCategoryForApiClients::RuleBansUserImageWithFaces), Db::RuleBansUserImageWithFaces);
      assert_eq!(task_failure_type_from_frontend_failure_category_for_api(&FrontendFailureCategoryForApiClients::RuleBansUserTextPrompt), Db::RuleBansUserTextPrompt);
      assert_eq!(task_failure_type_from_frontend_failure_category_for_api(&FrontendFailureCategoryForApiClients::RuleBansUserContent), Db::RuleBansUserContent);
      assert_eq!(task_failure_type_from_frontend_failure_category_for_api(&FrontendFailureCategoryForApiClients::RuleBansGeneratedVideo), Db::RuleBansGeneratedVideo);
      assert_eq!(task_failure_type_from_frontend_failure_category_for_api(&FrontendFailureCategoryForApiClients::RuleBansGeneratedAudio), Db::RuleBansGeneratedAudio);
      assert_eq!(task_failure_type_from_frontend_failure_category_for_api(&FrontendFailureCategoryForApiClients::RuleBansGeneratedContent), Db::RuleBansGeneratedContent);
      assert_eq!(task_failure_type_from_frontend_failure_category_for_api(&FrontendFailureCategoryForApiClients::GenerationFailed), Db::GenerationFailed);
    }

    #[test]
    fn legacy_model_rules_violation_maps_to_rule_bans_user_content() {
      assert_eq!(task_failure_type_from_frontend_failure_category_for_api(&FrontendFailureCategoryForApiClients::ModelRulesViolation), Db::RuleBansUserContent);
    }

    #[test]
    fn unmapped_variants_become_unknown() {
      assert_eq!(task_failure_type_from_frontend_failure_category_for_api(&FrontendFailureCategoryForApiClients::FaceNotDetected), Db::Unknown);
      assert_eq!(task_failure_type_from_frontend_failure_category_for_api(&FrontendFailureCategoryForApiClients::KeepAliveElapsed), Db::Unknown);
      assert_eq!(task_failure_type_from_frontend_failure_category_for_api(&FrontendFailureCategoryForApiClients::NotYetImplemented), Db::Unknown);
      assert_eq!(task_failure_type_from_frontend_failure_category_for_api(&FrontendFailureCategoryForApiClients::RetryableWorkerError), Db::Unknown);
    }

    #[test]
    fn unknown_api_variant_becomes_unknown() {
      assert_eq!(task_failure_type_from_frontend_failure_category_for_api(&FrontendFailureCategoryForApiClients::Unknown("some_future_value".to_string())), Db::Unknown);
    }
  }

  #[test]
  fn round_trip_api_to_db() {
    use strum::IntoEnumIterator;
    for variant in Api::iter() {
      let db = task_failure_type_to_db(&variant);
      let back = task_failure_type_to_api(&db);
      assert_eq!(variant, back);
    }
  }
}
