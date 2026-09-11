use crate::credentials::cookie_names::{AUTH_COOKIE_NAME_I, AUTH_COOKIE_NAME_R};
use cookie_store::cookie_store::CookieStore;

/// Returns true if the given cookie store has the necessary authentication cookies.
pub fn cookie_store_has_auth_cookies(cookie_store: &CookieStore) -> bool {
  cookie_store.has_cookie(AUTH_COOKIE_NAME_I)
      && cookie_store.has_cookie(AUTH_COOKIE_NAME_R)
}
