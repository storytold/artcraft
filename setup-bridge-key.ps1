param([switch]$SelfTest, [switch]$Replace)
$ErrorActionPreference = 'Stop'
if ([Environment]::OSVersion.Platform -ne [PlatformID]::Win32NT) {
  throw 'This credential setup requires Windows DPAPI.'
}
# Load the module shipped with this PowerShell host, avoiding inherited module paths.
Import-Module (Join-Path $PSHOME 'Modules\Microsoft.PowerShell.Security\Microsoft.PowerShell.Security.psd1') -ErrorAction Stop
$probe = ConvertTo-SecureString 'local-encryption-self-test' -AsPlainText -Force
$encryptedProbe = ConvertFrom-SecureString $probe
$restoredProbe = ConvertTo-SecureString $encryptedProbe
if ($restoredProbe.Length -ne $probe.Length) { throw 'Encryption self-test failed.' }
$probe.Dispose()
$restoredProbe.Dispose()
if ($SelfTest) { Write-Host 'Local encryption self-test passed.'; exit 0 }
$destination = (Join-Path $PSScriptRoot '.build\credentials\artcraft-api-key.dpapi')
if ([IO.File]::Exists($destination) -and -not $Replace) {
  throw 'An encrypted key already exists. Use -Replace only when intentionally replacing it.'
}
Write-Host 'Paste the ArtCraft assessment key, then press Enter. Input is hidden.'
$key = Read-Host -AsSecureString
try {
  if ($key.Length -lt 16 -or $key.Length -gt 4096) { throw 'No valid key entered; nothing saved.' }
  New-Item -ItemType Directory -Force -Path (Split-Path $destination) | Out-Null
  $temporary = $destination + '.' + [guid]::NewGuid().ToString('N') + '.tmp'
  [IO.File]::WriteAllText($temporary, (ConvertFrom-SecureString $key), [Text.Encoding]::ASCII)
  if ([IO.File]::Exists($destination)) {
    [IO.File]::Replace($temporary, $destination, $destination + '.' + [guid]::NewGuid().ToString('N') + '.bak')
  } else { [IO.File]::Move($temporary, $destination) }
} finally { $key.Dispose() }
Write-Host 'Saved encrypted for your Windows account. You can close this window.'
