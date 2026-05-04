use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::TokenPrefix;

/// The primary key for Debug Logs.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct DebugLogToken(pub String);

impl_string_token!(DebugLogToken);
impl_crockford_generator!(DebugLogToken, 32usize, TokenPrefix::DebugLog, CrockfordLower);
