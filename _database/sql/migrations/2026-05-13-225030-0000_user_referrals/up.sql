-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

CREATE TABLE user_referrals (
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,

  -- The user who was invited/referred.
  invited_user_token VARCHAR(32) NOT NULL,

  -- The user who referred the invited user.
  referrer_user_token VARCHAR(32) NOT NULL,

  -- OPTIONAL. The referral code token used, if any.
  maybe_referral_code_token VARCHAR(32) DEFAULT NULL,

  -- OPTIONAL. The referral URL the invited user arrived from.
  maybe_referral_url VARCHAR(255) DEFAULT NULL,

  -- OPTIONAL. The landing URL the invited user first visited.
  maybe_landing_url VARCHAR(255) DEFAULT NULL,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- INDICES --
  PRIMARY KEY (id),
  UNIQUE KEY unique_invited_user_token (invited_user_token),
  KEY index_referrer_user_token (referrer_user_token),
  KEY index_created_at (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
