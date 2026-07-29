#!/usr/bin/env bash
# Diagnose the local dev stack: checks every prerequisite the bootstrap sets up
# and reports PASS / WARN / FAIL per item.
#
# FAIL = the stack cannot work until fixed (exit code 1).
# WARN = optional or run-time-only (e.g. backend not currently running).
set -uo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${root_dir}/script/bootstrap/common.sh"

SECRETS_ENV_FILE="${root_dir}/crates/service/web/storyteller_web/config/storyteller-web.development-secrets.env"

failures=0
warnings=0

pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; failures=$((failures + 1)); }
warn_check() { printf '  WARN  %s\n' "$1"; warnings=$((warnings + 1)); }

echo "Dev stack doctor (${root_dir})"
echo ""
echo "--- Toolchains ---"

ensure_cargo_on_path
if command -v cargo >/dev/null 2>&1; then
  pass "rust: $(rustc --version 2>/dev/null | head -1)"
else
  fail "rust: cargo not on PATH (bootstrap installs via rustup)"
fi

if command -v diesel >/dev/null 2>&1; then
  pass "diesel_cli: $(diesel --version 2>/dev/null | head -1)"
else
  fail "diesel_cli: not installed (cargo install diesel_cli --no-default-features --features mysql,sqlite)"
fi

if command -v node >/dev/null 2>&1; then
  node_major="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
  if [ "${node_major}" -ge 20 ]; then
    pass "node: $(node --version) (>= 20 required by Nx 21 / Vite 6)"
  else
    fail "node: $(node --version) is too old — Node 20+ required"
  fi
else
  fail "node: not installed (Node 20+ required for the frontend)"
fi

echo ""
echo "--- Services ---"

if mysql_app_reachable; then
  pass "mysql: reachable as '${DEV_MYSQL_USER}' on database '${DEV_MYSQL_DB}'"

  migration_dirs="$(find "${root_dir}/_database/sql/migrations" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
  applied="$(mysql_app -N -e "SELECT COUNT(*) FROM __diesel_schema_migrations" 2>/dev/null || echo 0)"
  if [ "${applied}" -ge "${migration_dirs}" ] && [ "${applied}" -gt 0 ]; then
    pass "migrations: ${applied} applied (${migration_dirs} in _database/sql/migrations)"
  elif [ "${applied}" -gt 0 ]; then
    fail "migrations: only ${applied}/${migration_dirs} applied — run 'diesel migration run'"
  else
    fail "migrations: none applied — run 'diesel migration run'"
  fi

  role_count="$(mysql_app -N -e "SELECT COUNT(*) FROM user_roles" 2>/dev/null || echo 0)"
  if [ "${role_count}" -ge 3 ]; then
    pass "seed: user_roles has ${role_count} rows (user/mod/admin present)"
  else
    fail "seed: user_roles has ${role_count} rows — account creation needs the 'user' role (re-run bootstrap)"
  fi

  badge_count="$(mysql_app -N -e "SELECT COUNT(*) FROM badges" 2>/dev/null || echo 0)"
  if [ "${badge_count}" -gt 0 ]; then
    pass "seed: badges has ${badge_count} rows"
  else
    warn_check "seed: badges table is empty (cosmetic; re-run bootstrap to fill)"
  fi

  demo_count="$(mysql_app -N -e "SELECT COUNT(*) FROM users WHERE username='${DEMO_USERNAME}'" 2>/dev/null || echo 0)"
  if [ "${demo_count}" -gt 0 ]; then
    pass "demo user: '${DEMO_USERNAME}' exists"
  else
    warn_check "demo user: '${DEMO_USERNAME}' not created yet (./script/bootstrap/seed_demo_user.sh, backend must be running)"
  fi
else
  fail "mysql: cannot connect as '${DEV_MYSQL_USER}'@'${DEV_MYSQL_HOST}' to '${DEV_MYSQL_DB}' (is MySQL running? run bootstrap)"
fi

if redis_reachable; then
  pass "redis: PONG"
else
  fail "redis: not reachable on localhost (the backend's r2d2 pool connects eagerly at boot)"
fi

echo ""
echo "--- Backend ---"

if [ -f "${SECRETS_ENV_FILE}" ]; then
  pass "secrets env: ${SECRETS_ENV_FILE#"${root_dir}"/} exists"
else
  fail "secrets env: missing — the server aborts at boot on ~19 required vars (re-run bootstrap)"
fi

if [ -x "${root_dir}/target/debug/storyteller-web" ] || [ -x "${root_dir}/target/release/storyteller-web" ]; then
  pass "binary: storyteller-web is built"
else
  warn_check "binary: storyteller-web not built yet (bootstrap builds it; cargo run will build on demand)"
fi

if backend_reachable; then
  pass "server: ${DEV_BACKEND_URL}/_status responds"
else
  warn_check "server: not running (./script/bootstrap/run_backend_dev.sh)"
fi

echo ""
echo "--- Frontend ---"

if [ -d "${root_dir}/frontend/node_modules" ]; then
  pass "frontend: node_modules present"
else
  warn_check "frontend: node_modules missing (cd frontend && npm install)"
fi

if [ -e "${root_dir}/frontend/pnpm-lock.yaml" ] || [ -d "${root_dir}/frontend/node_modules/.pnpm" ]; then
  fail "frontend: stale pnpm artifacts detected (see frontend/README.md — the workspace uses npm)"
else
  pass "frontend: no stale pnpm artifacts"
fi

echo ""
echo "Summary: ${failures} failure(s), ${warnings} warning(s)."
if [ "${failures}" -gt 0 ]; then
  echo "Fix failures with: ./script/bootstrap/bootstrap_dev_stack.sh (safe to re-run)"
  exit 1
fi
