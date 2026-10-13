[CmdletBinding()]
param([ValidateSet('Inspect', 'Mock', 'Live')][string]$Mode = 'Inspect')
$ErrorActionPreference = 'Stop'
# Codex may supply a module path from another PowerShell version. Load this
# host's own built-ins explicitly, without editing the inherited environment.
foreach ($module in @('Microsoft.PowerShell.Utility', 'Microsoft.PowerShell.Management')) {
  Import-Module (Join-Path $PSHOME "Modules\$module\$module.psd1") -ErrorAction Stop
}

# This installer owns only its marked section in this checkout's config.
# It never edits user-level Codex settings or marks a project trusted.
$root = $PSScriptRoot
$built = Join-Path $root '.build\bridge-target\debug\artcraft-image-bridge.exe'
$configPath = Join-Path $root '.codex\config.toml'
$keyPath = Join-Path $root '.build\credentials\artcraft-api-key.dpapi'
$startMarker = '# BEGIN ArtCraft image bridge (managed by setup-project-mcp.ps1)'
$endMarker = '# END ArtCraft image bridge'
$encoding = New-Object System.Text.UTF8Encoding($false)

if (-not [IO.File]::Exists($built)) {
  throw 'Build the bridge first with .\build-image-bridge.ps1 -Action build.'
}
if ($Mode -eq 'Live' -and -not [IO.File]::Exists($keyPath)) {
  throw 'Live setup needs an encrypted key. Run .\setup-bridge-key.ps1 first. Never paste a key into Codex chat.'
}
$existing = if ([IO.File]::Exists($configPath)) { [IO.File]::ReadAllText($configPath) } else { '' }
$managedPattern = '(?ms)^' + [regex]::Escape($startMarker) + '\r?\n.*?^' + [regex]::Escape($endMarker) + '(?:\r?\n|$)'
$managedMatches = [regex]::Matches($existing, $managedPattern)
if ($managedMatches.Count -gt 1) { throw 'Multiple managed sections found; config was not changed.' }
$unmanaged = [regex]::Replace($existing, $managedPattern, '')
if ($unmanaged -match '(?m)^[^#\r\n]*artcraft_image_bridge' -or
    $unmanaged.Contains($startMarker) -or $unmanaged.Contains($endMarker)) {
  throw 'An unrecognized ArtCraft bridge entry already exists. Review it before replacing it; config was not changed.'
}

# Run an immutable copy, so compiling again cannot replace an executable in use.
$digest = (Get-FileHash -LiteralPath $built -Algorithm SHA256).Hash.ToLowerInvariant()
$runtimeDirectory = Join-Path $root ('.build\bin\' + $digest)
$runtime = Join-Path $runtimeDirectory 'artcraft-image-bridge.exe'
$imageRoot = Join-Path $root '.build\approved-images'
$state = Join-Path $root '.build\codex-mcp-state'
$serverArgs = @($imageRoot, $state)
if ($Mode -eq 'Mock') {
  $serverArgs[1] = Join-Path $root '.build\codex-mock-state'
  $serverArgs += '--mock'
}
if ($Mode -eq 'Live') { $serverArgs += @('--live-key', $keyPath) }
# JSON string escaping is a subset of TOML basic-string escaping for these paths.
$quotedArgs = ($serverArgs | ForEach-Object { ConvertTo-Json -InputObject $_ -Compress }) -join ', '
$section = @"
$startMarker
[mcp_servers.artcraft_image_bridge]
command = $(ConvertTo-Json -InputObject $runtime -Compress)
args = [$quotedArgs]
cwd = $(ConvertTo-Json -InputObject $root -Compress)
enabled = true
required = false
startup_timeout_sec = 30
tool_timeout_sec = 150
$endMarker
"@ + "`n"
$newConfig = if ($managedMatches.Count -eq 1) {
  $match = $managedMatches[0]
  $existing.Substring(0, $match.Index) + $section + $existing.Substring($match.Index + $match.Length)
} else {
  $existing + $(if ($existing.Length -gt 0 -and -not $existing.EndsWith("`n")) { "`n" }) + $section
}

New-Item -ItemType Directory -Force -Path $runtimeDirectory, $imageRoot, $serverArgs[1], (Split-Path $configPath) | Out-Null
if ([IO.File]::Exists($runtime)) {
  if ((Get-FileHash -LiteralPath $runtime -Algorithm SHA256).Hash.ToLowerInvariant() -ne $digest) {
    throw 'Installed executable differs from its recorded content hash; no config change made.'
  }
} else { Copy-Item -LiteralPath $built -Destination $runtime }

if ($newConfig -ne $existing) {
  $temporary = $configPath + '.' + [guid]::NewGuid().ToString('N') + '.tmp'
  [IO.File]::WriteAllText($temporary, $newConfig, $encoding)
  if ([IO.File]::Exists($configPath)) {
    $backupDirectory = Join-Path $root '.build\config-backups'
    New-Item -ItemType Directory -Force -Path $backupDirectory | Out-Null
    $backup = Join-Path $backupDirectory ('config.toml.' + [guid]::NewGuid().ToString('N') + '.bak')
    [IO.File]::Replace($temporary, $configPath, $backup)
  } else { [IO.File]::Move($temporary, $configPath) }
}
Write-Host "Project connection ready in $Mode mode. Global settings were not changed."
Write-Host 'Start a fresh Codex session in this folder and accept its normal trust prompt if shown.'
Write-Host 'Check /mcp for three ArtCraft tools, then inspect a selected image first.'
