use strum::EnumCount;
use strum::EnumIter;

/// Used in the `user_bookmarks` table in a `VARCHAR(32)` field named `entity_type`.
#[derive(Clone, Copy, Eq, PartialEq, Hash, Ord, PartialOrd, Deserialize, Serialize, EnumIter, EnumCount)]
pub enum FeaturedItemEntityType {
    /// MediaFile
    #[serde(rename = "media_file")]
    MediaFile,

    /// ModelWeight (the new way to store models)
    #[serde(rename = "model_weight")]
    ModelWeight,

    /// User
    #[serde(rename = "user")]
    User,
}

// TODO(bt, 2023-01-17): This desperately needs MySQL integration tests!
impl_enum_display_and_debug_using_to_str!(FeaturedItemEntityType);
impl_mysql_enum_coders!(FeaturedItemEntityType);
impl_mysql_from_row!(FeaturedItemEntityType);

/// NB: Legacy API for older code.
impl FeaturedItemEntityType {
    pub fn to_str(&self) -> &'static str {
        match self {
            Self::MediaFile => "media_file",
            Self::ModelWeight => "model_weight",
            Self::User => "user",
        }
    }

    pub fn from_str(value: &str) -> Result<Self, String> {
        match value {
            "media_file" => Ok(Self::MediaFile),
            "model_weight" => Ok(Self::ModelWeight),
            "user" => Ok(Self::User),
            _ => Err(format!("invalid value: {:?}", value)),
        }
    }

}

#[cfg(test)]
mod tests {
  use super::super::featured_item_entity_type::FeaturedItemEntityType;
  use enums_shared::test_helpers::assert_serialization;

  mod serde {
    use super::*;

    #[test]
        fn test_serialization() {
            assert_serialization(FeaturedItemEntityType::MediaFile, "media_file");
            assert_serialization(FeaturedItemEntityType::ModelWeight, "model_weight");
            assert_serialization(FeaturedItemEntityType::User, "user");
        }
    }

    mod impl_methods {
      use super::*;

      #[test]
        fn test_to_str() {
            assert_eq!(FeaturedItemEntityType::MediaFile.to_str(), "media_file");
            assert_eq!(FeaturedItemEntityType::ModelWeight.to_str(), "model_weight");
            assert_eq!(FeaturedItemEntityType::User.to_str(), "user");
        }

        #[test]
        fn test_from_str() {
            assert_eq!(FeaturedItemEntityType::from_str("media_file").unwrap(), FeaturedItemEntityType::MediaFile);
            assert_eq!(FeaturedItemEntityType::from_str("model_weight").unwrap(), FeaturedItemEntityType::ModelWeight);
            assert_eq!(FeaturedItemEntityType::from_str("user").unwrap(), FeaturedItemEntityType::User);
            assert!(FeaturedItemEntityType::from_str("foo").is_err());
        }
    }

    mod mechanical_checks {
      use super::*;

        #[test]
        fn round_trip() {
          use strum::IntoEnumIterator;
            for variant in FeaturedItemEntityType::iter() {
                assert_eq!(variant, FeaturedItemEntityType::from_str(variant.to_str()).unwrap());
                assert_eq!(variant, FeaturedItemEntityType::from_str(&format!("{}", variant)).unwrap());
                assert_eq!(variant, FeaturedItemEntityType::from_str(&format!("{:?}", variant)).unwrap());
            }
        }

        #[test]
        fn serialized_length_ok_for_database() {
          use strum::IntoEnumIterator;
            const MAX_LENGTH : usize = 32;
            for variant in FeaturedItemEntityType::iter() {
                let serialized = variant.to_str();
                assert!(serialized.len() > 0, "variant {:?} is too short", variant);
                assert!(serialized.len() <= MAX_LENGTH, "variant {:?} is too long", variant);
            }
        }
    }
}
