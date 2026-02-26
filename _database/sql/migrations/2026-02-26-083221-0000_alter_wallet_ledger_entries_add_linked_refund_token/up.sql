-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE wallet_ledger_entries
ADD COLUMN
maybe_linked_refund_ledger_token VARCHAR(32) DEFAULT NULL;
