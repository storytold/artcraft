use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::LegacyTokenPrefix;

/// "grouping token" for the `twitch_oauth_tokens` table (this is deprecated)
#[cfg_attr(not(feature = "database"), derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize))]
#[cfg_attr(feature = "database", derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, sqlx::Type, Debug, Serialize, Deserialize))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct TwitchOauthGroupingToken(pub String);

impl_string_token!(TwitchOauthGroupingToken);
impl_crockford_generator!(TwitchOauthGroupingToken, 32usize, LegacyTokenPrefix::TwitchOauthGrouping, CrockfordLower);
