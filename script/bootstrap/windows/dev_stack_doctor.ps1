# Diagnose the local dev stack on Windows: checks every prerequisite the
# bootstrap sets up and reports PASS / WARN / FAIL per item.
#
# FAIL = the stack cannot work until fixed (exit code 1).
# WARN = optional or run-time-only (e.g. backend not currently running).
param()

. (Join-Path $PSScriptRoot "common.ps1")
$ErrorActionPreference = "Continue"

$script:Failures = 0
$script:Warnings = 0

function Pass([string]$Message) { Write-Host "  PASS  $Message" }
function Fail([string]$Message) { Write-Host "  FAIL  $Message" -ForegroundColor Red; $script:Failures++ }
function WarnCheck([string]$Message) { Write-Host "  WARN  $Message" -ForegroundColor Yellow; $script:Warnings++ }

Write-Host "Dev stack doctor ($RootDir)"
Write-Host ""
Write-Host "--- Toolchains ---"

Add-SessionPath @((Join-Path $env:USERPROFILE ".cargo\bin"))
Add-MySqlClientToSession
# Freshly-installed build tools may not be on this session's PATH yet.
Add-SessionPath @("$env:ProgramFiles\CMake\bin", "C:\Strawberry\perl\bin", "$env:ProgramFiles\NASM", "$env:ProgramFiles\LLVM\bin")

if (Get-Command cargo -ErrorAction SilentlyContinue) {
  Pass "rust: $(rustc --version)"
} else {
  Fail "rust: cargo not on PATH (winget install Rustlang.Rustup)"
}

if (Get-Command diesel -ErrorAction SilentlyContinue) {
  try {
    $dv = diesel --version 2>$null
    if ($LASTEXITCODE -eq 0) { Pass "diesel_cli: $dv" }
    else { Fail "diesel_cli: present but broken (libmysql.dll missing from PATH? re-run bootstrap)" }
  } catch { Fail "diesel_cli: present but broken (libmysql.dll missing from PATH?)" }
} else {
  Fail "diesel_cli: not installed (bootstrap installs it against the portable MySQL client lib)"
}

if (Get-Command node -ErrorAction SilentlyContinue) {
  $nodeMajor = [int]((node --version) -replace '^v(\d+).*', '$1')
  if ($nodeMajor -ge 20) { Pass "node: $(node --version) (>= 20 required by Nx 21 / Vite 6)" }
  else { Fail "node: $(node --version) is too old - Node 20+ required" }
} else {
  Fail "node: not installed (Node 20+ required for the frontend)"
}

foreach ($tool in @("cmake", "perl", "nasm", "clang")) {
  if (Get-Command $tool -ErrorAction SilentlyContinue) {
    Pass "${tool}: found"
  } else {
    WarnCheck "${tool}: not on PATH (needed to COMPILE the backend; bootstrap offers winget installs)"
  }
}

Write-Host ""
Write-Host "--- Services (portable, under .devstack\) ---"

if (Test-Path (Join-Path $MySqlBaseDir "bin\mysqld.exe")) {
  Pass "mysql: portable install present ($MySqlVersion)"
} elseif (Test-TcpPort 3306) {
  WarnCheck "mysql: no portable install, but something serves port 3306 (external server assumed)"
} else {
  Fail "mysql: not installed (run bootstrap_dev_stack.ps1)"
}

if (Test-TcpPort 3306) {
  if (Test-MySqlApp) {
    Pass "mysql: reachable as '$DevMySqlUser' on database '$DevMySqlDb'"

    $migrationDirs = (Get-ChildItem -Directory (Join-Path $RootDir "_database\sql\migrations")).Count
    $applied = 0
    try { $applied = [int](Invoke-MySqlApp -Sql "SELECT COUNT(*) FROM __diesel_schema_migrations" | Select-Object -First 1) } catch {}
    if (($applied -ge $migrationDirs) -and ($applied -gt 0)) {
      Pass "migrations: $applied applied ($migrationDirs in _database\sql\migrations)"
    } elseif ($applied -gt 0) {
      Fail "migrations: only $applied/$migrationDirs applied - run 'diesel migration run'"
    } else {
      Fail "migrations: none applied - run 'diesel migration run' (or re-run bootstrap)"
    }

    $roleCount = 0
    try { $roleCount = [int](Invoke-MySqlApp -Sql "SELECT COUNT(*) FROM user_roles" | Select-Object -First 1) } catch {}
    if ($roleCount -ge 3) {
      Pass "seed: user_roles has $roleCount rows (user/mod/admin present)"
    } else {
      Fail "seed: user_roles has $roleCount rows - account creation needs the 'user' role (re-run bootstrap)"
    }

    $badgeCount = 0
    try { $badgeCount = [int](Invoke-MySqlApp -Sql "SELECT COUNT(*) FROM badges" | Select-Object -First 1) } catch {}
    if ($badgeCount -gt 0) { Pass "seed: badges has $badgeCount rows" }
    else { WarnCheck "seed: badges table is empty (cosmetic; re-run bootstrap to fill)" }

    $demoCount = 0
    try { $demoCount = [int](Invoke-MySqlApp -Sql "SELECT COUNT(*) FROM users WHERE username='$DemoUsername'" | Select-Object -First 1) } catch {}
    if ($demoCount -gt 0) { Pass "demo user: '$DemoUsername' exists" }
    else { WarnCheck "demo user: '$DemoUsername' not created yet (seed_demo_user.ps1, backend must be running)" }
  } else {
    Fail "mysql: port 3306 is up but '$DevMySqlUser' cannot access '$DevMySqlDb' (re-run bootstrap provisioning)"
  }
} else {
  Fail "mysql: nothing listening on 3306 (start_dev_services.ps1)"
}

if (Test-Redis) {
  Pass "redis: PONG"
} elseif (Test-TcpPort 6379) {
  WarnCheck "redis: port 6379 open but redis-cli not found to verify"
} else {
  Fail "redis: not reachable on 6379 (the backend's r2d2 pool connects eagerly at boot; start_dev_services.ps1)"
}

Write-Host ""
Write-Host "--- Backend ---"

if (Test-Path $SecretsEnvFile) {
  Pass "secrets env: storyteller-web.development-secrets.env exists"
} else {
  Fail "secrets env: missing - the server aborts at boot on ~19 required vars (re-run bootstrap)"
}

if ((Test-Path (Join-Path $RootDir "target\debug\storyteller-web.exe")) -or
    (Test-Path (Join-Path $RootDir "target\release\storyteller-web.exe"))) {
  Pass "binary: storyteller-web.exe is built"
} else {
  WarnCheck "binary: storyteller-web not built yet (bootstrap builds it; cargo run builds on demand)"
}

if (Test-Backend) {
  Pass "server: $DevBackendUrl/_status responds"
} else {
  WarnCheck "server: not running (run_backend_dev.ps1)"
}

Write-Host ""
Write-Host "--- Frontend ---"

if (Test-Path (Join-Path $RootDir "frontend\node_modules")) {
  Pass "frontend: node_modules present"
} else {
  WarnCheck "frontend: node_modules missing (cd frontend; npm install)"
}

if ((Test-Path (Join-Path $RootDir "frontend\pnpm-lock.yaml")) -or
    (Test-Path (Join-Path $RootDir "frontend\node_modules\.pnpm"))) {
  Fail "frontend: stale pnpm artifacts detected (see frontend/README.md - the workspace uses npm)"
} else {
  Pass "frontend: no stale pnpm artifacts"
}

Write-Host ""
Write-Host "Summary: $Failures failure(s), $Warnings warning(s)."
if ($Failures -gt 0) {
  Write-Host "Fix failures with: .\script\bootstrap\windows\bootstrap_dev_stack.ps1 (safe to re-run)"
  exit 1
}
