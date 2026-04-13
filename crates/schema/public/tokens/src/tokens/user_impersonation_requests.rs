use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for User Impersonation Requests
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct UserImpersonationRequestToken(pub String);

impl_string_token!(UserImpersonationRequestToken);
impl_mysql_token_from_row!(UserImpersonationRequestToken);
impl_crockford_generator!(UserImpersonationRequestToken, 32usize, TokenPrefix::UserImpersonationRequest, CrockfordLower);
