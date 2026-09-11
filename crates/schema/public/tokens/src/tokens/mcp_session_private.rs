use std::fmt::Debug;

use serde::Deserialize;
use serde::Serialize;
use utoipa::ToSchema;

use crate::prefixes::TokenPrefix;

/// The private credential for an `mcp_sessions` row (the `private_session_token` column).
///
/// This is the secret an MCP client presents in the `Authorization` header to authenticate as a
/// live session, so it carries more entropy than an ordinary token. Never list or display it
/// after creation. The non-private management handle is `McpSessionToken` (see
/// `mcp_sessions.rs`).
#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Debug, Serialize, Deserialize, ToSchema)]
#[cfg_attr(feature = "database", derive(sqlx::Type))]
#[cfg_attr(feature = "database", sqlx(transparent))]
pub struct McpSessionPrivateToken(pub String);

impl_string_token!(McpSessionPrivateToken);
impl_mysql_token_from_row!(McpSessionPrivateToken);
impl_crockford_generator!(McpSessionPrivateToken, 64usize, TokenPrefix::McpSessionPrivate, CrockfordLower);
