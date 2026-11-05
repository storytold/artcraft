# This runs Artcraft Rust in dev mode on Windows

Write-Host "Running Artcraft Rust in Dev Mode..."
Write-Host ""
Write-Host "You'll need to launch the frontend dev server as a second script!"  -ForegroundColor red -BackgroundColor white
Write-Host ""

# This tells Tauri *which* frontend and *which* Rust app to use since we're in a monorepo with several apps.
$env:TAURI_FRONTEND_PATH=".\frontend"
$env:TAURI_APP_PATH=".\crates\desktop\artcraft"

# Put SQLx into offline mode (no DB hits / migrations).
$env:SQLX_OFFLINE = "true"

# -----------------------------------------------------------------------------------------------
# Native toolchain for BoringSSL
#
# The desktop app depends on the `wreq` HTTP client, which compiles BoringSSL from source at
# build time. On Windows that needs (a) a CMake that knows the generator for the installed
# Visual Studio release and (b) LLVM's libclang for bindgen. These are the same prerequisites
# the Windows CI workflow installs (`choco install cmake llvm`).
#
# Everything in this section is best effort: it only sets environment variables when it finds
# something, never overrides values you set yourself, and otherwise falls through to the normal
# build with a hint about what to install.
#
# NB: do not "fix" an old CMake by setting CMAKE_GENERATOR=Ninja. The Rust `cmake` crate only
# overrides MSVC's debug CRT flag (/MDd) for the Visual Studio generator, so Ninja debug builds
# of BoringSSL fail to link against Rust's release CRT (unresolved __imp__CrtDbgReport).
# -----------------------------------------------------------------------------------------------

function Get-CMakeVersion([string] $cmakeExe) {
    try {
        $firstLine = & $cmakeExe --version 2>$null | Select-Object -First 1
        if ($firstLine -match '(\d+)\.(\d+)\.(\d+)') {
            return [version] "$($Matches[1]).$($Matches[2]).$($Matches[3])"
        }
    } catch { }
    return $null
}

if (-not $env:CMAKE) {
    # Candidate CMake binaries; the newest one wins. "Whatever is first on PATH" is not good
    # enough on its own because tools such as Strawberry Perl put an old CMake there, and an
    # old CMake does not know newer Visual Studio releases (e.g. "Visual Studio 18 2026").
    $cmakeCandidates = @()

    $cmakeOnPath = Get-Command cmake.exe -ErrorAction SilentlyContinue
    if ($cmakeOnPath) {
        $cmakeCandidates += $cmakeOnPath.Source
    }

    # Standalone installs (official installer, `choco install cmake`, winget).
    foreach ($root in @($env:ProgramFiles, ${env:ProgramFiles(x86)})) {
        if ($root) {
            $cmakeCandidates += (Join-Path $root "CMake\bin\cmake.exe")
        }
    }

    # CMake bundled with the "C++ CMake tools for Windows" Visual Studio component. It always
    # matches the installed Visual Studio release.
    if (${env:ProgramFiles(x86)}) {
        $vswhere = Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio\Installer\vswhere.exe"
        if (Test-Path $vswhere) {
            $bundledCmake = & $vswhere -latest -products '*' -find "Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe" 2>$null
            if ($bundledCmake) {
                $cmakeCandidates += $bundledCmake
            }
        }
    }

    $bestCmake = $null
    $bestCmakeVersion = $null
    foreach ($candidate in ($cmakeCandidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique)) {
        $candidateVersion = Get-CMakeVersion $candidate
        if ($candidateVersion -and ((-not $bestCmakeVersion) -or ($candidateVersion -gt $bestCmakeVersion))) {
            $bestCmake = $candidate
            $bestCmakeVersion = $candidateVersion
        }
    }

    if ($bestCmake) {
        if ((-not $cmakeOnPath) -or ($bestCmake -ne $cmakeOnPath.Source)) {
            # The Rust `cmake` crate honours CMAKE as the path of the binary to run.
            $env:CMAKE = $bestCmake
            Write-Host "Using CMake $bestCmakeVersion at $bestCmake"
        }
    } else {
        Write-Host "WARNING: CMake not found; the BoringSSL build will fail. Install it with: choco install cmake -y"  -ForegroundColor red -BackgroundColor white
    }
}

# bindgen locates libclang by itself (LIBCLANG_PATH, PATH, then the default LLVM install
# directories), so this is only a pre-flight check with an install hint.
$libclangFound = $false
$libclangSearchDirs = @()
if ($env:LIBCLANG_PATH) {
    $libclangSearchDirs += $env:LIBCLANG_PATH
}
foreach ($root in @($env:ProgramFiles, ${env:ProgramFiles(x86)})) {
    if ($root) {
        $libclangSearchDirs += (Join-Path $root "LLVM\bin")
    }
}
$libclangSearchDirs += ($env:PATH -split ';')
foreach ($dir in $libclangSearchDirs) {
    try {
        if ($dir -and (Test-Path (Join-Path $dir "libclang.dll"))) {
            $libclangFound = $true
            break
        }
    } catch { }
}
if (-not $libclangFound) {
    Write-Host "WARNING: libclang.dll not found; the BoringSSL build (bindgen) will fail. Install it with: choco install llvm -y"  -ForegroundColor red -BackgroundColor white
}

# The config file tells Tauri more instructions for the frontend build.
cargo tauri dev --config ".\crates\desktop\artcraft\tauri-dev-hot-reload.conf.json"
