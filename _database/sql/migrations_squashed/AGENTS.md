# Squashed / Materialized Schemas

Fully materialized table definitions representing the current state of each table
after all migrations have been applied. These are not executed — they exist as
human-readable documentation of the current schema.

## When to Update

Update the corresponding squashed file whenever a migration changes a table's schema
(adding columns, changing types, dropping and recreating, etc.).

## Table Conventions

- Primary key `id` columns must be `BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT`. Do not use signed IDs.
- Always create tables with `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`.
- All SQL files should start with the standard IntelliJ noinspection comments:
  ```sql
  -- noinspection SqlDialectInspectionForFile
  -- noinspection SqlNoDataSourceInspectionForFile
  -- noinspection SqlResolveForFile
  ```

## File Organization

Files are named after their table (e.g. `users.sql`, `media_files.sql`).
Some tables are grouped into subdirectories (e.g. `user_tables/`).
