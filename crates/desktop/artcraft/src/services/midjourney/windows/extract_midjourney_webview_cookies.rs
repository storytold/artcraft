use cookie_store_wrapper::cookie_store::CookieStore;
use errors::AnyhowResult;
use tauri::WebviewWindow;
use url::Url;

pub fn extract_midjourney_webview_cookies(webview: &WebviewWindow) -> AnyhowResult<CookieStore> {
  let mut store = CookieStore::empty();
  for origin in ["https://www.midjourney.com/", "https://midjourney.com/"] {
    let origin = Url::parse(origin)?;
    for cookie in webview.cookies_for_url(origin.clone())? {
      // Tauri's cookie serialization retains path, domain, Secure, HttpOnly,
      // SameSite, and expiry. The jar deduplicates by domain/path/name.
      store.apply_set_cookie_header(&cookie.to_string(), &origin);
    }
  }
  Ok(store)
}
