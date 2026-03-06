-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

-- Records of web referrals
CREATE TABLE web_referrals (
  -- Not used for anything except replication.
  id BIGINT(20) NOT NULL AUTO_INCREMENT,

  -- The referral URL
  url VARCHAR(255) NOT NULL,

  -- The parsed out referral domain
  domain VARCHAR(255) DEFAULT NULL,

  utm_source VARCHAR(32) DEFAULT NULL,

  utm_medium  VARCHAR(32) DEFAULT NULL,

  utm_campaign VARCHAR(255) DEFAULT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- ========== INDICES ==========
  PRIMARY KEY (id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
