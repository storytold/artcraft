use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::LegacyTokenPrefix;

/// The primary key for TTS models.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct TtsModelToken(pub String);

impl_string_token!(TtsModelToken);
impl_crockford_generator!(TtsModelToken, 15usize, LegacyTokenPrefix::TtsModel, CrockfordLower);
