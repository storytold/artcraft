-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE wallet_ledger_entries
ADD COLUMN
is_refunded BOOLEAN NOT NULL DEFAULT FALSE;
