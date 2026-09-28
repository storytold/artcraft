/// `User-Agent` sent to our own APIs and hosts.
///
/// TODO: Change to "artcraft-desktop/1.0" once the backend services can parse it.
pub const ARTCRAFT_DESKTOP_USER_AGENT: &str = "storyteller-client/1.0";

/// `User-Agent` sent to third parties: the default of the OS webview Tauri runs on
/// (WKWebView on macOS, WebView2 on Windows, WebKitGTK on Linux).
///
/// NB: These are hardcoded snapshots and WILL go out of date as the OS webviews update
/// (especially WebView2's Chrome/Edge version, which auto-updates on Windows). Rust can't read
/// the webview's real `navigator.userAgent`, so refresh these periodically by checking
/// `navigator.userAgent` in the desktop app's devtools on each OS.
#[cfg(target_os = "macos")]
pub const WEBVIEW_USER_AGENT: &str =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)";

#[cfg(target_os = "windows")]
pub const WEBVIEW_USER_AGENT: &str =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0";

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
pub const WEBVIEW_USER_AGENT: &str =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15 (KHTML, like Gecko)";
