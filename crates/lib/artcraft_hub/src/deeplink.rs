//! Deep links (CraftHub spec §18.5): `artcraft://join?<code|token>&server=<url>` — the unified
//! format every Craft app shares. The app opens, resolves the code (the `Resolve` message) and
//! joins without touching any other open session (§18.2: a session per project).
//!
//! No OS-level scheme registration exists in the desktop app today (the Tauri `deep-link`
//! plugin arrives with the session wiring, behind the `crafthub` flag); this module is the
//! parser and builder that wiring will register for.

/// A parsed deep link.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct JoinLink {
  /// The join code (`code=...`) or the invite token (`token=...`) — exactly one is set.
  pub code: Option<String>,
  /// The invite token, when the link carries one instead of a code.
  pub token: Option<String>,
  /// The server the code belongs to (`server=...`); `None` means the user's default server.
  pub server: Option<String>,
}

/// The URL scheme (artcraft's own; each sibling keeps its own).
pub const SCHEME: &str = "artcraft";

impl JoinLink {
  /// Parse `artcraft://join?code=X&server=Y` (or `?token=...`). Unknown parameters are
  /// ignored — v3's silent-absence rule for forward compatibility (§18.10).
  ///
  /// Never panics and never errors on malformed input beyond returning `None`: a link that
  /// doesn't parse is not a crash, it is a link the app politely declines to open.
  #[must_use]
  pub fn parse(url: &str) -> Option<Self> {
    let rest = url.strip_prefix(&format!("{SCHEME}://"))?;
    let (path, query) = rest.split_once('?')?;
    if path != "join" {
      return None;
    }
    let mut code = None;
    let mut token = None;
    let mut server = None;
    for pair in query.split('&') {
      let (key, value) = pair.split_once('=')?;
      // Percent-decode the few characters the format allows (a code never carries them,
      // a server URL may).
      let decoded = percent_decode(value);
      match key {
        "code" => code = Some(decoded),
        "token" => token = Some(decoded),
        "server" => server = Some(decoded),
        _ => {}, // unknown keys: silently absent, not an error
      }
    }
    if code.is_none() && token.is_none() {
      return None;
    }
    Some(Self { code, token, server })
  }

  /// Build the link form of a code (or token) and server.
  #[must_use]
  pub fn to_url(&self) -> String {
    let mut url = format!("{SCHEME}://join?");
    if let Some(code) = &self.code {
      url.push_str(&format!("code={}", percent_encode(code)));
    } else if let Some(token) = &self.token {
      url.push_str(&format!("token={}", percent_encode(token)));
    }
    if let Some(server) = &self.server {
      url.push_str(&format!("&server={}", percent_encode(server)));
    }
    url
  }
}

/// The percent-decoding the format needs (uppercase hex, the unreserved set stays).
fn percent_decode(s: &str) -> String {
  let bytes = s.as_bytes();
  let mut out = Vec::with_capacity(bytes.len());
  let mut i = 0;
  while i < bytes.len() {
    if bytes[i] == b'%' {
      if let Some(hex) = bytes.get(i + 1..i + 3) {
        if let Ok(b) = u8::from_str_radix(std::str::from_utf8(hex).unwrap_or("zz"), 16) {
          out.push(b);
          i += 3;
          continue;
        }
      }
    }
    out.push(bytes[i]);
    i += 1;
  }
  String::from_utf8_lossy(&out).into_owned()
}

/// Percent-encode everything outside the unreserved set.
fn percent_encode(s: &str) -> String {
  let mut out = String::with_capacity(s.len());
  for b in s.bytes() {
    match b {
      b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => out.push(b as char),
      _ => out.push_str(&format!("%{b:02X}")),
    }
  }
  out
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn roundtrip_code_and_server() {
    let link = JoinLink { code: Some("A1B2C3D4".into()), token: None, server: Some("wss://hub.example.com".into()) };
    let url = link.to_url();
    assert_eq!(url, "artcraft://join?code=A1B2C3D4&server=wss%3A%2F%2Fhub.example.com");
    assert_eq!(JoinLink::parse(&url), Some(link));
  }

  #[test]
  fn token_without_server() {
    let url = "artcraft://join?token=abc.def";
    let parsed = JoinLink::parse(url);
    assert_eq!(parsed, Some(JoinLink { code: None, token: Some("abc.def".into()), server: None }));
  }

  #[test]
  fn wrong_path_or_empty_is_declined() {
    assert_eq!(JoinLink::parse("artcraft://open?code=X"), None);
    assert_eq!(JoinLink::parse("artcraft://join?nothing=here"), None);
    assert_eq!(JoinLink::parse("https://example.com"), None);
  }
}
