use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::LegacyTokenPrefix;

/// Primary key for the `w2l_inference_jobs` table.
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct W2lInferenceJobToken(pub String);

impl_string_token!(W2lInferenceJobToken);
impl_crockford_generator!(W2lInferenceJobToken, 32usize, LegacyTokenPrefix::W2lInferenceJob, CrockfordLower);
