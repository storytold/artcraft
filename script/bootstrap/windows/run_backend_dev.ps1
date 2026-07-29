# Run the storyteller-web backend for local development (binds 0.0.0.0:12345).
#
# Requires a bootstrapped environment (bootstrap_dev_stack.ps1). Starts the
# portable MySQL/Redis if they aren't running. Always runs from the repo root:
# the server's config search path (crates/service/web/storyteller_web/config)
# and its includes/ defaults are cwd-relative.
param()

. (Join-Path $PSScriptRoot "common.ps1")
. (Join-Path $PSScriptRoot "start_dev_services.ps1")

Start-DevMySql
Start-DevRedis

if (-not (Test-MySqlApp)) { Die "MySQL is up but '$DevMySqlUser' cannot reach '$DevMySqlDb'. Run bootstrap_dev_stack.ps1." }
if (-not (Test-Path $SecretsEnvFile)) { Die "Missing $SecretsEnvFile. Run bootstrap_dev_stack.ps1." }

Add-SessionPath @((Join-Path $env:USERPROFILE ".cargo\bin"))
Push-Location $RootDir
try {
  # SERVER_ENVIRONMENT defaults to Development when unset; dev config files are
  # picked up from the search path automatically. SQLX_OFFLINE only affects
  # compile-time query checking, never runtime. TEMP_DIR belt-and-suspenders in
  # case an older generated secrets file predates the Windows TEMP_DIR line.
  $env:SQLX_OFFLINE = "true"
  if (-not $env:TEMP_DIR) { $env:TEMP_DIR = $env:TEMP -replace '\\', '/' }
  Write-Log "Starting storyteller-web on $DevBackendUrl (Ctrl-C to stop)..."
  Invoke-Native "cargo run -p storyteller-web --bin storyteller-web"
} finally {
  Pop-Location
}
