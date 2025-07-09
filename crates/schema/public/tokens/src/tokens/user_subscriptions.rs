use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::LegacyTokenPrefix;

/// Primary key for the `user_subscriptions` table.
#[cfg_attr(not(feature = "database"), derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize))]
#[cfg_attr(feature = "database", derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, sqlx::Type, Debug, Serialize, Deserialize))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct UserSubscriptionToken(pub String);

impl_string_token!(UserSubscriptionToken);
impl_crockford_generator!(UserSubscriptionToken, 32usize, LegacyTokenPrefix::UserSubscription, CrockfordLower);
