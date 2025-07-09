use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::TokenPrefix;

/// The primary key for model categories.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct VoiceConversionResultToken(pub String);

impl_string_token!(VoiceConversionResultToken);
impl_crockford_generator!(VoiceConversionResultToken, 32usize, TokenPrefix::VoiceConversionResult, CrockfordLower);
