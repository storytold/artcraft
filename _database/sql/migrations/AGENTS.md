# SQL Migrations

Incremental schema changes applied in order by timestamp prefix.

## Naming Convention

Migration directories follow the format:

```
YYYY-MM-DD-HHMMSS-NNNN_description_goes_here/
  up.sql
  down.sql
```

These are created with the `diesel` tool, and in particular:

> `diesel migration generate description_goes_here`

- `NNNN` is a zero-padded sequence number for ordering multiple migrations on the same timestamp.
- `up.sql` applies the migration forward.
- `down.sql` reverses it.

## Table Conventions

- Primary key `id` columns must be `BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT`. Do not use signed IDs.
- Always create tables with `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`.
- All SQL files should start with the standard IntelliJ noinspection comments:
  ```sql
  -- noinspection SqlDialectInspectionForFile
  -- noinspection SqlNoDataSourceInspectionForFile
  -- noinspection SqlResolveForFile
  ```

## Rules

- Every `up.sql` must have a corresponding `down.sql` that cleanly reverses the migration.
- For `CREATE TABLE` migrations, the `down.sql` is typically `DROP TABLE IF EXISTS table_name;`.
- For `ALTER TABLE` migrations, the `down.sql` reverses the alteration (e.g. `DROP COLUMN`).
