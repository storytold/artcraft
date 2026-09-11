use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::LegacyTokenPrefix;

/// Internal token for the `api_tokens` table.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct ApiTokenInternal(pub String);

impl_string_token!(ApiTokenInternal);
impl_crockford_generator!(ApiTokenInternal, 32usize, LegacyTokenPrefix::ApiTokenInternal, CrockfordLower);
