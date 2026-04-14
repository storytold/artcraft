-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

CREATE TABLE staff_audit_logs (

  -- Not used for anything except replication.
  id BIGINT(20) NOT NULL AUTO_INCREMENT,

  -- Effective "primary key" of the audit log item (in case we add a UI or notes)
  token VARCHAR(32) NOT NULL,

  -- The type of action taken
  audit_action VARCHAR(32) NOT NULL,

  -- The type of entity acted upon (if any)
  maybe_entity_type VARCHAR(16) DEFAULT NULL,

  -- The token of the entity mutated (if any)
  maybe_entity_token VARCHAR(32) NOT NULL,

  -- The staff user who performed the action.
  staff_user_token VARCHAR(32) DEFAULT NULL,

  -- For abuse tracking.
  -- Wide enough for IPv4/6
  staff_ip_address VARCHAR(40) NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- INDICES --
  PRIMARY KEY (id),
  UNIQUE KEY (token),
  KEY index_maybe_entity_type (maybe_entity_type),
  KEY index_maybe_entity_token (maybe_entity_token),
  KEY index_staff_user_token (staff_user_token),
  KEY index_created_at (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
