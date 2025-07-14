#!/usr/bin/env bash
# This works on Linux and MacOS to launch the Rust dev server

set -euxo pipefail

echo "Running Artcraft Rust in Dev Mode..."
echo ""

echo "You'll need to launch the frontend dev server as a second script!"
echo ""

root_dir=$(pwd)
frontend_path="${root_dir}/frontend"
rust_crate_path="${root_dir}/crates/desktop/artcraft"

sqlite_db_file="/tmp/tasks.sqlite"

# The tauri dev server integration is super annoying: It eats ctrl-c interrupts,
# it decoheres the and corrupts terminal output, and it's slow. This configuration
# allows us to start without it. Simply launch `nx` and the dev server as a separate
# process and leave tauri out of the loop
config_path="${rust_crate_path}/tauri.artcraft_3d.no_dev.conf.toml"

export TAURI_FRONTEND_PATH="${frontend_path}"
export TAURI_APP_PATH="${rust_crate_path}"

echo "Create database file..."
touch "${sqlite_db_file}"

sqlx_migrate() {
  echo "SQLx migrate database file..."
  sqlx migrate run \
    --database-url "sqlite:${sqlite_db_file}" \
    --source "${root_dir}/_sql/artcraft_migrations"

  export DATABASE_URL="sqlite:${sqlite_db_file}"
}

sqlx_offline() {
  echo "SQLx offline..."
  export SQLX_OFFLINE=true
}

# NB: Switch this for actively developing queries.
#sqlx_migrate
sqlx_offline

echo "Build and run..."
RUSTFLAGS="-Awarnings" cargo tauri dev \
  --no-dev-server \
  --no-dev-server-wait \
  --no-watch \
  --config "${config_path}"
