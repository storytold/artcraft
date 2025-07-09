use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::TokenPrefix;

/// The primary key for email_sender_jobs
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct EmailSenderJobToken(pub String);

impl_string_token!(EmailSenderJobToken);
impl_crockford_generator!(EmailSenderJobToken, 32usize, TokenPrefix::EmailSenderJob, CrockfordLower);
