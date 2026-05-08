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

  -- The user who created the log entry (if any).
  maybe_creator_user_token VARCHAR(32) DEFAULT NULL,

  -- The log message body.
  message MEDIUMTEXT NOT NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- INDICES --
  PRIMARY KEY (id),
  KEY index_event_token (event_token),
  KEY index_debug_log_type (debug_log_type),
  KEY index_maybe_creator_user_token (maybe_creator_user_token),
  KEY index_created_at (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
