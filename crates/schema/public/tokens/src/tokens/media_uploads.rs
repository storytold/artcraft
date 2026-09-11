use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::TokenPrefix;

/// The primary key for user media uploads (images, video, etc.)
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct MediaUploadToken(pub String);

impl_string_token!(MediaUploadToken);
impl_crockford_generator!(MediaUploadToken, 32usize, TokenPrefix::MediaUpload, CrockfordLower);
