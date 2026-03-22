use strum::EnumIter;
use utoipa::ToSchema;

#[derive(Clone, Debug, Copy, Eq, PartialEq, Deserialize, Serialize, EnumIter, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
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
  use super::ViewAs;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in ViewAs::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: ViewAs = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
