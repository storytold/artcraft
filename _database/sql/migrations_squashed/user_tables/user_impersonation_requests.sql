-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

CREATE TABLE user_impersonation_requests (

  -- Not used for anything except replication.
  id BIGINT(20) NOT NULL AUTO_INCREMENT,

  -- Internal "primary key"
  token VARCHAR(32) NOT NULL,

  -- The user being impersonated.
  impersonated_user_token VARCHAR(32) NOT NULL,

  -- The staff user who initiated the impersonation.
  impersonator_user_token VARCHAR(32) NOT NULL,

  -- The actual secret that must be presented to redeem the impersonation.
  user_impersonation_token VARCHAR(32) NOT NULL,

  -- Whether this request has been redeemed (used to create a session).
  is_redeemed BOOLEAN NOT NULL DEFAULT FALSE,

  -- IP address of the staff user who created the request.
  ip_address_creation VARCHAR(40) NOT NULL,

  -- IP address from which the request was redeemed, if redeemed.
  ip_address_redemption VARCHAR(40) DEFAULT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- The request expires after this time if not redeemed.
  expires_at TIMESTAMP NOT NULL,

  -- INDICES --
  PRIMARY KEY (id),
  UNIQUE KEY (token),
  UNIQUE KEY (user_impersonation_token),
  KEY index_impersonated_user_token (impersonated_user_token),
  KEY index_impersonator_user_token (impersonator_user_token)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
