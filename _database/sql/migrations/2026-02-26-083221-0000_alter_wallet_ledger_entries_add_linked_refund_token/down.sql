-- noinspection SqlDialectInspectionForFile
-- noinspection SqlNoDataSourceInspectionForFile
-- noinspection SqlResolveForFile

ALTER TABLE wallet_ledger_entries
DROP COLUMN
maybe_linked_refund_ledger_token;
