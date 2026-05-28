use crate::kinovi_version::KinoviVersion;
use anyhow::anyhow;
use log::info;
use seedance2pro_client::creds::seedance2pro_session::Seedance2ProSession;

// Configuration switch
const ENV_SEEDANCE2PRO_VERSION: &str = "SEEDANCE2PRO_VERSION";

// Cookies for Volcengine
#[deprecated]
const ENV_SEEDANCE2PRO_LEGACY_COOKIES: &str = "SEEDANCE2PRO_COOKIES";
const ENV_SEEDANCE2PRO_VOLCENGINE_COOKIES: &str = "SEEDANCE2PRO_VOLCENGINE_COOKIES";

// Cookies for BytePlus
#[deprecated]
const ENV_SEEDANCE2PRO_LEGACY_ALT_COOKIES: &str = "SEEDANCE2PRO_ALT_COOKIES";
const ENV_SEEDANCE2PRO_BYTEPLUS_COOKIES: &str = "SEEDANCE2PRO_BYTEPLUS_COOKIES";

// Cookies for BytePlus Ultra
const ENV_SEEDANCE2PRO_BYTEPLUS_ULTRA_COOKIES: &str = "SEEDANCE2PRO_BYTEPLUS_ULTRA_COOKIES";


pub fn get_kinovi_version() -> anyhow::Result<KinoviVersion> {
  info!("Reading kinovi version from env var: {}", ENV_SEEDANCE2PRO_VERSION);
  let kinovi_version = easyenv::get_env_string_optional(ENV_SEEDANCE2PRO_VERSION)
      .map(|v| v.trim().to_lowercase());

  let kinovi_version = match kinovi_version.as_deref() {
    None => KinoviVersion::Volcengine,
    Some("volcengine") => KinoviVersion::Volcengine,
    Some("byteplus") => KinoviVersion::BytePlus,
    Some("byteplusultra") => KinoviVersion::BytePlusUltra,
    Some(other) => return Err(anyhow!("invalid kinovi version: {}", other)),
  };

  Ok(kinovi_version)
}

pub fn get_kinovi_session(version: KinoviVersion) -> anyhow::Result<Seedance2ProSession> {
  let cookies = read_kinovi_cookies(version)?;
  Ok(Seedance2ProSession::from_cookies_string(cookies))
}

fn read_kinovi_cookies(version: KinoviVersion) -> anyhow::Result<String> {
  match version {
    KinoviVersion::Volcengine => {
      info!("Using Volcengine cookies from env var: {}", ENV_SEEDANCE2PRO_VOLCENGINE_COOKIES);
      easyenv::get_env_string_optional(ENV_SEEDANCE2PRO_VOLCENGINE_COOKIES)
          .or_else(|| easyenv::get_env_string_optional(ENV_SEEDANCE2PRO_LEGACY_COOKIES))
          .ok_or_else(|| anyhow!("missing Seedance2Pro cookies in in env var {}", ENV_SEEDANCE2PRO_VOLCENGINE_COOKIES))
    }
    KinoviVersion::BytePlus => {
      info!("Using BytePlus cookies from env var: {}", ENV_SEEDANCE2PRO_BYTEPLUS_COOKIES);
      easyenv::get_env_string_optional(ENV_SEEDANCE2PRO_BYTEPLUS_COOKIES)
          .or_else(|| easyenv::get_env_string_optional(ENV_SEEDANCE2PRO_LEGACY_ALT_COOKIES))
          .ok_or_else(|| anyhow!("missing Seedance2Pro cookies in in env var {}", ENV_SEEDANCE2PRO_BYTEPLUS_COOKIES))
    }
    KinoviVersion::BytePlusUltra => {
      info!("Using BytePlus Ultra cookies from env var: {}", ENV_SEEDANCE2PRO_BYTEPLUS_ULTRA_COOKIES);
      let cookies = easyenv::get_env_string_required(ENV_SEEDANCE2PRO_BYTEPLUS_ULTRA_COOKIES)?;
      Ok(cookies)
    }
  }
}
