# Start (or verify) the portable MySQL and Redis processes under .devstack/.
# Idempotent: already-running services are left alone. Safe to call from other
# scripts via dot-sourcing (defines Start-DevMySql / Start-DevRedis) or run
# directly.
param()

. (Join-Path $PSScriptRoot "common.ps1")

function Start-DevMySql {
  if (Test-TcpPort 3306) {
    Write-Log "MySQL already listening on 3306."
    return
  }
  $mysqld = Join-Path $MySqlBaseDir "bin\mysqld.exe"
  if (-not (Test-Path $mysqld)) {
    Die "Portable MySQL not installed at $MySqlBaseDir. Run bootstrap_dev_stack.ps1 first."
  }
  if (-not (Test-Path (Join-Path $MySqlDataDir "mysql"))) {
    Die "MySQL data directory not initialized at $MySqlDataDir. Run bootstrap_dev_stack.ps1 first."
  }
  Write-Log "Starting mysqld (portable, data in .devstack\mysql-data)..."
  Start-DevProcess -Name "mysqld" -Exe $mysqld -Arguments @("--defaults-file=`"$MySqlIniPath`"") | Out-Null
  Wait-ForCondition { Test-TcpPort 3306 } 60 "MySQL to listen on 3306" | Out-Null
  Write-Log "MySQL is up."
}

function Start-DevRedis {
  if (Test-TcpPort 6379) {
    Write-Log "Redis already listening on 6379."
    return
  }
  $redis = Join-Path $RedisDir "redis-server.exe"
  if (-not (Test-Path $redis)) {
    Die "Portable Redis not installed at $RedisDir. Run bootstrap_dev_stack.ps1 first."
  }
  Write-Log "Starting redis-server (portable)..."
  # Keep the working dir (dump.rdb etc.) inside .devstack. NB: Start-Process
  # rejects empty-string ArgumentList elements, so pass `--save ""` as one
  # token to disable snapshotting.
  Start-DevProcess -Name "redis" -Exe $redis -Arguments @(
    "--port", "6379",
    "--save", "`"`"",
    "--dir", "`"$RedisDir`""
  ) | Out-Null
  Wait-ForCondition { Test-TcpPort 6379 } 30 "Redis to listen on 6379" | Out-Null
  Write-Log "Redis is up."
}

if ($MyInvocation.InvocationName -ne '.') {
  Start-DevMySql
  Start-DevRedis
}
