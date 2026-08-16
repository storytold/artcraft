#!/bin/bash
#
# Regenerates the workspace-root `.sqlx/` offline query cache for BOTH query
# crates:
#
#   1. `sqlite_tasks` — desktop app "tasks" queries, checked against a scratch
#      SQLite database migrated from `_database/sql/artcraft_migrations`.
#   2. `mysql_queries` — backend queries, checked against the local dev MySQL
#      (the `DATABASE_URL` in the repo root `.env`, overridable via env).
#
# Requirements:
#   - sqlx-cli matching the workspace sqlx version, with both drivers:
#       cargo install sqlx-cli --version 0.7.4 --no-default-features \
#         --features mysql,sqlite,rustls --locked
#   - A running local MySQL with the migrated dev database.
#
# The new cache is staged in a temp directory and only replaces the old
# `.sqlx/*.json` files after BOTH prepares succeed, so a failure part-way
# never leaves the repo without a query cache.

set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

sqlite_db_file="$(mktemp /tmp/artcraft_sqlx_tasks.XXXXXX)"
sqlite_package_path="${root_dir}/crates/schema/database/sqlite_tasks"
mysql_package_path="${root_dir}/crates/schema/database/mysql_queries"

query_cache_dir="${root_dir}/.sqlx"
staging_dir="$(mktemp -d /tmp/sqlx_codegen.XXXXXX)"

cleanup() {
  rm -f -- "${sqlite_db_file}"

  if [[ -d "${staging_dir}" ]]; then
    rm -f -- "${staging_dir}/"*.json
    rmdir "${staging_dir}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# The dev MySQL database. Falls back to DATABASE_URL in the repo-root .env so
# the script works from any directory. Keep the credential out of shell trace,
# command arguments, and process listings.
if [[ -n "${DATABASE_URL:-}" ]]; then
  mysql_database_url="${DATABASE_URL}"
elif [[ -f "${root_dir}/.env" ]]; then
  mysql_database_url="$(
    sed -n 's/^DATABASE_URL=\(mysql.*\)$/\1/p' "${root_dir}/.env" | head -n 1
  )"
else
  echo "DATABASE_URL is unset and ${root_dir}/.env does not exist." >&2
  exit 1
fi

if [[ -z "${mysql_database_url}" ]]; then
  echo "A MySQL DATABASE_URL is required to regenerate the query cache." >&2
  exit 1
fi

prepare_sqlite_tasks() {
  echo "Creating a fresh Tauri SQLite tasks database..."

  echo "Migrating the SQLite tasks database..."
  cargo sqlx migrate run \
    --database-url "sqlite:${sqlite_db_file}" \
    --source "${root_dir}/_database/sql/artcraft_migrations"

  echo "Preparing the SQLite tasks query cache..."
  pushd "${sqlite_package_path}"
  cargo sqlx prepare \
    --database-url "sqlite:${sqlite_db_file}"
  popd

  mv "${sqlite_package_path}/.sqlx/"*.json "${staging_dir}/"
}

prepare_mysql() {
  echo "Preparing the MySQL query cache..."
  pushd "${mysql_package_path}"
  DATABASE_URL="${mysql_database_url}" cargo sqlx prepare
  popd

  mv "${mysql_package_path}/.sqlx/"*.json "${staging_dir}/"
}

replace_query_cache() {
  echo "Replacing the query cache..."
  mkdir -p "${query_cache_dir}"
  rm -f "${query_cache_dir}/"*.json
  mv "${staging_dir}/"*.json "${query_cache_dir}/"
  rmdir "${staging_dir}"

  # Remove the (now empty) per-package cache dirs so sqlx never resolves
  # offline queries against a stale crate-local cache instead of the
  # workspace root one.
  rmdir "${sqlite_package_path}/.sqlx" "${mysql_package_path}/.sqlx" 2>/dev/null || true
}

# The sqlx macros only emit query metadata when the crates actually
# recompile; a fresh (cached) build would yield an EMPTY cache. Force both
# query crates to rebuild.
cargo clean -p sqlite_tasks -p mysql_queries

# Prepare must expand the macros against the live databases.
export SQLX_OFFLINE=false

prepare_sqlite_tasks
prepare_mysql
replace_query_cache

echo 'done'
