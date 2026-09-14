use browser_emulation::browser_profile::BrowserProfile;

/// The User-Agent used for BOTH the Midjourney login webview and every
/// first-party Midjourney HTTP/websocket call.
///
/// It must be identical in both places: Cloudflare's `cf_clearance` cookie
/// (captured by the webview) is bound to the exact User-Agent, so the wreq
/// calls that replay those cookies have to present the same string. A
/// mainstream desktop Safari UA (rather than the default WKWebView UA) also
/// makes Google's embedded-webview risk detection less likely to force a
/// passkey step-up during sign-in.
pub const MIDJOURNEY_USER_AGENT: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15";

/// The browser profile used for ALL first-party Midjourney HTTP/websocket
/// traffic (submit, imagine, index page, image downloads, websocket upgrade).
///
/// Safari fingerprint + the exact [`MIDJOURNEY_USER_AGENT`], to stay consistent
/// with the macOS WKWebView login window that captured the cookies.
pub fn midjourney_browser_profile() -> BrowserProfile {
  BrowserProfile::safari_macos_with_user_agent(MIDJOURNEY_USER_AGENT)
}
