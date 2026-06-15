-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

CREATE TABLE api_keys (
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Effective "primary key" (used internally for lookups and as a foreign key).
  token VARCHAR(32) NOT NULL,

  -- The actual API key value presented by clients to authenticate.
  api_key VARCHAR(255) NOT NULL,

  -- ========== KEY INFO ==========

  -- User-supplied display name for the key.
  name VARCHAR(255) NOT NULL,

  -- Optional user-supplied description.
  maybe_description VARCHAR(512) DEFAULT NULL,

  -- ========== OWNER ==========

  -- The user that owns this API key.
  owner_user_token VARCHAR(32) NOT NULL,

  -- ========== IP ADDRESSES ==========

  -- IP address that created the key. Wide enough for IPv4/IPv6.
  ip_address_creation VARCHAR(40) NOT NULL,

  -- IP address that last updated the key. Wide enough for IPv4/IPv6.
  ip_address_update VARCHAR(40) NOT NULL,

  -- ========== TIMESTAMPS ==========

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Soft-delete timestamp. NULL means the key is live.
  maybe_deleted_at TIMESTAMP NULL,

  -- INDICES --
  PRIMARY KEY (id),
  UNIQUE KEY (token),
  UNIQUE KEY (api_key),
  KEY fk_owner_user_token (owner_user_token),
  KEY index_maybe_deleted_at (maybe_deleted_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
