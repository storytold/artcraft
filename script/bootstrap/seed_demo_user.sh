#!/usr/bin/env bash
# Create (or verify) the local demo user via the running backend, then verify
# that login works. Idempotent: an already-existing user is a success.
#
# Requires the backend to be up (./script/bootstrap/run_backend_dev.sh) — this
# script waits up to --wait-seconds (default 60) for it.
#
# The account is created through POST /v1/create_account rather than raw SQL so
# it exercises the real signup path (bcrypt hash, session, firehose row) and
# stays correct if the users schema evolves.
#
# Override the credentials via DEMO_USERNAME / DEMO_PASSWORD / DEMO_EMAIL.
# Username rules: 3-16 chars of [A-Za-z0-9_-], not on the reserved list
# (includes/binary_includes/usernames/reserved_usernames.txt); password >= 6 chars.
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "${root_dir}/script/bootstrap/common.sh"

WAIT_SECONDS=60
for arg in "$@"; do
  case "${arg}" in
    --wait-seconds=*) WAIT_SECONDS="${arg#*=}" ;;
    --help|-h) sed -n '2,15p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "Unknown option: ${arg} (try --help)" ;;
  esac
done

command -v jq >/dev/null 2>&1 || die "jq is required (apt-get install jq)."

log "Waiting for backend at ${DEV_BACKEND_URL} (up to ${WAIT_SECONDS}s)..."
deadline=$((SECONDS + WAIT_SECONDS))
until backend_reachable; do
  if [ "${SECONDS}" -ge "${deadline}" ]; then
    die "Backend not reachable at ${DEV_BACKEND_URL}/_status. Start it with ./script/bootstrap/run_backend_dev.sh"
  fi
  sleep 2
done
log "Backend is up."

log "Creating account '${DEMO_USERNAME}'..."
create_response="$(curl -sS -X POST "${DEV_BACKEND_URL}/v1/create_account" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
        --arg u "${DEMO_USERNAME}" \
        --arg p "${DEMO_PASSWORD}" \
        --arg e "${DEMO_EMAIL}" \
        '{username: $u, password: $p, password_confirmation: $p, email_address: $e}')")"

if [ "$(echo "${create_response}" | jq -r '.success // false')" = "true" ]; then
  log "Account created."
else
  error_code="$(echo "${create_response}" | jq -r '.error_code // .error_code_str // empty')"
  case "${error_code}" in
    *[Uu]sername[Tt]aken*|*[Ee]mail[Tt]aken*)
      log "Account already exists (${error_code}) — continuing."
      ;;
    *)
      die "Account creation failed: ${create_response}"
      ;;
  esac
fi

log "Verifying login..."
login_response="$(curl -sS -X POST "${DEV_BACKEND_URL}/v1/login" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
        --arg u "${DEMO_USERNAME}" \
        --arg p "${DEMO_PASSWORD}" \
        '{username_or_email: $u, password: $p}')")"

if [ "$(echo "${login_response}" | jq -r '.success // false')" != "true" ]; then
  die "Login verification failed: ${login_response}"
fi
if [ -z "$(echo "${login_response}" | jq -r '.signed_session // empty')" ]; then
  die "Login succeeded but returned no signed_session: ${login_response}"
fi

log "Demo user is ready."
log "  Username: ${DEMO_USERNAME}"
log "  Password: ${DEMO_PASSWORD}"
log "Log in at the webapp /login page, or via curl:"
log "  curl -c /tmp/cookies.txt -X POST ${DEV_BACKEND_URL}/v1/login -H 'Content-Type: application/json' -d '{\"username_or_email\":\"${DEMO_USERNAME}\",\"password\":\"${DEMO_PASSWORD}\"}'"
