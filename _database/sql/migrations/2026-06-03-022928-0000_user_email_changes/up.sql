-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

CREATE TABLE user_email_changes (
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  -- The user whose email was changed.
  user_token VARCHAR(32) NOT NULL,

  -- The email address before the change.
  old_email VARCHAR(255) NOT NULL,

  -- The email address after the change.
  new_email VARCHAR(255) NOT NULL,

  -- The IP address the change was made from.
  -- Wide enough for IPv4/6.
  ip_address VARCHAR(40) NOT NULL,

  -- The user that performed the change, if known. NULL when the change was
  -- performed by the user themselves, by an automated process, or in any
  -- other context where there is no acting user.
  maybe_changed_by_user_token VARCHAR(32) DEFAULT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- INDICES --
  PRIMARY KEY (id),
  KEY index_user_token (user_token),
  KEY index_old_email (old_email),
  KEY index_new_email (new_email),
  KEY index_created_at (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
