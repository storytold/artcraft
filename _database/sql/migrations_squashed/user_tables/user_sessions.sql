-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

CREATE TABLE user_sessions (
  -- Not used for anything except replication.
  id BIGINT(20) NOT NULL AUTO_INCREMENT,

  -- Session primary key
  token VARCHAR(32) NOT NULL,

  -- The user that the session belongs to.
  user_token VARCHAR(32) NOT NULL,

  -- NEVER IMPERSONATE A USER'S ACCOUNT WITHOUT THEIR CONSENT!
  --
  -- For support requests and inquiries, we can have staff log into user accounts
  -- to verify and debug possible broken states. The user is always told about
  -- this if we are to use this for support cases.
  --
  -- Every action performed by impersonated sessions is logged for auditing.
  --
  -- If this session is impersonating another user, this is the token of
  -- the staff user who initiated the impersonation.
  maybe_impersonation_user_token VARCHAR(32) DEFAULT NULL,

  -- Track each session's creation IP.
  -- Wide enough for IPv4/6
  ip_address_creation VARCHAR(40) NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Session termination time.
  -- This must be set by the server code, or the session is invalid
  expires_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- deletion = session termination
  -- Typically these are destroyed by users, but if in the future we allow mods to
  -- delete them, it doesn't really matter who did the deletion: sessions are not
  -- designed to be recoverable.
  deleted_at TIMESTAMP NULL,

  -- INDICES --
  PRIMARY KEY (id),
  UNIQUE KEY (token),
  KEY fk_user_token (user_token),
  KEY index_ip_address_creation (ip_address_creation)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
