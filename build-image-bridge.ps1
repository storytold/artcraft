param([ValidateSet('test', 'build', 'check', 'clippy', 'fmt')][string]$Action = 'test')
$ErrorActionPreference = 'Stop'
$priorCargoHome = $env:CARGO_HOME
$priorCargoTarget = $env:CARGO_TARGET_DIR
$priorTmp = $env:TMP
$priorTemp = $env:TEMP
try {
  $env:CARGO_HOME = Join-Path $PSScriptRoot '.build\cargo-home'
  $env:CARGO_TARGET_DIR = Join-Path $PSScriptRoot '.build\bridge-target'
  $env:TMP = Join-Path $PSScriptRoot '.build\temp'
  $env:TEMP = $env:TMP
  New-Item -ItemType Directory -Force -Path $env:TMP | Out-Null
  Push-Location $PSScriptRoot
  try {
    & "$env:USERPROFILE\.cargo\bin\cargo.exe" $Action --manifest-path crates/cli/artcraft-image-bridge/Cargo.toml
    if ($LASTEXITCODE -ne 0) { throw "Bridge $Action failed" }
  } finally { Pop-Location }
} finally {
  $env:CARGO_HOME = $priorCargoHome
  $env:CARGO_TARGET_DIR = $priorCargoTarget
  $env:TMP = $priorTmp
  $env:TEMP = $priorTemp
}
