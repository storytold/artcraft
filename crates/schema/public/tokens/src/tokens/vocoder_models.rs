use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::LegacyTokenPrefix;

/// The primary key for the `vocoder_models` table
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct VocoderModelToken(pub String);

impl_string_token!(VocoderModelToken);
impl_crockford_generator!(VocoderModelToken, 15usize, LegacyTokenPrefix::VocoderModel, CrockfordLower);
