use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for Prompts
#[cfg_attr(not(feature = "database"), derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, ToSchema))]
#[cfg_attr(feature = "database", derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, sqlx::Type, Debug, Serialize, Deserialize, ToSchema))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct PromptToken(pub String);

impl_crockford_generator!(PromptToken, 32usize, TokenPrefix::Prompt, CrockfordLower);
impl_mysql_token_from_row!(PromptToken);
impl_string_token!(PromptToken);
