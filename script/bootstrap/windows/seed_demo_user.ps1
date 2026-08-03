# Create (or verify) the local demo user via the running backend, then verify
# that login works. Idempotent: an already-existing user is a success.
#
# Requires the backend to be up (run_backend_dev.ps1) - waits up to
# -WaitSeconds (default 60) for it.
#
# The account is created through POST /v1/create_account rather than raw SQL so
# it exercises the real signup path (bcrypt hash, session, firehose row) and
# stays correct if the users schema evolves.
#
# Override credentials via DEMO_USERNAME / DEMO_PASSWORD / DEMO_EMAIL env vars.
# Username rules: 3-16 chars of [A-Za-z0-9_-], not on the reserved list
# (includes/binary_includes/usernames/reserved_usernames.txt); password >= 6.
param(
  [int]$WaitSeconds = 60
)

. (Join-Path $PSScriptRoot "common.ps1")

Write-Log "Waiting for backend at $DevBackendUrl (up to ${WaitSeconds}s)..."
Wait-ForCondition { Test-Backend } $WaitSeconds "backend /_status to respond (start it with run_backend_dev.ps1)" | Out-Null
Write-Log "Backend is up."

# curl.exe + ConvertFrom-Json: Invoke-RestMethod in PS 5.1 throws on non-2xx
# and hides the response body, which we need for the already-exists case.
# Invoke-Native keeps curl's stderr from becoming a terminating PS error.
function Invoke-JsonPost([string]$Url, [hashtable]$Body) {
  $json = $Body | ConvertTo-Json -Compress
  $tmp = Join-Path $env:TEMP "bootstrap_post_body.json"
  Set-Content -Path $tmp -Value $json -Encoding ascii
  $response = Invoke-Native "curl.exe -sS -X POST `"$Url`" -H `"Content-Type: application/json`" --data `"@$tmp`""
  $curlExit = $LASTEXITCODE
  Remove-Item $tmp -Force -Confirm:$false -ErrorAction SilentlyContinue
  $joined = ($response -join "`n")
  if ($curlExit -ne 0) { Die "Request to $Url failed (curl exit $curlExit): $joined" }
  try {
    return $joined | ConvertFrom-Json
  } catch {
    Die "Non-JSON response from ${Url}: $joined"
  }
}

Write-Log "Creating account '$DemoUsername'..."
$create = Invoke-JsonPost "$DevBackendUrl/v1/create_account" @{
  username              = $DemoUsername
  password              = $DemoPassword
  password_confirmation = $DemoPassword
  email_address         = $DemoEmail
}

if ($create.success -eq $true) {
  Write-Log "Account created."
} else {
  $errorCode = "$($create.error_type)$($create.error_code)$($create.error_code_str)"
  if ($errorCode -match "(?i)username_?taken|email_?taken") {
    Write-Log "Account already exists ($errorCode) - continuing."
  } else {
    Die "Account creation failed: $($create | ConvertTo-Json -Compress)"
  }
}

Write-Log "Verifying login..."
$login = Invoke-JsonPost "$DevBackendUrl/v1/login" @{
  username_or_email = $DemoUsername
  password          = $DemoPassword
}

if ($login.success -ne $true) { Die "Login verification failed: $($login | ConvertTo-Json -Compress)" }
if (-not $login.signed_session) { Die "Login succeeded but returned no signed_session." }

# --- Credits wallet ---------------------------------------------------------
# Generation submits deduct from the user's artcraft wallet and the webapp
# gates the generate button on the balance, so a user without credits cannot
# exercise any generation flow. Signup does not create a wallet; seed one.
# Raw SQL (not an endpoint): the only credit-granting paths are Stripe
# webhooks and moderator tooling, neither of which works locally.
Write-Log "Seeding credits wallet ($DemoCredits banked credits)..."

$userToken = @(Invoke-MySqlApp -Sql "SELECT token FROM users WHERE username = '$DemoUsername' LIMIT 1") |
    Where-Object { "$_" -match '^user_' } | Select-Object -First 1
if (-not $userToken) { Die "Could not find users row for '$DemoUsername'." }

$walletRow = @(Invoke-MySqlApp -Sql "SELECT token, banked_credits FROM wallets WHERE wallet_namespace = 'artcraft' AND owner_user_token = '$userToken' LIMIT 1") |
    Where-Object { "$_" -match '^wallet_' } | Select-Object -First 1

if (-not $walletRow) {
  $walletToken = New-DevToken "wallet_" 32
  $createLedgerToken = New-DevToken "wle_" 32
  $creditLedgerToken = New-DevToken "wle_" 32
  Invoke-MySqlApp -Sql (
    "INSERT INTO wallets SET token='$walletToken', wallet_namespace='artcraft', owner_user_token='$userToken', banked_credits=$DemoCredits, monthly_credits=0; " +
    "INSERT INTO wallet_ledger_entries SET token='$createLedgerToken', wallet_token='$walletToken', entry_type='create', credits_delta=0, banked_credits_before=0, banked_credits_after=0, monthly_credits_before=0, monthly_credits_after=0; " +
    "INSERT INTO wallet_ledger_entries SET token='$creditLedgerToken', wallet_token='$walletToken', entry_type='credit_banked', maybe_entity_ref='dev_bootstrap_seed', credits_delta=$DemoCredits, banked_credits_before=0, banked_credits_after=$DemoCredits, monthly_credits_before=0, monthly_credits_after=0;"
  ) | Out-Null
  if ($LASTEXITCODE -ne 0) { Die "Failed to insert the demo wallet." }
  Write-Log "Wallet created with $DemoCredits banked credits."
} else {
  $parts = "$walletRow" -split "`t"
  $walletToken = $parts[0]
  $balance = [uint64]$parts[1]
  if ($balance -lt $DemoCredits) {
    $creditLedgerToken = New-DevToken "wle_" 32
    $delta = [uint64]$DemoCredits - $balance
    Invoke-MySqlApp -Sql (
      "UPDATE wallets SET banked_credits=$DemoCredits, version=version+1 WHERE token='$walletToken' LIMIT 1; " +
      "INSERT INTO wallet_ledger_entries SET token='$creditLedgerToken', wallet_token='$walletToken', entry_type='credit_banked', maybe_entity_ref='dev_bootstrap_topup', credits_delta=$delta, banked_credits_before=$balance, banked_credits_after=$DemoCredits, monthly_credits_before=0, monthly_credits_after=0;"
    ) | Out-Null
    if ($LASTEXITCODE -ne 0) { Die "Failed to top up the demo wallet." }
    Write-Log "Wallet topped up: $balance -> $DemoCredits banked credits."
  } else {
    Write-Log "Wallet already has $balance banked credits - leaving as-is."
  }
}

# NB: no gallery media is seeded. A media_files row is only useful if the bytes
# behind it are reachable, and serving those locally needs real R2 credentials
# in the secrets env - rows on their own render as broken tiles. For a populated
# library with no backend at all, run frontend/apps/fake-storyteller-web.

Write-Log "Demo user is ready."
Write-Log "  Username: $DemoUsername"
Write-Log "  Password: $DemoPassword"
Write-Log "Log in at the webapp /login page (http://localhost:4201/login once 'nx dev artcraft-webapp' is running)."
