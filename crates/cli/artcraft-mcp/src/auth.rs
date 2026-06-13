use std::fs;
use std::path::PathBuf;

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
    if !path.exists() {
        return None;
    }

    match fs::read_to_string(path) {
        Ok(content) => {
            let token = content.trim();
            if token.is_empty() {
                warn!("Session file is empty: {:?}", path);
                return None;
            }
            info!("Loaded session cookie from file");
            Some(StorytellerSessionCookie::new(token.to_string()))
        }
        Err(e) => {
            warn!("Failed to read session file {:?}: {}", path, e);
            None
        }
    }
}

fn load_avt_cookie(path: &PathBuf) -> Option<StorytellerAvtCookie> {
    if !path.exists() {
        return None;
    }

    match fs::read_to_string(path) {
        Ok(content) => {
            let token = content.trim();
            if token.is_empty() {
                warn!("AVT file is empty: {:?}", path);
                return None;
            }
            info!("Loaded AVT cookie from file");
            Some(StorytellerAvtCookie::new(token.to_string()))
        }
        Err(e) => {
            warn!("Failed to read AVT file {:?}: {}", path, e);
            None
        }
    }
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
