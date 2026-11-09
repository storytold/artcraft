use std::fs;
use std::path::{Path, PathBuf};

use artcraft_client::credentials::storyteller_avt_cookie::StorytellerAvtCookie;
use artcraft_client::credentials::storyteller_credential_set::StorytellerCredentialSet;
use artcraft_client::credentials::storyteller_session_cookie::StorytellerSessionCookie;
use log::{info, warn};
use serde_json::Value;

const CREDENTIALS_DIR: &str = "Artcraft/credentials";
const SESSION_FILE: &str = "artcraft_session.txt";
const AVT_FILE: &str = "artcraft_avt.txt";
const COOKIE_STORE: &str = "ai.artcraft.app/.cookies";

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
        let local_app_data = dirs::data_local_dir()?;
        let cookie_store_path = local_app_data.join(COOKIE_STORE);
        if let Some((s, a)) = load_credentials_from_cookie_store(&cookie_store_path) {
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

fn load_session_cookie(path: &PathBuf) -> Option<StorytellerSessionCookie> {
    load_secret_file(path, "session").map(StorytellerSessionCookie::new)
}

fn load_avt_cookie(path: &PathBuf) -> Option<StorytellerAvtCookie> {
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
        }
        Err(e) => {
            warn!("Failed to read {} file {:?}: {}", label, path, e);
            None
        }
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
        }
        Err(e) => {
            warn!("Failed to stat credential file {:?}: {}", path, e);
        }
    }
}

#[cfg(not(unix))]
fn check_credential_file_permissions(_path: &Path) {
    // Windows ACL verification is out of scope; per-user profile isolation applies.
}

fn load_credentials_from_cookie_store(path: &PathBuf) -> Option<(Option<StorytellerSessionCookie>, Option<StorytellerAvtCookie>)> {
    if !path.exists() {
        return None;
    }

    let content = match fs::read_to_string(path) {
        Ok(c) => c,
        Err(e) => {
            warn!("Failed to read cookie store {:?}: {}", path, e);
            return None;
        }
    };

    let cookies: Value = match serde_json::from_str(&content) {
        Ok(v) => v,
        Err(e) => {
            warn!("Failed to parse cookie store JSON: {}", e);
            return None;
        }
    };

    let array = match cookies.as_array() {
        Some(a) => a,
        None => {
            warn!("Cookie store is not a JSON array");
            return None;
        }
    };

    let mut session = None;
    let mut avt = None;

    for cookie in array {
        if let Some(raw) = cookie.get("raw_cookie").and_then(|v| v.as_str()) {
            if raw.starts_with("session=") && session.is_none() {
                let value = raw.split(';').next().unwrap_or(raw);
                let token = value.strip_prefix("session=").unwrap_or(value);
                if !token.is_empty() {
                    info!("Loaded session cookie from Tauri cookie store");
                    session = Some(StorytellerSessionCookie::new(token.to_string()));
                }
            } else if raw.starts_with("visitor=") && avt.is_none() {
                let value = raw.split(';').next().unwrap_or(raw);
                let token = value.strip_prefix("visitor=").unwrap_or(value);
                if !token.is_empty() {
                    info!("Loaded AVT cookie from Tauri cookie store");
                    avt = Some(StorytellerAvtCookie::new(token.to_string()));
                }
            }
        }
    }

    Some((session, avt))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn load_secret_file_returns_none_when_missing() {
        let path = PathBuf::from("definitely/does/not/exist_7f3a1c.txt");
        assert!(load_secret_file(&path, "session").is_none());
    }

    #[test]
    fn load_secret_file_trims_whitespace() {
        let mut f = tempfile::NamedTempFile::new().unwrap();
        writeln!(f, "  session_token_value  ").unwrap();
        assert_eq!(
            load_secret_file(&f.path().to_path_buf(), "session"),
            Some("session_token_value".to_string())
        );
    }

    #[test]
    fn load_secret_file_rejects_empty() {
        let f = tempfile::NamedTempFile::new().unwrap();
        assert!(load_secret_file(&f.path().to_path_buf(), "session").is_none());
    }

    #[test]
    fn cookie_store_parses_session_and_visitor() {
        let mut f = tempfile::NamedTempFile::new().unwrap();
        write!(
            f,
            r#"[{{"raw_cookie": "session=abc123; Path=/"}}, {{"raw_cookie": "visitor=avt456; Path=/"}}]"#
        )
        .unwrap();
        let (session, avt) = load_credentials_from_cookie_store(&f.path().to_path_buf()).unwrap();
        assert!(session.is_some());
        assert!(avt.is_some());
    }

    #[test]
    fn cookie_store_rejects_non_array() {
        let mut f = tempfile::NamedTempFile::new().unwrap();
        write!(f, r#"{{"not": "an array"}}"#).unwrap();
        assert!(load_credentials_from_cookie_store(&f.path().to_path_buf()).is_none());
    }

    #[test]
    fn cookie_store_rejects_invalid_json() {
        let mut f = tempfile::NamedTempFile::new().unwrap();
        write!(f, "not json at all").unwrap();
        assert!(load_credentials_from_cookie_store(&f.path().to_path_buf()).is_none());
    }
}
