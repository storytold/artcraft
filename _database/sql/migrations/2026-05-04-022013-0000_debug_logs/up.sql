-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

CREATE TABLE debug_logs (

  -- Not used for anything except replication.
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  -- Effective "primary key" of the debug log entry.
  token VARCHAR(32) NOT NULL,

  -- The type of debug log entry.
  debug_log_type VARCHAR(16) NOT NULL,

  -- The user who created the log entry (if any).
  maybe_creator_user_token VARCHAR(32) DEFAULT NULL,

  -- The log message body.
  message MEDIUMTEXT NOT NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- INDICES --
  PRIMARY KEY (id),
  UNIQUE KEY (token),
  KEY index_created_at (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
