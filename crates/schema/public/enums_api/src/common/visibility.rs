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
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(rename_all = "lowercase"))]
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



// For reference, here's what the serde implementation might be if manually written.
// This may be useful for designing composite types in the future:
//
//   use serde::{Deserializer, Serializer};
//
//   impl serde::Serialize for UserToken {
//     fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
//       serializer.serialize_str(&self.0)
//     }
//   }
//
//   impl<'de> serde::Deserialize<'de> for UserToken {
//     fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
//       let s = String::deserialize(d)?;
//       Ok(UserToken(s))
//     }
//   }

//impl sqlx::Type<MySql> for Visibility {
//  fn type_info() -> sqlx_core::database::TypeInfo<MySql> {
//    todo!()
//  }
//}

impl Default for Visibility {
  fn default() -> Self { Self::Public }
}

/// NB: Legacy API for older code.
impl Visibility {
  pub fn to_str(&self) -> &'static str {
    match self {
      Self::Public => "public",
      Self::Hidden => "hidden",
      Self::Private => "private",
    }
  }

  pub fn from_str(value: &str) -> Result<Self, String> {
    match value {
      "public" => Ok(Self::Public),
      "hidden" => Ok(Self::Hidden),
      "private" => Ok(Self::Private),
      _ => Err(format!("invalid value: {:?}", value)),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::Visibility;
  use strum::IntoEnumIterator;

  #[test]
  fn round_trip_json() {
    for variant in Visibility::iter() {
      let json = serde_json::to_string(&variant).unwrap();
      let back: Visibility = serde_json::from_str(&json).unwrap();
      assert_eq!(variant, back);
    }
  }
}
