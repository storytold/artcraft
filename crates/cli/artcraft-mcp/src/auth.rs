use std::fs;
use std::io::BufReader;
use std::path::Path;

use artcraft_client::credentials::storyteller_avt_cookie::StorytellerAvtCookie;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::credentials::storyteller_session_cookie::StorytellerSessionCookie;
use artcraft_client::utils::api_host::ApiHost;
use log::{info, warn};
use url::Url;

const CREDENTIALS_DIR: &str = "Artcraft/credentials";
const SESSION_FILE: &str = "artcraft_session.txt";
const AVT_FILE: &str = "artcraft_avt.txt";
const COOKIE_STORE: &str = "ai.artcraft.app/.cookies";
const SESSION_COOKIE_NAME: &str = "session";
const AVT_COOKIE_NAME: &str = "visitor";

pub fn load_credentials() -> Option<StorytellerCredentialSet> {
  let home_dir = dirs::home_dir()?;
  let cred_dir = home_dir.join(CREDENTIALS_DIR);

  let session_path = cred_dir.join(SESSION_FILE);
  let avt_path = cred_dir.join(AVT_FILE);

  if session_path.exists() || avt_path.exists() {
    warn!(
      "Using plaintext credential files under {:?}. These files contain live \
             session cookies: keep them private, do not share or commit them, and \
             prefer OS keychain storage where available.",
      cred_dir
    );
  }

  let mut session = load_session_cookie(&session_path);
  let mut avt = load_avt_cookie(&avt_path);

  if session.is_none() || avt.is_none() {
    let api_url = Url::parse(&ApiHost::Storyteller.to_api_hostname_and_scheme()).ok()?;
    let cache_dir = dirs::cache_dir()?;
    let cookie_store_path = cache_dir.join(COOKIE_STORE);
    if let Some((s, a)) = load_credentials_from_cookie_store(&cookie_store_path, &api_url) {
      if session.is_none() {
        session = s;
      }
      if avt.is_none() {
        avt = a;
      }
    }
  }

  if session.is_none() && avt.is_none() {
    warn!("No ArtCraft credentials found");
    return None;
  }

  info!("Loaded ArtCraft credentials");
  Some(StorytellerCredentialSet::initialize(avt, session))
}

fn load_session_cookie(path: &Path) -> Option<StorytellerSessionCookie> {
  load_secret_file(path, "session").map(StorytellerSessionCookie::new)
}

fn load_avt_cookie(path: &Path) -> Option<StorytellerAvtCookie> {
  load_secret_file(path, "avt").map(StorytellerAvtCookie::new)
}

fn load_secret_file(path: &Path, label: &str) -> Option<String> {
  if !path.exists() {
    return None;
  }

  check_credential_file_permissions(path);

  match fs::read_to_string(path) {
    Ok(content) => {
      let token = content.trim();
      if token.is_empty() {
        warn!("{} file is empty: {:?}", label, path);
        return None;
      }
      info!("Loaded {} cookie from file", label);
      Some(token.to_string())
    },
    Err(e) => {
      warn!("Failed to read {} file {:?}: {}", label, path, e);
      None
    },
  }
}

#[cfg(unix)]
fn check_credential_file_permissions(path: &Path) {
  use std::os::unix::fs::PermissionsExt;
  match fs::metadata(path) {
    Ok(meta) => {
      let mode = meta.permissions().mode() & 0o777;
      if mode & 0o077 != 0 {
        warn!(
          "Credential file {:?} has permissive mode {:o}; group/other users can \
                     read your session. Run `chmod 600 {:?}` to restrict it.",
          path, mode, path
        );
      }
    },
    Err(e) => {
      warn!("Failed to stat credential file {:?}: {}", path, e);
    },
  }
}

#[cfg(not(unix))]
fn check_credential_file_permissions(_path: &Path) {
  // Windows ACL verification is out of scope; per-user profile isolation applies.
}

fn load_credentials_from_cookie_store(path: &Path, api_url: &Url) -> Option<(Option<StorytellerSessionCookie>, Option<StorytellerAvtCookie>)> {
  if !path.exists() {
    return None;
  }

  let file = match fs::File::open(path) {
    Ok(f) => f,
    Err(e) => {
      warn!("Failed to read cookie store {:?}: {}", path, e);
      return None;
    },
  };

  // Same matching the desktop applies in get_credentials_from_cookie_store:
  // only cookies applicable to our API origin (domain/path) and unexpired
  // qualify — never the first `session=` the jar happens to hold.
  let store = match cookie_store::serde::json::load(BufReader::new(file)) {
    Ok(s) => s,
    Err(e) => {
      warn!("Failed to parse cookie store {:?}: {}", path, e);
      return None;
    },
  };

  let mut session = None;
  let mut avt = None;

  for (name, value) in store.get_request_values(api_url) {
    if value.is_empty() {
      continue;
    }
    match name {
      SESSION_COOKIE_NAME if session.is_none() => {
        info!("Loaded session cookie from Tauri cookie store");
        session = Some(StorytellerSessionCookie::new(value.to_string()));
      },
      AVT_COOKIE_NAME if avt.is_none() => {
        info!("Loaded AVT cookie from Tauri cookie store");
        avt = Some(StorytellerAvtCookie::new(value.to_string()));
      },
      _ => {},
    }
  }

  Some((session, avt))
}

#[cfg(test)]
mod tests {
  use super::*;
  use cookie_store::CookieStore;
  use std::io::Write;

  #[test]
  fn load_secret_file_returns_none_when_missing() {
    let path = Path::new("definitely/does/not/exist_7f3a1c.txt");
    assert!(load_secret_file(&path, "session").is_none());
  }

  #[test]
  fn load_secret_file_trims_whitespace() {
    let mut f = tempfile::NamedTempFile::new().unwrap();
    writeln!(f, "  session_token_value  ").unwrap();
    assert_eq!(load_secret_file(&f.path().to_path_buf(), "session"), Some("session_token_value".to_string()));
  }

  #[test]
  fn load_secret_file_rejects_empty() {
    let f = tempfile::NamedTempFile::new().unwrap();
    assert!(load_secret_file(&f.path().to_path_buf(), "session").is_none());
  }

  #[test]
  fn cookie_store_parses_session_and_visitor() {
    let url = api_url();
    let f = write_store(&url, &["session=abc123; Secure; Path=/; Max-Age=3600", "visitor=avt456; Secure; Path=/; Max-Age=3600"]);
    let (session, avt) = load_credentials_from_cookie_store(&f.path().to_path_buf(), &url).unwrap();
    assert!(session.is_some());
    assert!(avt.is_some());
  }

  #[test]
  fn cookie_store_ignores_cookies_for_other_hosts() {
    let url = api_url();
    let other = Url::parse("https://unrelated.example/").unwrap();
    let f = write_store(&other, &["session=wrong-host; Secure; Path=/; Max-Age=3600"]);
    let (session, avt) = load_credentials_from_cookie_store(&f.path().to_path_buf(), &url).unwrap();
    assert!(session.is_none());
    assert!(avt.is_none());
  }

  #[test]
  fn cookie_store_ignores_expired_cookies() {
    let url = api_url();
    let f = write_store(&url, &["session=expired; Secure; Path=/; Max-Age=0"]);
    let (session, avt) = load_credentials_from_cookie_store(&f.path().to_path_buf(), &url).unwrap();
    assert!(session.is_none());
    assert!(avt.is_none());
  }

  #[test]
  fn cookie_store_rejects_invalid_json() {
    let mut f = tempfile::NamedTempFile::new().unwrap();
    write!(f, "not json at all").unwrap();
    assert!(load_credentials_from_cookie_store(&f.path().to_path_buf(), &api_url()).is_none());
  }

  fn api_url() -> Url {
    Url::parse(&ApiHost::Storyteller.to_api_hostname_and_scheme()).unwrap()
  }

  fn write_store(url: &Url, raws: &[&str]) -> tempfile::NamedTempFile {
    let mut store = CookieStore::default();
    let cookies: Vec<cookie_store::RawCookie> = raws.iter().map(|r| cookie_store::RawCookie::parse(*r).unwrap().into_owned()).collect();
    store.store_response_cookies(cookies.into_iter(), url);
    let mut f = tempfile::NamedTempFile::new().unwrap();
    cookie_store::serde::json::save(&store, &mut f).unwrap();
    f
  }
}
