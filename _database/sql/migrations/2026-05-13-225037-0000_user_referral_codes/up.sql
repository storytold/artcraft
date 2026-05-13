-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

CREATE TABLE user_referral_codes (
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Unique token identifier for this referral code record.
  token VARCHAR(32) NOT NULL,

  -- The human-readable referral code (e.g. a username or custom code).
  -- This can be changed.
  -- These must be unique.
  code VARCHAR(32) NOT NULL,

  -- The user who owns this referral code.
  owner_user_token VARCHAR(32) NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Soft delete.
  deleted_at TIMESTAMP NULL,

  -- INDICES --
  PRIMARY KEY (id),
  UNIQUE KEY unique_token (token),
  UNIQUE KEY unique_code (code),
  KEY index_owner_user_token (owner_user_token)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
