-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE web_referrals
ADD COLUMN ip_address VARCHAR(40) NOT NULL,
ADD COLUMN anonymous_visitor_token VARCHAR(32) DEFAULT NULL;
