-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE generic_inference_jobs
ADD COLUMN
maybe_wallet_ledger_entry_token VARCHAR(32) DEFAULT NULL;
