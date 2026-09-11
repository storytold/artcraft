# This runs Artcraft Frontend in dev mode on Windows

Write-Host "Running Artcraft Frontend in Dev Mode..."
Write-Host ""
Write-Host "You'll need to launch the Rust dev server as a second script!"  -ForegroundColor red -BackgroundColor white
Write-Host ""

Push-Location -Path ".\frontend"

$env:VITE_ENVIRONMENT_TYPE="production"

try
{
    Write-Host "Installing latest dependencies..."
    Write-Host ""
    Write-Host "You may need to run ./clean_modules.sh or manually clean up occasionally!"  -ForegroundColor red -BackgroundColor white
    Write-Host ""

    npm install --verbose

    Write-Host "Running dev server..."
    Write-Host ""
    Write-Host "If this isn't running on port 5173, you may need to kill a zombie process!"  -ForegroundColor red -BackgroundColor white
    Write-Host ""

    npx nx dev artcraft
}
finally
{
    Pop-Location
}
