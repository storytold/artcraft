#!/bin/bash

# NB: This format can be used without changing directory:
# SQLX_OFFLINE=true cargo sqlx prepare -- --bin storyteller-web --manifest-path crates/service/storyteller_web/Cargo.toml

set -euxo pipefail

# TODO: Fix up root dir determination
root_dir=$(pwd)
sqlite_db_file="/tmp/tasks.sqlite"

sqlite_package_path="${root_dir}/crates/schema/database/sqlite_tasks"
mysql_package_path="${root_dir}/crates/schema/database/mysql_queries"

query_cache_dir="${root_dir}/.sqlx/"

remove_old_query_cache() {
  echo "Removing old query cache files..."
  pushd "${query_cache_dir}"
  rm -f *.json
  popd
}

prepare_sqlite_tasks() {
  echo 'Create Tauri SQLite tasks database file...'
  touch "${sqlite_db_file}"

  echo "Migrate Tauri SQLite tasks database file..."
  cargo sqlx migrate run \
    --database-url "sqlite:${sqlite_db_file}" \
    --source "${root_dir}/_sql/artcraft_migrations"

  echo "Prepare Tauri SQLite tasks query cache..."
  pushd "${sqlite_package_path}"
  cargo sqlx prepare \
    --database-url "sqlite:${sqlite_db_file}"
  popd

  echo "Move query cache files..."
  pushd "${sqlite_package_path}/.sqlx"
  mv *.json "${query_cache_dir}"
  popd
}

prepare_mysql() {
  echo "Prepare MySQL database query cache..."
  pushd "${mysql_package_path}"
  cargo sqlx prepare
  popd

  echo "Move query cache files..."
  pushd "${mysql_package_path}/.sqlx"
  mv *.json "${query_cache_dir}"
  popd
}

remove_old_query_cache
prepare_sqlite_tasks
prepare_mysql

# NB(bt): Below are several generational revisions of sqlx query caching. 
# The most recent was for a workspace with only one sqlx query package.
# There are older remnants from a multi-package configuration, but I believe
# the tooling has improved since then. Keeping this here just in case.
#
#   #export DATABASE_URL="sqlite:${sqlite_db_file}"
#   
#   # NB: Database used by desktop app for AiChatBot sidecar.
#   # Make sure it has been migrated (use aichatbot-sidecar app directory as root).
#   # SQLITE_DATABASE_PATH=./runtime_data/database.db
#   
#   # NB: OpenSSL is broken on Ubuntu 22.04 (this is documented elsewhere)
#   # See https://askubuntu.com/a/1403961
#   # For some reason, the choice of "rustls" or the vendored openssl is not persistent between calls.
#   #cargo install sqlx-cli --features openssl-vendored,mysql
#   
#   build_shared_mysql_database_library() {
#
#     # NB: For now, this is our monolithic DB that serves all of our microservices (gross)
#
#     # It's a single package so that queries can be shared (again, gross)
#     #pushd crates/lib/mysql_queries
#     #SQLX_OFFLINE=true cargo sqlx prepare
#     #popd
#     cargo sqlx prepare --workspace
#   }
#   
#   #build_shared_sqlite_database_library() {
#   #  # NB(1): These are *SQLite* queries for the desktop AiChatBot app.
#   #  # NB(2): Make sure to run migrations first.
#
#   #  # NB(3): SqLite has trouble with relative paths, so we copy the file to /
#   #  cp $SQLITE_DATABASE_PATH /tmp
#   #  pushd crates/lib/sqlite_queries
#   #  DATABASE_URL=sqlite:///tmp/database.db cargo sqlx prepare --merged
#   #  popd
#   #}
#   
#   
#   echo 'mysql prepare (if this takes a while, it may need to rebuild all the rust code)'
#   build_shared_mysql_database_library
#   
#   #echo 'sqlite prepare'
#   #build_shared_sqlite_database_library

echo 'done'
