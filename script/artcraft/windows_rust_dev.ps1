# This runs Artcraft Rust in dev mode on Windows

Write-Host "Running Artcraft Rust in Dev Mode..."
Write-Host ""
Write-Host "You'll need to launch the frontend dev server as a second script!"  -ForegroundColor red -BackgroundColor white
Write-Host ""

# This tells Tauri *which* frontend and *which* Rust app to use since we're in a monorepo with several apps.
$env:TAURI_FRONTEND_PATH=".\frontend"
$env:TAURI_APP_PATH=".\crates\desktop\artcraft"

# Put SQLx into offline mode (no DB hits / migrations).
$env:SQLX_OFFLINE = "true"

# The config file tells Tauri more instructions for the frontend build.
cargo tauri dev --config ".\crates\desktop\artcraft\tauri-dev-hot-reload.conf.json"
