#[cfg(test)]
use strum::EnumCount;
#[cfg(test)]
use strum::EnumIter;
use utoipa::ToSchema;

#[cfg_attr(test, derive(EnumIter, EnumCount))]
#[cfg_attr(not(feature = "database"), derive(Clone, Copy, Eq, PartialEq, Deserialize, Serialize, ToSchema))]
#[cfg_attr(feature = "database", derive(Clone, Copy, Eq, PartialEq, Deserialize, Serialize, sqlx::Type,ToSchema))]
#[cfg_attr(feature = "database", sqlx(rename_all = "snake_case"))]
#[serde(rename_all = "snake_case")]
pub enum ViewAs {
    /// Public entities are able to be listed in public lists.
    /// It does not mean that they necessarily will be (eg. they could be "mod unapproved" or deleted).
    Author,
    /// Hidden entities are not shown in public lists, but the URL to them may be given out freely.
    /// They are available to non-logged-in users as long as they have the URL.
    Moderator,
    /// Private entities should only be available to the creator, a list of approved users, and
    /// website moderation staff.
    AnotherUser,
}


impl_enum_display_and_debug_using_to_str!(ViewAs);
impl_mysql_from_row!(ViewAs);

impl Default for ViewAs {
    fn default() -> Self { Self::AnotherUser }
}

/// NB: Legacy API for older code.
impl ViewAs {
    pub fn to_str(&self) -> &'static str {
        match self {
            Self::Author => "author",
            Self::Moderator => "moderator",
            Self::AnotherUser => "another_user",
        }
    }

    pub fn from_str(value: &str) -> Result<Self, String> {
        match value {
            "author" => Ok(Self::Author),
            "moderator" => Ok(Self::Moderator),
            "another_user" => Ok(Self::AnotherUser),
            _ => Err(format!("invalid value: {:?}", value)),
        }
    }
}

#[cfg(test)]
mod tests {
  use crate::common::view_as::ViewAs;
  use crate::test_helpers::assert_serialization;

  #[test]
    fn test_default() {
        assert_eq!(ViewAs::default(), ViewAs::AnotherUser);

    }

    #[test]
    fn test_serialization() {
        assert_serialization(ViewAs::Author, "author");
        assert_serialization(ViewAs::Moderator, "moderator");
        assert_serialization(ViewAs::AnotherUser, "another_user");
    }

    #[test]
    fn test_to_str() {
        assert_eq!(ViewAs::Author.to_str(), "author");
        assert_eq!(ViewAs::Moderator.to_str(), "moderator");
        assert_eq!(ViewAs::AnotherUser.to_str(), "another_user");
    }

    #[test]
    fn test_from_str() {
        assert_eq!(ViewAs::from_str("author").unwrap(), ViewAs::Author);
        assert_eq!(ViewAs::from_str("moderator").unwrap(), ViewAs::Moderator);
        assert_eq!(ViewAs::from_str("another_user").unwrap(), ViewAs::AnotherUser);
        assert!(ViewAs::from_str("foo").is_err());
    }

    mod traits {
      use crate::common::view_as::ViewAs;

      #[test]
        fn display() {
            let view_as = ViewAs::Moderator;
            assert_eq!(format!("{}", view_as), "moderator".to_string());
        }

        #[test]
        fn debug() {
            let view_as = ViewAs::Moderator;
            assert_eq!(format!("{:?}", view_as), "moderator".to_string());
        }
    }

    #[derive(Serialize, Deserialize, PartialEq, Debug)]
    struct CompositeType {
        view_as: ViewAs,
        string: String,
    }

    mod serde_serialization {
      use crate::common::view_as::ViewAs;

      use super::CompositeType;

      #[test]
        fn serialize() {
            let expected = "\"author\"".to_string(); // NB: Quoted

            assert_eq!(expected, serde_json::to_string(&ViewAs::Author).unwrap());

            // Just to show this serializes the same as a string
            assert_eq!(expected, serde_json::to_string("author").unwrap());
        }

        #[test]
        fn nested_serialize() {
            let value = CompositeType { view_as: ViewAs::Moderator, string: "bar".to_string() };
            let expected = r#"{"view_as":"moderator","string":"bar"}"#.to_string();
            assert_eq!(expected, serde_json::to_string(&value).unwrap());
        }
    }

    mod serde_deserialization {
      use crate::common::view_as::ViewAs;

      use super::CompositeType;

      #[test]
        fn deserialize() {
            let payload = "\"another_user\""; // NB: Quoted
            let value: ViewAs = serde_json::from_str(payload).unwrap();
            assert_eq!(value, ViewAs::AnotherUser);
        }

        #[test]
        fn nested_deserialize() {
            let payload = r#"{"view_as":"another_user","string":"bar"}"#.to_string();
            let expected = CompositeType {
                view_as: ViewAs::AnotherUser,
                string: "bar".to_string(),
            };

            assert_eq!(expected, serde_json::from_str::<CompositeType>(&payload).unwrap());
        }
    }
}
