#!/bin/bash

set -euxo pipefail

#
# If you get errors like this: 
#
#   x Build failed in 342ms
#   error during build:
#   [commonjs--resolver] Failed to resolve entry for package "@storyteller/api". 
#   The package may have incorrect main/module/exports specified in its package.json.
#   ... 
#
# Run this script!
#

echo 'TEMPORARY HACK: Build internal dependencies of artcraft since nx is not finding them...'

# A 'clean' will remove nx
npm install

# TODO: Temp commented out
nx build "@storyteller/api"
nx build "@storyteller/ui-gallery-modal"
nx build "@storyteller/tauri-events"
nx build "@storyteller/ui-pricing-modal"
nx build "@storyteller/ui-loading"
nx build "@storyteller/ui-promptbox"
nx build "@storyteller/ui-model-selector"
nx build "@storyteller/ui-login-modal"
nx build "@storyteller/ui-badge"
nx build "@storyteller/ui-settings-modal"
nx build "@storyteller/ui-menu-icon-selector"
nx build "@storyteller/provider-billing-modal"
nx build "@storyteller/provider-setup-modal"
nx build "@storyteller/ui-button-dropdown"
nx build "@storyteller/ui-create-3d-modal"
nx build "@storyteller/ui-button-icon"
nx build "@storyteller/ui-upload-modal"

# CANNOT FIND
nx build "@sparkjsdev/spark"














