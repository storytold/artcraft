-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Recreate with the original signed BIGINT id.
CREATE TABLE staff_audit_logs (

  id BIGINT(20) NOT NULL AUTO_INCREMENT,

  token VARCHAR(32) NOT NULL,

  audit_action VARCHAR(32) NOT NULL,

  maybe_entity_type VARCHAR(16) DEFAULT NULL,

  maybe_entity_token VARCHAR(32) NOT NULL,

  staff_user_token VARCHAR(32) DEFAULT NULL,

  staff_ip_address VARCHAR(40) NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY (token),
  KEY index_maybe_entity_type (maybe_entity_type),
  KEY index_maybe_entity_token (maybe_entity_token),
  KEY index_staff_user_token (staff_user_token),
  KEY index_created_at (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
