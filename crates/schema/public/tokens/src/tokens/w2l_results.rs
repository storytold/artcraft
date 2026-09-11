use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::LegacyTokenPrefix;

/// Primary key for the `w2l_results` table.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct W2lResultToken(pub String);

impl_string_token!(W2lResultToken);
impl_crockford_generator!(W2lResultToken, 32usize, LegacyTokenPrefix::W2lResult, CrockfordLower);
