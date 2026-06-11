-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE generic_inference_jobs
  ADD COLUMN maybe_external_third_party_cost_usd_cents INT(10) UNSIGNED DEFAULT NULL;
