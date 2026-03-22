use strum::EnumIter;
/// Visibility
///
/// Used in various database tables (as enums! careful!) and the HTTP API to convey
/// how the associated entity should be made visible to the public.
///
/// To use this in a query, the query must have type annotations.
/// See: https://www.gitmemory.com/issue/launchbadge/sqlx/1241/847154375
/// eg. preferred_tts_result_visibility as `preferred_tts_result_visibility: enums::common::visibility::Visibility`
///
/// See also: https://docs.rs/sqlx/0.4.0-beta.1/sqlx/trait.Type.html
///
/// *DO NOT CHANGE VALUES WITHOUT A MIGRATION STRATEGY!*

use utoipa::ToSchema;

#[derive(Clone, Debug, Copy, Eq, PartialEq, Deserialize, Serialize, EnumIter, ToSchema)]
#[serde(rename_all = "lowercase")]
pub enum Visibility {
  /// Public entities are able to be listed in public lists.
  /// It does not mean that they necessarily will be (eg. they could be "mod unapproved" or deleted).
  Public,
  /// Hidden entities are not shown in public lists, but the URL to them may be given out freely.
  /// They are available to non-logged-in users as long as they have the URL.
  Hidden,
  /// Private entities should only be available to the creator, a list of approved users, and
  /// website moderation staff.
  Private,

  // TODO(bt, 2022-12-20): We need a "Shared" option where users can share it with a specified group.
  //  This should perhaps be its own type, eg. VisibilityV2., so that we don't use it in tables that
  //  have not yet been migrated to this scheme.
}

#[cfg(test)]
mod tests {
  use super::Visibility;
  use enums_shared::test_helpers::{assert_deserialization, assert_serialization};
  use strum::IntoEnumIterator;

  mod manual_checks {
    use super::*;

    #[test]
    fn test_serialization() {
      assert_serialization(Visibility::Public, "public");
      assert_serialization(Visibility::Hidden, "hidden");
      assert_serialization(Visibility::Private, "private");
    }

    #[test]
    fn test_deserialization() {
      assert_deserialization("public", Visibility::Public);
      assert_deserialization("hidden", Visibility::Hidden);
      assert_deserialization("private", Visibility::Private);
    }

    #[test]
    fn variants_count_check() {
      assert_eq!(Visibility::iter().count(), 3);
    }
  }

  mod mechanical_checks {
    use super::*;

    #[test]
    fn round_trip_json() {
      for variant in Visibility::iter() {
        let json = serde_json::to_string(&variant).unwrap();
        let back: Visibility = serde_json::from_str(&json).unwrap();
        assert_eq!(variant, back);
      }
    }
  }
}
