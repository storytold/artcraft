#!/bin/bash
# apply_monitors.sh
#
# Idempotently applies every monitor JSON under `_metrics/datadog/monitors/`
# to our Datadog account. Sibling to `apply_dashboards.sh`.
#
# Behavior, per file:
#   - If the file already has a top-level `"id": <numeric>`, PUT the
#     monitor to `/api/v1/monitor/<id>` (in-place update).
#   - Otherwise, POST to `/api/v1/monitor` (create) and write the assigned
#     id back into the local JSON so the next run becomes an update.
#
# Note: Datadog dashboard ids are strings (`thp-c27-vnv`); monitor ids are
# integers. The script handles both — `jq` writes the value the API
# returns, whatever its type.
#
# Secrets:
#   secrets/datadog_key.txt           — DD-API-KEY        (required)
#   secrets/datadog_app_key.txt       — DD-APPLICATION-KEY (required)
#
# Flags:
#   --dry-run            Print what would happen; don't call the API.
#   --site <host>        Datadog site host. Default: api.datadoghq.com.
#   --dir <path>         Override monitors directory.
#                        Default: _metrics/datadog/monitors

set -euo pipefail

# -------- defaults --------
DD_SITE="api.datadoghq.com"
MON_DIR="_metrics/datadog/monitors"
API_KEY_FILE="secrets/datadog_key.txt"
APP_KEY_FILE="secrets/datadog_app_key.txt"
DRY_RUN=0

# -------- args --------
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --site) DD_SITE="$2"; shift 2 ;;
    --dir)  MON_DIR="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,24p' "$0"; exit 0 ;;
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

The monitor API requires BOTH a Datadog API key AND an Application key.
Generate an Application key at:
  https://app.datadoghq.com/organization-settings/application-keys
and save it as $APP_KEY_FILE (just the key, one line).
EOF
  exit 1
fi

DD_API_KEY=$(tr -d '[:space:]' < "$API_KEY_FILE")
DD_APP_KEY=$(tr -d '[:space:]' < "$APP_KEY_FILE")

if [ ! -d "$MON_DIR" ]; then
  echo "no such directory: $MON_DIR" >&2
  exit 1
fi

shopt -s nullglob
files=("$MON_DIR"/*.json)
if [ ${#files[@]} -eq 0 ]; then
  echo "no monitor JSON files in $MON_DIR" >&2
  exit 0
fi

exit_code=0

for file in "${files[@]}"; do
  echo
  echo "==> $file"

  if ! jq empty "$file" 2>/dev/null; then
    echo "   invalid JSON, skipping" >&2
    exit_code=1
    continue
  fi

  existing_id=$(jq -r '.id // empty' "$file")

  if [ -n "$existing_id" ]; then
    method="PUT"
    url="${BASE}/api/v1/monitor/${existing_id}"
    echo "   updating existing monitor id=${existing_id}"
  else
    method="POST"
    url="${BASE}/api/v1/monitor"
    echo "   creating new monitor"
  fi

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "   [dry-run] would ${method} ${url}"
    continue
  fi

  response_file=$(mktemp)
  payload=$(jq 'del(.id)' "$file")

  curl_status=$(curl -sS -o "$response_file" -w "%{http_code}" \
    -X "$method" "$url" \
    -H "Content-Type: application/json" \
    -H "DD-API-KEY: ${DD_API_KEY}" \
    -H "DD-APPLICATION-KEY: ${DD_APP_KEY}" \
    --data-binary "$payload" || echo "000")

  if [ "$curl_status" -lt 200 ] || [ "$curl_status" -ge 300 ]; then
    echo "   ✗ HTTP $curl_status"
    sed 's/^/      /' "$response_file" >&2
    exit_code=1
  else
    if [ "$method" = "POST" ]; then
      # Monitor ids are integers; preserve type when writing back.
      new_id=$(jq -r '.id // empty' "$response_file")
      if [ -n "$new_id" ]; then
        tmp=$(mktemp)
        jq --argjson id "$new_id" '. + {id: $id}' "$file" > "$tmp" && mv "$tmp" "$file"
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

  rm -f "$response_file"
done

echo
if [ "$exit_code" -eq 0 ]; then
  echo "All monitors applied."
else
  echo "Finished with errors. See output above."
fi
exit "$exit_code"
