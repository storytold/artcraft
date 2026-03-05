-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE users
ADD COLUMN
maybe_referral_url VARCHAR(255) DEFAULT NULL;
