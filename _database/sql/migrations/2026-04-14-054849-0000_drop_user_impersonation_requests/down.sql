-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Recreate with the original signed BIGINT id.
CREATE TABLE user_impersonation_requests (

  id BIGINT(20) NOT NULL AUTO_INCREMENT,

  token VARCHAR(32) NOT NULL,

  impersonated_user_token VARCHAR(32) NOT NULL,

  impersonator_user_token VARCHAR(32) NOT NULL,

  user_impersonation_token VARCHAR(32) NOT NULL,

  is_redeemed BOOLEAN NOT NULL DEFAULT FALSE,

  ip_address_creation VARCHAR(40) NOT NULL,

  ip_address_redemption VARCHAR(40) DEFAULT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  expires_at TIMESTAMP NOT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY (token),
  UNIQUE KEY (user_impersonation_token),
  KEY index_impersonated_user_token (impersonated_user_token),
  KEY index_impersonator_user_token (impersonator_user_token)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
