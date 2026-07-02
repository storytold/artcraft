-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

CREATE TABLE debug_logs (

  -- Not used for anything except replication.
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Event token. Not unique — multiple log rows can share the same event.
  event_token VARCHAR(32) NOT NULL,

  -- The type of debug log entry.
  debug_log_type VARCHAR(24) NOT NULL,

  -- The severity level of the log entry (info, warn, error, debug, trace).
  maybe_log_level VARCHAR(16) DEFAULT NULL,

  -- The user who created the log entry (if any).
  maybe_creator_user_token VARCHAR(32) DEFAULT NULL,

  -- The client IP address of the request (if any). Wide enough for IPv6.
  maybe_ip_address VARCHAR(40) DEFAULT NULL,

  -- The request URL (if any). Truncated to 255 characters on insert.
  maybe_url VARCHAR(255) DEFAULT NULL,

  -- The log message body.
  message MEDIUMTEXT NOT NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- INDICES --
  PRIMARY KEY (id),
  KEY index_event_token (event_token),
  KEY index_debug_log_type (debug_log_type),
  KEY index_maybe_log_level (maybe_log_level),
  KEY index_maybe_creator_user_token (maybe_creator_user_token),
  KEY index_created_at (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
