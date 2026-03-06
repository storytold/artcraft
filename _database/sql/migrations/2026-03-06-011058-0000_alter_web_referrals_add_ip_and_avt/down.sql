-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE web_referrals
DROP COLUMN ip_address,
DROP COLUMN anonymous_visitor_token;
