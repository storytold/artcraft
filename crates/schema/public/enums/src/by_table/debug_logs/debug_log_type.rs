use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

use crate::error::enum_error::EnumError;

/// Maximum serialized string length for database storage.
pub const MAX_LENGTH: usize = 24;

/// Used in the `debug_logs` table in a `VARCHAR(24)` field.
///
/// DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum DebugLogType {
  HttpRequest,
  FalRequest,
  KinoviRequest,
  GrokApiRequest,
  FalWebhook,
  BeebleWebhook,
}

impl_enum_display_and_debug_using_to_str!(DebugLogType);
impl_mysql_enum_coders!(DebugLogType);
impl_mysql_from_row!(DebugLogType);

impl DebugLogType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::HttpRequest => "http_request",
      Self::FalRequest => "fal_request",
      Self::KinoviRequest => "kinovi_request",
      Self::GrokApiRequest => "grok_api_request",
      Self::FalWebhook => "fal_webhook",
      Self::BeebleWebhook => "beeble_webhook",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, EnumError> {
    match value {
      "http_request" => Ok(Self::HttpRequest),
      "fal_request" => Ok(Self::FalRequest),
      "kinovi_request" => Ok(Self::KinoviRequest),
      "grok_api_request" => Ok(Self::GrokApiRequest),
      "fal_webhook" => Ok(Self::FalWebhook),
      "beeble_webhook" => Ok(Self::BeebleWebhook),
      _ => Err(EnumError::CouldNotConvertFromString(value.to_string())),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    BTreeSet::from([
      Self::HttpRequest,
      Self::FalRequest,
      Self::KinoviRequest,
      Self::GrokApiRequest,
      Self::FalWebhook,
      Self::BeebleWebhook,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::by_table::debug_logs::debug_log_type::DebugLogType;
  use crate::by_table::debug_logs::debug_log_type::MAX_LENGTH;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;
    use crate::error::enum_error::EnumError;

    #[test]
    fn test_serialization() {
      assert_serialization(DebugLogType::HttpRequest, "http_request");
      assert_serialization(DebugLogType::FalRequest, "fal_request");
      assert_serialization(DebugLogType::KinoviRequest, "kinovi_request");
      assert_serialization(DebugLogType::GrokApiRequest, "grok_api_request");
      assert_serialization(DebugLogType::FalWebhook, "fal_webhook");
      assert_serialization(DebugLogType::BeebleWebhook, "beeble_webhook");
    }

    #[test]
    fn to_str() {
      assert_eq!(DebugLogType::HttpRequest.to_str(), "http_request");
      assert_eq!(DebugLogType::FalRequest.to_str(), "fal_request");
      assert_eq!(DebugLogType::KinoviRequest.to_str(), "kinovi_request");
      assert_eq!(DebugLogType::GrokApiRequest.to_str(), "grok_api_request");
      assert_eq!(DebugLogType::FalWebhook.to_str(), "fal_webhook");
      assert_eq!(DebugLogType::BeebleWebhook.to_str(), "beeble_webhook");
    }

    #[test]
    fn from_str() {
      assert_eq!(DebugLogType::from_str("http_request").unwrap(), DebugLogType::HttpRequest);
      assert_eq!(DebugLogType::from_str("fal_request").unwrap(), DebugLogType::FalRequest);
      assert_eq!(DebugLogType::from_str("kinovi_request").unwrap(), DebugLogType::KinoviRequest);
      assert_eq!(DebugLogType::from_str("grok_api_request").unwrap(), DebugLogType::GrokApiRequest);
      assert_eq!(DebugLogType::from_str("fal_webhook").unwrap(), DebugLogType::FalWebhook);
      assert_eq!(DebugLogType::from_str("beeble_webhook").unwrap(), DebugLogType::BeebleWebhook);
    }

    #[test]
    fn from_str_err() {
      let result = DebugLogType::from_str("invalid");
      assert!(result.is_err());
      if let Err(EnumError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "invalid");
      } else {
        panic!("Expected EnumError::CouldNotConvertFromString");
      }
    }

    #[test]
    fn all_variants() {
      let mut variants = DebugLogType::all_variants();
      assert_eq!(variants.len(), 6);
      assert_eq!(variants.pop_first(), Some(DebugLogType::HttpRequest));
      assert_eq!(variants.pop_first(), Some(DebugLogType::FalRequest));
      assert_eq!(variants.pop_first(), Some(DebugLogType::KinoviRequest));
      assert_eq!(variants.pop_first(), Some(DebugLogType::GrokApiRequest));
      assert_eq!(variants.pop_first(), Some(DebugLogType::FalWebhook));
      assert_eq!(variants.pop_first(), Some(DebugLogType::BeebleWebhook));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(DebugLogType::all_variants().len(), DebugLogType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in DebugLogType::all_variants() {
        assert_eq!(variant, DebugLogType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, DebugLogType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, DebugLogType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      for variant in DebugLogType::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long via to_str()", variant);
      }
      for variant in DebugLogType::all_variants() {
        let json = serde_json::to_string(&variant).unwrap().replace('"', "");
        assert!(json.len() <= MAX_LENGTH, "variant {:?} is too long via JSON: {:?}", variant, json);
      }
    }

    #[test]
    fn serialized_names_must_only_contain_lowercase_alphanumeric_and_underscore() {
      let valid_pattern = regex::Regex::new(r"^[a-z0-9_]+$").unwrap();

      for variant in DebugLogType::all_variants() {
        let to_str_value = variant.to_str();
        assert!(valid_pattern.is_match(to_str_value),
          "to_str() for {:?} contains invalid characters: {:?} (only a-z, 0-9, _ allowed)", variant, to_str_value);
      }
    }
  }
}
