use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The rotating refresh credential for an `mcp_sessions` row (the `private_refresh_token`
/// column).
///
/// An MCP client presents this on the session-refresh endpoint to extend its session; each
/// successful refresh ROTATES the value, invalidating the previous one. Like the session
/// credential, it is a secret with extra entropy — never list or display it after it is handed
/// out. The session's other credentials are `McpSessionToken` (management handle) and
/// `McpSessionPrivateToken` (the session secret).
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct McpSessionRefreshToken(pub String);

impl_string_token!(McpSessionRefreshToken);
impl_mysql_token_from_row!(McpSessionRefreshToken);
impl_crockford_generator!(McpSessionRefreshToken, 64usize, TokenPrefix::McpSessionRefresh, CrockfordLower);
