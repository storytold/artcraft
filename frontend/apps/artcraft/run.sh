#!/usr/bin/env bash

set -euxo pipefail

# Kill any process running on port 5741, which will block startup
if lsof -i tcp:5173 &>/dev/null; then
  lsof -i tcp:5173 -t | xargs kill -9
  echo "Killed process running on port 5173"
else
  echo "No process running on port 5173"
fi


# # Get the directory of this script
# SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# # Go up to the root of the repository (assumes src/app/pages is always 3 levels deep)
# REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# cd "${REPO_ROOT}"
# echo "${REPO_ROOT}"

# # Run the launch script
# ./script/desktop/launch_rust_only_3d_for_michael.sh