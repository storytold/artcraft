use std::collections::BTreeSet;

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

/// NB: Legacy API for older code.
impl InferenceJobExternalThirdParty {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Fal => "fal",
      Self::Seedance2Pro => "seedance2pro",
      Self::Worldlabs => "worldlabs",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "fal" => Ok(Self::Fal),
      "seedance2pro" => Ok(Self::Seedance2Pro),
      "worldlabs" => Ok(Self::Worldlabs),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Fal,
      Self::Seedance2Pro,
      Self::Worldlabs,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::InferenceJobExternalThirdParty;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in InferenceJobExternalThirdParty::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: InferenceJobExternalThirdParty = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
