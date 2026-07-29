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
  $errorCode = "$($create.error_code)$($create.error_code_str)"
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

Write-Log "Demo user is ready."
Write-Log "  Username: $DemoUsername"
Write-Log "  Password: $DemoPassword"
Write-Log "Log in at the webapp /login page (http://localhost:4201/login once 'nx dev artcraft-webapp' is running)."
