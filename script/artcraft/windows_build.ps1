# Build Production Artcraft

Write-Host "Building production Artcraft..."
Write-Host ""

Get-Command node, npm, cargo -ErrorAction Stop | Out-Null

try
{
    Push-Location -Path ".\frontend"

    Write-Host "Installing latest dependencies..."
    Write-Host ""
    Write-Host "You may need to run ./clean_modules.sh or manually clean up occasionally!"  -ForegroundColor red -BackgroundColor white
    Write-Host ""

    npm install --verbose
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend dependency install failed"
    }
}
finally
{
    Pop-Location
}

$env:VITE_ENVIRONMENT_TYPE="production"
$env:SQLX_OFFLINE="true"

# This tells Tauri *which* frontend and *which* Rust app to use since we're in a monorepo with several apps.
$env:TAURI_FRONTEND_PATH=".\frontend"
$env:TAURI_APP_PATH=".\crates\desktop\artcraft"

node ".\frontend\scripts\check-runtime-bindings.mjs"
if ($LASTEXITCODE -ne 0) {
    throw "ArtCraft frontend has unresolved runtime identifiers"
}

# The config file tells Tauri more instructions for the frontend build.
# Force a fresh artcraft codegen so the embedded frontend cannot be stale.
cargo clean --release -p artcraft
if ($LASTEXITCODE -ne 0) {
    throw "cargo clean failed"
}
cargo tauri build --config ".\crates\desktop\artcraft\tauri.conf.json"
if ($LASTEXITCODE -ne 0) {
    throw "ArtCraft Tauri build failed"
}

node ".\script\artcraft\verify_embedded_frontend.mjs"
if ($LASTEXITCODE -ne 0) {
    throw "ArtCraft release EXE does not contain the current frontend"
}

Write-Host ""
Write-Host "Production Build Done!"  -ForegroundColor green -BackgroundColor white
Write-Host ""
Write-Host "You can find the installer in: target\release\bundle\nsis\ArtCraft_(version_info)-setup.exe"

Start-Process "explorer.exe" -ArgumentList ".\target\release\bundle\nsis"
