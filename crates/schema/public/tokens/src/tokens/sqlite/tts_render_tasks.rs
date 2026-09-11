use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;

use crate::prefixes::TokenPrefix;

/// The primary key for TTS render tasks (Sqlite / AiChatBotSidecar)
#[derive(Clone, PartialEq, Eq, Debug, Serialize, Deserialize)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct TtsRenderTaskToken(pub String);

impl_string_token!(TtsRenderTaskToken);
impl_crockford_generator!(TtsRenderTaskToken, 32usize, TokenPrefix::TtsRenderTask, CrockfordMixed);
