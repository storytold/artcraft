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
  error_code="$(echo "${create_response}" | jq -r '.error_type // .error_code // .error_code_str // empty')"
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

# --- Credits wallet ---------------------------------------------------------
# Generation submits deduct from the user's artcraft wallet and the webapp
# gates the generate button on the balance, so a user without credits cannot
# exercise any generation flow. Signup does not create a wallet; seed one.
# Raw SQL (not an endpoint): the only credit-granting paths are Stripe
# webhooks and moderator tooling, neither of which works locally.
log "Seeding credits wallet (${DEMO_CREDITS} banked credits)..."

user_token="$(mysql_app -N -e "SELECT token FROM users WHERE username = '${DEMO_USERNAME}' LIMIT 1")"
[ -n "${user_token}" ] || die "Could not find users row for '${DEMO_USERNAME}'."

wallet_row="$(mysql_app -N -e "SELECT token, banked_credits FROM wallets WHERE wallet_namespace = 'artcraft' AND owner_user_token = '${user_token}' LIMIT 1")"

if [ -z "${wallet_row}" ]; then
  wallet_token="$(new_dev_token "wallet_" 32)"
  create_ledger_token="$(new_dev_token "wle_" 32)"
  credit_ledger_token="$(new_dev_token "wle_" 32)"
  mysql_app -e "
    INSERT INTO wallets SET token='${wallet_token}', wallet_namespace='artcraft', owner_user_token='${user_token}', banked_credits=${DEMO_CREDITS}, monthly_credits=0;
    INSERT INTO wallet_ledger_entries SET token='${create_ledger_token}', wallet_token='${wallet_token}', entry_type='create', credits_delta=0, banked_credits_before=0, banked_credits_after=0, monthly_credits_before=0, monthly_credits_after=0;
    INSERT INTO wallet_ledger_entries SET token='${credit_ledger_token}', wallet_token='${wallet_token}', entry_type='credit_banked', maybe_entity_ref='dev_bootstrap_seed', credits_delta=${DEMO_CREDITS}, banked_credits_before=0, banked_credits_after=${DEMO_CREDITS}, monthly_credits_before=0, monthly_credits_after=0;
  " || die "Failed to insert the demo wallet."
  log "Wallet created with ${DEMO_CREDITS} banked credits."
else
  wallet_token="$(echo "${wallet_row}" | cut -f1)"
  balance="$(echo "${wallet_row}" | cut -f2)"
  if [ "${balance}" -lt "${DEMO_CREDITS}" ]; then
    credit_ledger_token="$(new_dev_token "wle_" 32)"
    delta=$((DEMO_CREDITS - balance))
    mysql_app -e "
      UPDATE wallets SET banked_credits=${DEMO_CREDITS}, version=version+1 WHERE token='${wallet_token}' LIMIT 1;
      INSERT INTO wallet_ledger_entries SET token='${credit_ledger_token}', wallet_token='${wallet_token}', entry_type='credit_banked', maybe_entity_ref='dev_bootstrap_topup', credits_delta=${delta}, banked_credits_before=${balance}, banked_credits_after=${DEMO_CREDITS}, monthly_credits_before=0, monthly_credits_after=0;
    " || die "Failed to top up the demo wallet."
    log "Wallet topped up: ${balance} -> ${DEMO_CREDITS} banked credits."
  else
    log "Wallet already has ${balance} banked credits — leaving as-is."
  fi
fi

# NB: no gallery media is seeded. A media_files row is only useful if the bytes
# behind it are reachable, and serving those locally needs real R2 credentials
# in the secrets env — rows on their own render as broken tiles. For a populated
# library with no backend at all, run frontend/apps/fake-storyteller-web.

log "Demo user is ready."
log "  Username: ${DEMO_USERNAME}"
log "  Password: ${DEMO_PASSWORD}"
log "Log in at the webapp /login page, or via curl:"
log "  curl -c /tmp/cookies.txt -X POST ${DEV_BACKEND_URL}/v1/login -H 'Content-Type: application/json' -d '{\"username_or_email\":\"${DEMO_USERNAME}\",\"password\":\"${DEMO_PASSWORD}\"}'"
