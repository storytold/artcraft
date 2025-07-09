use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::LegacyTokenPrefix;

/// External-facing key for the `api_tokens` table.
#[cfg_attr(not(feature = "database"), derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize))]
#[cfg_attr(feature = "database", derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, sqlx::Type, Debug, Serialize, Deserialize))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct ApiTokenExternal(pub String);

impl_string_token!(ApiTokenExternal);
impl_crockford_generator!(ApiTokenExternal, 32usize, LegacyTokenPrefix::ApiTokenExternal, CrockfordUpper);
