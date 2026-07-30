#!/usr/bin/env bash
# Run the storyteller-web backend for local development (binds 0.0.0.0:12345).
#
# Must run from a bootstrapped environment (./script/bootstrap/bootstrap_dev_stack.sh).
# Always runs from the repo root: the server's config search path
# (crates/service/web/storyteller_web/config/*.env) and its includes/ defaults
# are cwd-relative.
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${root_dir}/script/bootstrap/common.sh"

SECRETS_ENV_FILE="${root_dir}/crates/service/web/storyteller_web/config/storyteller-web.development-secrets.env"

mysql_app_reachable || die "MySQL is not reachable as '${DEV_MYSQL_USER}'. Run ./script/bootstrap/bootstrap_dev_stack.sh first."
redis_reachable     || die "Redis is not reachable. Run ./script/bootstrap/bootstrap_dev_stack.sh first."
[ -f "${SECRETS_ENV_FILE}" ] || die "Missing ${SECRETS_ENV_FILE}. Run ./script/bootstrap/bootstrap_dev_stack.sh first."

ensure_cargo_on_path
cd "${root_dir}"

# SERVER_ENVIRONMENT defaults to Development when unset (bootstrap.rs), and the
# dev config files are picked up from the search path automatically.
# SQLX_OFFLINE only affects compile-time query checking, never runtime.
log "Starting storyteller-web on ${DEV_BACKEND_URL} (Ctrl-C to stop)..."
exec env SQLX_OFFLINE=true cargo run -p storyteller-web --bin storyteller-web
