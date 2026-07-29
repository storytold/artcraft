# Stop the portable MySQL and Redis processes started by start_dev_services.ps1.
param()

. (Join-Path $PSScriptRoot "common.ps1")

# Graceful MySQL shutdown (flushes InnoDB) - root has no password in the
# portable install (initialized with --initialize-insecure).
if (Test-TcpPort 3306) {
  $mysqladmin = Get-MySqlTool "mysqladmin"
  if ($mysqladmin) {
    Write-Log "Shutting down MySQL..."
    try { & $mysqladmin -u root -h 127.0.0.1 shutdown 2>$null } catch {}
    $deadline = (Get-Date).AddSeconds(30)
    while ((Test-TcpPort 3306) -and ((Get-Date) -lt $deadline)) { Start-Sleep -Seconds 1 }
  }
}

if (Test-TcpPort 6379) {
  $cli = Get-RedisTool "redis-cli"
  if ($cli) {
    Write-Log "Shutting down Redis..."
    try { & $cli -h 127.0.0.1 shutdown nosave 2>$null } catch {}
  }
}

# Last resort: kill anything left via recorded PIDs.
if (Test-Path $PidsDir) {
  foreach ($pidFile in Get-ChildItem $PidsDir -Filter "*.pid" -ErrorAction SilentlyContinue) {
    $procId = Get-Content $pidFile.FullName -ErrorAction SilentlyContinue
    if ($procId) {
      $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
      if ($proc -and -not $proc.HasExited) {
        Write-Log "Force-stopping $($pidFile.BaseName) (pid $procId)..."
        try { Stop-Process -Id $procId -Force -Confirm:$false -ErrorAction Stop } catch {}
      }
    }
    Remove-Item $pidFile.FullName -Force -Confirm:$false -ErrorAction SilentlyContinue
  }
}

Write-Log "Dev services stopped."
