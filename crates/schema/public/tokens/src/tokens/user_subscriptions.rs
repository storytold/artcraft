use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// Primary key for the `user_subscriptions` table.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct UserSubscriptionToken(pub String);

impl_string_token!(UserSubscriptionToken);
impl_crockford_generator!(UserSubscriptionToken, 32usize, TokenPrefix::UserSubscription, CrockfordLower);
