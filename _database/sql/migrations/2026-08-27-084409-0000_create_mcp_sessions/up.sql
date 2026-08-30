-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Sessions for MCP and other non-human users.
-- These work like `user_sessions`, but are created and consumed by MCP clients.
CREATE TABLE mcp_sessions (
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Non-private "primary key" for the session.
  -- Used as a key to delete/manage sessions in the dashboard.
  token VARCHAR(32) NOT NULL,

  -- Private entropy presented by clients; used for lookup of live sessions.
  private_session_token VARCHAR(64) NOT NULL,

  -- Private refresh credential. Presenting this on the refresh endpoint extends the
  -- session's expiry and ROTATES this value — the previous refresh token becomes invalid.
  private_refresh_token VARCHAR(64) NOT NULL,

  -- The user that the session belongs to.
  user_token VARCHAR(32) NOT NULL,

  -- ========== CLIENT INFO ==========

  -- Trimmed name of the MCP client, if any.
  maybe_mcp_client_name VARCHAR(255) DEFAULT NULL,

  -- Trimmed version of the MCP client, if any.
  maybe_mcp_client_version VARCHAR(255) DEFAULT NULL,

  -- Trimmed vendor of the MCP client, if any.
  maybe_mcp_client_vendor VARCHAR(255) DEFAULT NULL,

  -- ========== IP ADDRESSES ==========

  -- IP address that created the session. Wide enough for IPv4/IPv6.
  ip_address_creation VARCHAR(40) NOT NULL,

  -- IP address that last updated the session. Wide enough for IPv4/IPv6.
  ip_address_update VARCHAR(40) NOT NULL,

  -- ========== TIMESTAMPS ==========

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- When the session expires, if not refreshed.
  -- This must be set by the server code, or the session is invalid.
  expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Soft-delete timestamp. NULL means the session is live.
  -- deletion = session termination
  maybe_deleted_at TIMESTAMP NULL,

  -- INDICES --
  PRIMARY KEY (id),
  UNIQUE KEY (token),
  UNIQUE KEY (private_session_token),
  UNIQUE KEY (private_refresh_token),
  KEY fk_user_token (user_token),
  KEY index_ip_address_creation (ip_address_creation),
  KEY index_maybe_deleted_at (maybe_deleted_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
