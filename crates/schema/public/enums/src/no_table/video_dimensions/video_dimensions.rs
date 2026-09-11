use std::collections::BTreeSet;

#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

/// This enum is not backed by a particular database table.
/// This is used to determine the video generation size.
#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[derive(Clone, Copy, Eq, PartialEq, Ord, PartialOrd, Hash, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "snake_case")]
pub enum VideoDimensions {
  Landscape,
  Portrait,
  Square,
}

// TODO(bt, 2022-12-21): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(VideoDimensions);
//impl_mysql_enum_coders!(VideoDimensions);
//impl_mysql_from_row!(VideoDimensions);

/// NB: Legacy API for older code.
impl VideoDimensions {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Landscape => "landscape",
      Self::Portrait => "portrait",
      Self::Square => "square",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "landscape" => Ok(Self::Landscape),
      "portrait" => Ok(Self::Portrait),
      "square" => Ok(Self::Square),
      _ => Err(format!("Unknown VideoDimensions: {}", value)),
    }
  }

  pub fn all_variants() -> BTreeSet<Self> {
    // NB: BTreeSet is sorted
    // NB: BTreeSet::from() isn't const, but not worth using LazyStatic, etc.
    BTreeSet::from([
      Self::Landscape,
      Self::Portrait,
      Self::Square,
    ])
  }
}

#[cfg(test)]
mod tests {
  use crate::no_table::video_dimensions::video_dimensions::VideoDimensions;
  use crate::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(VideoDimensions::Landscape, "landscape");
      assert_serialization(VideoDimensions::Portrait, "portrait");
      assert_serialization(VideoDimensions::Square, "square");
    }

    mod impl_methods {
      use super::*;

      #[test]
      fn to_str() {
        assert_eq!(VideoDimensions::Landscape.to_str(), "landscape");
        assert_eq!(VideoDimensions::Portrait.to_str(), "portrait");
        assert_eq!(VideoDimensions::Square.to_str(), "square");
      }

      #[test]
      fn from_str() {
        assert_eq!(VideoDimensions::from_str("landscape").unwrap(), VideoDimensions::Landscape);
        assert_eq!(VideoDimensions::from_str("portrait").unwrap(), VideoDimensions::Portrait);
        assert_eq!(VideoDimensions::from_str("square").unwrap(), VideoDimensions::Square);
      }
    }

    mod manual_variant_checks {
      use super::*;

      #[test]
      fn all_variants() {
        let variants = VideoDimensions::all_variants();
        assert_eq!(variants.len(), 3);
      }
    }

    mod mechanical_checks {
      use super::*;

      #[test]
      fn variant_length() {
        use strum::IntoEnumIterator;
        assert_eq!(VideoDimensions::all_variants().len(), VideoDimensions::iter().len());
      }

      #[test]
      fn round_trip() {
        for variant in VideoDimensions::all_variants() {
          assert_eq!(variant, VideoDimensions::from_str(variant.to_str()).unwrap());
          assert_eq!(variant, VideoDimensions::from_str(&format!("{}", variant)).unwrap());
          assert_eq!(variant, VideoDimensions::from_str(&format!("{:?}", variant)).unwrap());
        }
      }
    }
  }
}
