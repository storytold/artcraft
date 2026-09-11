use cookie_store::cookie_store::CookieStore;
use errors::AnyhowResult;
use once_cell::sync::Lazy;
use reqwest::Url;
use tauri::webview::Cookie;
use tauri::WebviewWindow;

static ROOT_COOKIE_URL: Lazy<Url> = Lazy::new(|| {
  Url::parse("https://worldlabs.ai").expect("URL should parse")
});

pub fn worldlabs_login_webview_extract_cookies(webview: &WebviewWindow) -> AnyhowResult<CookieStore> {
  let mut cookie_store = CookieStore::empty();
  let cookies = get_all_worldlabs_cookies(webview)?;
  for cookie in cookies.iter() {
    cookie_store.add_cookie_name_and_value(
      cookie.name().to_string(),
      cookie.value().to_string(),
    );
  }
  Ok(cookie_store)
}

fn get_all_worldlabs_cookies(webview: &WebviewWindow) -> AnyhowResult<Vec<Cookie>> {
  //let www_cookies = webview.cookies_for_url(WWW_COOKIE_URL.clone())?;
  let root_cookies = webview.cookies_for_url(ROOT_COOKIE_URL.clone())?;

  let mut all_cookies = root_cookies;
  //let mut cookie_names = HashSet::new();

  //for cookie in root_cookies.iter() {
  //  if !cookie_names.contains(cookie.name()) {
  //    cookie_names.insert(cookie.name().to_string());
  //    all_cookies.push(cookie.clone());
  //  }
  //}

  Ok(all_cookies)
}
