-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE users
  ADD COLUMN maybe_referral_partner VARCHAR(32) DEFAULT NULL;
