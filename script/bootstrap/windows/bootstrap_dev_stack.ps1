# Bootstrap the full local dev stack (backend + frontend) on native Windows.
#
# Everything service-shaped is PORTABLE and lives under the gitignored
# .devstack\ directory: MySQL 8.4 (official zip) and Redis run as plain user
# processes - no admin rights, no Windows services, no WSL, no Docker.
# Build tools (cmake, perl, nasm, llvm) are checked and offered via winget.
#
# Idempotent: safe to re-run at any time; each step detects work already done.
#
# Usage (from anywhere; paths are self-resolving):
#   .\script\bootstrap\windows\bootstrap_dev_stack.ps1 [options]
#
# Options:
#   -Yes            Non-interactive: assume "yes" for prompts (CI mode)
#   -SkipTools      Don't check/install build tools via winget
#   -SkipRustBuild  Don't build the storyteller-web binary
#   -SkipFrontend   Don't run the frontend npm install
#
# After it succeeds:
#   .\script\bootstrap\windows\run_backend_dev.ps1     # API on :12345
#   .\script\bootstrap\windows\seed_demo_user.ps1      # demo login
#   cd frontend; npx nx dev artcraft-webapp            # webapp on :4201
param(
  [switch]$Yes,
  [switch]$SkipTools,
  [switch]$SkipRustBuild,
  [switch]$SkipFrontend
)

. (Join-Path $PSScriptRoot "common.ps1")
. (Join-Path $PSScriptRoot "start_dev_services.ps1")

$script:AssumeYes = [bool]$Yes

# Tools needed to compile the Rust workspace on Windows (wreq's BoringSSL build
# needs cmake + nasm + perl + libclang; see the workspace Cargo.toml notes).
# Each entry: name, exe to probe, winget id, dirs the installer typically uses
# (appended to this session's PATH after install).
$BuildTools = @(
  @{ Name = "CMake";          Exe = "cmake"; WingetId = "Kitware.CMake";                 PathDirs = @("$env:ProgramFiles\CMake\bin") },
  @{ Name = "Strawberry Perl"; Exe = "perl";  WingetId = "StrawberryPerl.StrawberryPerl"; PathDirs = @("C:\Strawberry\perl\bin") },
  @{ Name = "NASM";           Exe = "nasm";  WingetId = "NASM.NASM";                     PathDirs = @("$env:ProgramFiles\NASM", "$env:LOCALAPPDATA\bin\NASM") },
  @{ Name = "LLVM (libclang)"; Exe = "clang"; WingetId = "LLVM.LLVM";                    PathDirs = @("$env:ProgramFiles\LLVM\bin") }
)

function Main {
  Step "Preflight"
  Ensure-CoreTools
  if (-not $SkipTools) { Ensure-BuildTools } else { Write-Log "Build-tool check skipped (-SkipTools)." }

  Step "Portable MySQL $MySqlVersion"
  Install-PortableMySql
  Start-DevMySql
  Provision-MySqlDatabase

  Step "Portable Redis"
  Install-PortableRedis
  Start-DevRedis

  Step "diesel_cli (migration runner)"
  Ensure-DieselCli

  Step "Database migrations (_database/sql/migrations)"
  Run-Migrations

  Step "Seed data (system roles + badges)"
  Seed-RolesAndBadges

  Step "Development secrets file"
  Write-SecretsEnvIfMissing

  Step "Backend build (storyteller-web)"
  Build-Backend

  Step "Frontend install (frontend/)"
  Setup-Frontend

  Print-NextSteps
}

function Ensure-CoreTools {
  if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    $cargoBin = Join-Path $env:USERPROFILE ".cargo\bin"
    Add-SessionPath @($cargoBin)
  }
  if (-not (Get-Command cargo -ErrorAction SilentlyContinue)) {
    Die "Rust is not installed. Install via winget (winget install Rustlang.Rustup) or https://rustup.rs, then re-run."
  }
  Write-Log "rust: $(rustc --version)"

  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Die "Node.js is not installed. Install Node 20+ (winget install OpenJS.NodeJS.LTS), then re-run."
  }
  $nodeMajor = [int]((node --version) -replace '^v(\d+).*', '$1')
  if ($nodeMajor -lt 20) {
    Die "Node.js 20+ is required (found $(node --version)) - Nx 21 / Vite 6 requirement."
  }
  Write-Log "node: $(node --version)"
}

function Ensure-BuildTools {
  # Tools installed by a previous run land in dirs this shell may not have on
  # PATH yet - map them in before probing, so we don't re-invoke winget.
  Add-BuildToolsToSession
  $missing = @($BuildTools | Where-Object { -not (Get-Command $_.Exe -ErrorAction SilentlyContinue) })
  if ($missing.Count -eq 0) {
    Write-Log "All native build tools present (cmake, perl, nasm, clang)."
    return
  }

  $names = ($missing | ForEach-Object { $_.Name }) -join ", "
  Write-Log "Missing build tools: $names"
  if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    Die "winget is unavailable; install the tools manually: $names"
  }
  if (-not (Confirm-Or-Skip "Install them via winget? (installers may raise a UAC prompt)")) {
    Die "Cannot build the backend without: $names (or re-run with -SkipTools if you manage them yourself)."
  }

  foreach ($tool in $missing) {
    Write-Log "winget install $($tool.WingetId)..."
    Invoke-Native "winget install --id $($tool.WingetId) -e --accept-source-agreements --accept-package-agreements --disable-interactivity"
    if ($LASTEXITCODE -ne 0) {
      Write-Warn2 "winget exited with $LASTEXITCODE for $($tool.Name); checking whether the tool landed anyway..."
    }
    Add-SessionPath $tool.PathDirs
    if (-not (Get-Command $tool.Exe -ErrorAction SilentlyContinue)) {
      Die "$($tool.Name) still not found after install. Open a new terminal (PATH refresh) and re-run, or install manually."
    }
    Write-Log "$($tool.Name) OK."
  }
}

function Install-PortableMySql {
  if (Test-Path (Join-Path $MySqlBaseDir "bin\mysqld.exe")) {
    Write-Log "Portable MySQL already extracted."
  } elseif ((Test-TcpPort 3306)) {
    # Something else already serves 3306 (e.g. a system-wide MySQL install).
    # Use it rather than fighting over the port; provisioning below needs root
    # credentials via MYSQL_ROOT_PASSWORD if that server has a root password.
    Write-Warn2 "Port 3306 is already in use by an existing MySQL server - using it instead of the portable install."
    if (-not (Get-Command mysql -ErrorAction SilentlyContinue)) {
      Die "A server owns port 3306 but no 'mysql' client is on PATH. Add the client or stop that server."
    }
    return
  } else {
    New-Item -ItemType Directory -Force $DownloadsDir | Out-Null
    $zipPath = Join-Path $DownloadsDir "mysql-$MySqlVersion-winx64.zip"
    if (-not (Test-Path $zipPath)) {
      Write-Log "Downloading MySQL $MySqlVersion (~250 MB, official cdn.mysql.com)..."
      Download-File $MySqlZipUrl $zipPath
    }
    Write-Log "Extracting..."
    Expand-Archive -Path $zipPath -DestinationPath (Join-Path $DevStackDir "mysql") -Force
    if (-not (Test-Path (Join-Path $MySqlBaseDir "bin\mysqld.exe"))) {
      Die "Extraction finished but $MySqlBaseDir\bin\mysqld.exe is missing."
    }
  }

  if (-not (Test-Path $MySqlIniPath)) {
    # Minimal config; utf8mb4 collation comes from each migration's DDL.
    # MySQL's ini parser escape-processes backslashes - use forward slashes,
    # and quote the values in case the clone path contains spaces.
    $baseForward = $MySqlBaseDir -replace '\\', '/'
    $dataForward = $MySqlDataDir -replace '\\', '/'
    $ini = @"
[mysqld]
basedir="$baseForward"
datadir="$dataForward"
port=3306
bind-address=127.0.0.1
"@
    New-Item -ItemType Directory -Force $DevStackDir | Out-Null
    Set-Content -Path $MySqlIniPath -Value $ini -Encoding ascii
  }

  if (-not (Test-Path (Join-Path $MySqlDataDir "mysql"))) {
    Write-Log "Initializing MySQL data directory (root without password, local dev only)..."
    $mysqld = Join-Path $MySqlBaseDir "bin\mysqld.exe"
    Invoke-Native "`"$mysqld`" --defaults-file=`"$MySqlIniPath`" --initialize-insecure --console"
    if ($LASTEXITCODE -ne 0) { Die "mysqld --initialize-insecure failed (exit $LASTEXITCODE). See output above." }
  }
}

function Provision-MySqlDatabase {
  if (Test-MySqlApp) {
    Write-Log "Database '$DevMySqlDb' and user '$DevMySqlUser' already provisioned."
    return
  }

  $mysql = Get-MySqlTool "mysql"
  if (-not $mysql) { Die "mysql client not found (portable install missing and none on PATH)." }
  # Portable install: root has no password. External server: honor MYSQL_ROOT_PASSWORD.
  $prev = $env:MYSQL_PWD
  if ($env:MYSQL_ROOT_PASSWORD) { $env:MYSQL_PWD = $env:MYSQL_ROOT_PASSWORD } else { $env:MYSQL_PWD = "" }
  try {
    # Same DDL as _docs/dev_setup_server.md, made idempotent. The extra
    # '127.0.0.1' account covers hosts where reverse-DNS of 127.0.0.1 doesn't
    # resolve to 'localhost'. Fed through a temp file + `source` so mysql's
    # stderr can never become a terminating PowerShell error mid-provision.
    $ddl = @"
CREATE DATABASE IF NOT EXISTS $DevMySqlDb;
CREATE USER IF NOT EXISTS '$DevMySqlUser'@'localhost' IDENTIFIED BY '$DevMySqlPassword';
CREATE USER IF NOT EXISTS '$DevMySqlUser'@'127.0.0.1' IDENTIFIED BY '$DevMySqlPassword';
GRANT ALL PRIVILEGES ON $DevMySqlDb.* TO '$DevMySqlUser'@'localhost';
GRANT ALL PRIVILEGES ON $DevMySqlDb.* TO '$DevMySqlUser'@'127.0.0.1';
FLUSH PRIVILEGES;
"@
    $ddlFile = Join-Path $env:TEMP "artcraft_provision_ddl.sql"
    Set-Content -Path $ddlFile -Value $ddl -Encoding ascii
    $ddlForward = $ddlFile -replace '\\', '/'
    $out = Invoke-Native "`"$mysql`" -u root -h 127.0.0.1 -e `"source $ddlForward`""
    Remove-Item $ddlFile -Force -Confirm:$false -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0) {
      if ($out) { Write-Host ($out -join "`n") }
      Die "Provisioning failed. For an external MySQL server, set MYSQL_ROOT_PASSWORD and re-run."
    }
  } finally {
    $env:MYSQL_PWD = $prev
  }

  if (-not (Test-MySqlApp)) { Die "Provisioning ran but '$DevMySqlUser' still cannot reach '$DevMySqlDb'." }
  Write-Log "Provisioned."
}

function Install-PortableRedis {
  if (Test-Path (Join-Path $RedisDir "redis-server.exe")) {
    Write-Log "Portable Redis already extracted."
    return
  }
  if (Test-TcpPort 6379) {
    Write-Warn2 "Port 6379 is already served (existing Redis/Memurai?) - using it."
    return
  }
  New-Item -ItemType Directory -Force $DownloadsDir | Out-Null
  $zipPath = Join-Path $DownloadsDir "redis-win-x64.zip"
  if (-not (Test-Path $zipPath)) {
    Write-Log "Downloading Redis for Windows (~12 MB)..."
    Download-File $RedisZipUrl $zipPath
  }
  Write-Log "Extracting..."
  Expand-Archive -Path $zipPath -DestinationPath $RedisDir -Force
  if (-not (Test-Path (Join-Path $RedisDir "redis-server.exe"))) {
    Die "Extraction finished but $RedisDir\redis-server.exe is missing."
  }
}

function Ensure-DieselCli {
  Add-MySqlClientToSession
  $needInstall = $true
  $forceFlag = ""
  if (Get-Command diesel -ErrorAction SilentlyContinue) {
    # A diesel.exe built against a client lib that has since moved fails at
    # load time - probe it rather than trusting its presence.
    $version = Invoke-Native "diesel --version"
    if ($LASTEXITCODE -eq 0) {
      Write-Log "Found $version."
      $needInstall = $false
    } else {
      Write-Warn2 "diesel is on PATH but broken (missing libmysql.dll?) - reinstalling."
      $forceFlag = " --force"
    }
  }
  if (-not $needInstall) { return }

  # diesel_cli's mysql feature links against libmysqlclient. The portable MySQL
  # ships its own client lib - point mysqlclient-sys at it instead of requiring
  # vcpkg. sqlite is bundled so no system sqlite is needed.
  if (-not (Test-Path (Join-Path $MySqlBaseDir "lib\libmysql.lib"))) {
    Die "MySQL client lib not found under $MySqlBaseDir\lib (needed to compile diesel_cli)."
  }
  Write-Log "Installing diesel_cli (compiles from source; a few minutes)..."
  $env:MYSQLCLIENT_LIB_DIR = Join-Path $MySqlBaseDir "lib"
  $env:MYSQLCLIENT_VERSION = $MySqlVersion
  Invoke-Native "cargo install diesel_cli --no-default-features --features mysql,sqlite-bundled$forceFlag"
  if ($LASTEXITCODE -ne 0) { Die "cargo install diesel_cli failed (exit $LASTEXITCODE)." }
  Write-Log "Installed $(Invoke-Native 'diesel --version')."
}

function Run-Migrations {
  # diesel-cli reads DATABASE_URL (also provided by the repo-root .env, which
  # diesel auto-loads from the cwd). diesel.exe needs libmysql.dll at runtime -
  # Add-MySqlClientToSession put the portable lib dirs on PATH.
  if (-not $env:DATABASE_URL) {
    $env:DATABASE_URL = "mysql://${DevMySqlUser}:${DevMySqlPassword}@localhost/${DevMySqlDb}"
  }
  Push-Location $RootDir
  try {
    # NB: "Encountered unknown type for Mysql: enum" warnings are harmless.
    Invoke-Native "diesel migration run"
    if ($LASTEXITCODE -ne 0) { Die "diesel migration run failed (exit $LASTEXITCODE)." }
  } finally {
    Pop-Location
  }
  Write-Log "Migrations up to date."
}

function Seed-RolesAndBadges {
  # Same data as _database/sql/seed/bootstrap_inserts_roles_etc.sh, but guarded
  # so re-runs don't hit duplicate-key errors. The 'user' role is mandatory:
  # account creation hardcodes user_role_slug='user'.
  $roleCount = Get-MySqlCount "SELECT COUNT(*) FROM user_roles"
  if ($roleCount -lt 0) { Die "Could not query user_roles - are migrations applied? (re-run bootstrap)" }
  if ($roleCount -gt 0) {
    Write-Log "user_roles already seeded ($roleCount rows)."
  } else {
    Invoke-MySqlApp -SourceFile (Join-Path $RootDir "_database\sql\seed\sql\system_roles.sql")
    if ($LASTEXITCODE -ne 0) { Die "Seeding system_roles.sql failed." }
    Write-Log "Inserted system roles (user, mod, admin)."
  }

  $badgeCount = Get-MySqlCount "SELECT COUNT(*) FROM badges"
  if ($badgeCount -lt 0) { Die "Could not query badges - are migrations applied? (re-run bootstrap)" }
  if ($badgeCount -gt 0) {
    Write-Log "badges already seeded ($badgeCount rows)."
  } else {
    Invoke-MySqlApp -SourceFile (Join-Path $RootDir "_database\sql\seed\sql\user_badges.sql")
    if ($LASTEXITCODE -ne 0) { Die "Seeding user_badges.sql failed." }
    Write-Log "Inserted badges."
  }
}

function Write-SecretsEnvIfMissing {
  if (Test-Path $SecretsEnvFile) {
    Write-Log "Already exists: $SecretsEnvFile (leaving it untouched)."
    return
  }

  # Every var below is read with get_env_string_required at server startup but
  # is NOT supplied by the checked-in config files. None is contacted at boot -
  # placeholders are enough to run the server.
  #
  # NOTE: config loading is FIRST-VALUE-WINS (dotenv never overrides a set
  # key), so values here cannot override storyteller-web.development.env.
  #
  # TEMP_DIR: the upload temp-dir helper defaults to /tmp, which doesn't exist
  # on Windows - point it at the user temp dir (forward slashes work fine).
  $tempDirForward = $env:TEMP -replace '\\', '/'
  $content = @"
# Local-development secrets for storyteller-web. Generated by
# script/bootstrap/windows/bootstrap_dev_stack.ps1 - gitignored; edit freely.
#
# Placeholders below satisfy required-at-boot checks without enabling any
# external integration. Replace individual values with real dev credentials
# only if you need that specific integration locally.

# Windows: scoped upload temp dirs (code default is /tmp)
TEMP_DIR=$tempDirForward

# R2/S3 object storage (clients are constructed offline)
ACCESS_KEY=dummy-local-dev
SECRET_KEY=dummy-local-dev
REGION_NAME=us-east-1
W2L_PRIVATE_DOWNLOAD_BUCKET_NAME=dummy-local-dev-private
W2L_PUBLIC_DOWNLOAD_BUCKET_NAME=dummy-local-dev-public

# Email (Resend)
RESEND_API_KEY=dummy-local-dev

# Generation providers. NB: the omni_gen endpoints (webapp image/video
# generation) contact providers SYNCHRONOUSLY in the request handler, so a real
# submit 500s until you put a real key in for the provider you are testing.
# The legacy polling providers are only contacted by worker binaries, which
# local dev does not run.
FAL_API_KEY=dummy-local-dev
GMICLOUD_API_KEY=dummy-local-dev
GROK_API_KEY=dummy-local-dev
BEEBLE_API_KEY=dummy-local-dev
OPENAI_API_KEY=dummy-local-dev
WORLDLABS_API_KEY=dummy-local-dev
SEEDANCE2PRO_COOKIES=dummy-local-dev
SEEDANCE2PRO_WHITELIST_COOKIES=dummy-local-dev
SEEDANCE2PRO_BYTEPLUS_ULTRA_COOKIES=dummy-local-dev

# Stripe account ids (test-mode secret keys are already checked into
# storyteller-web.development.env; only the account ids are missing there)
STRIPE_FAKEYOU_ACCOUNT_ID=acct_dummylocaldev
STRIPE_ARTCRAFT_ACCOUNT_ID=acct_dummylocaldev
STRIPE_ARTCRAFT_SECRET_KEY=sk_test_dummylocaldev
STRIPE_ARTCRAFT_SECRET_WEBHOOK_KEY=whsec_dummylocaldev
"@
  Set-Content -Path $SecretsEnvFile -Value $content -Encoding ascii
  Write-Log "Wrote $SecretsEnvFile"
}

function Build-Backend {
  if ($SkipRustBuild) {
    Write-Log "Skipped (-SkipRustBuild)."
    return
  }
  Add-BuildToolsToSession
  Push-Location $RootDir
  try {
    # SQLX_OFFLINE only affects compile-time query verification (checked-in
    # .sqlx/ cache instead of a live DB); it has no runtime effect.
    $env:SQLX_OFFLINE = "true"
    Write-Log "Building (first build takes several minutes)..."
    Invoke-Native "cargo build -p storyteller-web --bin storyteller-web"
    if ($LASTEXITCODE -ne 0) { Die "cargo build failed (exit $LASTEXITCODE)." }
  } finally {
    Pop-Location
  }
  Write-Log "Built target\debug\storyteller-web.exe."
}

function Setup-Frontend {
  if ($SkipFrontend) {
    Write-Log "Skipped (-SkipFrontend)."
    return
  }
  $frontendPath = Join-Path $RootDir "frontend"
  # Mirror script/common/frontend_preflight.sh: the workspace uses npm; stale
  # pnpm artifacts break installs with ENOTEMPTY.
  if ((Test-Path (Join-Path $frontendPath "pnpm-lock.yaml")) -or
      (Test-Path (Join-Path $frontendPath "pnpm-workspace.yaml")) -or
      (Test-Path (Join-Path $frontendPath "node_modules\.pnpm"))) {
    Die "Stale pnpm artifacts detected in frontend\. Clean up (see frontend/README.md): remove node_modules, pnpm-lock.yaml, pnpm-workspace.yaml, then re-run."
  }
  Push-Location $frontendPath
  try {
    Invoke-Native "npm install"
    if ($LASTEXITCODE -ne 0) {
      Write-Warn2 "npm install failed; wiping node_modules + .nx and retrying once..."
      Remove-Item -Recurse -Force -Confirm:$false node_modules, .nx -ErrorAction SilentlyContinue
      Invoke-Native "npm install"
      if ($LASTEXITCODE -ne 0) { Die "npm install failed again. See frontend/README.md troubleshooting." }
    }
  } finally {
    Pop-Location
  }
  Write-Log "Frontend dependencies installed."
}

function Download-File([string]$Url, [string]$Destination) {
  # curl.exe ships with Windows 10+ and handles redirects/resume better than
  # Invoke-WebRequest (which is also painfully slow on large files in PS 5.1).
  # -sS: no progress meter (it goes to stderr, which pollutes captured logs),
  # but errors still print.
  $out = Invoke-Native "curl.exe -fsSL --retry 3 -o `"$Destination.partial`" `"$Url`""
  if ($LASTEXITCODE -ne 0) {
    if ($out) { Write-Host ($out -join "`n") }
    Remove-Item "$Destination.partial" -Force -Confirm:$false -ErrorAction SilentlyContinue
    Die "Download failed: $Url"
  }
  Move-Item "$Destination.partial" $Destination -Force
}

function Print-NextSteps {
  Step "Done"
  Write-Host @"
The dev stack is bootstrapped. Next steps:

  1. Start the backend (binds $DevBackendUrl):
       .\script\bootstrap\windows\run_backend_dev.ps1

  2. In another terminal, create the demo login (idempotent):
       .\script\bootstrap\windows\seed_demo_user.ps1
     Credentials: $DemoUsername / $DemoPassword

  3. Start the webapp (binds http://localhost:4201; in dev it talks to
     $DevBackendUrl automatically):
       cd frontend; npx nx dev artcraft-webapp

  Health checks at any time:
       .\script\bootstrap\windows\dev_stack_doctor.ps1
  Services (MySQL/Redis) start on demand and persist; stop them with:
       .\script\bootstrap\windows\stop_dev_services.ps1
"@
}

Main
