use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The primary key for `mcp_sessions`.
///
/// This is the NON-PRIVATE handle for a session — safe to list and display, and used to
/// delete/manage sessions in the dashboard. It never authenticates anything; that is the job of
/// `McpSessionPrivateToken` (see `mcp_session_private.rs`).
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct McpSessionToken(pub String);

impl_string_token!(McpSessionToken);
impl_mysql_token_from_row!(McpSessionToken);
impl_crockford_generator!(McpSessionToken, 32usize, TokenPrefix::McpSession, CrockfordLower);
