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

#[cfg(test)]
mod tests {
  use super::ViewAs;
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn variants_count_check() {
      assert_eq!(ViewAs::iter().count(), 3);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in ViewAs::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: ViewAs = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
