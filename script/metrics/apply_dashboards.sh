#!/bin/bash
# apply_dashboards.sh
#
# Idempotently applies every dashboard JSON under `_metrics/datadog/dashboards/`
# to our Datadog account.
#
# Behavior, per file:
#   - If the file already has a top-level `"id": "<dd-dashboard-id>"`, PUT
#     the dashboard to `/api/v1/dashboard/<id>` (in-place update).
#   - Otherwise, POST to `/api/v1/dashboard` (create) and write the assigned
#     id back into the local JSON so the next run becomes an update.
#
# Secrets:
#   secrets/datadog_key.txt           — DD-API-KEY        (required)
#   secrets/datadog_app_key.txt       — DD-APPLICATION-KEY (required;
#                                        dashboard endpoints reject API-key-only
#                                        calls with 403).
#
# Both files should contain just the key, optionally with trailing whitespace.
#
# Flags:
#   --dry-run            Print what would happen; don't call the API.
#   --site <host>        Datadog site host. Default: api.datadoghq.com.
#                        US3 = api.us3.datadoghq.com, EU = api.datadoghq.eu, etc.
#   --dir <path>         Override dashboards directory.
#                        Default: _metrics/datadog/dashboards
#
# Examples:
#   script/metrics/apply_dashboards.sh
#   script/metrics/apply_dashboards.sh --dry-run
#   script/metrics/apply_dashboards.sh --site api.datadoghq.eu

set -euo pipefail

# -------- defaults --------
DD_SITE="api.datadoghq.com"
DASH_DIR="_metrics/datadog/dashboards"
API_KEY_FILE="secrets/datadog_key.txt"
APP_KEY_FILE="secrets/datadog_app_key.txt"
DRY_RUN=0

# -------- args --------
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --site) DD_SITE="$2"; shift 2 ;;
    --dir) DASH_DIR="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,28p' "$0"; exit 0 ;;
    *)
      echo "unknown flag: $1" >&2; exit 2 ;;
  esac
done

BASE="https://${DD_SITE}"

# -------- preflight --------
command -v jq >/dev/null 2>&1 || { echo "jq is required" >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "curl is required" >&2; exit 1; }

if [ ! -s "$API_KEY_FILE" ]; then
  echo "missing or empty API key file: $API_KEY_FILE" >&2
  exit 1
fi
if [ ! -s "$APP_KEY_FILE" ]; then
  cat >&2 <<EOF
Missing or empty application key file: $APP_KEY_FILE

The dashboard API requires BOTH a Datadog API key AND an Application key.
Generate an Application key at:
  https://app.datadoghq.com/organization-settings/application-keys
and save it as $APP_KEY_FILE (just the key, one line).
EOF
  exit 1
fi

DD_API_KEY=$(tr -d '[:space:]' < "$API_KEY_FILE")
DD_APP_KEY=$(tr -d '[:space:]' < "$APP_KEY_FILE")

if [ ! -d "$DASH_DIR" ]; then
  echo "no such directory: $DASH_DIR" >&2
  exit 1
fi

shopt -s nullglob
files=("$DASH_DIR"/*.json)
if [ ${#files[@]} -eq 0 ]; then
  echo "no dashboard JSON files in $DASH_DIR" >&2
  exit 0
fi

# -------- per-file apply --------
exit_code=0

for file in "${files[@]}"; do
  echo
  echo "==> $file"

  # Validate JSON before sending it anywhere.
  if ! jq empty "$file" 2>/dev/null; then
    echo "   invalid JSON, skipping" >&2
    exit_code=1
    continue
  fi

  existing_id=$(jq -r '.id // empty' "$file")

  if [ -n "$existing_id" ]; then
    method="PUT"
    url="${BASE}/api/v1/dashboard/${existing_id}"
    echo "   updating existing dashboard id=${existing_id}"
  else
    method="POST"
    url="${BASE}/api/v1/dashboard"
    echo "   creating new dashboard"
  fi

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "   [dry-run] would ${method} ${url}"
    continue
  fi

  http_status_file=$(mktemp)
  response_file=$(mktemp)
  # Drop the local-only `id` field before sending — Datadog returns it on
  # POST and accepts it (or ignores it) on PUT, but keeping it out of the
  # request body avoids any chance of confusing the API.
  payload=$(jq 'del(.id)' "$file")

  curl_status=$(curl -sS -o "$response_file" -w "%{http_code}" \
    -X "$method" "$url" \
    -H "Content-Type: application/json" \
    -H "DD-API-KEY: ${DD_API_KEY}" \
    -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
    --data-binary "$payload" || echo "000")
  echo "$curl_status" > "$http_status_file"

  if [ "$curl_status" -lt 200 ] || [ "$curl_status" -ge 300 ]; then
    echo "   ✗ HTTP $curl_status"
    sed 's/^/      /' "$response_file" >&2
    exit_code=1
  else
    if [ "$method" = "POST" ]; then
      new_id=$(jq -r '.id // empty' "$response_file")
      if [ -n "$new_id" ]; then
        tmp=$(mktemp)
        jq --arg id "$new_id" '. + {id: $id}' "$file" > "$tmp" && mv "$tmp" "$file"
        echo "   ✓ created (id=${new_id}), id written back to $file"
      else
        echo "   ✓ created but response had no id (??); body:"
        sed 's/^/      /' "$response_file"
        exit_code=1
      fi
    else
      echo "   ✓ updated"
    fi
  fi

  rm -f "$http_status_file" "$response_file"
done

echo
if [ "$exit_code" -eq 0 ]; then
  echo "All dashboards applied."
else
  echo "Finished with errors. See output above."
fi
exit "$exit_code"
