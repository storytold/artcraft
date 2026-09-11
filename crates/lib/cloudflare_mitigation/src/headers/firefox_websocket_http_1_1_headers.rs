use once_cell::sync::Lazy;
use wreq::header::OrigHeaderMap;

/// Header casing and order needed to bypass Cloudflare WebSocket HTTP/1.1 checks.
/// This is the set of headers sent by Firefox 143 on macOS.
static FIREFOX_WEBSOCKET_HTTP_1_1_HEADERS : Lazy<OrigHeaderMap> = Lazy::new(|| {
  let mut original_headers = OrigHeaderMap::new();

  original_headers.insert("Host");
  original_headers.insert("User-Agent");
  original_headers.insert("Accept");
  original_headers.insert("Accept-Language");
  original_headers.insert("Accept-Encoding");
  original_headers.insert("Sec-WebSocket-Version");
  original_headers.insert("Origin");
  original_headers.insert("Sec-WebSocket-Extensions");
  original_headers.insert("Sec-WebSocket-Key");
  original_headers.insert("Connection");
  original_headers.insert("Cookie");
  original_headers.insert("Sec-Fetch-Dest");
  original_headers.insert("Sec-Fetch-Mode");
  original_headers.insert("Sec-Fetch-Site");
  original_headers.insert("Pragma");
  original_headers.insert("Cache-Control");
  original_headers.insert("Upgrade");

  original_headers
});

/// Wreq expects an owned copy, so we are required to clone.
pub fn get_firefox_websocket_http_1_1_headers() -> OrigHeaderMap {
  FIREFOX_WEBSOCKET_HTTP_1_1_HEADERS.clone()
}