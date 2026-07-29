#!/usr/bin/env bash
# Bootstrap the full local dev stack (backend + frontend) on a fresh clone.
#
# Target platform: Ubuntu 22.04+ — native, WSL2, or a CI runner/container.
# (Windows users: the native PowerShell variant in script/bootstrap/windows/
# is the primary path — no WSL needed. macOS users: follow
# _docs/dev_setup_server.md manually. See _docs/dev_setup_local_stack.md.)
#
# Idempotent: safe to re-run at any time; each step detects work already done.
#
# Usage:
#   ./script/bootstrap/bootstrap_dev_stack.sh [options]
#
# Options:
#   --yes, -y          Non-interactive: assume "yes" for prompts (CI mode)
#   --skip-packages    Don't apt-install system packages
#   --skip-rust-build  Don't build the storyteller-web binary
#   --skip-frontend    Don't run the frontend npm install
#
# After it succeeds:
#   ./script/bootstrap/run_backend_dev.sh        # start the API on :12345
#   ./script/bootstrap/seed_demo_user.sh         # create the demo login
#   cd frontend && npx nx dev artcraft-webapp    # webapp on :4201
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${root_dir}/script/bootstrap/common.sh"

SECRETS_ENV_FILE="${root_dir}/crates/service/web/storyteller_web/config/storyteller-web.development-secrets.env"

# System packages: MySQL + Redis servers, the native libs needed to compile the
# Rust workspace (per build/service_cpu.Dockerfile) and diesel_cli
# (libmysqlclient-dev, libsqlite3-dev), plus curl/jq for the seeding scripts.
SYSTEM_PACKAGES=(
  build-essential
  ca-certificates
  cmake
  curl
  ffmpeg
  fontconfig
  git
  jq
  libclang-dev
  libfontconfig1-dev
  libmysqlclient-dev
  libsqlite3-dev
  libssl-dev
  mysql-server
  perl
  pkg-config
  redis-server
)

ASSUME_YES=false
SKIP_PACKAGES=false
SKIP_RUST_BUILD=false
SKIP_FRONTEND=false

main() {
  parse_args "$@"
  ensure_supported_platform

  install_system_packages
  ensure_mysql_running
  provision_mysql_database
  ensure_redis_running
  ensure_rust_toolchain
  ensure_diesel_cli
  run_migrations
  seed_roles_and_badges
  write_secrets_env_if_missing
  build_backend
  setup_frontend

  print_next_steps
}

parse_args() {
  for arg in "$@"; do
    case "${arg}" in
      --yes|-y)          ASSUME_YES=true ;;
      --skip-packages)   SKIP_PACKAGES=true ;;
      --skip-rust-build) SKIP_RUST_BUILD=true ;;
      --skip-frontend)   SKIP_FRONTEND=true ;;
      --help|-h)         sed -n '2,22p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
      *) die "Unknown option: ${arg} (try --help)" ;;
    esac
  done
}

ensure_supported_platform() {
  case "$(uname -s)" in
    Linux) ;;
    Darwin)
      die "This script targets Ubuntu/WSL2. On macOS, follow _docs/dev_setup_server.md."
      ;;
    *)
      die "Unsupported platform '$(uname -s)'. On Windows use script/bootstrap/windows/bootstrap_dev_stack.ps1 (native), or WSL2 Ubuntu for this script."
      ;;
  esac

  if grep -qi microsoft /proc/version 2>/dev/null && [[ "${root_dir}" == /mnt/* ]]; then
    warn "This checkout lives on the Windows filesystem (${root_dir})."
    warn "Rust + npm builds are dramatically slower through /mnt. Consider cloning"
    warn "into the WSL filesystem (e.g. ~/storyteller-rust) instead."
  fi
}

install_system_packages() {
  step "System packages"
  if [ "${SKIP_PACKAGES}" = "true" ]; then
    log "Skipped (--skip-packages)."
    return
  fi

  local missing=()
  for pkg in "${SYSTEM_PACKAGES[@]}"; do
    dpkg -s "${pkg}" >/dev/null 2>&1 || missing+=("${pkg}")
  done

  if [ "${#missing[@]}" -eq 0 ]; then
    log "All required apt packages are already installed."
    return
  fi

  log "Missing packages: ${missing[*]}"
  confirm "Install them with apt-get?" || die "Cannot continue without system packages (or pass --skip-packages if you manage them yourself)."
  maybe_sudo env DEBIAN_FRONTEND=noninteractive apt-get update
  maybe_sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y "${missing[@]}"
}

ensure_mysql_running() {
  step "MySQL server"
  if mysqladmin ping --silent 2>/dev/null; then
    log "MySQL is running."
  else
    log "Starting MySQL..."
    maybe_sudo service mysql start 2>/dev/null \
        || maybe_sudo systemctl start mysql 2>/dev/null \
        || die "Could not start MySQL (tried 'service mysql start' and 'systemctl start mysql')."
    mysqladmin ping --silent 2>/dev/null || sleep 3
    mysqladmin ping --silent 2>/dev/null || die "MySQL did not come up."
  fi

  # The tooling supports the MySQL 8.x series; 9.x is known-unsupported
  # (_docs/dev_setup_server.md).
  local version
  version="$(mysqld --version 2>/dev/null || true)"
  case "${version}" in
    *" 8."*) ;;
    "") warn "Could not determine MySQL server version." ;;
    *) warn "MySQL 8.x is expected; found: ${version}" ;;
  esac
}

provision_mysql_database() {
  step "MySQL database + user (${DEV_MYSQL_DB} / ${DEV_MYSQL_USER}@localhost)"
  if mysql_app_reachable; then
    log "Database and app user already provisioned."
    return
  fi

  # Same DDL as _docs/dev_setup_server.md, made idempotent.
  mysql_admin <<SQL
CREATE DATABASE IF NOT EXISTS ${DEV_MYSQL_DB};
CREATE USER IF NOT EXISTS '${DEV_MYSQL_USER}'@'localhost' IDENTIFIED BY '${DEV_MYSQL_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DEV_MYSQL_DB}.* TO '${DEV_MYSQL_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL

  mysql_app_reachable || die "Provisioning ran but '${DEV_MYSQL_USER}' still cannot reach '${DEV_MYSQL_DB}'."
  log "Provisioned."
}

ensure_redis_running() {
  step "Redis server"
  if redis_reachable; then
    log "Redis is running."
    return
  fi
  log "Starting Redis..."
  maybe_sudo service redis-server start 2>/dev/null \
      || maybe_sudo systemctl start redis-server 2>/dev/null \
      || die "Could not start Redis."
  redis_reachable || die "Redis did not come up."
}

ensure_rust_toolchain() {
  step "Rust toolchain"
  ensure_cargo_on_path
  if command -v cargo >/dev/null 2>&1; then
    log "Found $(rustc --version 2>/dev/null || echo 'cargo (rustc missing?)')."
    return
  fi
  confirm "Rust is not installed. Install stable via rustup?" || die "Rust is required to build the backend."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
  ensure_cargo_on_path
  command -v cargo >/dev/null 2>&1 || die "rustup install finished but cargo is not on PATH."
}

ensure_diesel_cli() {
  step "diesel_cli (migration runner)"
  if command -v diesel >/dev/null 2>&1; then
    log "Found $(diesel --version)."
    return
  fi
  # Same install command as _docs/dev_setup_server.md. Needs libmysqlclient-dev
  # and libsqlite3-dev (installed above).
  log "Installing diesel_cli (this compiles from source; a few minutes)..."
  cargo install diesel_cli --no-default-features --features mysql,sqlite
}

run_migrations() {
  step "Database migrations (_database/sql/migrations)"
  # diesel-cli reads DATABASE_URL; the repo-root .env provides it, but export a
  # default so this also works if that file is ever absent (e.g. sparse CI).
  export DATABASE_URL="${DATABASE_URL:-mysql://${DEV_MYSQL_USER}:${DEV_MYSQL_PASSWORD}@${DEV_MYSQL_HOST}/${DEV_MYSQL_DB}}"
  cd "${root_dir}"
  # NB: "Encountered unknown type for Mysql: enum" warnings are harmless
  # (_docs/dev_setup_server.md).
  diesel migration run
  log "Migrations up to date."
}

seed_roles_and_badges() {
  step "Seed data (system roles + badges)"
  # Same data as _database/sql/seed/bootstrap_inserts_roles_etc.sh, but guarded
  # so re-runs don't hit duplicate-key errors. The 'user' role is mandatory:
  # account creation hardcodes user_role_slug='user'.
  local role_count badge_count
  role_count="$(mysql_app -N -e "SELECT COUNT(*) FROM user_roles" 2>/dev/null || echo 0)"
  if [ "${role_count}" -gt 0 ]; then
    log "user_roles already seeded (${role_count} rows)."
  else
    mysql_app < "${root_dir}/_database/sql/seed/sql/system_roles.sql"
    log "Inserted system roles (user, mod, admin)."
  fi

  badge_count="$(mysql_app -N -e "SELECT COUNT(*) FROM badges" 2>/dev/null || echo 0)"
  if [ "${badge_count}" -gt 0 ]; then
    log "badges already seeded (${badge_count} rows)."
  else
    mysql_app < "${root_dir}/_database/sql/seed/sql/user_badges.sql"
    log "Inserted badges."
  fi
}

write_secrets_env_if_missing() {
  step "Development secrets file"
  if [ -f "${SECRETS_ENV_FILE}" ]; then
    log "Already exists: ${SECRETS_ENV_FILE} (leaving it untouched)."
    return
  fi

  # Every env var below is read with get_env_string_required at server startup
  # (build_dependencies.rs / setup_inference_providers.rs / setup_stripe_*.rs)
  # but is NOT supplied by the checked-in config files. None of them is
  # contacted at boot — placeholder values are enough to run the server; the
  # endpoints that would use them fail lazily if exercised. Generation is still
  # safe: providers are only contacted by the separate job worker binaries,
  # which local dev does not run.
  #
  # NOTE: config loading is FIRST-VALUE-WINS (dotenv never overrides an
  # already-set key), so values here cannot override anything already set in
  # storyteller-web.development.env — only real process env vars can.
  cat > "${SECRETS_ENV_FILE}" <<'EOF'
# Local-development secrets for storyteller-web. Generated by
# script/bootstrap/bootstrap_dev_stack.sh — gitignored; edit freely.
#
# Placeholders below satisfy required-at-boot checks without enabling any
# external integration. Replace individual values with real dev credentials
# only if you need that specific integration locally.

# R2/S3 object storage (clients are constructed offline)
ACCESS_KEY=dummy-local-dev
SECRET_KEY=dummy-local-dev
REGION_NAME=us-east-1
W2L_PRIVATE_DOWNLOAD_BUCKET_NAME=dummy-local-dev-private
W2L_PUBLIC_DOWNLOAD_BUCKET_NAME=dummy-local-dev-public

# Email (Resend)
RESEND_API_KEY=dummy-local-dev

# Generation providers (only job workers ever contact these; workers are not
# run in local dev, so enqueued jobs simply stay pending)
FAL_API_KEY=dummy-local-dev
GMICLOUD_API_KEY=dummy-local-dev
GROK_API_KEY=dummy-local-dev
BEEBLE_API_KEY=dummy-local-dev
OPENAI_API_KEY=dummy-local-dev
WORLDLABS_API_KEY=dummy-local-dev
SEEDANCE2PRO_COOKIES=dummy-local-dev
SEEDANCE2PRO_WHITELIST_COOKIES=dummy-local-dev
SEEDANCE2PRO_BYTEPLUS_ULTRA_COOKIES=dummy-local-dev

# Stripe account ids (test-mode secret keys are already checked into
# storyteller-web.development.env; only the account ids are missing there)
STRIPE_FAKEYOU_ACCOUNT_ID=acct_dummylocaldev
STRIPE_ARTCRAFT_ACCOUNT_ID=acct_dummylocaldev
STRIPE_ARTCRAFT_SECRET_KEY=sk_test_dummylocaldev
STRIPE_ARTCRAFT_SECRET_WEBHOOK_KEY=whsec_dummylocaldev
EOF
  log "Wrote ${SECRETS_ENV_FILE}"
}

build_backend() {
  step "Backend build (storyteller-web)"
  if [ "${SKIP_RUST_BUILD}" = "true" ]; then
    log "Skipped (--skip-rust-build)."
    return
  fi
  cd "${root_dir}"
  # SQLX_OFFLINE only affects compile-time query verification (uses the
  # checked-in .sqlx/ cache instead of a live DB); it has no runtime effect.
  log "Building (first build takes several minutes)..."
  SQLX_OFFLINE=true cargo build -p storyteller-web --bin storyteller-web
  log "Built target/debug/storyteller-web."
}

setup_frontend() {
  step "Frontend install (frontend/)"
  if [ "${SKIP_FRONTEND}" = "true" ]; then
    log "Skipped (--skip-frontend)."
    return
  fi
  source "${root_dir}/script/common/frontend_preflight.sh"
  frontend_preflight "${root_dir}/frontend"
  pushd "${root_dir}/frontend" >/dev/null
  frontend_npm_install
  popd >/dev/null
  log "Frontend dependencies installed."
}

print_next_steps() {
  step "Done"
  cat <<EOF
The dev stack is bootstrapped. Next steps:

  1. Start the backend (binds ${DEV_BACKEND_URL}):
       ./script/bootstrap/run_backend_dev.sh

  2. In another terminal, create the demo login (idempotent):
       ./script/bootstrap/seed_demo_user.sh
     Credentials: ${DEMO_USERNAME} / ${DEMO_PASSWORD}

  3. Start the webapp (binds http://localhost:4201; in dev it talks to
     ${DEV_BACKEND_URL} automatically):
       cd frontend && npx nx dev artcraft-webapp

  Health checks at any time:
       ./script/bootstrap/dev_stack_doctor.sh
EOF
}

main "$@"
