use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for user referral codes.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize, Default, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct UserReferralCodeToken(pub String);

impl_mysql_token_from_row!(UserReferralCodeToken);
impl_string_token!(UserReferralCodeToken);
impl_crockford_generator!(UserReferralCodeToken, 18usize, TokenPrefix::UserReferralCode, CrockfordLower);
