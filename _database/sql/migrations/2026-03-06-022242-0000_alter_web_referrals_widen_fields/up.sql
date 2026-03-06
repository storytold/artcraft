-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE web_referrals
MODIFY COLUMN utm_source VARCHAR(150) DEFAULT NULL,
MODIFY COLUMN utm_medium VARCHAR(150) DEFAULT NULL,
MODIFY COLUMN utm_campaign VARCHAR(150) DEFAULT NULL;
