#!/usr/bin/env bash
# Shared helpers for the dev-stack bootstrap scripts.
#
# Usage (from a script that has set ${root_dir}):
#
#   source "${root_dir}/script/bootstrap/common.sh"
#
# See _docs/dev_setup_local_stack.md for the full picture.

# Canonical local-dev database identity. These match _docs/dev_setup_server.md,
# the diesel DATABASE_URL in the repo-root .env, and the server's MYSQL_URL
# default (crates/schema/config/shared_env_var_config/src/mysql.rs). Override
# via environment only if your local MySQL differs — most tooling assumes them.
DEV_MYSQL_DB="${DEV_MYSQL_DB:-storyteller}"
DEV_MYSQL_USER="${DEV_MYSQL_USER:-storyteller}"
DEV_MYSQL_PASSWORD="${DEV_MYSQL_PASSWORD:-password}"
DEV_MYSQL_HOST="${DEV_MYSQL_HOST:-localhost}"

# Where the backend listens (BIND_ADDRESS default in
# storyteller_web/src/startup/build_dependencies.rs).
DEV_BACKEND_URL="${DEV_BACKEND_URL:-http://localhost:12345}"

# Default demo account. The username must NOT be on the reserved-usernames list
# (includes/binary_includes/usernames/reserved_usernames.txt — "demo", "admin",
# "test", and "dev" are all reserved) and must match ^[A-Za-z0-9_\-]{3,16}$.
DEMO_USERNAME="${DEMO_USERNAME:-localdev1}"
DEMO_PASSWORD="${DEMO_PASSWORD:-localdev1pass}"
DEMO_EMAIL="${DEMO_EMAIL:-localdev1@example.com}"

# Banked credits the demo user's artcraft wallet is seeded/topped-up to.
# Generation submits are gated on wallet balance, so 0 credits means the
# generate button silently refuses in the webapp.
DEMO_CREDITS="${DEMO_CREDITS:-100000}"

# Local media served by the backend at /media when LOCAL_MEDIA_ROOT points
# here (fully-local gallery + fake generation results). Mirrors the public
# bucket layout: object path /media/{...} lives at .devstack/media/media/{...}.
# NB: callers must have set ${root_dir} before sourcing this file.
DEV_MEDIA_ROOT="${DEV_MEDIA_ROOT:-${root_dir}/.devstack/media}"

log()  { echo "[bootstrap] $*"; }
warn() { echo "[bootstrap] WARNING: $*" >&2; }
die()  { echo "[bootstrap] ERROR: $*" >&2; exit 1; }

step() {
  echo ""
  echo "=== $* ==="
}

# sudo unless we already are root (CI containers often run as root without sudo).
maybe_sudo() {
  if [ "$(id -u)" -eq 0 ]; then
    "$@"
  else
    sudo "$@"
  fi
}

confirm() {
  local prompt="$1"
  if [ "${ASSUME_YES:-false}" = "true" ]; then
    return 0
  fi
  local reply
  read -r -p "${prompt} [y/N] " reply
  [[ "${reply}" =~ ^[Yy] ]]
}

# Generate a token in the backend's format: {prefix}{crockford-lower entropy}
# padded to the same TOTAL length the Rust generators use (tokens crate,
# impl_crockford_generator!). Alphabet excludes i/l/o/u like Crockford base32.
new_dev_token() {
  local prefix="$1" total_length="$2"
  local charset="0123456789abcdefghjkmnpqrstvwxyz"
  local count=$((total_length - ${#prefix}))
  local entropy=""
  local i
  for ((i = 0; i < count; i++)); do
    entropy+="${charset:RANDOM%32:1}"
  done
  echo "${prefix}${entropy}"
}

# Run a statement (or stdin) as the storyteller app user against the dev DB.
# MYSQL_PWD keeps the password off the process list.
mysql_app() {
  MYSQL_PWD="${DEV_MYSQL_PASSWORD}" mysql \
      -u "${DEV_MYSQL_USER}" -h "${DEV_MYSQL_HOST}" -D "${DEV_MYSQL_DB}" "$@"
}

# Run a statement as an administrator, for provisioning the DB and user.
# On a fresh Ubuntu/WSL install, root uses auth_socket, so `sudo mysql` works.
# On GitHub Actions runners the preinstalled MySQL root password is "root" —
# export MYSQL_ROOT_PASSWORD to use password auth instead.
mysql_admin() {
  if [ -n "${MYSQL_ROOT_PASSWORD:-}" ]; then
    MYSQL_PWD="${MYSQL_ROOT_PASSWORD}" mysql -u root -h "${DEV_MYSQL_HOST}" "$@"
  else
    maybe_sudo mysql "$@"
  fi
}

mysql_app_reachable() {
  mysql_app -e "SELECT 1" >/dev/null 2>&1
}

redis_reachable() {
  redis-cli ping 2>/dev/null | grep -q PONG
}

backend_reachable() {
  curl -sf -o /dev/null --max-time 3 "${DEV_BACKEND_URL}/_status"
}

# Make ~/.cargo/bin visible when rustup was installed but the shell profile
# hasn't been re-sourced (fresh installs, CI).
ensure_cargo_on_path() {
  if ! command -v cargo >/dev/null 2>&1 && [ -x "${HOME}/.cargo/bin/cargo" ]; then
    export PATH="${HOME}/.cargo/bin:${PATH}"
  fi
}
