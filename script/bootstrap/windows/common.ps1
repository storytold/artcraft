# Shared helpers for the Windows dev-stack bootstrap scripts.
#
# Dot-source from a sibling script:
#   . (Join-Path $PSScriptRoot "common.ps1")
#
# Design: the stack is PORTABLE - MySQL and Redis live under the gitignored
# .devstack/ directory and run as plain user processes. No admin rights, no
# Windows services, no system-wide installs (build tools excepted).
# See _docs/dev_setup_local_stack.md.

$ErrorActionPreference = "Stop"

$script:RootDir = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..")).Path

# Canonical local-dev database identity - must match _docs/dev_setup_server.md,
# the repo-root .env DATABASE_URL, and the server's MYSQL_URL default.
$script:DevMySqlDb       = if ($env:DEV_MYSQL_DB)       { $env:DEV_MYSQL_DB }       else { "storyteller" }
$script:DevMySqlUser     = if ($env:DEV_MYSQL_USER)     { $env:DEV_MYSQL_USER }     else { "storyteller" }
$script:DevMySqlPassword = if ($env:DEV_MYSQL_PASSWORD) { $env:DEV_MYSQL_PASSWORD } else { "password" }

$script:DevBackendUrl = if ($env:DEV_BACKEND_URL) { $env:DEV_BACKEND_URL } else { "http://localhost:12345" }

# Default demo account (see seed_demo_user.ps1). "demo"/"admin"/"test"/"dev"
# are on the backend's reserved-usernames list - don't use those.
$script:DemoUsername = if ($env:DEMO_USERNAME) { $env:DEMO_USERNAME } else { "localdev1" }
$script:DemoPassword = if ($env:DEMO_PASSWORD) { $env:DEMO_PASSWORD } else { "localdev1pass" }
$script:DemoEmail    = if ($env:DEMO_EMAIL)    { $env:DEMO_EMAIL }    else { "localdev1@example.com" }

# Banked credits the demo user's artcraft wallet is seeded/topped-up to.
# Generation submits are gated on wallet balance, so 0 credits means the
# generate button silently refuses in the webapp.
$script:DemoCredits = if ($env:DEMO_CREDITS) { [uint32]$env:DEMO_CREDITS } else { 100000 }

# --- Portable service pins -------------------------------------------------
# MySQL 8.4 LTS (the 8.x series is required; 9.x is unsupported by tooling).
# cdn.mysql.com hosts only some patch versions; 8.4.11 verified available.
$script:MySqlVersion = "8.4.11"
$script:MySqlZipUrl  = "https://cdn.mysql.com/Downloads/MySQL-8.4/mysql-$MySqlVersion-winx64.zip"

# Redis for Windows (tporadowski build). Old (5.0) but stable and sufficient
# for the backend's usage (keepalive/TTL/rate-limiter commands). Swap to
# Memurai or Microsoft Garnet by pointing REDIS_ZIP_URL elsewhere.
$script:RedisZipUrl = if ($env:REDIS_ZIP_URL) { $env:REDIS_ZIP_URL } else {
  "https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip"
}

$script:DevStackDir   = Join-Path $RootDir ".devstack"
$script:DownloadsDir  = Join-Path $DevStackDir "downloads"
$script:MySqlBaseDir  = Join-Path $DevStackDir "mysql\mysql-$MySqlVersion-winx64"
$script:MySqlDataDir  = Join-Path $DevStackDir "mysql-data"
$script:MySqlIniPath  = Join-Path $DevStackDir "my.ini"
$script:RedisDir      = Join-Path $DevStackDir "redis"
$script:LogsDir       = Join-Path $DevStackDir "logs"
$script:PidsDir       = Join-Path $DevStackDir "pids"

$script:SecretsEnvFile = Join-Path $RootDir "crates\service\web\storyteller_web\config\storyteller-web.development-secrets.env"

function Write-Log([string]$Message)  { Write-Host "[bootstrap] $Message" }
function Write-Warn2([string]$Message) { Write-Host "[bootstrap] WARNING: $Message" -ForegroundColor Yellow }
function Die([string]$Message) { Write-Host "[bootstrap] ERROR: $Message" -ForegroundColor Red; exit 1 }
function Step([string]$Title) { Write-Host ""; Write-Host "=== $Title ===" -ForegroundColor Cyan }

function Confirm-Or-Skip([string]$Prompt) {
  if ($script:AssumeYes) { return $true }
  $reply = Read-Host "$Prompt [y/N]"
  return ($reply -match '^[Yy]')
}

function Test-TcpPort([int]$Port) {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    if (-not $async.AsyncWaitHandle.WaitOne(1500)) { return $false }
    $client.EndConnect($async)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

# Resolve a client/server exe: prefer the portable install, fall back to PATH.
function Get-MySqlTool([string]$Name) {
  $portable = Join-Path $MySqlBaseDir "bin\$Name.exe"
  if (Test-Path $portable) { return $portable }
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  return $null
}

function Get-RedisTool([string]$Name) {
  $portable = Join-Path $RedisDir "$Name.exe"
  if (Test-Path $portable) { return $portable }
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  return $null
}

# Generate a token in the backend's format: {prefix}{crockford-lower entropy}
# padded to the same TOTAL length the Rust generators use (tokens crate,
# impl_crockford_generator!). Alphabet excludes i/l/o/u like Crockford base32.
function New-DevToken([string]$Prefix, [int]$TotalLength) {
  $charset = "0123456789abcdefghjkmnpqrstvwxyz"
  $count = $TotalLength - $Prefix.Length
  $chars = 1..$count | ForEach-Object { $charset[(Get-Random -Maximum $charset.Length)] }
  return "$Prefix$(-join $chars)"
}

# Run SQL as the app user against the dev database. Returns output lines
# (stdout and stderr merged via Invoke-Native, so a caller capturing our
# streams can never turn a mysql warning into a terminating error).
# Password goes via MYSQL_PWD so it stays off the command line.
# -Quiet discards output (for probes that are expected to fail, e.g.
# Test-MySqlApp before provisioning). Check $LASTEXITCODE for success.
function Invoke-MySqlApp([string]$Sql, [string]$SourceFile, [switch]$Quiet) {
  $mysql = Get-MySqlTool "mysql"
  if (-not $mysql) { Die "mysql client not found (run bootstrap_dev_stack.ps1 first)." }
  $prev = $env:MYSQL_PWD
  $env:MYSQL_PWD = $DevMySqlPassword
  try {
    if ($SourceFile) {
      $forward = $SourceFile -replace '\\', '/'
      $out = Invoke-Native "`"$mysql`" -u $DevMySqlUser -h 127.0.0.1 -D $DevMySqlDb -e `"source $forward`""
    } else {
      $out = Invoke-Native "`"$mysql`" -u $DevMySqlUser -h 127.0.0.1 -D $DevMySqlDb -N -e `"$Sql`""
    }
    if (-not $Quiet) { return $out }
  } finally {
    $env:MYSQL_PWD = $prev
  }
}

# Run a query expected to return a single non-negative integer (e.g. COUNT(*)).
# Returns -1 if the query failed or produced no numeric line, so callers can
# distinguish "table is empty" (0) from "query failed" (-1).
function Get-MySqlCount([string]$Sql) {
  $out = @(Invoke-MySqlApp -Sql $Sql)
  if ($LASTEXITCODE -ne 0) { return -1 }
  $line = $out | Where-Object { "$_" -match '^\d+$' } | Select-Object -First 1
  if ($null -eq $line) { return -1 }
  return [int]"$line"
}

function Test-MySqlApp {
  try {
    Invoke-MySqlApp -Sql "SELECT 1" -Quiet
    return ($LASTEXITCODE -eq 0)
  } catch {
    return $false
  }
}

function Test-Redis {
  $cli = Get-RedisTool "redis-cli"
  if (-not $cli) { return $false }
  try {
    $pong = Invoke-Native "`"$cli`" -h 127.0.0.1 ping"
    return ("$pong" -match "PONG")
  } catch {
    return $false
  }
}

function Test-Backend {
  try {
    $r = Invoke-WebRequest -Uri "$DevBackendUrl/_status" -UseBasicParsing -TimeoutSec 3
    return ($r.StatusCode -eq 200)
  } catch {
    return $false
  }
}

# Start a detached background process, remembering its PID for stop_dev_services.
function Start-DevProcess([string]$Name, [string]$Exe, [string[]]$Arguments) {
  New-Item -ItemType Directory -Force $PidsDir | Out-Null
  New-Item -ItemType Directory -Force $LogsDir | Out-Null
  $out = Join-Path $LogsDir "$Name.out.log"
  $err = Join-Path $LogsDir "$Name.err.log"
  $proc = Start-Process -FilePath $Exe -ArgumentList $Arguments -WindowStyle Hidden `
      -RedirectStandardOutput $out -RedirectStandardError $err -PassThru
  Set-Content -Path (Join-Path $PidsDir "$Name.pid") -Value $proc.Id -Encoding ascii
  return $proc
}

function Wait-ForCondition([scriptblock]$Condition, [int]$TimeoutSeconds, [string]$What) {
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    if (& $Condition) { return $true }
    Start-Sleep -Seconds 1
  }
  Die "Timed out after ${TimeoutSeconds}s waiting for: $What"
}

# Run a native command line via cmd so its stderr is merged OUTSIDE PowerShell.
# PS 5.1 wraps captured native stderr lines in ErrorRecords; combined with our
# $ErrorActionPreference = "Stop", a harmless warning (e.g. from cargo) would
# otherwise abort the script whenever a caller captures/redirects our output.
# Quote embedded paths: Invoke-Native "`"$exe`" --flag value"
function Invoke-Native([string]$CommandLine) {
  cmd /s /c "$CommandLine 2>&1"
}

# Make freshly-installed tools visible in this session without a new shell.
function Add-SessionPath([string[]]$Dirs) {
  foreach ($d in $Dirs) {
    if ((Test-Path $d) -and (($env:Path -split ';') -notcontains $d)) {
      $env:Path = "$d;$env:Path"
    }
  }
}

# The portable MySQL's client DLL + import lib, needed to build AND run
# diesel-cli with the mysql feature.
function Add-MySqlClientToSession {
  Add-SessionPath @((Join-Path $MySqlBaseDir "bin"), (Join-Path $MySqlBaseDir "lib"))
}

# Native build tools (cmake/perl/nasm/llvm) land in these dirs when installed
# via winget; a shell opened before the install won't have them on PATH yet.
# bindgen (used by boring2 / aws-lc-sys) additionally wants LIBCLANG_PATH.
function Add-BuildToolsToSession {
  Add-SessionPath @(
    "$env:ProgramFiles\CMake\bin",
    "C:\Strawberry\perl\bin",
    "$env:ProgramFiles\NASM",
    "$env:LOCALAPPDATA\bin\NASM",
    "$env:ProgramFiles\LLVM\bin"
  )
  if (-not $env:LIBCLANG_PATH) {
    $clang = Get-Command clang -ErrorAction SilentlyContinue
    if ($clang) { $env:LIBCLANG_PATH = Split-Path $clang.Source }
  }
}
