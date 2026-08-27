use artcraft_api_defs::mcp_sessions::common::McpSessionInfo;
use mysql_queries::queries::mcp_sessions::mcp_session_row::McpSessionRow;

/// Map a database row onto the wire shape. The row never contains the secret
/// `private_session_token`, so nothing here can leak it.
pub fn mcp_session_row_to_info(row: McpSessionRow) -> McpSessionInfo {
  McpSessionInfo {
    token: row.token,
    maybe_mcp_client_name: row.maybe_mcp_client_name,
    maybe_mcp_client_version: row.maybe_mcp_client_version,
    maybe_mcp_client_vendor: row.maybe_mcp_client_vendor,
    ip_address_creation: row.ip_address_creation,
    ip_address_update: row.ip_address_update,
    created_at: row.created_at,
    updated_at: row.updated_at,
    expires_at: row.expires_at,
    maybe_deleted_at: row.maybe_deleted_at,
  }
}
