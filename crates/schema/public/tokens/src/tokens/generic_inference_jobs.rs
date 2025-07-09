use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for "generic" inference jobs.
#[cfg_attr(not(feature = "database"), derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize, Default, ToSchema))]
#[cfg_attr(feature = "database", derive(Clone, PartialEq, Eq, sqlx::Type, Debug, Serialize, Deserialize, Default, ToSchema))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct InferenceJobToken(String);

impl_crockford_generator!(InferenceJobToken, 32usize, TokenPrefix::InferenceJob, CrockfordLower);
impl_mysql_token_from_row!(InferenceJobToken);
impl_string_token!(InferenceJobToken);
