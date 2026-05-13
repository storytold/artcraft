-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE users
  ADD COLUMN maybe_referral_user_token VARCHAR(32) DEFAULT NULL;
