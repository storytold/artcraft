-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE web_referrals
MODIFY COLUMN utm_source VARCHAR(32) DEFAULT NULL,
MODIFY COLUMN utm_medium VARCHAR(32) DEFAULT NULL,
MODIFY COLUMN utm_campaign VARCHAR(255) DEFAULT NULL;
