//! Implements wreq's `CookieStore` trait on [`SharedCookieStore`], so a wreq
//! client can use our store as its cookie provider:
//!
//! ```ignore
//! let cookies = SharedCookieStore::empty();
//! let client = wreq::Client::builder()
//!     .cookie_provider(cookies.clone())
//!     .build()?;
//! // Every Set-Cookie the client receives now lands in `cookies`,
//! // and every request sends the matching stored cookies.
//! ```

use crate::shared_cookie_store::SharedCookieStore;
use log::warn;
use url::Url;
use wreq::Uri;
use wreq::cookie::{CookieStore as WreqCookieStore, Cookies};
use wreq::header::HeaderValue;

impl WreqCookieStore for SharedCookieStore {
  fn set_cookies(&self, cookie_headers: &mut dyn Iterator<Item = &HeaderValue>, uri: &Uri) {
    let Some(request_url) = uri_to_url(uri) else {
      warn!("Cannot convert URI to URL for Set-Cookie storage: {}", uri);
      return;
    };
    self.with_write(|store| {
      for header in cookie_headers {
        match header.to_str() {
          Ok(value) => {
            store.apply_set_cookie_header(value, &request_url);
          },
          Err(err) => {
            warn!("Set-Cookie header from {} is not valid UTF-8: {:?}", request_url, err);
          },
        }
      }
    });
  }

  fn cookies(&self, uri: &Uri) -> Cookies {
    let Some(request_url) = uri_to_url(uri) else {
      return Cookies::Empty;
    };
    let maybe_header = self.cookie_header_for_url(&request_url);
    match maybe_header {
      Some(header) => match HeaderValue::from_str(&header) {
        Ok(value) => Cookies::Compressed(value),
        Err(err) => {
          warn!("Stored cookies for {} do not form a valid header: {:?}", request_url, err);
          Cookies::Empty
        },
      },
      None => Cookies::Empty,
    }
  }
}

fn uri_to_url(uri: &Uri) -> Option<Url> {
  Url::parse(&uri.to_string()).ok()
}
