use strum::EnumIter;
use utoipa::ToSchema;

/// Used in the `generic_inference_jobs` table in `VARCHAR(16)` field `maybe_external_third_party`.
///
/// YOU CAN ADD NEW VALUES, BUT DO NOT CHANGE EXISTING VALUES WITHOUT A MIGRATION STRATEGY.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, ToSchema, Default, EnumIter, Debug)]
#[serde(rename_all = "snake_case")]

pub enum InferenceJobExternalThirdParty {
  /// Fal jobs
  #[serde(rename = "fal")]
  #[default]
  Fal,

  /// Seedance 2 Pro jobs
  #[serde(rename = "seedance2pro")]
  Seedance2Pro,

  /// World Labs jobs
  #[serde(rename = "worldlabs")]
  Worldlabs,
}

#[cfg(test)]
mod tests {
  use super::InferenceJobExternalThirdParty;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(InferenceJobExternalThirdParty::iter().count(), 3);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in InferenceJobExternalThirdParty::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: InferenceJobExternalThirdParty = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
