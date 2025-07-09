use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::LegacyTokenPrefix;

/// primary key token for the `twitch_event_rules` table (this is deprecated)
#[cfg_attr(not(feature = "database"), derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize))]
#[cfg_attr(feature = "database", derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, sqlx::Type, Debug, Serialize, Deserialize))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct TwitchEventRuleToken(pub String);

impl_string_token!(TwitchEventRuleToken);
impl_crockford_generator!(TwitchEventRuleToken, 32usize, LegacyTokenPrefix::TwitchEventRule, CrockfordLower);
