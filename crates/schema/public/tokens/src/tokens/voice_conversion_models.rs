use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::TokenPrefix;

/// The primary key for "generic" inference jobs.
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct VoiceConversionModelToken(pub String);

impl_string_token!(VoiceConversionModelToken);
impl_crockford_generator!(VoiceConversionModelToken, 16usize, TokenPrefix::VoiceConversionModel, CrockfordLower);
