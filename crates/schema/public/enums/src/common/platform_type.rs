//! The platform a request originated from, inferred from the User-Agent header.
//!
//! Stored on `generic_inference_jobs` (set at enqueue time) and copied to the
//! resulting `media_files` rows when jobs complete.

use std::collections::BTreeSet;

use crate::error::enum_error::EnumError;
#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// NB: This is used by multiple tables (`generic_inference_jobs`, `media_files`).
/// Keep the max length to 16 characters.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum PlatformType {
  // ========== Our clients ==========

  /// Website users
  Web,

  /// Desktop app users
  DesktopApp,

  // ========== Other clients ==========

  Curl,
  PythonRequests,
  Postman,
}

impl_enum_display_and_debug_using_to_str!(PlatformType);
impl_mysql_enum_coders!(PlatformType);
impl_mysql_from_row!(PlatformType);

impl PlatformType {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Web => "web",
      Self::DesktopApp => "desktop_app",
      Self::Curl => "curl",
      Self::PythonRequests => "python_requests",
      Self::Postman => "postman",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, EnumError> {
    match value {
      "web" => Ok(Self::Web),
      "desktop_app" => Ok(Self::DesktopApp),
      "curl" => Ok(Self::Curl),
      "python_requests" => Ok(Self::PythonRequests),
      "postman" => Ok(Self::Postman),
      _ => Err(EnumError::CouldNotConvertFromString(value.to_string())),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    BTreeSet::from([
      Self::Web,
      Self::DesktopApp,
      Self::Curl,
      Self::PythonRequests,
      Self::Postman,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::common::platform_type::PlatformType;
  use crate::error::enum_error::EnumError;
  use crate::test_helpers::assert_serialization;

  mod explicit_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(PlatformType::Web, "web");
      assert_serialization(PlatformType::DesktopApp, "desktop_app");
      assert_serialization(PlatformType::Curl, "curl");
      assert_serialization(PlatformType::PythonRequests, "python_requests");
      assert_serialization(PlatformType::Postman, "postman");
    }

    #[test]
    fn to_str() {
      assert_eq!(PlatformType::Web.to_str(), "web");
      assert_eq!(PlatformType::DesktopApp.to_str(), "desktop_app");
      assert_eq!(PlatformType::Curl.to_str(), "curl");
      assert_eq!(PlatformType::PythonRequests.to_str(), "python_requests");
      assert_eq!(PlatformType::Postman.to_str(), "postman");
    }

    #[test]
    fn from_str() {
      assert_eq!(PlatformType::from_str("web").unwrap(), PlatformType::Web);
      assert_eq!(PlatformType::from_str("desktop_app").unwrap(), PlatformType::DesktopApp);
      assert_eq!(PlatformType::from_str("curl").unwrap(), PlatformType::Curl);
      assert_eq!(PlatformType::from_str("python_requests").unwrap(), PlatformType::PythonRequests);
      assert_eq!(PlatformType::from_str("postman").unwrap(), PlatformType::Postman);
    }

    #[test]
    fn from_str_err() {
      let result = PlatformType::from_str("asdf");
      assert!(result.is_err());
      if let Err(EnumError::CouldNotConvertFromString(value)) = result {
        assert_eq!(value, "asdf");
      } else {
        panic!("Expected EnumError::CouldNotConvertFromString");
      }
    }

    #[test]
    fn all_variants() {
      let mut variants = PlatformType::all_variants();
      assert_eq!(variants.len(), 5);
      assert_eq!(variants.pop_first(), Some(PlatformType::Web));
      assert_eq!(variants.pop_first(), Some(PlatformType::DesktopApp));
      assert_eq!(variants.pop_first(), Some(PlatformType::Curl));
      assert_eq!(variants.pop_first(), Some(PlatformType::PythonRequests));
      assert_eq!(variants.pop_first(), Some(PlatformType::Postman));
      assert_eq!(variants.pop_first(), None);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn variant_length() {
      use strum::IntoEnumIterator;
      assert_eq!(PlatformType::all_variants().len(), PlatformType::iter().len());
    }

    #[test]
    fn round_trip() {
      for variant in PlatformType::all_variants() {
        // Test to_str(), from_str(), Display, and Debug.
        assert_eq!(variant, PlatformType::from_str(variant.to_str()).unwrap());
        assert_eq!(variant, PlatformType::from_str(&format!("{}", variant)).unwrap());
        assert_eq!(variant, PlatformType::from_str(&format!("{:?}", variant)).unwrap());
      }
    }

    #[test]
    fn serialized_length_ok_for_database() {
      const MAX_LENGTH : usize = 16;
      for variant in PlatformType::all_variants() {
        let serialized = variant.to_str();
        assert!(serialized.len() > 0, "variant {:?} is too short", variant);
        assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
      }
    }
  }
}
